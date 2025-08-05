import { html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

/**
 * Reusable button component with multiple variants and sizes
 */
@customElement('ui-button')
export class UIButton extends BaseComponent {
  @property({ type: String })
  variant = 'primary';

  @property({ type: String })
  size = 'md';

  @property({ type: Boolean, attribute: 'full-width' })
  fullWidth = false;

  @property({ type: Boolean, attribute: 'icon-only' })
  iconOnly = false;

  @property({ type: String })
  href = '';

  @property({ type: String })
  target = '';

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: inline-block;
      }

      :host([full-width]) {
        display: block;
      }

      .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        font-weight: var(--font-weight-medium);
        font-size: var(--font-size-md);
        line-height: 1.5;
        text-decoration: none;
        transition: all var(--transition-fast);
        cursor: pointer;
        border: 1px solid transparent;
        min-height: 44px;
        min-width: 44px;
        position: relative;
        overflow: hidden;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
        font-family: inherit;
        background: none;
        color: inherit;
      }

      .button:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      /* Variants */
      .button--primary {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      .button--primary:hover:not(:disabled) {
        background-color: var(--color-primary-dark);
        border-color: var(--color-primary-dark);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .button--secondary {
        background-color: var(--color-secondary);
        color: var(--color-secondary-contrast);
        border-color: var(--color-secondary);
      }

      .button--secondary:hover:not(:disabled) {
        background-color: var(--color-secondary-dark);
        border-color: var(--color-secondary-dark);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      .button--outline {
        background-color: transparent;
        color: var(--color-primary);
        border-color: var(--color-primary);
      }

      .button--outline:hover:not(:disabled) {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .button--ghost {
        background-color: transparent;
        color: var(--color-on-surface);
        border-color: transparent;
      }

      .button--ghost:hover:not(:disabled) {
        background-color: var(--color-surface-variant);
        transform: translateY(-1px);
      }

      .button--danger {
        background-color: var(--color-error);
        color: white;
        border-color: var(--color-error);
      }

      .button--danger:hover:not(:disabled) {
        background-color: #c82333;
        border-color: #c82333;
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      /* Sizes */
      .button--sm {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: var(--font-size-sm);
        min-height: 36px;
      }

      .button--lg {
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: var(--font-size-lg);
        min-height: 52px;
      }

      /* States */
      .button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        pointer-events: none;
        transform: none !important;
        box-shadow: none !important;
      }

      .button:active:not(:disabled) {
        transform: translateY(0);
        box-shadow: var(--shadow-sm);
      }

      /* Active state for navigation */
      .button--active {
        background-color: var(--color-primary-dark);
        border-color: var(--color-primary-dark);
        box-shadow: var(--shadow-sm);
      }

      .button--outline.button--active {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
      }

      .button--ghost.button--active {
        background-color: var(--color-surface-variant);
      }

      /* Full width */
      .button--full-width {
        width: 100%;
      }

      /* Icon only */
      .button--icon-only {
        padding: var(--spacing-sm);
        border-radius: var(--border-radius-full);
        min-width: 44px;
        min-height: 44px;
      }

      .button--icon-only.button--sm {
        min-width: 36px;
        min-height: 36px;
        padding: var(--spacing-xs);
      }

      .button--icon-only.button--lg {
        min-width: 52px;
        min-height: 52px;
        padding: var(--spacing-md);
      }

      /* Loading state */
      .button--loading {
        color: transparent;
      }

      .button--loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }

      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }

      /* Ripple effect */
      .button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.2);
        transform: translate(-50%, -50%);
        transition: width 0.3s, height 0.3s;
      }

      .button:active::before {
        width: 300px;
        height: 300px;
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .button {
          min-height: 48px;
        }

        .button--icon-only {
          min-width: 48px;
          min-height: 48px;
        }

        .button--sm {
          min-height: 40px;
        }

        .button--lg {
          min-height: 56px;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .button {
          transition: none;
        }

        .button::before {
          transition: none;
        }

        .button--loading::after {
          animation: none;
        }
      }
    `
  ];

  protected handleClick = (event: Event): void => {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.emitEvent('click', { originalEvent: event });
  };

  render() {
    const classes = [
      'button',
      `button--${this.variant}`,
      `button--${this.size}`,
      this.fullWidth && 'button--full-width',
      this.iconOnly && 'button--icon-only',
      this.loading && 'button--loading'
    ].filter(Boolean).join(' ');

    const content = html`<slot></slot>`;

    if (this.href) {
      return html`
        <a
          class=${classes}
          href=${this.href}
          target=${this.target || ''}
          ?disabled=${this.disabled}
          @click=${this.handleClick}
        >
          ${content}
        </a>
      `;
    }

    return html`
      <button
        class=${classes}
        type="button"
        ?disabled=${this.disabled || this.loading}
        @click=${this.handleClick}
      >
        ${content}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': UIButton;
  }
}