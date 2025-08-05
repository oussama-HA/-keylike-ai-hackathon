import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { NavigationService } from '../../services/navigation-service.js';
import { StateManager } from '../../services/state-manager.js';
import { ScanStore } from '../../stores/scan-store.js';
import '../common/navigation-button';

/**
 * Main application shell component that handles the overall layout and navigation
 */
@customElement('app-shell')
export class AppShell extends BaseComponent {
  @property({ type: String })
  currentRoute = '/';

  @property({ type: Boolean })
  modelReady = false;

  @property({ type: Boolean })
  isOnline = true;

  @state()
  private _sidebarOpen = false;

  @state()
  private _showInstallPrompt = false;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        background-color: var(--color-background);
        color: var(--color-on-background);
      }

      .app-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--color-surface);
        border-bottom: 1px solid var(--color-outline-variant);
        box-shadow: var(--shadow-sm);
      }

      .app-main {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .app-sidebar {
        width: 280px;
        background-color: var(--color-surface);
        border-right: 1px solid var(--color-outline-variant);
        transform: translateX(-100%);
        transition: transform var(--transition-normal);
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 200;
        overflow-y: auto;
      }

      .app-sidebar.open {
        transform: translateX(0);
      }

      .sidebar-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 150;
        opacity: 0;
        visibility: hidden;
        transition: opacity var(--transition-normal), visibility var(--transition-normal);
      }

      .sidebar-backdrop.visible {
        opacity: 1;
        visibility: visible;
      }

      .app-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .route-container {
        flex: 1;
        overflow-y: auto;
        padding: var(--spacing-md);
      }

      .status-bar {
        padding: var(--spacing-xs) var(--spacing-md);
        background-color: var(--color-surface-variant);
        border-top: 1px solid var(--color-outline-variant);
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .install-prompt {
        position: fixed;
        bottom: var(--spacing-md);
        left: var(--spacing-md);
        right: var(--spacing-md);
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        padding: var(--spacing-md);
        border-radius: var(--border-radius-lg);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        z-index: 300;
        transform: translateY(100%);
        transition: transform var(--transition-normal);
      }

      .install-prompt.visible {
        transform: translateY(0);
      }

      .install-prompt-content {
        flex: 1;
      }

      .install-prompt-title {
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-xs);
      }

      .install-prompt-text {
        font-size: var(--font-size-sm);
        opacity: 0.9;
      }

      .install-prompt-actions {
        display: flex;
        gap: var(--spacing-sm);
      }

      .install-btn {
        background-color: rgba(255, 255, 255, 0.2);
        color: inherit;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-sm);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .install-btn:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }

      .close-btn {
        background: none;
        border: none;
        color: inherit;
        font-size: var(--font-size-lg);
        cursor: pointer;
        padding: var(--spacing-xs);
        border-radius: var(--border-radius-sm);
        transition: background-color var(--transition-fast);
      }

      .close-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
      }

      /* Desktop styles */
      @media (min-width: 768px) {
        .app-sidebar {
          position: static;
          transform: none;
          height: auto;
        }

        .sidebar-backdrop {
          display: none;
        }

        .install-prompt {
          max-width: 400px;
          left: auto;
          right: var(--spacing-md);
        }
      }

      /* Sidebar Navigation Styling */
      .sidebar-nav {
        padding: var(--spacing-md);
      }

      .sidebar-header {
        margin-bottom: var(--spacing-lg);
      }

      .sidebar-header h3 {
        color: var(--color-on-surface);
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin: 0;
      }

      .nav-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .nav-list li {
        width: 100%;
      }


      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .app-sidebar,
        .sidebar-backdrop,
        .install-prompt {
          transition: none;
        }
      }
    `
  ];

  protected initializeComponent(): void {
    // Listen for route changes
    window.addEventListener('popstate', this.handleRouteChange);
    
    // Listen for app store updates
    this.setupStoreSubscriptions();
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Subscribe to navigation events for auto-collapse
    this.setupNavigationSubscription();
    
    // Setup scan completion handling
    this.setupScanEventListeners();
  }

  protected cleanupComponent(): void {
    window.removeEventListener('popstate', this.handleRouteChange);
    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('scan-complete', this.handleScanComplete);
  }

  private setupStoreSubscriptions(): void {
    // Import app store dynamically to avoid circular imports
    import('../../stores/app-store.js').then(({ appStore }) => {
      console.log('🔗 App shell connecting to store...');
      
      // Subscribe to app store changes
      const unsubscribe = appStore.subscribe((state) => {
        console.log('📡 App shell received store update:', {
          modelReady: state.isModelReady,
          isOnline: state.isOnline,
          installPromptAvailable: state.installPrompt !== null,
          currentShowPrompt: this._showInstallPrompt
        });
        
        this.modelReady = state.isModelReady;
        this.isOnline = state.isOnline;
        
        const newPromptState = state.installPrompt !== null;
        if (this._showInstallPrompt !== newPromptState) {
          console.log(`🎯 Install prompt visibility changing: ${this._showInstallPrompt} → ${newPromptState}`);
          this._showInstallPrompt = newPromptState;
        }
        
        this.requestUpdate();
      });
      
      // Store unsubscribe function for cleanup
      this.addEventListener('disconnected', unsubscribe);
      
      console.log('✅ App shell store subscription established');
    });
  }

  private handleRouteChange = (): void => {
    this.currentRoute = window.location.pathname;
    this.closeSidebar();
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    // ESC key closes sidebar
    if (event.key === 'Escape' && this._sidebarOpen) {
      this.closeSidebar();
    }
    
    // Ctrl/Cmd + K opens search (future feature)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      // TODO: Open search modal
    }
  };

  private toggleSidebar(): void {
    this._sidebarOpen = !this._sidebarOpen;
  }

  private closeSidebar(): void {
    this._sidebarOpen = false;
  }

  private handleSidebarNavigation = (): void => {
    // Auto-collapse sidebar after navigation on mobile
    this.closeSidebar();
  };

  private setupNavigationSubscription(): void {
    // Import navigation service dynamically to avoid circular imports
    import('../../services/navigation-service.js').then(({ navigationService }) => {
      // Subscribe to navigation events for auto-collapse
      navigationService.subscribe((newRoute: string, previousRoute: string) => {
        console.log('🚪 Sidebar auto-collapse triggered by navigation:', previousRoute, '→', newRoute);
        this.closeSidebar();
      });
      
      console.log('🔗 Sidebar navigation subscription established');
    });
  }

  private async handleInstall(): Promise<void> {
    try {
      // Import app store and trigger PWA installation
      const { appStore } = await import('../../stores/app-store.js');
      await appStore.installPWA();
      this._showInstallPrompt = false;
      console.log('📱 PWA installation triggered');
    } catch (error) {
      console.error('❌ PWA installation failed:', error);
    }
  }

  private async dismissInstallPrompt(): Promise<void> {
    this._showInstallPrompt = false;
    
    // Clear the install prompt from the app store so it won't show again
    try {
      const { appStore } = await import('../../stores/app-store.js');
      appStore.setInstallPrompt(null);
      console.log('📱 PWA install prompt dismissed and cleared from store');
    } catch (error) {
      console.error('❌ Failed to clear install prompt from store:', error);
    }
  }

  /**
   * Setup scan-complete event listener
   */
  private setupScanEventListeners(): void {
    document.addEventListener('scan-complete', this.handleScanComplete);
    console.log('🔍 Scan event listeners set up in app-shell');
  }

  /**
   * Handle scan completion and navigate to results
   */
  private handleScanComplete = async (event: Event): Promise<void> => {
    const customEvent = event as CustomEvent;
    const scanResult = customEvent.detail;
    
    console.log('🎯 [APP-SHELL] Received scan-complete event:', {
      scanId: scanResult?.id,
      keyway: scanResult?.prediction?.keyway,
      riskLevel: scanResult?.riskAssessment?.level
    });

    try {
      // Import services dynamically to avoid circular imports
      const [{ scanStore }, { navigationService }] = await Promise.all([
        import('../../stores/scan-store.js'),
        import('../../services/navigation-service.js')
      ]);

      // Store the scan result in the scan store
      await scanStore.completeScan(scanResult);
      console.log('✅ Scan result stored in scan store');

      // Navigate to results page with scan data
      const success = await navigationService.navigate('/results', {
        data: { scanResult }
      });

      if (success) {
        console.log('🧭 Successfully navigated to results page');
      } else {
        console.error('❌ Failed to navigate to results page');
      }

    } catch (error) {
      console.error('❌ Error handling scan completion:', error);
      // Still try to navigate even if storing fails
      try {
        const { navigationService } = await import('../../services/navigation-service.js');
        await navigationService.navigate('/results', {
          data: { scanResult }
        });
      } catch (navError) {
        console.error('❌ Failed to navigate after scan completion error:', navError);
      }
    }
  };

  render() {
    return html`
      <!-- App Header -->
      <header class="app-header">
        <app-header 
          .currentRoute=${this.currentRoute}
          .modelReady=${this.modelReady}
          .isOnline=${this.isOnline}
          @menu-toggle=${this.toggleSidebar}
        ></app-header>
      </header>

      <!-- Main App Layout -->
      <main class="app-main">
        <!-- Sidebar -->
        <aside class="app-sidebar ${this._sidebarOpen ? 'open' : ''}">
          <nav class="sidebar-nav">
            <div class="sidebar-header">
              <h3>Navigation</h3>
            </div>
            <ul class="nav-list">
              <li>
                <navigation-button
                  route="/"
                  variant="sidebar"
                  full-width
                  class="nav-item"
                >
                  🏠 Home
                </navigation-button>
              </li>
              <li>
                <navigation-button
                  route="/scan"
                  variant="sidebar"
                  full-width
                  class="nav-item"
                >
                  📸 Scan
                </navigation-button>
              </li>
              <li>
                <navigation-button
                  route="/history"
                  variant="sidebar"
                  full-width
                  class="nav-item"
                >
                  📋 History
                </navigation-button>
              </li>
              <li>
                <navigation-button
                  route="/settings"
                  variant="sidebar"
                  full-width
                  class="nav-item"
                >
                  ⚙️ Settings
                </navigation-button>
              </li>
            </ul>
          </nav>
        </aside>

        <!-- Sidebar Backdrop (mobile) -->
        <div 
          class="sidebar-backdrop ${this._sidebarOpen ? 'visible' : ''}"
          @click=${this.closeSidebar}
        ></div>

        <!-- Main Content -->
        <div class="app-content">
          <div class="route-container">
            <app-router .currentRoute=${this.currentRoute}></app-router>
          </div>

          <!-- Status Bar -->
          <footer class="status-bar">
            <div>
              <span>Model: ${this.modelReady ? 'Ready' : 'Loading...'}</span>
            </div>
            <div>
              <span>Status: ${this.isOnline ? 'Online' : 'Offline'}</span>
            </div>
          </footer>
        </div>
      </main>

      <!-- PWA Install Prompt -->
      ${this._showInstallPrompt ? html`
        <div class="install-prompt visible">
          <div class="install-prompt-content">
            <div class="install-prompt-title">Install Keylike AI</div>
            <div class="install-prompt-text">
              Add to your home screen for quick access and offline use
            </div>
          </div>
          <div class="install-prompt-actions">
            <button class="install-btn" @click=${this.handleInstall}>
              Install
            </button>
            <button class="close-btn" @click=${this.dismissInstallPrompt}>
              ×
            </button>
          </div>
        </div>
      ` : ''}

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-shell': AppShell;
  }
}