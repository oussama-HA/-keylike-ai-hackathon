import type { UserSettings } from '../services/storage-service';
import type { Theme, Language, InferenceBackend } from '../types/app-types';
import { StorageService } from '../services/storage-service';

export interface SettingsStoreState {
  settings: UserSettings;
  loading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  lastSavedTime: number | null;
}

export type SettingsStoreSubscriber = (state: SettingsStoreState) => void;

export interface SettingsStoreActions {
  loadSettings(): Promise<void>;
  saveSettings(): Promise<void>;
  updatePrivacySettings(settings: Partial<UserSettings['privacy']>): void;
  updateUISettings(settings: Partial<UserSettings['ui']>): void;
  updateModelSettings(settings: Partial<UserSettings['model']>): void;
  updatePerformanceSettings(settings: Partial<UserSettings['performance']>): void;
  updatePermissions(permissions: Partial<UserSettings['permissions']>): void;
  resetToDefaults(): void;
  exportSettings(): Promise<string>;
  importSettings(data: string): Promise<void>;
}

export class SettingsStore {
  private state: SettingsStoreState;
  private subscribers: Set<SettingsStoreSubscriber> = new Set();
  private saveTimeout: number | null = null;
  private storageService: StorageService;
  private isInitialized = false;

  constructor() {
    this.state = this.createInitialState();
    this.storageService = new StorageService();
    console.log('⚙️ Settings store initialized');
    
    // Initialize storage and load settings
    this.initializeStorage();
  }

