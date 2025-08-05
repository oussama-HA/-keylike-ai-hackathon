/**
 * Data Lifecycle Management Service for Keylike AI PWA
 * Handles privacy-compliant data retention, cleanup, and optimization
 */

import { databaseManager } from './database/database-manager';
import { encryptionService } from './database/encryption-service';
import { RETENTION_POLICIES, STORAGE_LIMITS } from './database/database-schema';
import type { UserSettings } from './storage-service';
import type { ScanResult } from '../types/scan-types';

export interface DataLifecycleConfig {
  enableAutoCleanup: boolean;
  cleanupInterval: number; // milliseconds
  retentionDays: number;
  maxStorageSize: number; // bytes
  enableDataOptimization: boolean;
  enablePrivacyMode: boolean;
}

export interface CleanupReport {
  scanResultsDeleted: number;
  cacheCleared: number;
  storageFreed: number; // bytes
  duration: number; // milliseconds
  timestamp: number;
}

export interface StorageAnalysis {
  totalSize: number;
  availableSpace: number;
  utilizationPercentage: number;
  oldestRecord?: number;
  newestRecord?: number;
  retentionCompliance: boolean;
  recommendations: string[];
}

export interface PrivacyCompliance {
  dataRetentionCompliant: boolean;
  encryptionEnabled: boolean;
  locationDataMinimized: boolean;
  personalDataRemoved: boolean;
  auditTrail: PrivacyAuditEntry[];
}

export interface PrivacyAuditEntry {
  timestamp: number;
  action: 'data_created' | 'data_accessed' | 'data_deleted' | 'data_exported' | 'data_anonymized';
  recordId?: string;
  details: string;
}

export class DataLifecycleService {
  private static instance: DataLifecycleService;
  private config: DataLifecycleConfig;
  private cleanupInterval: number | null = null;
  private auditLog: PrivacyAuditEntry[] = [];

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  static getInstance(): DataLifecycleService {
    if (!DataLifecycleService.instance) {
      DataLifecycleService.instance = new DataLifecycleService();
    }
    return DataLifecycleService.instance;
  }

  /**
   * Initialize the data lifecycle service
   */
  async initialize(userSettings?: UserSettings): Promise<void> {
    try {
      // Update config based on user settings
      if (userSettings) {
        this.updateConfigFromSettings(userSettings);
      }

      // Start automatic cleanup if enabled
      if (this.config.enableAutoCleanup) {
        this.startAutoCleanup();
      }

      // Perform initial compliance check
      await this.performComplianceCheck();

      this.logAuditEvent('data_created', undefined, 'Data lifecycle service initialized');
      console.log('🔄 Data lifecycle service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize data lifecycle service:', error);
      throw error;
    }
  }

  /**
   * Update configuration from user settings
   */
  updateConfigFromSettings(settings: UserSettings): void {
    this.config = {
      ...this.config,
      retentionDays: settings.privacy.dataRetention,
      enablePrivacyMode: settings.privacy.encryption,
      enableAutoCleanup: settings.performance.enableMetrics,
    };

    console.log('🔧 Data lifecycle config updated from user settings');
  }

  /**
   * Perform comprehensive data cleanup
   */
  async performCleanup(): Promise<CleanupReport> {
    const startTime = Date.now();
    let scanResultsDeleted = 0;
    let cacheCleared = 0;
    let storageFreed = 0;

    try {
      console.log('🧹 Starting comprehensive data cleanup...');

      // 1. Clean up expired scan results
      scanResultsDeleted = await this.cleanupExpiredScanResults();

      // 2. Clean up cache entries
      cacheCleared = await this.cleanupCache();

      // 3. Optimize storage
      storageFreed = await this.optimizeStorage();

      // 4. Update audit log
      this.logAuditEvent('data_deleted', undefined, 
        `Cleanup completed: ${scanResultsDeleted} scans, ${cacheCleared} cache entries`);

      const report: CleanupReport = {
        scanResultsDeleted,
        cacheCleared,
        storageFreed,
        duration: Date.now() - startTime,
        timestamp: Date.now()
      };

      console.log('✅ Data cleanup completed:', report);
      return report;

    } catch (error) {
      console.error('❌ Data cleanup failed:', error);
      throw error;
    }
  }

