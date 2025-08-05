/**
 * Database Manager for Keylike AI PWA
 * Handles IndexedDB operations with encryption, migrations, and lifecycle management
 */

import {
  DATABASE_CONFIG,
  DATABASE_SCHEMA,
  MIGRATION_SCRIPTS,
  RETENTION_POLICIES,
  STORAGE_LIMITS,
  DatabaseError,
  DatabaseEvent,
  DatabaseEventListener,
  StoredScanResult,
  StoredSettings,
  StoredCacheEntry,
  StoredMetadata
} from './database-schema';

import { encryptionService, EncryptionResult } from './encryption-service';
import { migrationService } from './migration-service';
import type { ScanResult, ScanFilters } from '../../types/scan-types';
import type { UserSettings } from '../storage-service';

export interface DatabaseStats {
  totalRecords: number;
  totalSize: number;
  scanResults: number;
  settings: number;
  cacheEntries: number;
  oldestRecord?: number;
  newestRecord?: number;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  index?: string;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private eventListeners: Set<DatabaseEventListener> = new Set();
  private cleanupInterval: number | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize the database with migrations and encryption
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🗄️ Initializing IndexedDB database...');

      // Initialize encryption service
      await encryptionService.initialize();

      // Open database with upgrade handling
      this.db = await this.openDatabase();

      // Initialize migration service
      await migrationService.initialize(this.db);

      // Run any pending migrations
      const migrationResult = await migrationService.runMigrations();
      if (!migrationResult.success) {
        throw new DatabaseError(
          `Migration failed: ${migrationResult.error}`,
          'MIGRATION_FAILED'
        );
      }

      // Validate database integrity
      const isValid = await migrationService.validateDatabaseIntegrity();
      if (!isValid) {
        throw new DatabaseError(
          'Database integrity validation failed',
          'INTEGRITY_FAILED'
        );
      }

      // Start cleanup scheduler
      this.startCleanupScheduler();

      this.isInitialized = true;
      this.emitEvent({ type: 'migration', store: 'database', timestamp: Date.now() });
      
