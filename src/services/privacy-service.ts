import { Geolocation } from '@capacitor/geolocation';
import type { ScanResult } from '../types/scan-types';
import type { UserPermissions } from '../types/app-types';

export interface IPrivacyService {
  hashLocation(lat: number, lng: number, precision?: number): string;
  encryptData(data: any): Promise<string>;
  decryptData(encryptedData: string): Promise<any>;
  anonymizeResult(result: ScanResult): ScanResult;
  sanitizeMetadata(metadata: any): SanitizedMetadata;
  generateSalt(): string;
  hashString(input: string, salt?: string): Promise<string>;
  validateGeohash(geohash: string): boolean;
  getLocationFromGeohash(geohash: string): { lat: number; lng: number; precision: number };
  // Geolocation methods
  requestLocationPermissions(): Promise<boolean>;
  getCurrentLocationHash(precision?: number): Promise<string | null>;
  getLocationPermissionStatus(): Promise<UserPermissions['geolocation']>;
}

export interface SanitizedMetadata {
  processingTime: number;
  modelVersion: string;
  appVersion: string;
  deviceType: string;
  userAgent: string;
  // Removed: exact timestamp, IP, etc.
}

export interface EncryptionConfig {
  algorithm: 'AES-GCM';
  keyLength: 256;
  ivLength: 12;
  tagLength: 16;
}

export interface LocationPrivacyConfig {
  defaultPrecision: number; // Default geohash precision (5 = ~2.4km)
  maxPrecision: number; // Maximum allowed precision (8 = ~38m)
  minPrecision: number; // Minimum precision for usefulness (3 = ~156km)
}

export class PrivacyService implements IPrivacyService {
  private encryptionConfig: EncryptionConfig;
  private locationConfig: LocationPrivacyConfig;
  private encryptionKey: CryptoKey | null = null;

  // Base32 alphabet for geohash
  private readonly BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

  constructor() {
    this.encryptionConfig = {
      algorithm: 'AES-GCM',
      keyLength: 256,
      ivLength: 12,
      tagLength: 16
    };

    this.locationConfig = {
      defaultPrecision: 5, // ~2.4km precision
      maxPrecision: 8,     // ~38m precision
      minPrecision: 3      // ~156km precision
    };

    this.initializeEncryption();
  }

  private async initializeEncryption(): Promise<void> {
    try {
      // Generate or retrieve encryption key
      this.encryptionKey = await this.getOrCreateEncryptionKey();
      console.log('🔐 Privacy service encryption initialized');
    } catch (error) {
      console.error('❌ Failed to initialize encryption:', error);
    }
  }

