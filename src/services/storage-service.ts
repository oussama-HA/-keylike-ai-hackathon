import type {
  ScanResult,
  ScanHistory,
  ScanSession,
  ExportedData,
  ScanFilters
} from '../types/scan-types';
import type { UserPermissions } from '../types/app-types';
import { databaseManager, DatabaseManager } from './database/database-manager';
import { encryptionService } from './database/encryption-service';
import { DatabaseError } from './database/database-schema';

export interface UserSettings {
  id: 'default';
  privacy: {
    locationTracking: boolean;
    dataRetention: number; // days
    encryption: boolean;
    geohashPrecision: number;
  };
  ui: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    hapticFeedback: boolean;
    language: string;
  };
  model: {
    autoUpdate: boolean;
    cacheSize: number; // MB
    inferenceBackend: 'webgl' | 'wasm' | 'auto';
  };
  performance: {
    enableMetrics: boolean;
    maxHistoryItems: number;
  };
  permissions: UserPermissions;
}

export interface IStorageService {
  init(): Promise<void>;
  saveScanResult(result: ScanResult): Promise<void>;
  getScanHistory(filters?: ScanFilters): Promise<ScanResult[]>;
  getScanSessions(): Promise<ScanSession[]>;
  deleteScanResult(id: string): Promise<void>;
  clearHistory(): Promise<void>;
  getSettings(): Promise<UserSettings>;
  updateSettings(settings: Partial<UserSettings>): Promise<void>;
  exportData(): Promise<ExportedData>;
  importData(data: ExportedData): Promise<void>;
  getStorageInfo(): Promise<StorageInfo>;
  cleanup(): Promise<void>;
}

export interface StorageInfo {
  totalSize: number; // bytes
  availableSpace: number; // bytes
  scanResultsCount: number;
  oldestScan?: number; // timestamp
  newestScan?: number; // timestamp
  cacheSize: number; // bytes
}

export interface DBSchema {
  scanResults: ScanResult;
  scanSessions: ScanSession;
  userSettings: UserSettings;
  modelCache: {
    key: string;
    data: any;
    timestamp: number;
    expiresAt: number;
  };
  privacyData: {
    id: string;
    encryptedData: string;
    salt: string;
    timestamp: number;
  };
}

export class StorageService implements IStorageService {
  private dbManager: DatabaseManager;
  private isInitialized = false;

  constructor() {
    this.dbManager = databaseManager;
  }

  async init(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('💾 Initializing enhanced storage service...');
      
      // Initialize database manager with encryption
      await this.dbManager.initialize();
      
      this.isInitialized = true;
      console.log('✅ Enhanced storage service initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize storage service:', error);
      throw new DatabaseError(
        `Storage initialization failed: ${error}`,
        'INIT_FAILED',
        error as Error
      );
    }
  }

  async saveScanResult(result: ScanResult): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      await this.dbManager.saveScanResult(result);
    } catch (error) {
      console.error('❌ Failed to save scan result:', error);
      throw error;
    }
  }

  async getScanHistory(filters?: ScanFilters): Promise<ScanResult[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      return await this.dbManager.getScanHistory(filters);
    } catch (error) {
      console.error('❌ Failed to get scan history:', error);
      throw error;
    }
  }

  async getScanSessions(): Promise<ScanSession[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      // TODO: Implement session management in database manager
      console.log('📝 Session management not yet implemented in database manager');
      return [];
    } catch (error) {
      console.error('❌ Failed to get scan sessions:', error);
      throw error;
    }
  }

  async deleteScanResult(id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      await this.dbManager.deleteScanResult(id);
    } catch (error) {
      console.error('❌ Failed to delete scan result:', error);
      throw error;
    }
  }

  async clearHistory(): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      await this.dbManager.clearScanHistory();
    } catch (error) {
      console.error('❌ Failed to clear history:', error);
      throw error;
    }
  }

  async getSettings(): Promise<UserSettings> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const settings = await this.dbManager.getSettings();
      return settings || this.getDefaultSettings();
    } catch (error) {
      console.error('❌ Failed to get settings:', error);
      return this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      id: 'default',
      privacy: {
        locationTracking: false,
        dataRetention: 30, // 30 days
        encryption: true,
        geohashPrecision: 5 // ~2.4km precision
      },
      ui: {
        theme: 'auto',
        notifications: true,
        hapticFeedback: true,
        language: 'en'
      },
      model: {
        autoUpdate: true,
        cacheSize: 50, // 50 MB
        inferenceBackend: 'auto'
      },
      performance: {
        enableMetrics: true,
        maxHistoryItems: 1000
      },
      permissions: {
        camera: 'prompt',
        geolocation: 'prompt',
        notifications: 'prompt'
      }
    };
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...settings };
      
      await this.dbManager.saveSettings(updatedSettings);
      console.log('⚙️ Settings updated');
      
    } catch (error) {
      console.error('❌ Failed to update settings:', error);
      throw error;
    }
  }

  async exportData(): Promise<ExportedData> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const [scanHistory, settings] = await Promise.all([
        this.getScanHistory(),
        this.getSettings()
      ]);
      
      const exportData: ExportedData = {
        version: '1.0.0',
        exportDate: Date.now(),
        scanHistory: {
          sessions: [],
          totalScans: scanHistory.length,
          lastScanTime: scanHistory[0]?.timestamp,
          favoriteLocations: [],
          statistics: {
            averageRiskScore: scanHistory.reduce((sum, scan) => sum + scan.riskAssessment.score, 0) / scanHistory.length || 0,
            mostCommonKeyway: 'SC1', // TODO: Calculate actual most common
            totalProcessingTime: scanHistory.reduce((sum, scan) => sum + scan.metadata.processingTime, 0),
            accuracyFeedback: 0.85 // TODO: Calculate from user feedback
          }
        },
        userSettings: settings,
        modelInfo: {}, // TODO: Get from ModelService
        privacy: {
          dataAnonymized: settings.privacy.encryption,
          locationPrecision: settings.privacy.geohashPrecision,
          encryptionUsed: settings.privacy.encryption
        }
      };
      
      console.log('📤 Data exported');
      return exportData;
      
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  }

  async importData(data: ExportedData): Promise<void> {
    // TODO: Implement data import with validation
    console.log('📥 Data import not yet implemented');
    throw new Error('Data import not yet implemented');
  }

  async getStorageInfo(): Promise<StorageInfo> {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      const stats = await this.dbManager.getStats();
      
      return {
        totalSize: stats.totalSize,
        availableSpace: 100 * 1024 * 1024, // Assume 100MB available
        scanResultsCount: stats.scanResults,
        oldestScan: stats.oldestRecord,
        newestScan: stats.newestRecord,
        cacheSize: 0 // TODO: Calculate actual cache size
      };
      
    } catch (error) {
      console.error('❌ Failed to get storage info:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      await this.dbManager.cleanup();
    } catch (error) {
      console.error('❌ Failed to cleanup storage:', error);
    }
  }

  // Utility methods
  isReady(): boolean {
    return this.isInitialized && this.dbManager.isReady();
  }

  // Cleanup
  dispose(): void {
    this.dbManager.dispose();
    this.isInitialized = false;
    console.log('🗑️ Storage service disposed');
  }
}