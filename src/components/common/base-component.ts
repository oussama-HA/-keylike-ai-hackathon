import { LitElement, css, CSSResultGroup, html, TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';

/**
 * Base component class that provides common functionality for all Keylike AI components
 */
export abstract class BaseComponent extends LitElement {
  /**
   * Loading state indicator
   */
  @property({ type: Boolean, reflect: true })
  loading = false;

  /**
   * Error state
   */
  @property({ type: String, reflect: true })
  error?: string;

  /**
   * Disabled state
   */
  @property({ type: Boolean, reflect: true })
  disabled = false;

  /**
   * Component visibility
   */
  @property({ type: Boolean, reflect: true })
  hidden = false;

  /**
   * Internal loading state for async operations
   */
  @state()
  protected _internalLoading = false;

  /**
   * Component lifecycle - called when component is first connected
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('error', this.handleError);
    this.initializeComponent();
  }

  /**
   * Component lifecycle - called when component is disconnected
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('error', this.handleError);
    this.cleanupComponent();
  }

  /**
   * Override this method to initialize component-specific functionality
   */
  protected initializeComponent(): void {
    // Override in subclasses
  }

  /**
   * Override this method to cleanup component-specific resources
   */
  protected cleanupComponent(): void {
    // Override in subclasses
  }

  /**
   * Handle errors in a standardized way
   */
  protected handleError = (event: ErrorEvent | Event): void => {
    console.error(`Error in ${this.constructor.name}:`, event);
    
    if (event instanceof ErrorEvent) {
      this.error = event.error?.message || 'An error occurred';
    } else {
      this.error = 'An unexpected error occurred';
    }

    // Emit custom error event for parent components
    this.dispatchEvent(new CustomEvent('component-error', {
      detail: {
        component: this.constructor.name,
        error: this.error,
        originalEvent: event
      },
      bubbles: true,
      composed: true
    }));
  };

  /**
   * Clear any error state
   */
  protected clearError(): void {
    this.error = undefined;
  }

  /**
   * Set loading state
   */
  protected setLoading(loading: boolean): void {
    this._internalLoading = loading;
    this.loading = loading;
    this.requestUpdate();
  }

  /**
   * Emit a custom event with standardized format
   */
  protected emitEvent<T = any>(
    name: string, 
    detail?: T, 
    options: Partial<CustomEventInit> = {}
  ): boolean {
    return this.dispatchEvent(new CustomEvent(name, {
      detail,
      bubbles: true,
      composed: true,
      ...options
    }));
  }

  /**
   * Safe async operation wrapper with loading state
   */
  protected async safeAsyncOperation<T>(
    operation: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T | null> {
    try {
      this.clearError();
      this.setLoading(true);
      
      if (loadingMessage) {
        console.log(loadingMessage);
      }
      
      const result = await operation();
      return result;
      
    } catch (error) {
      console.error(`Async operation failed in ${this.constructor.name}:`, error);
      this.error = error instanceof Error ? error.message : 'Operation failed';
      return null;
      
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Throttle function execution
   */
  protected throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    let lastExecTime = 0;
    
    return (...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * Debounce function execution
   */
  protected debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Check if component is visible in viewport
   */
  protected isInViewport(): boolean {
    const rect = this.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Get current theme
   */
  protected getCurrentTheme(): 'light' | 'dark' {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme === 'dark' ? 'dark' : 'light';
  }

  /**
   * Base styles applied to all components
   */
  static styles: CSSResultGroup = css`
    :host {
      display: block;
      box-sizing: border-box;
    }

    :host([hidden]) {
      display: none !important;
    }

    :host([disabled]) {
      pointer-events: none;
      opacity: 0.6;
    }

    :host([loading]) {
      position: relative;
    }

    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(255, 255, 255, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: inherit;
    }

    [data-theme="dark"] .loading-overlay {
      background-color: rgba(0, 0, 0, 0.8);
    }

    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid rgba(0, 0, 0, 0.1);
      border-top: 2px solid var(--color-primary, #2196F3);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-message {
      color: var(--color-error, #dc3545);
      font-size: var(--font-size-sm, 0.875rem);
      padding: var(--spacing-sm, 0.5rem);
      background-color: rgba(220, 53, 69, 0.1);
      border: 1px solid var(--color-error, #dc3545);
      border-radius: var(--border-radius-md, 0.5rem);
      margin: var(--spacing-sm, 0.5rem) 0;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    /* Focus management */
    :host(:focus-visible) {
      outline: 2px solid var(--color-primary, #2196F3);
      outline-offset: 2px;
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .loading-spinner {
        animation: none;
      }
      
      * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    }

    /* High contrast support */
    @media (prefers-contrast: high) {
      .error-message {
        border-width: 2px;
        font-weight: bold;
      }
    }
  `;

  /**
   * Render loading overlay if component is in loading state
   */
  protected renderLoadingOverlay(): TemplateResult | '' {
    if (!this.loading && !this._internalLoading) return '';
    
    return html`
      <div class="loading-overlay">
        <div class="loading-spinner" aria-label="Loading"></div>
      </div>
    `;
  }

  /**
   * Render error message if component has an error
   */
  protected renderError(): TemplateResult | '' {
    if (!this.error) return '';
    
    return html`
      <div class="error-message" role="alert">
        ${this.error}
      </div>
    `;
  }
}