      console.log('✅ Database initialized successfully');
      if (migrationResult.migrationsApplied.length > 0) {
        console.log(`🔄 Applied ${migrationResult.migrationsApplied.length} migration(s)`);
      }

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new DatabaseError(
        'Failed to initialize database',
        'INIT_FAILED',
        error as Error
      );
    }
  }

  /**
   * Open IndexedDB with version control and migrations
   */
  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_CONFIG.name, DATABASE_CONFIG.version);

      request.onerror = () => {
        reject(new DatabaseError(
          'Failed to open database',
          'OPEN_FAILED',
          request.error || undefined
        ));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onupgradeneeded = async (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction!;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || DATABASE_CONFIG.version;

        console.log(`📦 Database upgrade: ${oldVersion} → ${newVersion}`);

        try {
          // Create stores if this is initial setup
          if (oldVersion === 0) {
            await this.createStores(db);
          }

          // Run migration scripts
          await this.runMigrations(db, transaction, oldVersion, newVersion);

        } catch (error) {
          console.error('❌ Database upgrade failed:', error);
          transaction.abort();
          reject(error);
        }
      };
    });
  }

  /**
   * Create object stores with indexes
   */
  private async createStores(db: IDBDatabase): Promise<void> {
    for (const storeDefinition of DATABASE_SCHEMA.stores) {
      if (!db.objectStoreNames.contains(storeDefinition.name)) {
        const store = db.createObjectStore(storeDefinition.name, {
          keyPath: storeDefinition.keyPath,
          autoIncrement: storeDefinition.autoIncrement
        });

        // Create indexes
        if (storeDefinition.indexes) {
          for (const index of storeDefinition.indexes) {
            store.createIndex(index.name, index.keyPath, index.options);
          }
        }

        console.log(`📋 Created store: ${storeDefinition.name}`);
      }
    }
  }

  /**
   * Run migration scripts
   */
  private async runMigrations(
    db: IDBDatabase,
    transaction: IDBTransaction,
    oldVersion: number,
    newVersion: number
  ): Promise<void> {
    const applicableMigrations = MIGRATION_SCRIPTS.filter(
      migration => migration.fromVersion >= oldVersion && migration.toVersion <= newVersion
    );

    for (const migration of applicableMigrations) {
      console.log(`🔄 Running migration: ${migration.description}`);
      await migration.execute(db, transaction);
    }
  }

  /**
   * Save scan result with encryption
   */
  async saveScanResult(scanResult: ScanResult): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      console.log('🔍 [DEBUG] Starting scan result save for:', scanResult.id);
      const totalStartTime = performance.now();

      // STEP 1: Prepare data BEFORE creating transaction (async operations)
      console.log('🔍 [DEBUG] Preparing data for storage (async operations)...');
      const dataPreparationStart = performance.now();
      const storedResult: StoredScanResult = await this.prepareScanResultForStorage(scanResult);
      const dataPreparationTime = performance.now() - dataPreparationStart;
      
      console.log(`🔍 [DEBUG] ✅ Data preparation completed in ${dataPreparationTime.toFixed(2)}ms`);

      // STEP 2: Create transaction and perform synchronous storage operations
      console.log('🔍 [DEBUG] Creating transaction and storing data...');
      const transactionStartTime = performance.now();
      
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);

      await new Promise<void>((resolve, reject) => {
        try {
          const request = store.put(storedResult);
          request.onsuccess = () => {
            const transactionTime = performance.now() - transactionStartTime;
            const totalTime = performance.now() - totalStartTime;
            console.log(`🔍 [DEBUG] ✅ Transaction successful!`);
            console.log(`🔍 [DEBUG] Transaction time: ${transactionTime.toFixed(2)}ms`);
            console.log(`🔍 [DEBUG] Total operation time: ${totalTime.toFixed(2)}ms`);
            resolve();
          };
          request.onerror = () => {
            const transactionTime = performance.now() - transactionStartTime;
            const totalTime = performance.now() - totalStartTime;
            console.log(`🔍 [DEBUG] ❌ Transaction failed after ${transactionTime.toFixed(2)}ms`);
            console.log(`🔍 [DEBUG] Total time when failed: ${totalTime.toFixed(2)}ms`);
            console.log('🔍 [DEBUG] Error:', request.error);
            console.log('🔍 [DEBUG] Transaction mode:', transaction.mode);
            console.log('🔍 [DEBUG] Transaction error:', transaction.error);
            reject(request.error);
          };
        } catch (syncError) {
          const transactionTime = performance.now() - transactionStartTime;
          const totalTime = performance.now() - totalStartTime;
          console.log(`🔍 [DEBUG] ❌ Synchronous error after ${transactionTime.toFixed(2)}ms:`, syncError);
          console.log(`🔍 [DEBUG] Total time when error occurred: ${totalTime.toFixed(2)}ms`);
          reject(syncError);
        }
      });

      this.emitEvent({ 
        type: 'write', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        recordCount: 1
      });

      console.log('💾 Scan result saved:', scanResult.id);

      // Check storage limits
      await this.checkStorageLimits();

    } catch (error) {
      this.emitEvent({ 
        type: 'error', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        error: error as Error
      });
      throw new DatabaseError(
        'Failed to save scan result',
        'SAVE_FAILED',
        error as Error
      );
    }
  }

  /**
   * Get scan history with filtering and pagination
   */
  async getScanHistory(filters?: ScanFilters, options?: QueryOptions): Promise<ScanResult[]> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readonly');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);

      let cursor: IDBRequest<IDBCursorWithValue | null>;

      // Use index if specified in options
      if (options?.index) {
        const index = store.index(options.index);
        cursor = index.openCursor(null, options.orderDirection === 'asc' ? 'next' : 'prev');
      } else {
        cursor = store.openCursor(null, options?.orderDirection === 'asc' ? 'next' : 'prev');
      }

      const results: StoredScanResult[] = [];
      let count = 0;
      const limit = options?.limit || Number.MAX_SAFE_INTEGER;
      const offset = options?.offset || 0;

      await new Promise<void>((resolve, reject) => {
        cursor.onsuccess = (event) => {
          const cursorResult = (event.target as IDBRequest).result;
          
          if (!cursorResult || count >= limit) {
            resolve();
            return;
          }

          if (count >= offset) {
            const storedResult = cursorResult.value as StoredScanResult;
            
            // Apply filters
            if (!filters || this.matchesFilters(storedResult, filters)) {
              results.push(storedResult);
            }
          }

          count++;
          cursorResult.continue();
        };

        cursor.onerror = () => reject(cursor.error);
      });

      // Convert stored results back to ScanResult objects
      const scanResults: ScanResult[] = [];
      for (const stored of results) {
        try {
          const converted = await this.convertStoredToScanResult(stored);
          scanResults.push(converted);
        } catch (error) {
          console.warn('🔍 [DEBUG] Failed to decrypt stored scan result:', stored.id, error);
          console.log('🔍 [DEBUG] Stored result details:', {
            id: stored.id,
            encrypted: stored.encrypted,
            hasEncryptedData: !!stored.encryptedData,
            hasSalt: !!stored.salt,
            hasIv: !!stored.iv,
            timestamp: stored.timestamp
          });
          
          // Skip corrupted/undecryptable entries rather than failing entirely
          console.warn('⚠️ Skipping corrupted scan result:', stored.id);
        }
      }

      this.emitEvent({ 
        type: 'read', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        recordCount: scanResults.length
      });

      return scanResults;

    } catch (error) {
      this.emitEvent({ 
        type: 'error', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        error: error as Error
      });
      throw new DatabaseError(
        'Failed to get scan history',
        'READ_FAILED',
        error as Error
      );
    }
  }

  /**
   * Delete scan result by ID
   */
  async deleteScanResult(id: string): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.emitEvent({ 
        type: 'delete', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        recordCount: 1
      });

      console.log('🗑️ Scan result deleted:', id);

    } catch (error) {
      throw new DatabaseError(
        'Failed to delete scan result',
        'DELETE_FAILED',
        error as Error
      );
    }
  }

  /**
   * Save user settings
   */
  async saveSettings(settings: UserSettings): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SETTINGS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SETTINGS);

      // Break down settings into categories for storage
      const settingsEntries = await this.prepareSettingsForStorage(settings);

      for (const entry of settingsEntries) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      this.emitEvent({ 
        type: 'write', 
        store: DATABASE_CONFIG.stores.SETTINGS, 
        timestamp: Date.now(),
        recordCount: settingsEntries.length
      });

      console.log('⚙️ Settings saved');

    } catch (error) {
      throw new DatabaseError(
        'Failed to save settings',
        'SAVE_FAILED',
        error as Error
      );
    }
  }

  /**
   * Get user settings
   */
  async getSettings(): Promise<UserSettings | null> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SETTINGS], 'readonly');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SETTINGS);

      const settingsEntries: StoredSettings[] = [];

      await new Promise<void>((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          settingsEntries.push(...request.result);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });

      if (settingsEntries.length === 0) {
        return null;
      }

      // Reconstruct settings from stored entries
      const settings = await this.convertStoredToSettings(settingsEntries);

      this.emitEvent({ 
        type: 'read', 
        store: DATABASE_CONFIG.stores.SETTINGS, 
        timestamp: Date.now(),
        recordCount: settingsEntries.length
      });

      return settings;

    } catch (error) {
      throw new DatabaseError(
        'Failed to get settings',
        'READ_FAILED',
        error as Error
      );
    }
  }

  /**
   * Clear corrupted/undecryptable scan data
   */
  async clearCorruptedData(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      console.log('🧹 Clearing corrupted encrypted data...');
      
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);
      
      let clearedCount = 0;
      
      await new Promise<void>((resolve, reject) => {
        const request = store.openCursor();
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const stored = cursor.value as StoredScanResult;
            
            // Delete entries that are encrypted (likely corrupted from old sessions)
            if (stored.encrypted) {
              cursor.delete();
              clearedCount++;
            }
            cursor.continue();
          } else {
            resolve();
          }
        };
        request.onerror = () => reject(request.error);
      });

      console.log(`🧹 Cleared ${clearedCount} corrupted scan results`);
      
      this.emitEvent({
        type: 'cleanup',
        store: DATABASE_CONFIG.stores.SCANS,
        timestamp: Date.now(),
        recordCount: clearedCount
      });

    } catch (error) {
      throw new DatabaseError(
        'Failed to clear corrupted data',
        'CLEANUP_FAILED',
        error as Error
      );
    }
  }

  /**
   * Clear all scan history
   */
  async clearScanHistory(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      this.emitEvent({ 
        type: 'delete', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now()
      });

      console.log('🧹 Scan history cleared');

    } catch (error) {
      throw new DatabaseError(
        'Failed to clear scan history',
        'DELETE_FAILED',
        error as Error
      );
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('Database not initialized', 'NOT_INITIALIZED');
    }

    try {
      const scans = await this.getScanHistory();
      const settings = await this.getSettings();

      // Estimate storage size (rough calculation)
      const scanSize = scans.length * 2048; // ~2KB per scan
      const settingsSize = settings ? 1024 : 0; // ~1KB for settings
      const totalSize = scanSize + settingsSize;

      const timestamps = scans.map(scan => scan.timestamp).sort((a, b) => a - b);

      return {
        totalRecords: scans.length + (settings ? 1 : 0),
        totalSize,
        scanResults: scans.length,
        settings: settings ? 1 : 0,
        cacheEntries: 0, // TODO: Implement cache counting
        oldestRecord: timestamps[0],
        newestRecord: timestamps[timestamps.length - 1]
      };

    } catch (error) {
      throw new DatabaseError(
        'Failed to get database stats',
        'STATS_FAILED',
        error as Error
      );
    }
  }

  /**
   * Perform database cleanup based on retention policies
   */
  async cleanup(): Promise<void> {
    if (!this.isInitialized || !this.db) {
      return;
    }

    try {
      console.log('🧹 Starting database cleanup...');

      const cutoffTime = Date.now() - (RETENTION_POLICIES.defaultRetentionDays * 24 * 60 * 60 * 1000);
      
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.SCANS], 'readwrite');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);
      const index = store.index('timestamp');

      let deletedCount = 0;

      await new Promise<void>((resolve, reject) => {
        const range = IDBKeyRange.upperBound(cutoffTime);
        const request = index.openCursor(range);

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            deletedCount++;
            
            if (deletedCount >= RETENTION_POLICIES.batchSize) {
              resolve();
            } else {
              cursor.continue();
            }
          } else {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });

      this.emitEvent({ 
        type: 'cleanup', 
        store: DATABASE_CONFIG.stores.SCANS, 
        timestamp: Date.now(),
        recordCount: deletedCount
      });

      console.log(`🧹 Cleanup completed: ${deletedCount} records removed`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.emitEvent({ 
        type: 'error', 
        store: 'cleanup', 
        timestamp: Date.now(),
        error: error as Error
      });
    }
  }

  /**
   * Helper methods for data conversion
   */
  private async prepareScanResultForStorage(scanResult: ScanResult): Promise<StoredScanResult> {
    // Check if encryption is enabled
    const shouldEncrypt = true; // TODO: Check user settings

    const baseData: Partial<StoredScanResult> = {
      id: scanResult.id,
      timestamp: scanResult.timestamp,
      riskLevel: scanResult.riskAssessment.level,
      geohash: scanResult.location.geohash,
      keyway: scanResult.prediction.keyway,
      lockType: scanResult.prediction.lockType,
      encrypted: shouldEncrypt,
      version: 1,
      retentionExpiry: Date.now() + (RETENTION_POLICIES.defaultRetentionDays * 24 * 60 * 60 * 1000)
    };

    if (shouldEncrypt) {
      const encrypted = await encryptionService.encrypt(scanResult);
      return {
        ...baseData,
        encryptedData: encrypted.encryptedData,
        salt: encrypted.salt,
        iv: encrypted.iv,
        dataHash: await encryptionService.generateHash(scanResult)
      } as StoredScanResult;
    } else {
      return {
        ...baseData,
        plainData: scanResult,
        dataHash: await encryptionService.generateHash(scanResult)
      } as StoredScanResult;
    }
  }

  private async convertStoredToScanResult(stored: StoredScanResult): Promise<ScanResult> {
    if (stored.encrypted && stored.encryptedData) {
      const decrypted = await encryptionService.decrypt({
        encryptedData: stored.encryptedData,
        salt: stored.salt!,
        iv: stored.iv!
      });

      // Verify data integrity
      const isValid = await encryptionService.verifyHash(decrypted, stored.dataHash);
      if (!isValid) {
        throw new DatabaseError('Data integrity check failed', 'INTEGRITY_ERROR');
      }

      return decrypted;
    } else {
      return stored.plainData;
    }
  }

  private async prepareSettingsForStorage(settings: UserSettings): Promise<StoredSettings[]> {
    const entries: StoredSettings[] = [];
    const shouldEncrypt = true; // TODO: Check if sensitive settings should be encrypted

    for (const [category, value] of Object.entries(settings)) {
      if (category === 'id') continue;

      const entry: StoredSettings = {
        key: `settings_${category}`,
        category: category as any,
        value: shouldEncrypt ? undefined : value,
        encrypted: shouldEncrypt,
        lastModified: Date.now(),
        version: 1
      };

      if (shouldEncrypt) {
        const encrypted = await encryptionService.encrypt(value);
        entry.encryptedData = encrypted.encryptedData;
        entry.salt = encrypted.salt;
        entry.iv = encrypted.iv;
      }

      entries.push(entry);
    }

    return entries;
  }

  private async convertStoredToSettings(entries: StoredSettings[]): Promise<UserSettings> {
    const settings: any = { id: 'default' };

    for (const entry of entries) {
      const category = entry.key.replace('settings_', '');
      
      if (entry.encrypted && entry.encryptedData) {
        const decrypted = await encryptionService.decrypt({
          encryptedData: entry.encryptedData,
          salt: entry.salt!,
          iv: entry.iv!
        });
        settings[category] = decrypted;
      } else {
        settings[category] = entry.value;
      }
    }

    return settings as UserSettings;
  }

  private matchesFilters(stored: StoredScanResult, filters: ScanFilters): boolean {
    if (filters.dateRange) {
      if (stored.timestamp < filters.dateRange.start || stored.timestamp > filters.dateRange.end) {
        return false;
      }
    }

    if (filters.riskLevel && !filters.riskLevel.includes(stored.riskLevel)) {
      return false;
    }

    if (filters.keyway && !filters.keyway.includes(stored.keyway)) {
      return false;
    }

    return true;
  }

  private async checkStorageLimits(): Promise<void> {
    const stats = await this.getStats();
    
    if (stats.scanResults > STORAGE_LIMITS.maxScanResults) {
      console.warn('⚠️ Scan results limit exceeded, triggering cleanup');
      await this.cleanup();
    }
  }

  private startCleanupScheduler(): void {
    this.cleanupInterval = window.setInterval(() => {
      this.cleanup().catch(console.error);
    }, RETENTION_POLICIES.cleanupIntervalMs);
  }

  /**
   * Event handling
   */
  addEventListener(listener: DatabaseEventListener): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  private emitEvent(event: DatabaseEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Database event listener error:', error);
      }
    });
  }

  /**
   * Cleanup and disposal
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (this.db) {
      this.db.close();
      this.db = null;
    }

    this.eventListeners.clear();
    this.isInitialized = false;
    DatabaseManager.instance = null as any;
    
    console.log('🗑️ Database manager disposed');
  }

  /**
   * Status and health checks
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  async healthCheck(): Promise<boolean> {
    try {
      if (!this.isReady()) {
        return false;
      }

      // Test encryption
      const encryptionTest = await encryptionService.testEncryption();
      if (!encryptionTest) {
        return false;
      }

      // Test database connection
      await this.getStats();
      
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const databaseManager = DatabaseManager.getInstance();