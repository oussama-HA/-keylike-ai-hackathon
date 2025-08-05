import { html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

/**
 * Reusable card component for displaying content in a card layout
 */
@customElement('ui-card')
export class UICard extends BaseComponent {
  @property({ type: Boolean })
  elevated = false;

  @property({ type: Boolean })
  interactive = false;

  @property({ type: String })
  href = '';

  @property({ type: String })
  target = '';

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
      }

      .card {
        background-color: var(--color-surface);
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
        transition: all var(--transition-normal);
        position: relative;
        overflow: hidden;
      }

      .card--elevated {
        box-shadow: var(--shadow-md);
        border: none;
      }

      .card--interactive {
        cursor: pointer;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }

      .card--interactive:hover {
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }

      .card--elevated.card--interactive:hover {
        box-shadow: var(--shadow-lg);
        transform: translateY(-4px);
      }

      .card--interactive:active {
        transform: translateY(0);
        box-shadow: var(--shadow-sm);
      }

      .card-header {
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-md);
        border-bottom: 1px solid var(--color-outline-variant);
      }

      .card-title {
        margin: 0;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        color: var(--color-on-surface);
        line-height: 1.2;
      }

      .card-subtitle {
        margin: var(--spacing-xs) 0 0 0;
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
        line-height: 1.4;
      }

      .card-body {
        margin-bottom: var(--spacing-md);
        color: var(--color-on-surface);
        line-height: 1.6;
      }

      .card-footer {
        margin-top: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--color-outline-variant);
        display: flex;
        gap: var(--spacing-sm);
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .card-media {
        margin: calc(-1 * var(--spacing-lg)) calc(-1 * var(--spacing-lg)) var(--spacing-md) calc(-1 * var(--spacing-lg));
        border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
        overflow: hidden;
      }

      .card-media img,
      .card-media video {
        width: 100%;
        height: auto;
        display: block;
      }

      .card-actions {
        margin-top: var(--spacing-md);
        display: flex;
        gap: var(--spacing-sm);
        flex-wrap: wrap;
      }

      /* Link styling */
      a.card {
        text-decoration: none;
        color: inherit;
      }

      /* Focus styles */
      .card:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .card {
          padding: var(--spacing-md);
        }

        .card-media {
          margin: calc(-1 * var(--spacing-md)) calc(-1 * var(--spacing-md)) var(--spacing-sm) calc(-1 * var(--spacing-md));
        }

        .card-footer,
        .card-actions {
          flex-direction: column;
          align-items: stretch;
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .card {
          transition: none;
        }
      }

      /* High contrast support */
      @media (prefers-contrast: high) {
        .card {
          border-width: 2px;
        }

        .card-header,
        .card-footer {
          border-width: 2px;
        }
      }
    `
  ];

  private handleClick = (event: Event): void => {
    if (!this.interactive && !this.href) return;

    this.emitEvent('click', { originalEvent: event });
  };

  render() {
    const classes = [
      'card',
      this.elevated && 'card--elevated',
      this.interactive && 'card--interactive'
    ].filter(Boolean).join(' ');

    const content = html`
      <slot name="media" class="card-media"></slot>
      <slot name="header" class="card-header"></slot>
      <slot class="card-body"></slot>
      <slot name="footer" class="card-footer"></slot>
      <slot name="actions" class="card-actions"></slot>
    `;

    if (this.href) {
      return html`
        <a
          class=${classes}
          href=${this.href}
          target=${this.target || ''}
          @click=${this.handleClick}
        >
          ${content}
        </a>
      `;
    }

    return html`
      <div
        class=${classes}
        ?tabindex=${this.interactive ? 0 : undefined}
        @click=${this.handleClick}
        @keydown=${this.handleKeyDown}
      >
        ${content}
      </div>
    `;
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.interactive && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      this.handleClick(event);
    }
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'ui-card': UICard;
  }
}