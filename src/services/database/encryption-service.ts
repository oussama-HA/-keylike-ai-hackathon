/**
 * Encryption Service for Keylike AI PWA
 * Provides client-side encryption using Web Crypto API
 */

import { ENCRYPTION_CONFIG, EncryptionError } from './database-schema';

export interface EncryptionResult {
  encryptedData: string;
  salt: string;
  iv: string;
}

export interface DecryptionOptions {
  encryptedData: string;
  salt: string;
  iv: string;
}

export interface KeyDerivationOptions {
  password: string;
  salt: Uint8Array;
  iterations?: number;
}

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Initialize the encryption service with a master key
   */
  async initialize(userSeed?: string): Promise<void> {
    try {
      // Generate or derive master key
      if (userSeed) {
        this.masterKey = await this.deriveKeyFromSeed(userSeed);
      } else {
        this.masterKey = await this.generateMasterKey();
      }

      this.isInitialized = true;
      console.log('🔐 Encryption service initialized');

    } catch (error) {
      throw new EncryptionError(
        'Failed to initialize encryption service',
        'INIT_FAILED',
        error as Error
      );
    }
  }

  /**
   * Encrypt data with AES-GCM
   */
  async encrypt(data: any): Promise<EncryptionResult> {
    if (!this.isInitialized || !this.masterKey) {
      throw new EncryptionError(
        'Encryption service not initialized',
        'NOT_INITIALIZED'
      );
    }

    try {
      // Convert data to JSON string
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonData);

      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.saltLength));
      const iv = crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));

      // Use master key directly for encryption (salt is used in IV for uniqueness)
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: iv,
          tagLength: ENCRYPTION_CONFIG.tagLength * 8 // Convert to bits
        },
        this.masterKey,
        dataBuffer
      );

      // Convert to base64 for storage
      const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
      const saltBase64 = this.arrayBufferToBase64(salt.buffer);
      const ivBase64 = this.arrayBufferToBase64(iv.buffer);

      return {
        encryptedData,
        salt: saltBase64,
        iv: ivBase64
      };

    } catch (error) {
      throw new EncryptionError(
        'Failed to encrypt data',
        'ENCRYPTION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Decrypt data with AES-GCM
   */
  async decrypt(options: DecryptionOptions): Promise<any> {
    if (!this.isInitialized || !this.masterKey) {
      throw new EncryptionError(
        'Encryption service not initialized',
        'NOT_INITIALIZED'
      );
    }

    try {
      // Convert from base64
      const encryptedBuffer = this.base64ToArrayBuffer(options.encryptedData);
      const salt = this.base64ToArrayBuffer(options.salt);
      const iv = this.base64ToArrayBuffer(options.iv);

      // Use master key directly for decryption
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: ENCRYPTION_CONFIG.algorithm,
          iv: new Uint8Array(iv),
          tagLength: ENCRYPTION_CONFIG.tagLength * 8 // Convert to bits
        },
        this.masterKey,
        encryptedBuffer
      );

      // Convert back to JSON
      const decoder = new TextDecoder();
      const jsonString = decoder.decode(decryptedBuffer);
      
      return JSON.parse(jsonString);

    } catch (error) {
      throw new EncryptionError(
        'Failed to decrypt data',
        'DECRYPTION_FAILED',
        error as Error
      );
    }
  }

  /**
   * Generate a hash for data integrity verification
   */
  async generateHash(data: any): Promise<string> {
    try {
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonData);

      const hashBuffer = await crypto.subtle.digest(
        ENCRYPTION_CONFIG.hashAlgorithm,
        dataBuffer
      );

      return this.arrayBufferToHex(hashBuffer);

    } catch (error) {
      throw new EncryptionError(
        'Failed to generate hash',
        'HASH_FAILED',
        error as Error
      );
    }
  }

  /**
   * Verify data integrity using hash
   */
  async verifyHash(data: any, expectedHash: string): Promise<boolean> {
    try {
      const actualHash = await this.generateHash(data);
      return actualHash === expectedHash;

    } catch (error) {
      console.warn('Hash verification failed:', error);
      return false;
    }
  }

  /**
   * Generate a new master key using AES-GCM
   * This approach is compatible with all modern browsers and mobile WebViews
   */
  private async generateMasterKey(): Promise<CryptoKey> {
    // Generate a random AES key that we'll use directly for encryption
    const masterKey = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // Not extractable for security
      ['encrypt', 'decrypt'] // Use directly for encryption/decryption
    );
    
    return masterKey;
  }

  /**
   * Derive master key from user seed
   */
  private async deriveKeyFromSeed(seed: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(seed),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return keyMaterial;
  }

  /**
   * Derive encryption key from master key using salt
   */
  private async deriveKey(masterKey: CryptoKey, salt: Uint8Array): Promise<CryptoKey> {
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: ENCRYPTION_CONFIG.iterations,
        hash: ENCRYPTION_CONFIG.hashAlgorithm
      },
      masterKey,
      {
        name: ENCRYPTION_CONFIG.algorithm,
        length: ENCRYPTION_CONFIG.keyLength
      },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to hex string
   */
  private arrayBufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Test encryption capabilities
   */
  async testEncryption(): Promise<boolean> {
    try {
      const testData = { message: 'Test encryption', timestamp: Date.now() };
      
      const encrypted = await this.encrypt(testData);
      const decrypted = await this.decrypt(encrypted);
      
      // Verify data integrity
      const originalHash = await this.generateHash(testData);
      const decryptedHash = await this.generateHash(decrypted);
      
      return originalHash === decryptedHash &&
             JSON.stringify(testData) === JSON.stringify(decrypted);

    } catch (error) {
      console.error('Encryption test failed:', error);
      return false;
    }
  }

  /**
   * Check if Web Crypto API is supported
   */
  static isSupported(): boolean {
    return typeof crypto !== 'undefined' && 
           typeof crypto.subtle !== 'undefined' &&
           typeof crypto.getRandomValues !== 'undefined';
  }

  /**
   * Get encryption status
   */
  getStatus(): {
    isInitialized: boolean;
    isSupported: boolean;
    algorithm: string;
    keyLength: number;
  } {
    return {
      isInitialized: this.isInitialized,
      isSupported: EncryptionService.isSupported(),
      algorithm: ENCRYPTION_CONFIG.algorithm,
      keyLength: ENCRYPTION_CONFIG.keyLength
    };
  }

  /**
   * Reset encryption service
   */
  reset(): void {
    this.masterKey = null;
    this.isInitialized = false;
    console.log('🔐 Encryption service reset');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.reset();
    EncryptionService.instance = null as any;
    console.log('🗑️ Encryption service disposed');
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();