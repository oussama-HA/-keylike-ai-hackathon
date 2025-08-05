/**
 * Navigation Button Component
 * 
 * Extends the existing UIButton component to provide SPA navigation functionality.
 * This is a drop-in replacement for ui-button that adds a `route` attribute for navigation.
 * Maintains all existing ui-button functionality and styling.
 */

import { html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { UIButton } from './ui-button';
import { navigationService, NavigationOptions } from '../../services/navigation-service';

/**
 * Enhanced button component with built-in SPA navigation
 */
@customElement('navigation-button')
export class NavigationButton extends UIButton {
  @property({ type: String })
  route = '';

  @property({ type: Boolean, attribute: 'replace' })
  replace = false;

  @property({ type: Boolean, attribute: 'preserve-state' })
  preserveState = true;

  static styles: CSSResultGroup = [
    UIButton.styles,
    css`
      /* Additional styles specific to navigation button if needed */
      :host([route]) {
        cursor: pointer;
      }
      
      :host([route][disabled]) {
        cursor: not-allowed;
      }

      /* Sidebar variant - secondary blue background for inactive buttons */
      .button--sidebar {
        background-color: rgba(45, 108, 210, 0.55) !important; /* Secondary blue background */
        color: white !important;
        padding: var(--spacing-md) var(--spacing-xl) !important;
        border-radius: var(--border-radius-lg) !important;
        border: 1px solid rgba(59, 117, 217, 0.4) !important;
        font-size: var(--font-size-lg) !important;
        font-weight: var(--font-weight-semibold) !important;
        cursor: pointer;
        transition: all var(--transition-fast) !important;
        width: 100%;
        text-align: left;
        margin-bottom: var(--spacing-xs);
        display: block !important;
      }

      /* Sidebar hover effect */
      .button--sidebar:hover:not(:disabled) {
        background-color: rgba(255, 255, 255, 0.1);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      /* Sidebar active state - matches Get Started button */
      .button--sidebar.button--active {
        background-color: var(--color-primary) !important;
        color: var(--color-primary-contrast) !important;
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      /* Sidebar active hover */
      .button--sidebar.button--active:hover:not(:disabled) {
        background-color: var(--color-primary-dark) !important;
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
    `
  ];

  private handleNavigationClick = async (event: Event): Promise<void> => {
    // Don't navigate if disabled or loading
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // Don't navigate if no route is specified
    if (!this.route) {
      return;
    }

    // Prevent default behavior
    event.preventDefault();
    event.stopPropagation();

    try {
      // Set loading state
      this.loading = true;

      // Prepare navigation options
      const options: NavigationOptions = {
        replace: this.replace,
        preserveState: this.preserveState
      };

      // Navigate using the navigation service
      const success = await navigationService.navigate(this.route, options);

      if (!success) {
        console.warn('🧭 Navigation failed for route:', this.route);
      }

      // Emit custom navigation event
      this.emitEvent('navigation-click', {
        route: this.route,
        success,
        options
      });

    } catch (error) {
      console.error('🧭 Navigation error:', error);
      this.emitEvent('navigation-error', { error, route: this.route });
    } finally {
      // Clear loading state
      this.loading = false;
    }
  };

  protected handleClick = (event: Event): void => {
    // Check if disabled or loading first
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    // If route is specified, handle navigation
    if (this.route) {
      this.handleNavigationClick(event);
      return;
    }

    // Otherwise, emit the standard click event
    this.emitEvent('click', { originalEvent: event });
  };

  /**
   * Navigate programmatically
   */
  async navigate(options: NavigationOptions = {}): Promise<boolean> {
    if (!this.route) {
      console.warn('🧭 Cannot navigate: no route specified');
      return false;
    }

    const navigationOptions = {
      replace: this.replace,
      preserveState: this.preserveState,
      ...options
    };

    return navigationService.navigate(this.route, navigationOptions);
  }

  /**
   * Check if this button's route is currently active
   */
  isCurrentRoute(): boolean {
    if (!this.route) {
      return false;
    }
    return navigationService.isCurrentRoute(this.route);
  }

  /**
   * Set the route and update the href attribute if needed
   */
  setRoute(route: string): void {
    this.route = route;
    
    // Update href attribute for accessibility and fallback
    if (route && !this.href) {
      this.href = route;
    }
  }

  private navigationUnsubscribe?: () => void;

  override connectedCallback(): void {
    super.connectedCallback();
    
    // Set href for accessibility if route is provided but href is not
    if (this.route && !this.href) {
      this.href = this.route;
    }

    // Subscribe to navigation changes to update active state
    this.navigationUnsubscribe = navigationService.subscribe(() => {
      this.requestUpdate(); // Re-render when route changes
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    
    // Clean up navigation subscription
    if (this.navigationUnsubscribe) {
      this.navigationUnsubscribe();
    }
  }

  render() {
    const classes = [
      'button',
      `button--${this.variant}`,
      `button--${this.size}`,
      this.fullWidth && 'button--full-width',
      this.iconOnly && 'button--icon-only',
      this.loading && 'button--loading',
      this.route && this.isCurrentRoute() && 'button--active'
    ].filter(Boolean).join(' ');

    const content = html`<slot></slot>`;

    // Always render as button for navigation, even if href is set
    // This ensures consistent navigation behavior
    return html`
      <button
        class=${classes}
        type="button"
        ?disabled=${this.disabled || this.loading}
        @click=${this.handleClick}
        title=${this.route ? `Navigate to ${this.route}` : ''}
      >
        ${content}
      </button>
    `;
  }
}

// Re-export UIButton types for convenience
export type { UIButton } from './ui-button';

declare global {
  interface HTMLElementTagNameMap {
    'navigation-button': NavigationButton;
  }
}