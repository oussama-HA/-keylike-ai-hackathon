import type { 
  AppState, 
  DeviceInfo, 
  PerformanceMetrics, 
  ErrorInfo,
  UserPermissions
} from '../types/app-types';

export interface AppStoreState extends AppState {
  loading: boolean;
  error: ErrorInfo | null;
  route: string;
  previousRoute: string;
  performanceMetrics: PerformanceMetrics;
  permissions: UserPermissions;
  networkStatus: 'online' | 'offline' | 'slow';
  installPrompt: any; // BeforeInstallPromptEvent
}

export type AppStoreSubscriber = (state: AppStoreState) => void;

export interface AppStoreActions {
  setLoading(loading: boolean): void;
  setError(error: ErrorInfo | null): void;
  setModelReady(ready: boolean): void;
  setRoute(route: string): void;
  updateDeviceInfo(info: Partial<DeviceInfo>): void;
  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void;
  updatePermissions(permissions: Partial<UserPermissions>): void;
  setNetworkStatus(status: 'online' | 'offline' | 'slow'): void;
  setInstallPrompt(prompt: any): void;
  clearError(): void;
  reset(): void;
}

export class AppStore {
  private state: AppStoreState;
  private subscribers: Set<AppStoreSubscriber> = new Set();

  constructor() {
    this.state = this.createInitialState();
    this.initializeStore();
  }

  private createInitialState(): AppStoreState {
    return {
      isInitialized: false,
      isModelReady: false,
      isOnline: navigator.onLine,
      currentRoute: '/',
      deviceInfo: this.detectDeviceInfo(),
      loading: true,
      error: null,
      route: '/',
      previousRoute: '',
      performanceMetrics: {
        bundleSize: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0
      },
      permissions: {
        camera: 'prompt',
        geolocation: 'prompt',
        notifications: 'prompt'
      },
      networkStatus: navigator.onLine ? 'online' : 'offline',
      installPrompt: null
    };
  }

  private detectDeviceInfo(): DeviceInfo {
    const userAgent = navigator.userAgent;
    const platform = this.detectPlatform();
    
    return {
      platform,
      userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      isOnline: navigator.onLine,
      hasCamera: this.detectCameraCapability(),
      hasGeolocation: 'geolocation' in navigator
    };
  }

