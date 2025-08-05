import './styles/global.css';

// Initialize PWA Elements for Capacitor
import { defineCustomElements } from '@ionic/pwa-elements/loader';

// PWA Elements initialization
console.log('🔧 Initializing PWA Elements...');
try {
  defineCustomElements(window);
  console.log('✅ PWA Elements initialized successfully');
  
  // Diagnostic check
  if (typeof (window as any).defineCustomElements === 'function') {
    console.log('✅ defineCustomElements function available');
  }
} catch (error) {
  console.error('❌ Failed to initialize PWA Elements:', error);
}

// Import all component modules to register them
import './components/app/app-shell';
import './components/app/app-router';
import './components/app/app-header';
import './components/common/ui-button';
import './components/common/ui-card';
import './components/scanner/camera-scanner';
import './components/scanner/scan-controls';
import './components/scanner/scan-overlay';
import './components/results/risk-display';
import './components/results/scan-history';
import './components/settings/settings-panel';
import './components/demo/ui-showcase';
import './components/onboarding/welcome-screen';
import './components/onboarding/permissions-screen';
import './components/onboarding/privacy-screen';

// Initialize services
import { ModelService } from './services/model-service';
import { StorageService } from './services/storage-service';
import { PrivacyService } from './services/privacy-service';
import { dataLifecycleService } from './services/data-lifecycle-service';

// Initialize stores
import { AppStore } from './stores/app-store';
import { ScanStore } from './stores/scan-store';
import { SettingsStore } from './stores/settings-store';

// App initialization
class App {
  private modelService: ModelService;
  private storageService: StorageService;
  private privacyService: PrivacyService;
  private appStore: AppStore;
  private scanStore: ScanStore;
  private settingsStore: SettingsStore;

  constructor() {
    this.modelService = new ModelService();
    this.storageService = new StorageService();
    this.privacyService = new PrivacyService();
    this.appStore = new AppStore();
    this.scanStore = new ScanStore();
    this.settingsStore = new SettingsStore();
  }

  async init(): Promise<void> {
    try {
      console.log('🚀 Keylike AI starting up...');
      
      
      // Initialize storage
      await this.storageService.init();
      console.log('✅ Storage initialized');
      
      // Load user settings
      await this.settingsStore.loadSettings();
      console.log('✅ Settings loaded');
      
      // Initialize data lifecycle service with user settings
      const userSettings = this.settingsStore.getSettings();
      await dataLifecycleService.initialize(userSettings);
      console.log('✅ Data lifecycle service initialized');
      
      // Hide loading screen and show app
      this.hideLoadingScreen();
      console.log('✅ App ready');
      
      // Initialize model in background
      this.initializeModelInBackground();
      
    } catch (error) {
      console.error('❌ Failed to initialize app:', error);
      this.showError('Failed to initialize application');
    }
  }

  private hideLoadingScreen(): void {
    const loadingElement = document.getElementById('loading');
    const appElement = document.getElementById('app');
    
    if (loadingElement && appElement) {
      loadingElement.style.display = 'none';
      appElement.style.display = 'block';
    }
  }

  private async initializeModelInBackground(): Promise<void> {
    try {
      console.log('🤖 Loading AI model in background...');
      await this.modelService.loadModel();
      console.log('✅ AI model loaded');
      this.appStore.setModelReady(true);
    } catch (error) {
      console.error('❌ Failed to load model:', error);
      this.appStore.setModelReady(false);
    }
  }

  private showError(message: string): void {
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
      loadingElement.innerHTML = `
        <div style="text-align: center; color: white; padding: 20px;">
          <h2>⚠️ Initialization Error</h2>
          <p>${message}</p>
          <button onclick="location.reload()" style="
            background: white; 
            color: #2196F3; 
            border: none; 
            padding: 10px 20px; 
            border-radius: 4px; 
            margin-top: 16px;
            cursor: pointer;
          ">
            Retry
          </button>
        </div>
      `;
    }
  }
}

// Start the application
const app = new App();
app.init().catch(console.error);

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('✅ Service Worker registered:', registration);
      })
      .catch(error => {
        console.log('❌ Service Worker registration failed:', error);
      });
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});