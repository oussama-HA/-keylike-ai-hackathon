import { html, css, CSSResultGroup } from 'lit';
import { customElement } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';

@customElement('privacy-screen')
export class PrivacyScreen extends BaseComponent {
  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        padding: var(--spacing-md);
        max-width: 800px;
        margin: 0 auto;
      }

      .settings-section {
        background-color: var(--color-surface);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        margin-bottom: var(--spacing-md);
      }

      .section-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-md);
        color: var(--color-primary);
      }

      .setting-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) 0;
        border-bottom: 1px solid var(--color-outline-variant);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-info h4 {
        margin: 0 0 var(--spacing-xs) 0;
        font-size: var(--font-size-md);
      }

      .setting-info p {
        margin: 0;
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
      }

      .toggle-switch {
        position: relative;
        width: 48px;
        height: 24px;
        background-color: var(--color-outline);
        border-radius: 12px;
        cursor: pointer;
        transition: background-color var(--transition-fast);
      }

      .toggle-switch.active {
        background-color: var(--color-primary);
      }

      .toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        background-color: white;
        border-radius: 50%;
        transition: transform var(--transition-fast);
      }

      .toggle-switch.active .toggle-slider {
        transform: translateX(24px);
      }
    `
  ];

  render() {
    return html`
      <h1>Privacy & Settings</h1>
      
      <div class="settings-section">
        <h2 class="section-title">Privacy Controls</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Location Tracking</h4>
            <p>Allow app to access your location for regional security data</p>
          </div>
          <div class="toggle-switch">
            <div class="toggle-slider"></div>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Data Encryption</h4>
            <p>Encrypt all scan data stored locally on your device</p>
          </div>
          <div class="toggle-switch active">
            <div class="toggle-slider"></div>
          </div>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="section-title">App Preferences</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Dark Mode</h4>
            <p>Use dark theme for better visibility in low light</p>
          </div>
          <div class="toggle-switch">
            <div class="toggle-slider"></div>
          </div>
        </div>
        
        <div class="setting-item">
          <div class="setting-info">
            <h4>Haptic Feedback</h4>
            <p>Enable vibration feedback for interactions</p>
          </div>
          <div class="toggle-switch active">
            <div class="toggle-slider"></div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'privacy-screen': PrivacyScreen;
  }
}