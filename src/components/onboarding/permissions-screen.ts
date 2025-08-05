import { html, css, CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import '../common/navigation-button.ts';

@customElement('permissions-screen')
export class PermissionsScreen extends BaseComponent {
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

      .permission-card {
        background-color: var(--color-surface);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-xl);
        margin-bottom: var(--spacing-lg);
        max-width: 400px;
        width: 100%;
      }

      .permission-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
      }

      .permission-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-sm);
      }

      .permission-description {
        color: var(--color-on-surface-variant);
        margin-bottom: var(--spacing-lg);
        line-height: 1.6;
      }

      .permission-button {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        border: none;
        font-weight: var(--font-weight-medium);
        cursor: pointer;
        transition: background-color var(--transition-fast);
        width: 100%;
      }

      .permission-button:hover {
        background-color: var(--color-primary-dark);
      }

      .skip-button {
        background: none;
        border: none;
        color: var(--color-on-surface-variant);
        cursor: pointer;
        margin-top: var(--spacing-md);
        text-decoration: underline;
      }
    `
  ];

  private async requestCameraPermission(): Promise<void> {
    try {
      // TODO: Use CameraService to request permissions
      console.log('🔒 Requesting camera permission...');
      // Simulate permission grant
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to scan page after permission is granted
      const navButton = this.shadowRoot?.querySelector('navigation-button[route="/scan"]') as any;
      if (navButton) {
        await navButton.navigate();
      }
    } catch (error) {
      console.error('❌ Permission request failed:', error);
    }
  }

  render() {
    return html`
      <div class="permission-card">
        <div class="permission-icon">📷</div>
        <h2 class="permission-title">Camera Access</h2>
        <p class="permission-description">
          Keylike AI needs camera access to scan locks and analyze their security features. 
          All processing is done locally on your device.
        </p>
        <button 
          class="permission-button"
          @click=${this.requestCameraPermission}
        >
          Allow Camera Access
        </button>
        <navigation-button
          route="/scan"
          variant="ghost"
          class="skip-button"
        >
          Skip for now
        </navigation-button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'permissions-screen': PermissionsScreen;
  }
}