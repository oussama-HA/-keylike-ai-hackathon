import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import '../common/navigation-button.ts';

/**
 * Application header with navigation and status indicators
 */
@customElement('app-header')
export class AppHeader extends BaseComponent {
  @property({ type: String })
  currentRoute = '/';

  @property({ type: Boolean })
  modelReady = false;

  @property({ type: Boolean })
  isOnline = true;

  @state()
  private _showMenu = false;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        background-color: var(--color-surface);
        border-bottom: 1px solid var(--color-outline-variant);
        box-shadow: var(--shadow-sm);
      }

      .header-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-sm) var(--spacing-md);
        max-width: 1200px;
        margin: 0 auto;
        min-height: 64px;
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
      }

      .menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: var(--border-radius-md);
        background: none;
        border: none;
        color: var(--color-on-surface);
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .menu-button:hover {
        background-color: var(--color-surface-variant);
      }

      .menu-icon {
        width: 24px;
        height: 24px;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }

      .menu-line {
        width: 100%;
        height: 2px;
        background-color: currentColor;
        border-radius: 1px;
        transition: all var(--transition-fast);
      }

      .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        text-decoration: none;
        color: var(--color-on-surface);
      }

      .logo-icon {
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        border-radius: var(--border-radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: var(--font-weight-bold);
        font-size: var(--font-size-sm);
      }

      .logo-text {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-on-surface);
      }

      .header-center {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
      }

      .breadcrumb-separator {
        color: var(--color-outline);
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .status-indicators {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .status-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .status-indicator.online {
        background-color: rgba(40, 167, 69, 0.1);
        color: var(--color-success);
      }

      .status-indicator.offline {
        background-color: rgba(220, 53, 69, 0.1);
        color: var(--color-error);
      }

      .status-indicator.model-ready {
        background-color: rgba(33, 150, 243, 0.1);
        color: var(--color-primary);
      }

      .status-indicator.model-loading {
        background-color: rgba(255, 193, 7, 0.1);
        color: var(--color-warning);
      }

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: currentColor;
      }

      .model-loading .status-dot {
        animation: pulse 1.5s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }


      /* Mobile adjustments */
      @media (max-width: 768px) {
        .header-container {
          padding: var(--spacing-xs) var(--spacing-sm);
        }

        .logo-text {
          display: none;
        }

        .breadcrumb {
          display: none;
        }

        .status-indicators {
          gap: var(--spacing-xs);
        }

        .status-indicator {
          padding: var(--spacing-xs);
        }

        .status-indicator span {
          display: none;
        }
      }

      /* Desktop menu button hidden */
      @media (min-width: 768px) {
        .menu-button {
          display: none;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .model-loading .status-dot {
          animation: none;
        }
      }
    `
  ];

  private getBreadcrumb(): string[] {
    const route = this.currentRoute;
    const segments = route.split('/').filter(Boolean);
    
    const breadcrumbs = ['Home'];
    
    segments.forEach(segment => {
      switch (segment) {
        case 'scan':
          breadcrumbs.push('Scanner');
          break;
        case 'results':
          breadcrumbs.push('Results');
          break;
        case 'history':
          breadcrumbs.push('History');
          break;
        case 'settings':
          breadcrumbs.push('Settings');
          break;
        case 'onboarding':
          breadcrumbs.push('Welcome');
          break;
        default:
          breadcrumbs.push(segment);
      }
    });
    
    return breadcrumbs;
  }

  private handleMenuToggle(): void {
    this.emitEvent('menu-toggle');
  }


  render() {
    const breadcrumbs = this.getBreadcrumb();
    
    return html`
      <div class="header-container">
        <!-- Left Section -->
        <div class="header-left">
          <button 
            class="menu-button" 
            @click=${this.handleMenuToggle}
            aria-label="Toggle menu"
          >
            <div class="menu-icon">
              <div class="menu-line"></div>
              <div class="menu-line"></div>
              <div class="menu-line"></div>
            </div>
          </button>
          
          <navigation-button route="/" variant="ghost" class="logo">
            <div class="logo-icon">K</div>
            <div class="logo-text">Keylike AI</div>
          </navigation-button>
        </div>

        <!-- Center Section -->
        <div class="header-center">
          <nav class="breadcrumb">
            ${breadcrumbs.map((crumb, index) => html`
              ${index > 0 ? html`<span class="breadcrumb-separator">/</span>` : ''}
              <span>${crumb}</span>
            `)}
          </nav>
        </div>

        <!-- Right Section -->
        <div class="header-right">
          <!-- Status Indicators -->
          <div class="status-indicators">
            <div class="status-indicator ${this.isOnline ? 'online' : 'offline'}">
              <div class="status-dot"></div>
              <span>${this.isOnline ? 'Online' : 'Offline'}</span>
            </div>
            
            <div class="status-indicator ${this.modelReady ? 'model-ready' : 'model-loading'}">
              <div class="status-dot"></div>
              <span>${this.modelReady ? 'Ready' : 'Loading'}</span>
            </div>
          </div>

        </div>
      </div>

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-header': AppHeader;
  }
}