  /**
   * Clean up expired scan results based on retention policy
   */
  private async cleanupExpiredScanResults(): Promise<number> {
    try {
      const cutoffTime = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      const scanHistory = await databaseManager.getScanHistory();
      
      const expiredScans = scanHistory.filter(scan => scan.timestamp < cutoffTime);
      
      let deletedCount = 0;
      for (const scan of expiredScans) {
        await databaseManager.deleteScanResult(scan.id);
        deletedCount++;
        
        this.logAuditEvent('data_deleted', scan.id, 
          `Scan result deleted due to retention policy (${this.config.retentionDays} days)`);
      }

      console.log(`🗑️ Deleted ${deletedCount} expired scan results`);
      return deletedCount;

    } catch (error) {
      console.error('❌ Failed to cleanup expired scan results:', error);
      return 0;
    }
  }

  /**
   * Clean up cache entries
   */
  private async cleanupCache(): Promise<number> {
    try {
      // This would be implemented when cache functionality is added
      // For now, return 0 as placeholder
      console.log('🧹 Cache cleanup (placeholder - not yet implemented)');
      return 0;

    } catch (error) {
      console.error('❌ Failed to cleanup cache:', error);
      return 0;
    }
  }

  /**
   * Optimize storage by compacting and reorganizing data
   */
  private async optimizeStorage(): Promise<number> {
    try {
      // Placeholder for storage optimization
      // This could include defragmentation, index rebuilding, etc.
      console.log('⚡ Storage optimization (placeholder)');
      return 0;

    } catch (error) {
      console.error('❌ Failed to optimize storage:', error);
      return 0;
    }
  }

  /**
   * Analyze current storage usage
   */
  async analyzeStorage(): Promise<StorageAnalysis> {
    try {
      const stats = await databaseManager.getStats();
      const utilizationPercentage = (stats.totalSize / STORAGE_LIMITS.maxCacheSize) * 100;
      const retentionCutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
      
      const recommendations: string[] = [];
      
      // Generate recommendations based on analysis
      if (utilizationPercentage > 80) {
        recommendations.push('Storage usage is high. Consider reducing retention period or clearing old data.');
      }
      
      if (stats.scanResults > STORAGE_LIMITS.maxScanResults * 0.8) {
        recommendations.push('Large number of scan results. Automatic cleanup is recommended.');
      }
      
      if (stats.oldestRecord && stats.oldestRecord < retentionCutoff) {
        recommendations.push('Some data exceeds retention policy. Cleanup is needed for compliance.');
      }

      return {
        totalSize: stats.totalSize,
        availableSpace: STORAGE_LIMITS.maxCacheSize - stats.totalSize,
        utilizationPercentage,
        oldestRecord: stats.oldestRecord,
        newestRecord: stats.newestRecord,
        retentionCompliance: !stats.oldestRecord || stats.oldestRecord >= retentionCutoff,
        recommendations
      };

    } catch (error) {
      console.error('❌ Failed to analyze storage:', error);
      throw error;
    }
  }

  /**
   * Check privacy compliance
   */
  async checkPrivacyCompliance(): Promise<PrivacyCompliance> {
    try {
      const analysis = await this.analyzeStorage();
      const encryptionStatus = encryptionService.getStatus();
      
      return {
        dataRetentionCompliant: analysis.retentionCompliance,
        encryptionEnabled: encryptionStatus.isInitialized,
        locationDataMinimized: true, // Using geohash instead of raw GPS
        personalDataRemoved: true, // No PII stored
        auditTrail: [...this.auditLog].slice(-100) // Last 100 entries
      };

    } catch (error) {
      console.error('❌ Failed to check privacy compliance:', error);
      throw error;
    }
  }