  private async getOrCreateEncryptionKey(): Promise<CryptoKey> {
    // Check if we have a stored key
    const storedKey = localStorage.getItem('keylike_encryption_key');
    
    if (storedKey) {
      try {
        const keyData = JSON.parse(storedKey);
        return await crypto.subtle.importKey(
          'jwk',
          keyData,
          { name: this.encryptionConfig.algorithm },
          false,
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.warn('Failed to import stored key, generating new one');
      }
    }

    // Generate new key
    const key = await crypto.subtle.generateKey(
      {
        name: this.encryptionConfig.algorithm,
        length: this.encryptionConfig.keyLength
      },
      true,
      ['encrypt', 'decrypt']
    );

    // Store the key for future use
    const exportedKey = await crypto.subtle.exportKey('jwk', key);
    localStorage.setItem('keylike_encryption_key', JSON.stringify(exportedKey));

    return key;
  }

  hashLocation(lat: number, lng: number, precision: number = this.locationConfig.defaultPrecision): string {
    // Validate inputs
    if (lat < -90 || lat > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
    if (precision < this.locationConfig.minPrecision || precision > this.locationConfig.maxPrecision) {
      throw new Error(`Invalid precision: must be between ${this.locationConfig.minPrecision} and ${this.locationConfig.maxPrecision}`);
    }

    return this.encodeGeohash(lat, lng, precision);
  }

  private encodeGeohash(lat: number, lng: number, precision: number): string {
    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    let geohash = '';
    let bits = 0;
    let bit = 0;
    let even = true;

    while (geohash.length < precision) {
      if (even) { // longitude
        const mid = (lngMin + lngMax) / 2;
        if (lng >= mid) {
          bit = (bit << 1) + 1;
          lngMin = mid;
        } else {
          bit = bit << 1;
          lngMax = mid;
        }
      } else { // latitude
        const mid = (latMin + latMax) / 2;
        if (lat >= mid) {
          bit = (bit << 1) + 1;
          latMin = mid;
        } else {
          bit = bit << 1;
          latMax = mid;
        }
      }

      even = !even;
      bits++;

      if (bits === 5) {
        geohash += this.BASE32[bit];
        bits = 0;
        bit = 0;
      }
    }

    return geohash;
  }

  validateGeohash(geohash: string): boolean {
    if (!geohash || typeof geohash !== 'string') {
      return false;
    }

    // Check if all characters are valid base32
    for (const char of geohash) {
      if (!this.BASE32.includes(char)) {
        return false;
      }
    }

    // Check length is reasonable
    return geohash.length >= this.locationConfig.minPrecision && 
           geohash.length <= this.locationConfig.maxPrecision;
  }

  getLocationFromGeohash(geohash: string): { lat: number; lng: number; precision: number } {
    if (!this.validateGeohash(geohash)) {
      throw new Error('Invalid geohash');
    }

    let latMin = -90, latMax = 90;
    let lngMin = -180, lngMax = 180;
    let even = true;

    for (const char of geohash) {
      const cd = this.BASE32.indexOf(char);
      
      for (let i = 4; i >= 0; i--) {
        const bit = (cd >> i) & 1;
        
        if (even) { // longitude
          const mid = (lngMin + lngMax) / 2;
          if (bit === 1) {
            lngMin = mid;
          } else {
            lngMax = mid;
          }
        } else { // latitude
          const mid = (latMin + latMax) / 2;
          if (bit === 1) {
            latMin = mid;
          } else {
            latMax = mid;
          }
        }
        
        even = !even;
      }
    }

    return {
      lat: (latMin + latMax) / 2,
      lng: (lngMin + lngMax) / 2,
      precision: geohash.length
    };
  }

  async encryptData(data: any): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      const jsonString = JSON.stringify(data);
      const dataBuffer = new TextEncoder().encode(jsonString);
      
      const iv = crypto.getRandomValues(new Uint8Array(this.encryptionConfig.ivLength));
      
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: this.encryptionConfig.algorithm,
          iv: iv
        },
        this.encryptionKey,
        dataBuffer
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
      
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  async decryptData(encryptedData: string): Promise<any> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    if (!this.encryptionKey) {
      throw new Error('Encryption key not available');
    }

    try {
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, this.encryptionConfig.ivLength);
      const encryptedBuffer = combined.slice(this.encryptionConfig.ivLength);

      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: this.encryptionConfig.algorithm,
          iv: iv
        },
        this.encryptionKey,
        encryptedBuffer
      );

      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString);
      
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  anonymizeResult(result: ScanResult): ScanResult {
    const anonymized = { ...result };

    // Replace exact location with geohash
    if (result.location && typeof result.location.geohash === 'string') {
      // Ensure geohash precision doesn't exceed privacy settings
      const maxPrecision = this.locationConfig.defaultPrecision;
      if (result.location.geohash.length > maxPrecision) {
        anonymized.location.geohash = result.location.geohash.substring(0, maxPrecision);
      }
    }

    // Sanitize metadata
    anonymized.metadata = this.sanitizeMetadata(result.metadata);

    // Remove or hash image data
    anonymized.imageHash = this.hashImageReference(result.imageHash);

    // Round timestamp to nearest hour for privacy
    anonymized.timestamp = Math.floor(result.timestamp / (60 * 60 * 1000)) * (60 * 60 * 1000);

    // Remove any notes that might contain personal info
    delete anonymized.notes;

    return anonymized;
  }

  sanitizeMetadata(metadata: any): SanitizedMetadata {
    return {
      processingTime: metadata.processingTime,
      modelVersion: metadata.modelVersion,
      appVersion: metadata.appVersion,
      deviceType: this.generalizeDeviceType(metadata.deviceType || metadata.userAgent),
      userAgent: this.generalizeDeviceType(metadata.userAgent || 'unknown')
    };
  }

  private generalizeDeviceType(userAgent: string): string {
    if (!userAgent) return 'unknown';
    
    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  private hashImageReference(imageHash: string): string {
    // Create a non-reversible hash of the image hash for privacy
    // This allows deduplication without exposing the original hash
    return btoa(imageHash).substring(0, 16);
  }

  generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  async hashString(input: string, salt?: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input + (salt || ''));
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    
    return btoa(String.fromCharCode(...hashArray));
  }

  // Utility methods
  getPrivacyLevel(geohashPrecision: number): 'low' | 'medium' | 'high' {
    if (geohashPrecision <= 3) return 'low';    // ~156km
    if (geohashPrecision <= 5) return 'medium'; // ~2.4km  
    return 'high';                              // <1km
  }

  estimateLocationAccuracy(geohashPrecision: number): number {
    // Approximate area in square kilometers
    const precisionToKm = {
      1: 5000, 2: 1250, 3: 156, 4: 39, 5: 4.9,
      6: 1.2, 7: 0.15, 8: 0.037, 9: 0.0046, 10: 0.0011
    };
    
    return precisionToKm[geohashPrecision as keyof typeof precisionToKm] || 0;
  }

  // Geolocation methods
  async requestLocationPermissions(): Promise<boolean> {
    try {
      const permissions = await Geolocation.requestPermissions();
      const granted = permissions.location === 'granted';
      
      console.log('📍 Location permission status:', permissions.location);
      return granted;
      
    } catch (error) {
      console.error('❌ Failed to request location permissions:', error);
      return false;
    }
  }

  async getLocationPermissionStatus(): Promise<UserPermissions['geolocation']> {
    try {
      const permissions = await Geolocation.checkPermissions();
      
      // Map Capacitor permission states to our app states
      const mappedStatus: UserPermissions['geolocation'] =
        permissions.location === 'granted' ? 'granted' :
        permissions.location === 'denied' ? 'denied' : 'prompt';
      
      return mappedStatus;
    } catch (error) {
      console.error('❌ Failed to check location permissions:', error);
      return 'prompt';
    }
  }

  async getCurrentLocationHash(precision: number = this.locationConfig.defaultPrecision): Promise<string | null> {
    try {
      // Check permissions first
      const permissionStatus = await this.getLocationPermissionStatus();
      if (permissionStatus !== 'granted') {
        const granted = await this.requestLocationPermissions();
        if (!granted) {
          console.warn('Location permission denied, cannot get location hash');
          return null;
        }
      }

      // Get current position
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000 // 1 minute cache
      });

      const { latitude, longitude } = position.coords;
      
      // Convert to privacy-preserving geohash
      const geohash = this.hashLocation(latitude, longitude, precision);
      
      console.log('📍 Location converted to geohash:', {
        precision,
        privacyLevel: this.getPrivacyLevel(precision),
        estimatedAccuracy: `~${this.estimateLocationAccuracy(precision)}km²`
      });
      
      return geohash;
      
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      return null;
    }
  }

  // Configuration
  updateLocationConfig(config: Partial<LocationPrivacyConfig>): void {
    this.locationConfig = { ...this.locationConfig, ...config };
  }

  getLocationConfig(): LocationPrivacyConfig {
    return { ...this.locationConfig };
  }

  // Cleanup
  dispose(): void {
    this.encryptionKey = null;
    console.log('🗑️ Privacy service disposed');
  }
}