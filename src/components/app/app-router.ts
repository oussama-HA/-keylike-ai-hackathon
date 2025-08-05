import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { navigationService, NavigationOptions } from '../../services/navigation-service';
import { stateManager } from '../../services/state-manager';
import '../common/navigation-button';
import '../onboarding/location-collection';

/**
 * Simple client-side router for the application
 */
@customElement('app-router')
export class AppRouter extends BaseComponent {
  @property({ type: String })
  currentRoute = '/';

  @state()
  private _routeParams: Record<string, string> = {};

  @state()
  private _queryParams: Record<string, string> = {};

  @state()
  private _navigationData: any = null;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .route-view {
        width: 100%;
        height: 100%;
        overflow-y: auto;
      }

      .route-transition {
        animation: fadeIn 0.3s ease-in-out;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .not-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: var(--spacing-xl);
      }

      .not-found h1 {
        font-size: var(--font-size-xxxl);
        margin-bottom: var(--spacing-md);
        color: var(--color-on-surface-variant);
      }

      .not-found p {
        font-size: var(--font-size-lg);
        color: var(--color-on-surface-variant);
        margin-bottom: var(--spacing-lg);
      }

      .home-link {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        text-decoration: none;
        font-weight: var(--font-weight-medium);
        transition: background-color var(--transition-fast);
      }

      .home-link:hover {
        background-color: var(--color-primary-dark);
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .route-transition {
          animation: none;
        }
      }
    `
  ];

  protected initializeComponent(): void {
    this.parseCurrentRoute();
    window.addEventListener('popstate', this.handlePopState);
    
    // Connect with NavigationService
    navigationService.setAppRouter(this);
    
    // Set up navigation hooks for state management
    navigationService.setHooks({
      beforeNavigate: stateManager.beforeNavigate.bind(stateManager),
      afterNavigate: stateManager.afterNavigate.bind(stateManager)
    });
    
    console.log('🧭 App router integrated with navigation services');
  }

  protected cleanupComponent(): void {
    window.removeEventListener('popstate', this.handlePopState);
    navigationService.dispose();
    stateManager.dispose();
  }

  private handlePopState = (): void => {
    this.currentRoute = window.location.pathname;
    this.parseCurrentRoute();
  };

  private parseCurrentRoute(): void {
    const url = new URL(window.location.href);
    this.currentRoute = url.pathname;
    
    // Parse route parameters (for future use with parameterized routes)
    this._routeParams = this.extractRouteParams(this.currentRoute);
    
    // Parse query parameters
    this._queryParams = Object.fromEntries(url.searchParams.entries());
  }

  private extractRouteParams(route: string): Record<string, string> {
    // Simple route parameter extraction
    // For more complex routing, we would use a proper router library
    const params: Record<string, string> = {};
    
    // Example: /scan/:id -> extract id parameter
    if (route.startsWith('/scan/') && route.length > 6) {
      params.id = route.substring(6);
    }
    
    return params;
  }

  private navigate(path: string): void {
    if (path !== this.currentRoute) {
      window.history.pushState({}, '', path);
      this.currentRoute = path;
      this.parseCurrentRoute();
      
      // Emit navigation event
      this.emitEvent('route-changed', {
        route: path,
        params: this._routeParams,
        query: this._queryParams
      });
    }
  }

  /**
   * Public API method for programmatic navigation
   */
  async navigateTo(path: string, options: NavigationOptions = {}): Promise<boolean> {
    return navigationService.navigate(path, options);
  }

  /**
   * Replace current route
   */
  async replaceTo(path: string, options: Omit<NavigationOptions, 'replace'> = {}): Promise<boolean> {
    return navigationService.replace(path, options);
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    navigationService.goBack();
  }

  /**
   * Navigate forward in history
   */
  goForward(): void {
    navigationService.goForward();
  }

  /**
   * Get current route information
   */
  getRouteInfo() {
    return {
      route: this.currentRoute,
      params: { ...this._routeParams },
      query: { ...this._queryParams }
    };
  }

  /**
   * Check if route matches current
   */
  isCurrentRoute(route: string): boolean {
    return navigationService.isCurrentRoute(route);
  }

  /**
   * Handle route changes from NavigationService
   */
  handleRouteChange(newRoute: string, navigationData?: any): void {
    this.currentRoute = newRoute;
    this._navigationData = navigationData;
    this.parseCurrentRoute();
    this.requestUpdate();
  }

  private renderRoute() {
    const route = this.currentRoute;
    
    // Route matching
    switch (true) {
      case route === '/':
        return html`<welcome-screen></welcome-screen>`;
        
      case route === '/location':
        return html`<location-collection></location-collection>`;
        
      case route === '/scan':
        return html`<camera-scanner></camera-scanner>`;
        
      case route.startsWith('/scan/'):
        return html`<camera-scanner .scanId=${this._routeParams.id}></camera-scanner>`;
        
      case route === '/results':
        return html`<risk-display .scanResult=${this._navigationData?.scanResult || null}></risk-display>`;
        
      case route.startsWith('/results/'):
        return html`<risk-display .resultId=${this._routeParams.id} .scanResult=${this._navigationData?.scanResult || null}></risk-display>`;
        
      case route === '/history':
        return html`<scan-history></scan-history>`;
        
      case route === '/settings':
        return html`<privacy-screen></privacy-screen>`;
        
      case route === '/permissions':
        return html`<permissions-screen></permissions-screen>`;
        
      case route === '/onboarding':
        return html`<welcome-screen></welcome-screen>`;
        
      default:
        return this.renderNotFound();
    }
  }

  private renderNotFound() {
    return html`
      <div class="not-found">
        <h1>404</h1>
        <p>Page not found</p>
        <navigation-button route="/" variant="filled" class="home-link">
          Go Home
        </navigation-button>
      </div>
    `;
  }


  render() {
    return html`
      <div class="route-view">
        <div class="route-transition">
          ${this.renderRoute()}
        </div>
      </div>
      
      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-router': AppRouter;
  }
}