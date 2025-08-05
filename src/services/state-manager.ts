/**
 * State Manager
 * 
 * Middleware for preserving all store state during navigation.
 * Integrates with app-store, scan-store, and settings-store to ensure
 * state persistence during SPA route changes.
 */

import { appStore, AppStoreState } from '../stores/app-store';
import { scanStore, ScanStoreState } from '../stores/scan-store';
import { settingsStore, SettingsStoreState } from '../stores/settings-store';

export interface StateSnapshot {
  timestamp: number;
  route: string;
  appState: AppStoreState;
  scanState: ScanStoreState;
  settingsState: SettingsStoreState;
}

export interface StateManagerOptions {
  enableAutoSave?: boolean;
  saveInterval?: number;
  maxSnapshots?: number;
  excludeStates?: Array<'app' | 'scan' | 'settings'>;
}

export class StateManager {
  private snapshots: Map<string, StateSnapshot> = new Map();
  private autoSaveInterval: number | null = null;
  private options: StateManagerOptions;
  private isInitialized = false;

  constructor(options: StateManagerOptions = {}) {
    this.options = {
      enableAutoSave: true,
      saveInterval: 30000, // 30 seconds
      maxSnapshots: 10,
      excludeStates: [],
      ...options
    };

    this.initializeStateManager();
  }

  private initializeStateManager(): void {
    // Set up auto-save if enabled
    if (this.options.enableAutoSave && this.options.saveInterval) {
      this.startAutoSave();
    }

    this.isInitialized = true;
    console.log('💾 State manager initialized with options:', this.options);
  }

  /**
   * Create a snapshot of current state
   */
  createSnapshot(route: string): StateSnapshot {
    const timestamp = Date.now();
    
    const snapshot: StateSnapshot = {
      timestamp,
      route,
      appState: appStore.getState(),
      scanState: scanStore.getState(),
      settingsState: settingsStore.getState()
    };

    return snapshot;
  }

  /**
   * Save current state for a route
   */
  saveState(route: string): void {
    try {
      const snapshot = this.createSnapshot(route);
      this.snapshots.set(route, snapshot);

      // Cleanup old snapshots if we exceed max
      if (this.snapshots.size > (this.options.maxSnapshots || 10)) {
        this.cleanupOldSnapshots();
      }

      console.log(`💾 State saved for route: ${route}`);
    } catch (error) {
      console.error('❌ Failed to save state:', error);
    }
  }

