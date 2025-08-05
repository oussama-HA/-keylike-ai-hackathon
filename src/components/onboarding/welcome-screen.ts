import { html, css, CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import '../common/navigation-button.ts';

@customElement('welcome-screen')
export class WelcomeScreen extends BaseComponent {
  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: var(--spacing-xl);
      }

      .logo {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
      }

      .title {
        font-size: var(--font-size-xxxl);
        font-weight: var(--font-weight-bold);
        margin-bottom: var(--spacing-md);
        color: var(--color-primary);
      }

      .subtitle {
        font-size: var(--font-size-lg);
        color: var(--color-on-surface-variant);
        margin-bottom: var(--spacing-xl);
        max-width: 500px;
        line-height: 1.6;
      }

      .cta-button {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        padding: var(--spacing-md) var(--spacing-xl);
        border-radius: var(--border-radius-lg);
        border: none;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .cta-button:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }
    `
  ];


  render() {
    return html`
      <div class="logo">🔐</div>
      <h1 class="title">Keylike AI</h1>
      <p class="subtitle">
        Privacy-first lock security assessment powered by AI. 
        Scan locks to analyze their security and get personalized recommendations.
      </p>
      <navigation-button route="/location" variant="primary" class="cta-button">
        Get Started
      </navigation-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'welcome-screen': WelcomeScreen;
  }
}