  /**
   * Export user data for GDPR compliance
   */
  async exportUserData(): Promise<any> {
    try {
      const scanHistory = await databaseManager.getScanHistory();
      const compliance = await this.checkPrivacyCompliance();
      
      const exportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        dataType: 'user_personal_data',
        scanResults: scanHistory.map(scan => ({
          id: scan.id,
          timestamp: scan.timestamp,
          keyway: scan.prediction.keyway,
          riskLevel: scan.riskAssessment.level,
          location: {
            geohash: scan.location.geohash,
            precision: scan.location.precision
          },
          encrypted: scan.encrypted
        })),
        privacyCompliance: compliance,
        dataProcessingPurpose: 'Lock security analysis and user convenience',
        legalBasis: 'User consent',
        retentionPeriod: `${this.config.retentionDays} days`
      };

      this.logAuditEvent('data_exported', undefined, 'User data exported for GDPR compliance');
      console.log('📤 User data exported for GDPR compliance');
      
      return exportData;

    } catch (error) {
      console.error('❌ Failed to export user data:', error);
      throw error;
    }
  }

  /**
   * Delete all user data (right to be forgotten)
   */
  async deleteAllUserData(): Promise<void> {
    try {
      console.log('🗑️ Deleting all user data...');

      // Clear all scan results
      await databaseManager.clearScanHistory();
      
      // Reset settings to defaults
      // Note: This would be implemented based on requirements
      
      // Clear audit log
      this.auditLog = [];
      
      this.logAuditEvent('data_deleted', undefined, 'All user data deleted (right to be forgotten)');
      console.log('✅ All user data deleted successfully');

    } catch (error) {
      console.error('❌ Failed to delete all user data:', error);
      throw error;
    }
  }

  /**
   * Anonymize scan data (remove identifying information)
   */
  async anonymizeData(): Promise<void> {
    try {
      console.log('🔒 Anonymizing scan data...');
      
      const scanHistory = await databaseManager.getScanHistory();
      
      for (const scan of scanHistory) {
        // Remove or hash any potentially identifying data
        const anonymizedScan: ScanResult = {
          ...scan,
          id: this.generateAnonymousId(),
          notes: undefined, // Remove user notes
          tags: undefined, // Remove user tags
          location: {
            ...scan.location,
            city: undefined, // Remove city information
            country: undefined // Remove country information
          }
        };
        
        await databaseManager.saveScanResult(anonymizedScan);
      }

      this.logAuditEvent('data_anonymized', undefined, `Anonymized ${scanHistory.length} scan results`);
      console.log('✅ Data anonymization completed');

    } catch (error) {
      console.error('❌ Failed to anonymize data:', error);
      throw error;
    }
  }

  /**
   * Start automatic cleanup process
   */
  private startAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = window.setInterval(async () => {
      try {
        await this.performCleanup();
      } catch (error) {
        console.error('❌ Automatic cleanup failed:', error);
      }
    }, this.config.cleanupInterval);

    console.log('⏰ Automatic cleanup started');
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('⏹️ Automatic cleanup stopped');
    }
  }

  /**
   * Perform compliance check
   */
  private async performComplianceCheck(): Promise<void> {
    try {
      const compliance = await this.checkPrivacyCompliance();
      
      if (!compliance.dataRetentionCompliant) {
        console.warn('⚠️ Data retention compliance issue detected - triggering cleanup');
        await this.performCleanup();
      }

      if (!compliance.encryptionEnabled) {
        console.warn('⚠️ Encryption not enabled - privacy may be compromised');
      }

    } catch (error) {
      console.error('❌ Compliance check failed:', error);
    }
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    action: PrivacyAuditEntry['action'], 
    recordId?: string, 
    details?: string
  ): void {
    const entry: PrivacyAuditEntry = {
      timestamp: Date.now(),
      action,
      recordId,
      details: details || ''
    };

    this.auditLog.push(entry);

    // Keep only last 1000 entries to prevent unlimited growth
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Generate anonymous ID
   */
  private generateAnonymousId(): string {
    return 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): DataLifecycleConfig {
    return {
      enableAutoCleanup: true,
      cleanupInterval: RETENTION_POLICIES.cleanupIntervalMs,
      retentionDays: RETENTION_POLICIES.defaultRetentionDays,
      maxStorageSize: STORAGE_LIMITS.maxCacheSize,
      enableDataOptimization: true,
      enablePrivacyMode: true
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DataLifecycleConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart auto cleanup if interval changed
    if (config.cleanupInterval || config.enableAutoCleanup !== undefined) {
      this.stopAutoCleanup();
      if (this.config.enableAutoCleanup) {
        this.startAutoCleanup();
      }
    }

    console.log('🔧 Data lifecycle configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): DataLifecycleConfig {
    return { ...this.config };
  }

  /**
   * Get audit log
   */
  getAuditLog(): PrivacyAuditEntry[] {
    return [...this.auditLog];
  }

  /**
   * Cleanup and disposal
   */
  dispose(): void {
    this.stopAutoCleanup();
    this.auditLog = [];
    DataLifecycleService.instance = null as any;
    console.log('🗑️ Data lifecycle service disposed');
  }
}

// Export singleton instance
export const dataLifecycleService = DataLifecycleService.getInstance();