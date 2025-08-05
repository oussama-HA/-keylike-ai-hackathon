import type {
  ScanResult,
  ScanHistory,
  ScanSession,
  ScanFilters,
  CapturedImage,
  ModelPrediction
} from '../types/scan-types';
import { StorageService } from '../services/storage-service';

export interface ScanStoreState {
  currentScan: ScanResult | null;
  scanHistory: ScanResult[];
  activeSessions: ScanSession[];
  currentSession: ScanSession | null;
  isScanning: boolean;
  scanProgress: number; // 0-100
  lastScanTime: number | null;
  filters: ScanFilters;
  statistics: ScanStatistics;
  loading: boolean;
  error: string | null;
}

export interface ScanStatistics {
  totalScans: number;
  averageRiskScore: number;
  mostCommonKeyway: string;
  mostCommonLockType: string;
  scansThisWeek: number;
  scansThisMonth: number;
  averageConfidence: number;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
  };
}

export type ScanStoreSubscriber = (state: ScanStoreState) => void;

export interface ScanStoreActions {
  startScan(): void;
  updateScanProgress(progress: number): void;
  completeScan(result: ScanResult): Promise<void>;
  cancelScan(): void;
  addScanResult(result: ScanResult): Promise<void>;
  deleteScanResult(id: string): Promise<void>;
  clearHistory(): Promise<void>;
  updateFilters(filters: Partial<ScanFilters>): void;
  startSession(name?: string): void;
  endSession(): void;
  exportData(): Promise<any>;
  importData(data: any): Promise<void>;
}

export class ScanStore {
  private state: ScanStoreState;
  private subscribers: Set<ScanStoreSubscriber> = new Set();
  private storageService: StorageService;
  private isInitialized = false;

  constructor() {
    this.state = this.createInitialState();
    this.storageService = new StorageService();
    console.log('🔬 Scan store initialized');
    
    // Initialize storage and load data
    this.initializeStorage();
  }

