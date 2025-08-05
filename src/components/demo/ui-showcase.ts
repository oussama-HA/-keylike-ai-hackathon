import { html, css, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';

/**
 * UI showcase component to test all UI elements
 */
@customElement('ui-showcase')
export class UIShowcase extends BaseComponent {
  @state()
  private _currentDemo = 'overview';

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        height: 100vh;
        overflow-y: auto;
        background-color: var(--color-background);
      }

      .showcase-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--spacing-lg);
      }

      .showcase-header {
        text-align: center;
        margin-bottom: var(--spacing-xl);
        padding: var(--spacing-lg);
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        color: white;
        border-radius: var(--border-radius-lg);
      }

      .showcase-title {
        font-size: var(--font-size-xxxl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--spacing-sm) 0;
      }

      .showcase-subtitle {
        font-size: var(--font-size-lg);
        opacity: 0.9;
        margin: 0;
      }

      .demo-nav {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-xl);
        flex-wrap: wrap;
        justify-content: center;
      }

      .demo-tab {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        background-color: var(--color-surface);
        color: var(--color-on-surface);
        cursor: pointer;
        transition: all var(--transition-fast);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .demo-tab:hover {
        background-color: var(--color-surface-variant);
        transform: translateY(-1px);
      }

      .demo-tab.active {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      .demo-section {
        background-color: var(--color-surface);
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        margin-bottom: var(--spacing-lg);
      }

      .section-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        margin: 0 0 var(--spacing-lg) 0;
        color: var(--color-on-surface);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .demo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: var(--spacing-lg);
        margin-bottom: var(--spacing-lg);
      }

      .demo-item {
        padding: var(--spacing-md);
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--border-radius-md);
        background-color: var(--color-background);
      }

      .demo-item h4 {
        margin: 0 0 var(--spacing-md) 0;
        font-size: var(--font-size-lg);
        color: var(--color-on-surface);
      }

      .button-group {
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
        margin-bottom: var(--spacing-md);
      }

      .mock-button {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        border: 1px solid;
        cursor: pointer;
        font-weight: var(--font-weight-medium);
        transition: all var(--transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        min-height: 44px;
      }

      .mock-button.primary {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      .mock-button.primary:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .mock-button.secondary {
        background-color: var(--color-secondary);
        color: var(--color-secondary-contrast);
        border-color: var(--color-secondary);
      }

      .mock-button.outline {
        background-color: transparent;
        color: var(--color-primary);
        border-color: var(--color-primary);
      }

      .mock-button.outline:hover {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
      }

      .mock-card {
        background-color: var(--color-surface);
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-normal);
        margin-bottom: var(--spacing-md);
      }

      .mock-card:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .risk-demo {
        display: flex;
        gap: var(--spacing-md);
        flex-wrap: wrap;
      }

      .risk-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-full);
        font-weight: var(--font-weight-bold);
        text-transform: uppercase;
        font-size: var(--font-size-xs);
        letter-spacing: 0.5px;
      }

      .risk-low {
        background-color: var(--color-risk-low);
        color: white;
      }

      .risk-medium {
        background-color: var(--color-risk-medium);
        color: black;
      }

      .risk-high {
        background-color: var(--color-risk-high);
        color: white;
      }

      .color-palette {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: var(--spacing-md);
      }

      .color-swatch {
        text-align: center;
        border-radius: var(--border-radius-md);
        overflow: hidden;
        box-shadow: var(--shadow-sm);
      }

      .color-sample {
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: var(--font-weight-semibold);
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
      }

      .color-label {
        padding: var(--spacing-sm);
        background-color: var(--color-surface);
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
      }

      .theme-switcher {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-lg);
        justify-content: center;
        flex-wrap: wrap;
      }

      .theme-button {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        background-color: var(--color-surface);
        color: var(--color-on-surface);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .theme-button:hover {
        background-color: var(--color-surface-variant);
      }

      .theme-button.active {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      @media (max-width: 768px) {
        .showcase-container {
          padding: var(--spacing-md);
        }

        .demo-grid {
          grid-template-columns: 1fr;
        }

        .button-group {
          flex-direction: column;
        }

        .color-palette {
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        }
      }
    `
  ];

  private switchDemo(demo: string): void {
    this._currentDemo = demo;
  }

  private switchTheme(theme: string): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private renderOverview() {
    return html`
      <div class="demo-section">
        <h3 class="section-title">🎨 Theme Switcher</h3>
        <div class="theme-switcher">
          <button class="theme-button" @click=${() => this.switchTheme('light')}>☀️ Light</button>
          <button class="theme-button" @click=${() => this.switchTheme('dark')}>🌙 Dark</button>
          <button class="theme-button" @click=${() => this.switchTheme('blue')}>🔵 Blue</button>
          <button class="theme-button" @click=${() => this.switchTheme('security')}>🔒 Security</button>
        </div>
      </div>

      <div class="demo-section">
        <h3 class="section-title">🎯 Component Overview</h3>
        <div class="demo-grid">
          <div class="demo-item">
            <h4>✅ Completed Components</h4>
            <ul>
              <li>✓ Enhanced Risk Display</li>
              <li>✓ Scanner Controls</li>
              <li>✓ Settings Panel</li>
              <li>✓ Welcome Screen</li>
              <li>✓ App Shell & Navigation</li>
              <li>✓ Responsive CSS System</li>
              <li>✓ Theme Management</li>
            </ul>
          </div>
          <div class="demo-item">
            <h4>🎨 Design System Features</h4>
            <ul>
              <li>✓ CSS Custom Properties</li>
              <li>✓ Mobile-First Design</li>
              <li>✓ Touch-Friendly Interactions</li>
              <li>✓ Accessibility Support</li>
              <li>✓ Dark/Light Themes</li>
              <li>✓ PWA Optimizations</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  private renderButtons() {
    return html`
      <div class="demo-section">
        <h3 class="section-title">🔘 Button Variants</h3>
        <div class="demo-grid">
          <div class="demo-item">
            <h4>Primary Buttons</h4>
            <div class="button-group">
              <button class="mock-button primary">📸 Primary</button>
              <button class="mock-button primary">🚀 Start Scan</button>
              <button class="mock-button primary">💾 Save</button>
            </div>
          </div>
          <div class="demo-item">
            <h4>Secondary & Outline</h4>
            <div class="button-group">
              <button class="mock-button secondary">🔄 Secondary</button>
              <button class="mock-button outline">📤 Share</button>
              <button class="mock-button outline">⚙️ Settings</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderCards() {
    return html`
      <div class="demo-section">
        <h3 class="section-title">🗃️ Card Components</h3>
        <div class="demo-grid">
          <div class="mock-card">
            <h4>🔒 Security Analysis</h4>
            <p>Lock type: Standard Pin Tumbler</p>
            <div class="risk-demo">
              <span class="risk-badge risk-low">✅ Low Risk</span>
              <span>Confidence: 92%</span>
            </div>
          </div>
          <div class="mock-card">
            <h4>⚠️ Vulnerability Detected</h4>
            <p>This lock may be susceptible to bump key attacks</p>
            <div class="risk-demo">
              <span class="risk-badge risk-high">🚨 High Risk</span>
              <span>Confidence: 87%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderColors() {
    return html`
      <div class="demo-section">
        <h3 class="section-title">🎨 Color System</h3>
        <div class="color-palette">
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-primary)">Primary</div>
            <div class="color-label">--color-primary</div>
          </div>
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-secondary)">Secondary</div>
            <div class="color-label">--color-secondary</div>
          </div>
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-success)">Success</div>
            <div class="color-label">--color-success</div>
          </div>
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-warning); color: black;">Warning</div>
            <div class="color-label">--color-warning</div>
          </div>
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-error)">Error</div>
            <div class="color-label">--color-error</div>
          </div>
          <div class="color-swatch">
            <div class="color-sample" style="background-color: var(--color-info)">Info</div>
            <div class="color-label">--color-info</div>
          </div>
        </div>
      </div>
    `;
  }

  private renderCurrentDemo() {
    switch (this._currentDemo) {
      case 'buttons': return this.renderButtons();
      case 'cards': return this.renderCards();
      case 'colors': return this.renderColors();
      default: return this.renderOverview();
    }
  }

  render() {
    return html`
      <div class="showcase-container">
        <div class="showcase-header">
          <h1 class="showcase-title">Keylike AI UI Showcase</h1>
          <p class="showcase-subtitle">Comprehensive UI components and design system</p>
        </div>

        <div class="demo-nav">
          <button 
            class="demo-tab ${this._currentDemo === 'overview' ? 'active' : ''}"
            @click=${() => this.switchDemo('overview')}
          >
            📋 Overview
          </button>
          <button 
            class="demo-tab ${this._currentDemo === 'buttons' ? 'active' : ''}"
            @click=${() => this.switchDemo('buttons')}
          >
            🔘 Buttons
          </button>
          <button 
            class="demo-tab ${this._currentDemo === 'cards' ? 'active' : ''}"
            @click=${() => this.switchDemo('cards')}
          >
            🗃️ Cards
          </button>
          <button 
            class="demo-tab ${this._currentDemo === 'colors' ? 'active' : ''}"
            @click=${() => this.switchDemo('colors')}
          >
            🎨 Colors
          </button>
        </div>

        ${this.renderCurrentDemo()}

        <div class="demo-section">
          <h3 class="section-title">📱 PWA Features</h3>
          <div class="demo-grid">
            <div class="demo-item">
              <h4>✅ Implemented</h4>
              <ul>
                <li>✓ Responsive Design (Mobile-First)</li>
                <li>✓ Touch-Friendly UI (44px+ targets)</li>
                <li>✓ Safe Area Support</li>
                <li>✓ Offline-Ready CSS</li>
                <li>✓ Performance Optimized</li>
                <li>✓ Accessibility Features</li>
              </ul>
            </div>
            <div class="demo-item">
              <h4>🎯 Design Principles</h4>
              <ul>
                <li>✓ Material Design Inspired</li>
                <li>✓ Consistent Spacing Scale</li>
                <li>✓ Typography Hierarchy</li>
                <li>✓ Color System with Variants</li>
                <li>✓ Motion & Animations</li>
                <li>✓ Theme Customization</li>
              </ul>
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
    'ui-showcase': UIShowcase;
  }
}