  /**
   * Initialize storage service and load existing settings
   */
  private async initializeStorage(): Promise<void> {
    try {
      this.updateState({ loading: true });
      
      await this.storageService.init();
      await this.loadSettings();
      
      this.isInitialized = true;
      this.updateState({ loading: false, error: null });
      
      console.log('✅ Settings store storage initialized');
    } catch (error) {
      console.error('❌ Failed to initialize settings store storage:', error);
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Storage initialization failed'
      });
    }
  }

  private createInitialState(): SettingsStoreState {
    return {
      settings: this.getDefaultSettings(),
      loading: false,
      error: null,
      hasUnsavedChanges: false,
      lastSavedTime: null
    };
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

  // Public API
  getState(): SettingsStoreState {
    return { ...this.state };
  }

  getSettings(): UserSettings {
    return { ...this.state.settings };
  }

  subscribe(subscriber: SettingsStoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  // Settings management
  async loadSettings(): Promise<void> {
    this.updateState({ loading: true, error: null });
    
    try {
      const settings = await this.storageService.getSettings();
      const mergedSettings = this.mergeWithDefaults(settings);
      
      this.updateState({
        settings: mergedSettings,
        loading: false,
        hasUnsavedChanges: false,
        lastSavedTime: Date.now()
      });
      
      // Apply theme immediately
      this.applyTheme(mergedSettings.ui.theme);
      
      console.log('⚙️ Settings loaded from database successfully');
      
    } catch (error) {
      console.error('❌ Failed to load settings:', error);
      
      // Fall back to defaults on error
      const defaultSettings = this.getDefaultSettings();
      this.updateState({
        settings: defaultSettings,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load settings'
      });
      
      this.applyTheme(defaultSettings.ui.theme);
    }
  }

  private mergeWithDefaults(stored: Partial<UserSettings>): UserSettings {
    const defaults = this.getDefaultSettings();
    
    return {
      ...defaults,
      ...stored,
      privacy: { ...defaults.privacy, ...stored.privacy },
      ui: { ...defaults.ui, ...stored.ui },
      model: { ...defaults.model, ...stored.model },
      performance: { ...defaults.performance, ...stored.performance },
      permissions: { ...defaults.permissions, ...stored.permissions }
    };
  }

  async saveSettings(): Promise<void> {
    if (!this.state.hasUnsavedChanges || !this.isInitialized) {
      return;
    }
    
    this.updateState({ loading: true, error: null });
    
    try {
      await this.storageService.updateSettings(this.state.settings);
      
      this.updateState({
        loading: false,
        hasUnsavedChanges: false,
        lastSavedTime: Date.now()
      });
      
      console.log('⚙️ Settings saved to database successfully');
      
    } catch (error) {
      console.error('❌ Failed to save settings:', error);
      this.updateState({
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to save settings'
      });
    }
  }

  // Auto-save with debouncing
  private autoSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = window.setTimeout(() => {
      this.saveSettings().catch(console.error);
    }, 1000); // Save after 1 second of inactivity
  }

  // Update methods
  updatePrivacySettings(updates: Partial<UserSettings['privacy']>): void {
    const updatedSettings = {
      ...this.state.settings,
      privacy: { ...this.state.settings.privacy, ...updates }
    };
    
    this.updateState({
      settings: updatedSettings,
      hasUnsavedChanges: true
    });
    
    this.autoSave();
    console.log('🔒 Privacy settings updated:', updates);
  }

  updateUISettings(updates: Partial<UserSettings['ui']>): void {
    const updatedSettings = {
      ...this.state.settings,
      ui: { ...this.state.settings.ui, ...updates }
    };
    
    this.updateState({
      settings: updatedSettings,
      hasUnsavedChanges: true
    });
    
    // Apply theme change immediately
    if (updates.theme) {
      this.applyTheme(updates.theme);
    }
    
    this.autoSave();
    console.log('🎨 UI settings updated:', updates);
  }

  updateModelSettings(updates: Partial<UserSettings['model']>): void {
    const updatedSettings = {
      ...this.state.settings,
      model: { ...this.state.settings.model, ...updates }
    };
    
    this.updateState({
      settings: updatedSettings,
      hasUnsavedChanges: true
    });
    
    this.autoSave();
    console.log('🤖 Model settings updated:', updates);
  }

  updatePerformanceSettings(updates: Partial<UserSettings['performance']>): void {
    const updatedSettings = {
      ...this.state.settings,
      performance: { ...this.state.settings.performance, ...updates }
    };
    
    this.updateState({
      settings: updatedSettings,
      hasUnsavedChanges: true
    });
    
    this.autoSave();
    console.log('📈 Performance settings updated:', updates);
  }

  updatePermissions(updates: Partial<UserSettings['permissions']>): void {
    const updatedSettings = {
      ...this.state.settings,
      permissions: { ...this.state.settings.permissions, ...updates }
    };
    
    this.updateState({
      settings: updatedSettings,
      hasUnsavedChanges: true
    });
    
    this.autoSave();
    console.log('🔒 Permissions updated:', updates);
  }

  // Theme management
  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
  }

  getCurrentTheme(): 'light' | 'dark' {
    const theme = this.state.settings.ui.theme;
    
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return theme;
  }

  // Reset and defaults
  resetToDefaults(): void {
    const defaultSettings = this.getDefaultSettings();
    
    this.updateState({
      settings: defaultSettings,
      hasUnsavedChanges: true
    });
    
    this.applyTheme(defaultSettings.ui.theme);
    this.autoSave();
    
    console.log('🔄 Settings reset to defaults');
  }

  // Import/Export
  async exportSettings(): Promise<string> {
    try {
      const exportData = {
        version: '1.0.0',
        exportDate: Date.now(),
        settings: this.state.settings
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      console.log('📤 Settings exported');
      
      return jsonString;
      
    } catch (error) {
      console.error('❌ Failed to export settings:', error);
      throw new Error('Failed to export settings');
    }
  }

  async importSettings(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data);
      
      if (!importData.version || !importData.settings) {
        throw new Error('Invalid settings format');
      }
      
      if (importData.version !== '1.0.0') {
        throw new Error('Unsupported settings version');
      }
      
      const mergedSettings = this.mergeWithDefaults(importData.settings);
      
      this.updateState({
        settings: mergedSettings,
        hasUnsavedChanges: true
      });
      
      this.applyTheme(mergedSettings.ui.theme);
      await this.saveSettings();
      
      console.log('📥 Settings imported successfully');
      
    } catch (error) {
      console.error('❌ Failed to import settings:', error);
      this.updateState({
        error: error instanceof Error ? error.message : 'Failed to import settings'
      });
      throw error;
    }
  }

  // Privacy helpers
  isLocationTrackingEnabled(): boolean {
    return this.state.settings.privacy.locationTracking;
  }

  isEncryptionEnabled(): boolean {
    return this.state.settings.privacy.encryption;
  }

  getDataRetentionDays(): number {
    return this.state.settings.privacy.dataRetention;
  }

  getGeohashPrecision(): number {
    return this.state.settings.privacy.geohashPrecision;
  }

  // UI helpers
  getTheme(): Theme {
    return this.state.settings.ui.theme;
  }

  getLanguage(): Language {
    return this.state.settings.ui.language as Language;
  }

  isNotificationsEnabled(): boolean {
    return this.state.settings.ui.notifications;
  }

  isHapticFeedbackEnabled(): boolean {
    return this.state.settings.ui.hapticFeedback;
  }

  // Model helpers
  isAutoUpdateEnabled(): boolean {
    return this.state.settings.model.autoUpdate;
  }

  getModelCacheSize(): number {
    return this.state.settings.model.cacheSize;
  }

  getInferenceBackend(): InferenceBackend {
    return this.state.settings.model.inferenceBackend;
  }

  // Performance helpers
  isMetricsEnabled(): boolean {
    return this.state.settings.performance.enableMetrics;
  }

  getMaxHistoryItems(): number {
    return this.state.settings.performance.maxHistoryItems;
  }

  // Validation
  validateSettings(settings: Partial<UserSettings>): string[] {
    const errors: string[] = [];
    
    if (settings.privacy) {
      const { dataRetention, geohashPrecision } = settings.privacy;
      
      if (dataRetention !== undefined && (dataRetention < 1 || dataRetention > 365)) {
        errors.push('Data retention must be between 1 and 365 days');
      }
      
      if (geohashPrecision !== undefined && (geohashPrecision < 1 || geohashPrecision > 12)) {
        errors.push('Geohash precision must be between 1 and 12');
      }
    }
    
    if (settings.model?.cacheSize !== undefined) {
      const { cacheSize } = settings.model;
      if (cacheSize < 10 || cacheSize > 500) {
        errors.push('Model cache size must be between 10 and 500 MB');
      }
    }
    
    if (settings.performance?.maxHistoryItems !== undefined) {
      const { maxHistoryItems } = settings.performance;
      if (maxHistoryItems < 10 || maxHistoryItems > 10000) {
        errors.push('Max history items must be between 10 and 10,000');
      }
    }
    
    return errors;
  }

  // Utility methods
  hasUnsavedChanges(): boolean {
    return this.state.hasUnsavedChanges;
  }

  isLoading(): boolean {
    return this.state.loading;
  }

  getLastSavedTime(): number | null {
    return this.state.lastSavedTime;
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  // Private helpers
  private updateState(updates: Partial<SettingsStoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('❌ Settings store subscriber error:', error);
      }
    });
  }

  // Cleanup
  dispose(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.subscribers.clear();
    console.log('🗑️ Settings store disposed');
  }
}

// Singleton instance
export const settingsStore = new SettingsStore();