/**
 * Navigation Service
 * 
 * Centralized SPA navigation service that:
 * - Manages programmatic navigation with state persistence
 * - Integrates with existing app-router
 * - Prevents default anchor tag behavior for SPA routes
 * - Provides hooks for state management during navigation
 */

export interface NavigationOptions {
  replace?: boolean;
  preserveState?: boolean;
  data?: any;
}

export interface NavigationHooks {
  beforeNavigate?: (fromRoute: string, toRoute: string) => Promise<boolean> | boolean;
  afterNavigate?: (fromRoute: string, toRoute: string) => Promise<void> | void;
}

export type NavigationSubscriber = (route: string, previousRoute: string) => void;

export class NavigationService {
  private subscribers: Set<NavigationSubscriber> = new Set();
  private hooks: NavigationHooks = {};
  private appRouter: any = null; // Will be set by app-router
  private isNavigating = false;

  constructor() {
    this.initializeService();
  }

  private initializeService(): void {
    // Intercept anchor clicks for SPA navigation
    document.addEventListener('click', this.handleLinkClick, true);
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', this.handlePopState);
    
    console.log('🧭 Navigation service initialized');
  }

  /**
   * Set the app router instance for integration
   */
  setAppRouter(router: any): void {
    this.appRouter = router;
    console.log('🧭 Navigation service connected to app router');
  }

  /**
   * Register navigation hooks
   */
  setHooks(hooks: NavigationHooks): void {
    this.hooks = { ...this.hooks, ...hooks };
  }

  /**
   * Subscribe to navigation events
   */
  subscribe(subscriber: NavigationSubscriber): () => void {
    this.subscribers.add(subscriber);
    
    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  /**
   * Main navigation method
   */
  async navigate(route: string, options: NavigationOptions = {}): Promise<boolean> {
    if (this.isNavigating) {
      console.warn('🧭 Navigation already in progress, ignoring new navigation');
      return false;
    }

    const currentRoute = window.location.pathname;
    
    // Normalize route
    const normalizedRoute = this.normalizeRoute(route);
    
    // Skip if already on this route
    if (normalizedRoute === currentRoute && !options.replace) {
      console.log('🧭 Already on route:', normalizedRoute);
      return true;
    }

    try {
      this.isNavigating = true;

      // Call beforeNavigate hook
      if (this.hooks.beforeNavigate) {
        const canNavigate = await this.hooks.beforeNavigate(currentRoute, normalizedRoute);
        if (canNavigate === false) {
          console.log('🧭 Navigation cancelled by beforeNavigate hook');
          return false;
        }
      }

      // Update browser history
      if (options.replace) {
        window.history.replaceState(options.data || {}, '', normalizedRoute);
      } else {
        window.history.pushState(options.data || {}, '', normalizedRoute);
      }

      // Update app router if available
      if (this.appRouter && typeof this.appRouter.handleRouteChange === 'function') {
        this.appRouter.handleRouteChange(normalizedRoute, options.data);
      }

      // Notify subscribers
      this.notifySubscribers(normalizedRoute, currentRoute);

      // Call afterNavigate hook
      if (this.hooks.afterNavigate) {
        await this.hooks.afterNavigate(currentRoute, normalizedRoute);
      }

      console.log(`🧭 Navigation completed: ${currentRoute} → ${normalizedRoute}`);
      return true;

    } catch (error) {
      console.error('🧭 Navigation failed:', error);
      return false;
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Navigate back in history
   */
  goBack(): void {
    window.history.back();
  }

  /**
   * Navigate forward in history
   */
  goForward(): void {
    window.history.forward();
  }

  /**
   * Replace current route
   */
  async replace(route: string, options: Omit<NavigationOptions, 'replace'> = {}): Promise<boolean> {
    return this.navigate(route, { ...options, replace: true });
  }

  /**
   * Get current route
   */
  getCurrentRoute(): string {
    return window.location.pathname;
  }

  /**
   * Check if route is current
   */
  isCurrentRoute(route: string): boolean {
    return this.normalizeRoute(route) === this.getCurrentRoute();
  }

  /**
   * Check if navigation is in progress
   */
  isNavigationInProgress(): boolean {
    return this.isNavigating;
  }

  /**
   * Handle anchor tag clicks for SPA navigation
   */
  private handleLinkClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a[href]') as HTMLAnchorElement;
    
    if (!anchor || !anchor.href) {
      return;
    }

    // Check if this is a local route
    const url = new URL(anchor.href);
    const isLocalRoute = url.origin === window.location.origin;
    const isExternalLink = anchor.target === '_blank' || anchor.hasAttribute('data-external');
    const isDownload = anchor.hasAttribute('download');
    
    // Skip if not a local route or explicitly marked as external
    if (!isLocalRoute || isExternalLink || isDownload) {
      return;
    }

    // Check for data-spa-ignore attribute to bypass SPA navigation
    if (anchor.hasAttribute('data-spa-ignore')) {
      return;
    }

    // Prevent default navigation
    event.preventDefault();
    event.stopPropagation();

    // Navigate using SPA
    const route = url.pathname + url.search + url.hash;
    this.navigate(route);
  };

  /**
   * Handle browser back/forward navigation
   */
  private handlePopState = (event: PopStateEvent): void => {
    const newRoute = window.location.pathname;
    const currentRoute = this.getCurrentRoute();
    
    // Update app router if available
    if (this.appRouter && typeof this.appRouter.handleRouteChange === 'function') {
      this.appRouter.handleRouteChange(newRoute, event.state);
    }

    // Notify subscribers
    this.notifySubscribers(newRoute, currentRoute);

    console.log(`🧭 Browser navigation: ${currentRoute} → ${newRoute}`);
  };

  /**
   * Normalize route path
   */
  private normalizeRoute(route: string): string {
    // Remove any leading protocol/domain
    if (route.includes('://')) {
      const url = new URL(route);
      route = url.pathname + url.search + url.hash;
    }

    // Ensure leading slash
    if (!route.startsWith('/')) {
      route = '/' + route;
    }

    // Remove trailing slash except for root
    if (route.length > 1 && route.endsWith('/')) {
      route = route.slice(0, -1);
    }

    return route;
  }

  /**
   * Notify all subscribers of navigation
   */
  private notifySubscribers(newRoute: string, previousRoute: string): void {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(newRoute, previousRoute);
      } catch (error) {
        console.error('🧭 Navigation subscriber error:', error);
      }
    });
  }

  /**
   * Check if a route matches a pattern
   */
  matchesRoute(route: string, pattern: string): boolean {
    const normalizedRoute = this.normalizeRoute(route);
    const normalizedPattern = this.normalizeRoute(pattern);
    
    // Exact match
    if (normalizedRoute === normalizedPattern) {
      return true;
    }
    
    // Pattern matching (simple wildcard support)
    if (normalizedPattern.includes('*')) {
      const regex = new RegExp(
        '^' + normalizedPattern.replace(/\*/g, '.*') + '$'
      );
      return regex.test(normalizedRoute);
    }
    
    // Prefix matching for nested routes
    if (normalizedPattern.endsWith('/*')) {
      const prefix = normalizedPattern.slice(0, -2);
      return normalizedRoute.startsWith(prefix);
    }
    
    return false;
  }

  /**
   * Cleanup service
   */
  dispose(): void {
    document.removeEventListener('click', this.handleLinkClick, true);
    window.removeEventListener('popstate', this.handlePopState);
    this.subscribers.clear();
    console.log('🧭 Navigation service disposed');
  }
}

// Singleton instance
export const navigationService = new NavigationService();