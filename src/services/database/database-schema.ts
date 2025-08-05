/**
 * Database Schema Definitions for Keylike AI PWA
 * Provides structured schema for IndexedDB stores with encryption support
 */

export interface DatabaseSchema {
  version: number;
  stores: StoreDefinition[];
}

export interface StoreDefinition {
  name: string;
  keyPath?: string;
  autoIncrement?: boolean;
  indexes?: IndexDefinition[];
}

export interface IndexDefinition {
  name: string;
  keyPath: string | string[];
  options?: {
    unique?: boolean;
    multiEntry?: boolean;
  };
}

// Database configuration
export const DATABASE_CONFIG = {
  name: 'KeylikeAI_DB',
  version: 1,
  stores: {
    SCANS: 'scans',
    SETTINGS: 'settings',
    CACHE: 'cache',
    METADATA: 'metadata'
  }
} as const;

// Store schemas
export const DATABASE_SCHEMA: DatabaseSchema = {
  version: 1,
  stores: [
    {
      name: DATABASE_CONFIG.stores.SCANS,
      keyPath: 'id',
      autoIncrement: false,
      indexes: [
        {
          name: 'timestamp',
          keyPath: 'timestamp',
          options: { unique: false }
        },
        {
          name: 'riskLevel',
          keyPath: 'riskLevel',
          options: { unique: false }
        },
        {
          name: 'geohash',
          keyPath: 'geohash',
          options: { unique: false }
        },
        {
          name: 'encrypted',
          keyPath: 'encrypted',
          options: { unique: false }
        },
        {
          name: 'keyway',
          keyPath: 'keyway',
          options: { unique: false }
        },
        {
          name: 'lockType',
          keyPath: 'lockType',
          options: { unique: false }
        }
      ]
    },
    {
      name: DATABASE_CONFIG.stores.SETTINGS,
      keyPath: 'key',
      autoIncrement: false,
      indexes: [
        {
          name: 'category',
          keyPath: 'category',
          options: { unique: false }
        },
        {
          name: 'lastModified',
          keyPath: 'lastModified',
          options: { unique: false }
        }
      ]
    },
    {
      name: DATABASE_CONFIG.stores.CACHE,
      keyPath: 'key',
      autoIncrement: false,
      indexes: [
        {
          name: 'expiresAt',
          keyPath: 'expiresAt',
          options: { unique: false }
        },
        {
          name: 'category',
          keyPath: 'category',
          options: { unique: false }
        },
        {
          name: 'lastAccessed',
          keyPath: 'lastAccessed',
          options: { unique: false }
        }
      ]
    },
    {
      name: DATABASE_CONFIG.stores.METADATA,
      keyPath: 'key',
      autoIncrement: false,
      indexes: [
        {
          name: 'type',
          keyPath: 'type',
          options: { unique: false }
        },
        {
          name: 'lastUpdated',
          keyPath: 'lastUpdated',
          options: { unique: false }
        }
      ]
    }
  ]
};

// Data type definitions for storage
export interface StoredScanResult {
  id: string;
  timestamp: number;
  riskLevel: 'low' | 'medium' | 'high';
  geohash: string;
  keyway: string;
  lockType: string;
  encrypted: boolean;
  encryptedData?: string; // JSON string of encrypted scan data
  salt?: string; // For encryption
  iv?: string; // Initialization vector
  plainData?: any; // For non-encrypted storage
  dataHash: string; // Integrity check
  version: number; // Schema version
  retentionExpiry: number; // Timestamp for automatic deletion
}

export interface StoredSettings {
  key: string;
  category: 'privacy' | 'ui' | 'model' | 'performance' | 'permissions';
  value: any;
  encrypted: boolean;
  encryptedData?: string;
  salt?: string;
  iv?: string;
  lastModified: number;
  version: number;
}

export interface StoredCacheEntry {
  key: string;
  category: 'model' | 'image' | 'api' | 'user';
  value: any;
  encrypted: boolean;
  encryptedData?: string;
  salt?: string;
  iv?: string;
  expiresAt: number;
  lastAccessed: number;
  size: number; // bytes
  version: number;
}

export interface StoredMetadata {
  key: string;
  type: 'database' | 'user' | 'installation' | 'migration';
  value: any;
  lastUpdated: number;
  version: number;
}

// Encryption configuration
export const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,
  ivLength: 12,
  saltLength: 16,
  tagLength: 16,
  iterations: 100000, // PBKDF2 iterations
  hashAlgorithm: 'SHA-256'
} as const;

// Database migration definitions
export interface MigrationScript {
  fromVersion: number;
  toVersion: number;
  description: string;
  execute: (db: IDBDatabase, transaction: IDBTransaction) => Promise<void>;
}

export const MIGRATION_SCRIPTS: MigrationScript[] = [
  // Future migrations will be added here
  // Example:
  // {
  //   fromVersion: 1,
  //   toVersion: 2,
  //   description: 'Add new indexes for better performance',
  //   execute: async (db, transaction) => {
  //     // Migration logic
  //   }
  // }
];

// Data retention policies
export const RETENTION_POLICIES = {
  defaultRetentionDays: 30,
  maxRetentionDays: 365,
  minRetentionDays: 1,
  cleanupIntervalMs: 24 * 60 * 60 * 1000, // 24 hours
  batchSize: 100 // Number of records to process per cleanup batch
} as const;

// Storage quotas and limits
export const STORAGE_LIMITS = {
  maxScanResults: 10000,
  maxCacheSize: 100 * 1024 * 1024, // 100MB
  maxImageSize: 5 * 1024 * 1024, // 5MB per image
  warningThreshold: 0.8, // 80% of quota
  criticalThreshold: 0.95 // 95% of quota
} as const;

// Error handling
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class EncryptionError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'EncryptionError';
  }
}

// Database events for monitoring
export interface DatabaseEvent {
  type: 'read' | 'write' | 'delete' | 'cleanup' | 'migration' | 'error';
  store: string;
  timestamp: number;
  recordCount?: number;
  error?: Error;
  metadata?: any;
}

export type DatabaseEventListener = (event: DatabaseEvent) => void;