  /**
   * Restore state for a route if it exists
   */
  restoreState(route: string): boolean {
    try {
      const snapshot = this.snapshots.get(route);
      
      if (!snapshot) {
        console.log(`💾 No saved state found for route: ${route}`);
        return false;
      }

      // Check if snapshot is not too old (avoid restoring stale state)
      const maxAge = 1000 * 60 * 30; // 30 minutes
      if (Date.now() - snapshot.timestamp > maxAge) {
        console.log(`💾 State snapshot too old for route: ${route}`);
        this.snapshots.delete(route);
        return false;
      }

      // Restore states (except for excluded ones)
      if (!this.options.excludeStates?.includes('app')) {
        this.restoreAppState(snapshot.appState);
      }

      if (!this.options.excludeStates?.includes('scan')) {
        this.restoreScanState(snapshot.scanState);
      }

      if (!this.options.excludeStates?.includes('settings')) {
        this.restoreSettingsState(snapshot.settingsState);
      }

      console.log(`💾 State restored for route: ${route}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to restore state:', error);
      return false;
    }
  }

  /**
   * Save state before navigation
   */
  beforeNavigate(fromRoute: string, toRoute: string): boolean {
    this.saveState(fromRoute);
    return true; // Allow navigation to continue
  }

  /**
   * Restore state after navigation
   */
  async afterNavigate(fromRoute: string, toRoute: string): Promise<void> {
    // Small delay to ensure route is fully established
    setTimeout(() => {
      this.restoreState(toRoute);
    }, 50);
  }

  /**
   * Get available snapshots
   */
  getSnapshots(): Array<{ route: string; timestamp: number }> {
    return Array.from(this.snapshots.entries()).map(([route, snapshot]) => ({
      route,
      timestamp: snapshot.timestamp
    }));
  }

  /**
   * Check if state exists for a route
   */
  hasStateFor(route: string): boolean {
    return this.snapshots.has(route);
  }

  /**
   * Clear all saved states
   */
  clearAll(): void {
    this.snapshots.clear();
    console.log('💾 All saved states cleared');
  }

  /**
   * Clear state for a specific route
   */
  clearRoute(route: string): void {
    const deleted = this.snapshots.delete(route);
    if (deleted) {
      console.log(`💾 State cleared for route: ${route}`);
    }
  }

  /**
   * Get state manager statistics
   */
  getStats(): {
    totalSnapshots: number;
    oldestSnapshot: number | null;
    newestSnapshot: number | null;
    memoryUsage: number;
  } {
    const timestamps = Array.from(this.snapshots.values()).map(s => s.timestamp);
    
    return {
      totalSnapshots: this.snapshots.size,
      oldestSnapshot: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestSnapshot: timestamps.length > 0 ? Math.max(...timestamps) : null,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Start auto-save functionality
   */
  private startAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.autoSaveInterval = window.setInterval(() => {
      const currentRoute = window.location.pathname;
      this.saveState(currentRoute);
    }, this.options.saveInterval || 30000);

    console.log('💾 Auto-save started with interval:', this.options.saveInterval);
  }

  /**
   * Stop auto-save functionality
   */
  private stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('💾 Auto-save stopped');
    }
  }

  /**
   * Cleanup old snapshots to prevent memory leaks
   */
  private cleanupOldSnapshots(): void {
    const entries = Array.from(this.snapshots.entries());
    entries.sort(([,a], [,b]) => b.timestamp - a.timestamp);

    // Keep only the most recent snapshots
    const maxSnapshots = this.options.maxSnapshots || 10;
    if (entries.length > maxSnapshots) {
      const toDelete = entries.slice(maxSnapshots);
      toDelete.forEach(([route]) => {
        this.snapshots.delete(route);
      });
      console.log(`💾 Cleaned up ${toDelete.length} old snapshots`);
    }
  }

  /**
   * Restore app store state
   */
  private restoreAppState(state: AppStoreState): void {
    try {
      // Only restore certain non-critical properties to avoid conflicts
      appStore.setRoute(state.route);
      
      // Don't restore loading/error states as they should be fresh
      if (state.deviceInfo) {
        appStore.updateDeviceInfo(state.deviceInfo);
      }
      
      if (state.permissions) {
        appStore.updatePermissions(state.permissions);
      }
    } catch (error) {
      console.error('❌ Failed to restore app state:', error);
    }
  }

  /**
   * Restore scan store state
   */
  private restoreScanState(state: ScanStoreState): void {
    try {
      // Restore filters and non-active scanning states
      if (state.filters) {
        scanStore.updateFilters(state.filters);
      }

      // Don't restore active scanning state to avoid conflicts
      // History and statistics are restored automatically via storage
    } catch (error) {
      console.error('❌ Failed to restore scan state:', error);
    }
  }

  /**
   * Restore settings store state
   */
  private restoreSettingsState(state: SettingsStoreState): void {
    try {
      // Settings are automatically persisted via storage service
      // Just ensure any pending changes are handled
      if (state.hasUnsavedChanges && !settingsStore.isLoading()) {
        settingsStore.saveSettings().catch(console.error);
      }
    } catch (error) {
      console.error('❌ Failed to restore settings state:', error);
    }
  }

  /**
   * Estimate memory usage of stored snapshots
   */
  private estimateMemoryUsage(): number {
    try {
      const serialized = JSON.stringify(Array.from(this.snapshots.values()));
      return serialized.length * 2; // Rough estimate in bytes (UTF-16)
    } catch {
      return 0;
    }
  }

  /**
   * Export state data for debugging
   */
  exportSnapshots(): any {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      snapshots: Array.from(this.snapshots.entries()).map(([route, snapshot]) => ({
        ...snapshot,
        route // Keep the route from the key, not from snapshot
      }))
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newOptions: Partial<StateManagerOptions>): void {
    this.options = { ...this.options, ...newOptions };
    
    // Restart auto-save if interval changed
    if (newOptions.enableAutoSave !== undefined || newOptions.saveInterval !== undefined) {
      this.stopAutoSave();
      if (this.options.enableAutoSave) {
        this.startAutoSave();
      }
    }

    console.log('💾 State manager configuration updated:', newOptions);
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    this.stopAutoSave();
    this.snapshots.clear();
    console.log('💾 State manager disposed');
  }
}

// Singleton instance
export const stateManager = new StateManager();