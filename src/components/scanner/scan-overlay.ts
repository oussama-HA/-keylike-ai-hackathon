import { html, css, CSSResultGroup } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';

@customElement('scan-overlay')
export class ScanOverlay extends BaseComponent {
  @property({ type: Boolean })
  isScanning = false;

  @property({ type: Number })
  progress = 0;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      .scan-reticle {
        width: 80%;
        max-width: 300px;
        aspect-ratio: 1;
        border: 2px solid var(--color-primary);
        border-radius: var(--border-radius-md);
        position: relative;
      }

      .scan-reticle.scanning {
        animation: pulse 2s infinite;
      }

      .scan-reticle::before,
      .scan-reticle::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border: 3px solid var(--color-primary);
      }

      .scan-reticle::before {
        top: -3px;
        left: -3px;
        border-right: none;
        border-bottom: none;
      }

      .scan-reticle::after {
        bottom: -3px;
        right: -3px;
        border-left: none;
        border-top: none;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }

      .scan-instructions {
        position: absolute;
        bottom: -60px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
        color: white;
        background-color: rgba(0, 0, 0, 0.7);
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-sm);
        white-space: nowrap;
      }
    `
  ];

  render() {
    return html`
      <div class="scan-reticle ${this.isScanning ? 'scanning' : ''}">
        <div class="scan-instructions">
          ${this.isScanning ? `Scanning... ${this.progress}%` : 'Position lock in frame'}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scan-overlay': ScanOverlay;
  }
}