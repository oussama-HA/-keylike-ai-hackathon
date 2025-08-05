/**
 * Database Migration Service for Keylike AI PWA
 * Handles database schema versioning and migrations
 */

import { 
  DATABASE_CONFIG, 
  DATABASE_SCHEMA,
  MigrationScript,
  DatabaseError,
  StoredMetadata
} from './database-schema';

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migrationsApplied: string[];
  duration: number;
  error?: string;
}

export interface MigrationStatus {
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: MigrationScript[];
  lastMigrationDate?: number;
}

export interface MigrationRecord {
  id: string;
  version: number;
  description: string;
  appliedAt: number;
  duration: number;
  checksum: string;
}

export class MigrationService {
  private static instance: MigrationService;
  private db: IDBDatabase | null = null;
  private migrations: Map<number, MigrationScript> = new Map();

  private constructor() {
    this.loadMigrations();
  }

  static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService();
    }
    return MigrationService.instance;
  }

  /**
   * Initialize migration service with database connection
   */
  async initialize(database: IDBDatabase): Promise<void> {
    this.db = database;
    await this.ensureMigrationTable();
    console.log('🔄 Migration service initialized');
  }

  /**
   * Load all available migrations
   */
  private loadMigrations(): void {
    // Example migrations - these would be defined as the app evolves
    const migrations: MigrationScript[] = [
      {
        fromVersion: 1,
        toVersion: 2,
        description: 'Add search indexes for better performance',
        execute: async (db: IDBDatabase, transaction: IDBTransaction) => {
          // This would add new indexes to existing stores
          const scansStore = transaction.objectStore(DATABASE_CONFIG.stores.SCANS);
          if (!scansStore.indexNames.contains('brandDetected')) {
            scansStore.createIndex('brandDetected', 'brandDetected', { unique: false });
          }
        }
      },
      {
        fromVersion: 2,
        toVersion: 3,
        description: 'Add user feedback tracking',
        execute: async (db: IDBDatabase, transaction: IDBTransaction) => {
          // This would create a new store for user feedback
          if (!db.objectStoreNames.contains('userFeedback')) {
            const feedbackStore = db.createObjectStore('userFeedback', { keyPath: 'id' });
            feedbackStore.createIndex('scanId', 'scanId', { unique: false });
            feedbackStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      },
      {
        fromVersion: 3,
        toVersion: 4,
        description: 'Add performance metrics store',
        execute: async (db: IDBDatabase, transaction: IDBTransaction) => {
          if (!db.objectStoreNames.contains('performanceMetrics')) {
            const metricsStore = db.createObjectStore('performanceMetrics', { keyPath: 'id' });
            metricsStore.createIndex('type', 'type', { unique: false });
            metricsStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        }
      }
    ];

    // Load migrations into map for easy access
    migrations.forEach(migration => {
      this.migrations.set(migration.toVersion, migration);
    });

    console.log(`📚 Loaded ${migrations.length} migration(s)`);
  }

  /**
   * Ensure migration tracking table exists
   */
  private async ensureMigrationTable(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    // Check if metadata store exists (it should from our schema)
    if (!this.db.objectStoreNames.contains(DATABASE_CONFIG.stores.METADATA)) {
      throw new DatabaseError('Metadata store not found', 'METADATA_STORE_MISSING');
    }
  }

  /**
   * Get current database version
   */
  async getCurrentVersion(): Promise<number> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readonly');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);

      return new Promise<number>((resolve, reject) => {
        const request = store.get('database_version');
        request.onsuccess = () => {
          const result = request.result as StoredMetadata | undefined;
          resolve(result?.value || 1); // Default to version 1 if not found
        };
        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.warn('Failed to get current version, defaulting to 1:', error);
      return 1;
    }
  }

  /**
   * Set database version
   */
  private async setCurrentVersion(version: number): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readwrite');
    const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);

    const versionRecord: StoredMetadata = {
      key: 'database_version',
      type: 'database',
      value: version,
      lastUpdated: Date.now(),
      version: 1
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(versionRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<MigrationStatus> {
    const currentVersion = await this.getCurrentVersion();
    const targetVersion = DATABASE_SCHEMA.version;
    
    const pendingMigrations: MigrationScript[] = [];
    for (let version = currentVersion + 1; version <= targetVersion; version++) {
      const migration = this.migrations.get(version);
      if (migration) {
        pendingMigrations.push(migration);
      }
    }

    const lastMigrationDate = await this.getLastMigrationDate();

    return {
      currentVersion,
      targetVersion,
      pendingMigrations,
      lastMigrationDate
    };
  }

  /**
   * Check if migrations are needed
   */
  async needsMigration(): Promise<boolean> {
    const status = await this.getMigrationStatus();
    return status.currentVersion < status.targetVersion;
  }

  /**
   * Run pending migrations
   */
  async runMigrations(): Promise<MigrationResult> {
    const startTime = Date.now();
    const status = await this.getMigrationStatus();
    
    if (status.pendingMigrations.length === 0) {
      return {
        success: true,
        fromVersion: status.currentVersion,
        toVersion: status.targetVersion,
        migrationsApplied: [],
        duration: Date.now() - startTime
      };
    }

    const migrationsApplied: string[] = [];
    let currentVersion = status.currentVersion;

    try {
      for (const migration of status.pendingMigrations) {
        console.log(`🔄 Running migration: ${migration.description}`);
        
        await this.runSingleMigration(migration);
        await this.recordMigration(migration);
        
        currentVersion = migration.toVersion;
        migrationsApplied.push(migration.description);
        
        console.log(`✅ Migration completed: ${migration.description}`);
      }

      // Update current version
      await this.setCurrentVersion(currentVersion);

      return {
        success: true,
        fromVersion: status.currentVersion,
        toVersion: currentVersion,
        migrationsApplied,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Migration failed:', error);
      
      return {
        success: false,
        fromVersion: status.currentVersion,
        toVersion: currentVersion,
        migrationsApplied,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown migration error'
      };
    }
  }

  /**
   * Run a single migration
   */
  private async runSingleMigration(migration: MigrationScript): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    return new Promise<void>((resolve, reject) => {
      // Create a version change transaction
      const transaction = this.db!.transaction(
        Array.from(this.db!.objectStoreNames), 
        'readwrite'
      );

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(new Error('Migration transaction aborted'));

      // Execute the migration
      migration.execute(this.db!, transaction).catch(reject);
    });
  }

  /**
   * Record migration in metadata
   */
  private async recordMigration(migration: MigrationScript): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    const migrationRecord: MigrationRecord = {
      id: `migration_${migration.toVersion}`,
      version: migration.toVersion,
      description: migration.description,
      appliedAt: Date.now(),
      duration: 0, // TODO: Track actual duration
      checksum: await this.calculateMigrationChecksum(migration)
    };

    const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readwrite');
    const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);

    const metadataRecord: StoredMetadata = {
      key: `migration_${migration.toVersion}`,
      type: 'migration',
      value: migrationRecord,
      lastUpdated: Date.now(),
      version: 1
    };

    await new Promise<void>((resolve, reject) => {
      const request = store.put(metadataRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get last migration date
   */
  private async getLastMigrationDate(): Promise<number | undefined> {
    if (!this.db) {
      return undefined;
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readonly');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);
      const index = store.index('type');

      return new Promise<number | undefined>((resolve) => {
        const request = index.openCursor(IDBKeyRange.only('migration'));
        let lastDate: number | undefined;

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            const migration = cursor.value.value as MigrationRecord;
            if (!lastDate || migration.appliedAt > lastDate) {
              lastDate = migration.appliedAt;
            }
            cursor.continue();
          } else {
            resolve(lastDate);
          }
        };

        request.onerror = () => resolve(undefined);
      });

    } catch (error) {
      console.warn('Failed to get last migration date:', error);
      return undefined;
    }
  }

  /**
   * Calculate migration checksum for integrity verification
   */
  private async calculateMigrationChecksum(migration: MigrationScript): Promise<string> {
    const migrationString = JSON.stringify({
      fromVersion: migration.fromVersion,
      toVersion: migration.toVersion,
      description: migration.description
    });

    const encoder = new TextEncoder();
    const data = encoder.encode(migrationString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get migration history
   */
  async getMigrationHistory(): Promise<MigrationRecord[]> {
    if (!this.db) {
      return [];
    }

    try {
      const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readonly');
      const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);
      const index = store.index('type');

      return new Promise<MigrationRecord[]>((resolve, reject) => {
        const migrations: MigrationRecord[] = [];
        const request = index.openCursor(IDBKeyRange.only('migration'));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            migrations.push(cursor.value.value as MigrationRecord);
            cursor.continue();
          } else {
            // Sort by version
            migrations.sort((a, b) => a.version - b.version);
            resolve(migrations);
          }
        };

        request.onerror = () => reject(request.error);
      });

    } catch (error) {
      console.error('Failed to get migration history:', error);
      return [];
    }
  }

  /**
   * Validate database integrity after migrations
   */
  async validateDatabaseIntegrity(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      // Check that all expected stores exist
      for (const storeDefinition of DATABASE_SCHEMA.stores) {
        if (!this.db.objectStoreNames.contains(storeDefinition.name)) {
          console.error(`Missing object store: ${storeDefinition.name}`);
          return false;
        }

        // Check indexes within a transaction
        const transaction = this.db.transaction([storeDefinition.name], 'readonly');
        const store = transaction.objectStore(storeDefinition.name);

        if (storeDefinition.indexes) {
          for (const indexDef of storeDefinition.indexes) {
            if (!store.indexNames.contains(indexDef.name)) {
              console.error(`Missing index: ${indexDef.name} in store: ${storeDefinition.name}`);
              return false;
            }
          }
        }
      }

      console.log('✅ Database integrity validation passed');
      return true;

    } catch (error) {
      console.error('❌ Database integrity validation failed:', error);
      return false;
    }
  }

  /**
   * Reset migration state (for development/testing)
   */
  async resetMigrationState(): Promise<void> {
    if (!this.db) {
      throw new DatabaseError('Database not initialized', 'DB_NOT_INITIALIZED');
    }

    const transaction = this.db.transaction([DATABASE_CONFIG.stores.METADATA], 'readwrite');
    const store = transaction.objectStore(DATABASE_CONFIG.stores.METADATA);
    const index = store.index('type');

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only('migration'));
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });

    // Reset version to 1
    await this.setCurrentVersion(1);
    console.log('🔄 Migration state reset');
  }

  /**
   * Add a new migration (for development)
   */
  addMigration(migration: MigrationScript): void {
    this.migrations.set(migration.toVersion, migration);
    console.log(`📝 Added migration: ${migration.description}`);
  }

  /**
   * Cleanup and disposal
   */
  dispose(): void {
    this.db = null;
    this.migrations.clear();
    MigrationService.instance = null as any;
    console.log('🗑️ Migration service disposed');
  }
}

// Export singleton instance
export const migrationService = MigrationService.getInstance();