  private detectPlatform(): 'web' | 'ios' | 'android' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) {
      return 'android';
    } else if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      return 'ios';
    } else {
      return 'web';
    }
  }

  private detectCameraCapability(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  private initializeStore(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.updateState({
        isOnline: true,
        networkStatus: 'online'
      });
    });

    window.addEventListener('offline', () => {
      this.updateState({
        isOnline: false,
        networkStatus: 'offline'
      });
    });

    // Listen for PWA install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('🔥 PWA beforeinstallprompt event fired!', e);
      e.preventDefault();
      this.setInstallPrompt(e);
      console.log('✅ PWA install prompt stored in app state');
    });

    // Listen for app install
    window.addEventListener('appinstalled', () => {
      this.setInstallPrompt(null);
      console.log('📱 PWA installed successfully');
    });

    // Enhanced PWA debugging - check periodically for install readiness
    const checkPWAReadiness = () => {
      console.log('🔍 Checking PWA readiness...');
      
      // Check if already installed
      if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App is already installed in standalone mode');
        return;
      }
      
      // Check service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          console.log('🔧 Service Worker Status:', {
            count: registrations.length,
            active: registrations.map(r => ({
              scope: r.scope,
              state: r.active?.state,
              installing: r.installing?.state,
              waiting: r.waiting?.state
            }))
          });
        });
      }
      
      // Check if beforeinstallprompt has fired
      console.log('📊 Install Prompt State:', {
        hasPrompt: this.state.installPrompt !== null,
        timestamp: new Date().toISOString()
      });
    };
    
    // Check immediately and every 10 seconds
    setTimeout(checkPWAReadiness, 2000);
    setInterval(checkPWAReadiness, 10000);

    // PWA diagnostic logging
    this.logPWADiagnostics();

    // Performance monitoring
    this.initializePerformanceMonitoring();

    console.log('🏪 App store initialized');
  }

  private initializePerformanceMonitoring(): void {
    // Monitor performance metrics
    if ('performance' in window) {
      // First Contentful Paint
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.updatePerformanceMetrics({ 
              firstContentfulPaint: entry.startTime 
            });
          }
          if (entry.name === 'largest-contentful-paint') {
            this.updatePerformanceMetrics({ 
              largestContentfulPaint: entry.startTime 
            });
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  // Public API
  getState(): AppStoreState {
    return { ...this.state };
  }

  subscribe(subscriber: AppStoreSubscriber): () => void {
    this.subscribers.add(subscriber);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  // Actions
  setLoading(loading: boolean): void {
    this.updateState({ loading });
  }

  setError(error: ErrorInfo | null): void {
    this.updateState({ error });
    
    if (error) {
      console.error('❌ App error:', error);
    }
  }

  setModelReady(ready: boolean): void {
    this.updateState({ isModelReady: ready });
    
    if (ready) {
      console.log('🤖 Model ready for inference');
    }
  }

  setRoute(route: string): void {
    const previousRoute = this.state.route;
    this.updateState({ 
      route, 
      previousRoute,
      currentRoute: route 
    });
    
    console.log(`🧭 Route changed: ${previousRoute} → ${route}`);
  }

  updateDeviceInfo(info: Partial<DeviceInfo>): void {
    this.updateState({
      deviceInfo: { ...this.state.deviceInfo, ...info }
    });
  }

  updatePerformanceMetrics(metrics: Partial<PerformanceMetrics>): void {
    this.updateState({
      performanceMetrics: { ...this.state.performanceMetrics, ...metrics }
    });
  }

  updatePermissions(permissions: Partial<UserPermissions>): void {
    this.updateState({
      permissions: { ...this.state.permissions, ...permissions }
    });
    
    console.log('🔒 Permissions updated:', permissions);
  }

  setNetworkStatus(status: 'online' | 'offline' | 'slow'): void {
    this.updateState({ 
      networkStatus: status,
      isOnline: status !== 'offline'
    });
    
    console.log(`🌐 Network status: ${status}`);
  }

  setInstallPrompt(prompt: any): void {
    this.updateState({ installPrompt: prompt });
    console.log('🔄 Install prompt state updated:', prompt !== null ? 'Available' : 'Not Available');
  }

  clearError(): void {
    this.updateState({ error: null });
  }

  reset(): void {
    const newState = this.createInitialState();
    this.updateState(newState);
    console.log('🔄 App store reset');
  }

  // Initialization complete
  setInitialized(): void {
    this.updateState({ 
      isInitialized: true,
      loading: false 
    });
    console.log('✅ App initialization complete');
  }

  // Utility methods
  isReady(): boolean {
    return this.state.isInitialized && !this.state.loading;
  }

  hasError(): boolean {
    return this.state.error !== null;
  }

  canUseCamera(): boolean {
    return this.state.deviceInfo.hasCamera && 
           this.state.permissions.camera === 'granted';
  }

  canUseLocation(): boolean {
    return this.state.deviceInfo.hasGeolocation && 
           this.state.permissions.geolocation === 'granted';
  }

  isOnline(): boolean {
    return this.state.isOnline;
  }

  canInstallPWA(): boolean {
    return this.state.installPrompt !== null;
  }

  async installPWA(): Promise<boolean> {
    if (!this.state.installPrompt) {
      return false;
    }

    try {
      const prompt = this.state.installPrompt;
      const result = await prompt.prompt();
      
      if (result.outcome === 'accepted') {
        console.log('📱 User accepted PWA install');
        return true;
      } else {
        console.log('📱 User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA install failed:', error);
      return false;
    } finally {
      this.setInstallPrompt(null);
    }
  }

  // Error handling
  reportError(error: Error, context?: string): void {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (context) {
      errorInfo.message = `${context}: ${errorInfo.message}`;
    }

    this.setError(errorInfo);
  }

  // Performance tracking
  trackPerformance(metric: string, value: number): void {
    const updates: Partial<PerformanceMetrics> = {};
    
    switch (metric) {
      case 'modelLoadTime':
        updates.modelLoadTime = value;
        break;
      case 'inferenceTime':
        updates.inferenceTime = value;
        break;
      case 'memoryUsage':
        updates.memoryUsage = value;
        break;
      case 'bundleSize':
        updates.bundleSize = value;
        break;
    }
    
    this.updatePerformanceMetrics(updates);
  }

  // Private helpers
  private updateState(updates: Partial<AppStoreState>): void {
    this.state = { ...this.state, ...updates };
    this.notifySubscribers();
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(this.state);
      } catch (error) {
        console.error('❌ Store subscriber error:', error);
      }
    });
  }

  private logPWADiagnostics(): void {
    console.log('🔍 PWA Installation Diagnostics:');
    console.log('  • User Agent:', navigator.userAgent);
    console.log('  • Service Worker Support:', 'serviceWorker' in navigator);
    console.log('  • Manifest Support:', 'manifest' in document.createElement('link'));
    console.log('  • HTTPS:', location.protocol === 'https:' || location.hostname === 'localhost');
    console.log('  • beforeinstallprompt Support:', 'onbeforeinstallprompt' in window);
    
    // Check if already installed
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((apps: any[]) => {
        console.log('  • Already Installed Apps:', apps.length > 0 ? apps : 'None');
      }).catch(() => {
        console.log('  • Already Installed Apps: Check failed');
      });
    }
    
    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    console.log('  • Manifest Link:', manifestLink ? manifestLink.href : 'Not found');
    
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        console.log('  • Service Worker Registrations:', registrations.length);
      });
    }
    
    // Check current install prompt state
    console.log('  • Current Install Prompt:', this.state.installPrompt ? 'Available' : 'Not Available');
  }

  // Cleanup
  dispose(): void {
    this.subscribers.clear();
    console.log('🗑️ App store disposed');
  }
}

// Singleton instance
export const appStore = new AppStore();