  /**
   * Initialize storage service and load existing data
   */
  private async initializeStorage(): Promise<void> {
    try {
      this.updateState({ loading: true });
      
      await this.storageService.init();
      await this.loadScanHistory();
      
      this.isInitialized = true;
      this.updateState({ loading: false, error: null });
      
      console.log('✅ Scan store storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize scan store storage:', error);
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Storage initialization failed'
      });
    }
  }

  /**
   * Load scan history from storage
   */
  private async loadScanHistory(): Promise<void> {
    try {
      const scanHistory = await this.storageService.getScanHistory();
      const statistics = this.calculateStatistics(scanHistory);
      
      this.updateState({
        scanHistory,
        statistics
      });
      
      console.log(`📚 Loaded ${scanHistory.length} scan results from storage`);
    } catch (error) {
      console.error('❌ Failed to load scan history:', error);
      // Don't throw - continue with empty state
    }
  }

  private createInitialState(): ScanStoreState {
    return {
      currentScan: null,
      scanHistory: [],
      activeSessions: [],
      currentSession: null,
      isScanning: false,
      scanProgress: 0,
      lastScanTime: null,
      filters: {},
      statistics: {
        totalScans: 0,
        averageRiskScore: 0,
        mostCommonKeyway: '',
        mostCommonLockType: '',
        scansThisWeek: 0,
        scansThisMonth: 0,
        averageConfidence: 0,
        riskDistribution: {
          low: 0,
          medium: 0,
          high: 0
        }
      },
      loading: false,
      error: null
    };
  }

  // Public API
  getState(): ScanStoreState {
    return { ...this.state };
  }

  subscribe(subscriber: ScanStoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  // Scanning actions
  startScan(): void {
    this.updateState({
      isScanning: true,
      scanProgress: 0,
      currentScan: null,
      error: null
    });
    
    console.log('📸 Scan started');
  }

  updateScanProgress(progress: number): void {
    this.updateState({ 
      scanProgress: Math.max(0, Math.min(100, progress)) 
    });
  }

  async completeScan(result: ScanResult): Promise<void> {
    try {
      await this.addScanResult(result);
      
      this.updateState({
        currentScan: result,
        isScanning: false,
        scanProgress: 100,
        lastScanTime: result.timestamp
      });

      // Add to current session if active
      if (this.state.currentSession) {
        this.addToCurrentSession(result);
      }
      
      console.log('✅ Scan completed and saved:', result.id);
    } catch (error) {
      console.error('❌ Failed to complete scan:', error);
      this.updateState({
        isScanning: false,
        scanProgress: 0,
        error: 'Failed to save scan result'
      });
      throw error;
    }
  }

  cancelScan(): void {
    this.updateState({
      isScanning: false,
      scanProgress: 0,
      currentScan: null
    });
    
    console.log('❌ Scan cancelled');
  }

  // Data management
  async addScanResult(result: ScanResult): Promise<void> {
    try {
      // Save to storage first
      if (this.isInitialized) {
        await this.storageService.saveScanResult(result);
      }

      // Update in-memory state
      const updatedHistory = [result, ...this.state.scanHistory];
      const statistics = this.calculateStatistics(updatedHistory);
      
      this.updateState({
        scanHistory: updatedHistory,
        statistics
      });
      
      console.log('💾 Scan result added to history and saved to storage');
    } catch (error) {
      console.error('❌ Failed to save scan result:', error);
      this.updateState({ error: 'Failed to save scan result' });
      throw error;
    }
  }

  async deleteScanResult(id: string): Promise<void> {
    try {
      // Delete from storage first
      if (this.isInitialized) {
        await this.storageService.deleteScanResult(id);
      }

      // Update in-memory state
      const updatedHistory = this.state.scanHistory.filter(scan => scan.id !== id);
      const statistics = this.calculateStatistics(updatedHistory);
      
      this.updateState({
        scanHistory: updatedHistory,
        statistics
      });
      
      // Remove from current scan if it matches
      if (this.state.currentScan?.id === id) {
        this.updateState({ currentScan: null });
      }
      
      console.log('🗑️ Scan result deleted from storage and memory:', id);
    } catch (error) {
      console.error('❌ Failed to delete scan result:', error);
      this.updateState({ error: 'Failed to delete scan result' });
      throw error;
    }
  }

  async clearHistory(): Promise<void> {
    try {
      // Clear storage first
      if (this.isInitialized) {
        await this.storageService.clearHistory();
      }

      // Update in-memory state
      this.updateState({
        scanHistory: [],
        currentScan: null,
        statistics: this.createInitialState().statistics
      });
      
      console.log('🧹 Scan history cleared from storage and memory');
    } catch (error) {
      console.error('❌ Failed to clear scan history:', error);
      this.updateState({ error: 'Failed to clear scan history' });
      throw error;
    }
  }

  // Filtering
  updateFilters(filters: Partial<ScanFilters>): void {
    this.updateState({
      filters: { ...this.state.filters, ...filters }
    });
    
    console.log('🔍 Filters updated:', filters);
  }

  getFilteredResults(): ScanResult[] {
    return this.applyFilters(this.state.scanHistory, this.state.filters);
  }

  private applyFilters(results: ScanResult[], filters: ScanFilters): ScanResult[] {
    let filtered = results;
    
    if (filters.dateRange) {
      filtered = filtered.filter(result => 
        result.timestamp >= filters.dateRange!.start && 
        result.timestamp <= filters.dateRange!.end
      );
    }
    
    if (filters.riskLevel && filters.riskLevel.length > 0) {
      filtered = filtered.filter(result => 
        filters.riskLevel!.includes(result.riskAssessment.level)
      );
    }
    
    if (filters.lockType && filters.lockType.length > 0) {
      filtered = filtered.filter(result => 
        filters.lockType!.includes(result.prediction.lockType)
      );
    }
    
    if (filters.keyway && filters.keyway.length > 0) {
      filtered = filtered.filter(result => 
        filters.keyway!.includes(result.prediction.keyway)
      );
    }
    
    if (filters.minConfidence !== undefined) {
      filtered = filtered.filter(result => 
        result.prediction.confidence >= filters.minConfidence!
      );
    }
    
    if (filters.location && filters.location.length > 0) {
      filtered = filtered.filter(result => 
        filters.location!.some(loc => 
          result.location.geohash.startsWith(loc)
        )
      );
    }
    
    return filtered;
  }

  // Sessions
  startSession(name?: string): void {
    const session: ScanSession = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      results: [],
      purpose: name,
      shared: false
    };
    
    this.updateState({
      currentSession: session,
      activeSessions: [...this.state.activeSessions, session]
    });
    
    console.log('🎬 Scan session started:', session.id);
  }

  endSession(): void {
    if (!this.state.currentSession) {
      return;
    }
    
    const endedSession = {
      ...this.state.currentSession,
      endTime: Date.now()
    };
    
    const updatedSessions = this.state.activeSessions.map(session =>
      session.id === endedSession.id ? endedSession : session
    );
    
    this.updateState({
      currentSession: null,
      activeSessions: updatedSessions
    });
    
    console.log('🏁 Scan session ended:', endedSession.id);
  }

  private addToCurrentSession(result: ScanResult): void {
    if (!this.state.currentSession) {
      return;
    }
    
    const updatedSession = {
      ...this.state.currentSession,
      results: [...this.state.currentSession.results, result]
    };
    
    const updatedSessions = this.state.activeSessions.map(session =>
      session.id === updatedSession.id ? updatedSession : session
    );
    
    this.updateState({
      currentSession: updatedSession,
      activeSessions: updatedSessions
    });
  }

  // Statistics calculation
  private calculateStatistics(results: ScanResult[]): ScanStatistics {
    if (results.length === 0) {
      return this.createInitialState().statistics;
    }
    
    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const scansThisWeek = results.filter(r => r.timestamp >= oneWeekAgo).length;
    const scansThisMonth = results.filter(r => r.timestamp >= oneMonthAgo).length;
    
    const totalRiskScore = results.reduce((sum, r) => sum + r.riskAssessment.score, 0);
    const averageRiskScore = totalRiskScore / results.length;
    
    const totalConfidence = results.reduce((sum, r) => sum + r.prediction.confidence, 0);
    const averageConfidence = totalConfidence / results.length;
    
    // Find most common keyway
    const keywayCount = results.reduce((count, r) => {
      count[r.prediction.keyway] = (count[r.prediction.keyway] || 0) + 1;
      return count;
    }, {} as Record<string, number>);
    
    const mostCommonKeyway = Object.entries(keywayCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    // Find most common lock type
    const lockTypeCount = results.reduce((count, r) => {
      count[r.prediction.lockType] = (count[r.prediction.lockType] || 0) + 1;
      return count;
    }, {} as Record<string, number>);
    
    const mostCommonLockType = Object.entries(lockTypeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';
    
    // Risk distribution
    const riskDistribution = results.reduce((dist, r) => {
      dist[r.riskAssessment.level]++;
      return dist;
    }, { low: 0, medium: 0, high: 0 });
    
    return {
      totalScans: results.length,
      averageRiskScore: Math.round(averageRiskScore * 10) / 10,
      mostCommonKeyway,
      mostCommonLockType,
      scansThisWeek,
      scansThisMonth,
      averageConfidence: Math.round(averageConfidence * 100) / 100,
      riskDistribution
    };
  }

  // Data export/import
  async exportData(): Promise<any> {
    const exportData = {
      version: '1.0.0',
      exportDate: Date.now(),
      scanHistory: this.state.scanHistory,
      sessions: this.state.activeSessions,
      statistics: this.state.statistics
    };
    
    console.log('📤 Scan data exported');
    return exportData;
  }

  async importData(data: any): Promise<void> {
    try {
      if (data.version !== '1.0.0') {
        throw new Error('Unsupported data version');
      }
      
      const scanHistory = data.scanHistory || [];
      const activeSessions = data.sessions || [];
      const statistics = this.calculateStatistics(scanHistory);
      
      this.updateState({
        scanHistory,
        activeSessions,
        statistics,
        currentScan: null,
        currentSession: null
      });
      
      console.log('📥 Scan data imported successfully');
      
    } catch (error) {
      console.error('❌ Failed to import scan data:', error);
      throw error;
    }
  }

  // Utility methods
  getCurrentScan(): ScanResult | null {
    return this.state.currentScan;
  }

  getRecentScans(count: number = 10): ScanResult[] {
    return this.state.scanHistory.slice(0, count);
  }

  getScanById(id: string): ScanResult | null {
    return this.state.scanHistory.find(scan => scan.id === id) || null;
  }

  getScansForLocation(geohash: string): ScanResult[] {
    return this.state.scanHistory.filter(scan => 
      scan.location.geohash.startsWith(geohash)
    );
  }

  getScansForKeyway(keyway: string): ScanResult[] {
    return this.state.scanHistory.filter(scan => 
      scan.prediction.keyway === keyway
    );
  }

  isScanning(): boolean {
    return this.state.isScanning;
  }

  hasResults(): boolean {
    return this.state.scanHistory.length > 0;
  }

  // Search functionality
  searchScans(query: string): ScanResult[] {
    const searchTerm = query.toLowerCase();
    
    return this.state.scanHistory.filter(scan => 
      scan.prediction.keyway.toLowerCase().includes(searchTerm) ||
      scan.prediction.lockType.toLowerCase().includes(searchTerm) ||
      scan.prediction.brandDetected?.toLowerCase().includes(searchTerm) ||
      scan.notes?.toLowerCase().includes(searchTerm)
    );
  }

  // Private helpers
  private updateState(updates: Partial<ScanStoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('❌ Scan store subscriber error:', error);
      }
    });
  }

  // Cleanup
  dispose(): void {
    this.subscribers.clear();
    console.log('🗑️ Scan store disposed');
  }
}

// Singleton instance
export const scanStore = new ScanStore();