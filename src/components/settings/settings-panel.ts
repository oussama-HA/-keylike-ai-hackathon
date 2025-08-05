import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';

export interface SettingsData {
  theme: 'light' | 'dark' | 'auto';
  autoScan: boolean;
  flashEnabled: boolean;
  soundEnabled: boolean;
  hapticFeedback: boolean;
  saveHistory: boolean;
  shareAnalytics: boolean;
  cameraQuality: 'low' | 'medium' | 'high';
  scanSensitivity: number;
}

/**
 * Settings panel component for app configuration
 */
@customElement('settings-panel')
export class SettingsPanel extends BaseComponent {
  @property({ type: Object })
  settings: SettingsData = {
    theme: 'auto',
    autoScan: false,
    flashEnabled: false,
    soundEnabled: true,
    hapticFeedback: true,
    saveHistory: true,
    shareAnalytics: false,
    cameraQuality: 'high',
    scanSensitivity: 50
  };

  @state()
  private _showAdvanced = false;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        max-width: 600px;
        margin: 0 auto;
        padding: var(--spacing-md);
      }

      .settings-container {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .settings-header {
        text-align: center;
        padding: var(--spacing-lg);
        background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark));
        color: white;
        border-radius: var(--border-radius-lg);
        margin-bottom: var(--spacing-lg);
      }

      .settings-title {
        font-size: var(--font-size-xxl);
        font-weight: var(--font-weight-bold);
        margin: 0 0 var(--spacing-sm) 0;
      }

      .settings-subtitle {
        font-size: var(--font-size-md);
        opacity: 0.9;
        margin: 0;
      }

      .settings-section {
        background-color: var(--color-surface);
        border: 1px solid var(--color-outline-variant);
        border-radius: var(--border-radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-sm);
      }

      .section-title {
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        margin: 0 0 var(--spacing-md) 0;
        color: var(--color-on-surface);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
      }

      .section-icon {
        font-size: var(--font-size-xl);
      }

      .setting-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--color-outline-variant);
      }

      .setting-item:last-child {
        border-bottom: none;
      }

      .setting-info {
        flex: 1;
        margin-right: var(--spacing-md);
      }

      .setting-label {
        font-size: var(--font-size-md);
        font-weight: var(--font-weight-medium);
        color: var(--color-on-surface);
        margin: 0 0 var(--spacing-xs) 0;
      }

      .setting-description {
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
        margin: 0;
        line-height: 1.4;
      }

      .setting-control {
        flex-shrink: 0;
      }

      /* Toggle Switch */
      .toggle-switch {
        position: relative;
        width: 48px;
        height: 24px;
        background-color: var(--color-outline);
        border-radius: 12px;
        cursor: pointer;
        transition: background-color var(--transition-fast);
        border: none;
        padding: 0;
      }

      .toggle-switch.active {
        background-color: var(--color-primary);
      }

      .toggle-switch::after {
        content: '';
        position: absolute;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: white;
        top: 2px;
        left: 2px;
        transition: transform var(--transition-fast);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .toggle-switch.active::after {
        transform: translateX(24px);
      }

      /* Select Dropdown */
      .select-control {
        position: relative;
        min-width: 120px;
      }

      .select-dropdown {
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        background-color: var(--color-background);
        color: var(--color-on-background);
        font-size: var(--font-size-sm);
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
        background-position: right 8px center;
        background-repeat: no-repeat;
        background-size: 16px;
        padding-right: 40px;
      }

      .select-dropdown:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }

      /* Range Slider */
      .slider-control {
        min-width: 120px;
      }

      .slider-input {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: var(--color-outline-variant);
        outline: none;
        -webkit-appearance: none;
        appearance: none;
      }

      .slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .slider-input::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--color-primary);
        cursor: pointer;
        border: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .slider-value {
        text-align: center;
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
        margin-top: var(--spacing-xs);
      }

      /* Advanced Settings Toggle */
      .advanced-toggle {
        text-align: center;
        margin: var(--spacing-lg) 0;
      }

      .advanced-button {
        background: none;
        border: 1px solid var(--color-outline);
        color: var(--color-primary);
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all var(--transition-fast);
      }

      .advanced-button:hover {
        background-color: var(--color-surface-variant);
        border-color: var(--color-primary);
      }

      .advanced-section {
        max-height: 0;
        overflow: hidden;
        transition: max-height var(--transition-normal);
      }

      .advanced-section.open {
        max-height: 500px;
      }

      /* Action Buttons */
      .action-buttons {
        display: flex;
        gap: var(--spacing-md);
        justify-content: center;
        margin-top: var(--spacing-xl);
        flex-wrap: wrap;
      }

      .action-button {
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius-md);
        border: 1px solid;
        cursor: pointer;
        font-weight: var(--font-weight-medium);
        transition: all var(--transition-fast);
        min-width: 120px;
      }

      .action-button.primary {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      .action-button.primary:hover {
        background-color: var(--color-primary-dark);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .action-button.secondary {
        background-color: transparent;
        color: var(--color-on-surface);
        border-color: var(--color-outline);
      }

      .action-button.secondary:hover {
        background-color: var(--color-surface-variant);
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        :host {
          padding: var(--spacing-sm);
        }

        .settings-section {
          padding: var(--spacing-md);
        }

        .setting-item {
          flex-direction: column;
          align-items: flex-start;
          gap: var(--spacing-sm);
        }

        .setting-info {
          margin-right: 0;
        }

        .setting-control {
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }

        .action-buttons {
          flex-direction: column;
        }
      }
    `
  ];

  private handleToggle(setting: keyof SettingsData): void {
    const newSettings = { ...this.settings } as Record<string, any>;
    newSettings[setting] = !newSettings[setting];
    this.settings = newSettings as SettingsData;
    this.emitEvent('settings-change', { settings: this.settings });
  }

  private handleSelectChange(setting: keyof SettingsData, value: string): void {
    const newSettings = { ...this.settings } as Record<string, any>;
    newSettings[setting] = value;
    this.settings = newSettings as SettingsData;
    this.emitEvent('settings-change', { settings: this.settings });
  }

  private handleSliderChange(setting: keyof SettingsData, value: number): void {
    const newSettings = { ...this.settings } as Record<string, any>;
    newSettings[setting] = value;
    this.settings = newSettings as SettingsData;
    this.emitEvent('settings-change', { settings: this.settings });
  }

  private toggleAdvanced(): void {
    this._showAdvanced = !this._showAdvanced;
  }

  private handleSave(): void {
    this.emitEvent('save-settings', { settings: this.settings });
  }

  private handleReset(): void {
    this.emitEvent('reset-settings');
  }

  private handleExport(): void {
    this.emitEvent('export-settings', { settings: this.settings });
  }

  render() {
    return html`
      <div class="settings-container">
        <!-- Header -->
        <div class="settings-header">
          <h1 class="settings-title">Settings</h1>
          <p class="settings-subtitle">Customize your Keylike AI experience</p>
        </div>

        <!-- General Settings -->
        <div class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">⚙️</span>
            General
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Theme</h3>
              <p class="setting-description">Choose your preferred app appearance</p>
            </div>
            <div class="setting-control">
              <div class="select-control">
                <select 
                  class="select-dropdown"
                  .value=${this.settings.theme}
                  @change=${(e: Event) => this.handleSelectChange('theme', (e.target as HTMLSelectElement).value)}
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Auto Scan</h3>
              <p class="setting-description">Automatically start scanning when camera opens</p>
            </div>
            <div class="setting-control">
              <button 
                class="toggle-switch ${this.settings.autoScan ? 'active' : ''}"
                @click=${() => this.handleToggle('autoScan')}
                aria-label="Toggle auto scan"
              ></button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Save History</h3>
              <p class="setting-description">Keep a record of your scan results</p>
            </div>
            <div class="setting-control">
              <button 
                class="toggle-switch ${this.settings.saveHistory ? 'active' : ''}"
                @click=${() => this.handleToggle('saveHistory')}
                aria-label="Toggle save history"
              ></button>
            </div>
          </div>
        </div>

        <!-- Camera Settings -->
        <div class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">📸</span>
            Camera
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Camera Quality</h3>
              <p class="setting-description">Higher quality provides better accuracy</p>
            </div>
            <div class="setting-control">
              <div class="select-control">
                <select 
                  class="select-dropdown"
                  .value=${this.settings.cameraQuality}
                  @change=${(e: Event) => this.handleSelectChange('cameraQuality', (e.target as HTMLSelectElement).value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Flash</h3>
              <p class="setting-description">Enable flash for better lighting</p>
            </div>
            <div class="setting-control">
              <button 
                class="toggle-switch ${this.settings.flashEnabled ? 'active' : ''}"
                @click=${() => this.handleToggle('flashEnabled')}
                aria-label="Toggle flash"
              ></button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Scan Sensitivity</h3>
              <p class="setting-description">Adjust how sensitive the scanner is</p>
            </div>
            <div class="setting-control">
              <div class="slider-control">
                <input 
                  type="range" 
                  class="slider-input"
                  min="0" 
                  max="100" 
                  .value=${this.settings.scanSensitivity.toString()}
                  @input=${(e: Event) => this.handleSliderChange('scanSensitivity', parseInt((e.target as HTMLInputElement).value))}
                />
                <div class="slider-value">${this.settings.scanSensitivity}%</div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Experience -->
        <div class="settings-section">
          <h2 class="section-title">
            <span class="section-icon">✨</span>
            Experience
          </h2>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Sound Effects</h3>
              <p class="setting-description">Play sounds for scan results</p>
            </div>
            <div class="setting-control">
              <button 
                class="toggle-switch ${this.settings.soundEnabled ? 'active' : ''}"
                @click=${() => this.handleToggle('soundEnabled')}
                aria-label="Toggle sound effects"
              ></button>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <h3 class="setting-label">Haptic Feedback</h3>
              <p class="setting-description">Vibrate on scan completion</p>
            </div>
            <div class="setting-control">
              <button 
                class="toggle-switch ${this.settings.hapticFeedback ? 'active' : ''}"
                @click=${() => this.handleToggle('hapticFeedback')}
                aria-label="Toggle haptic feedback"
              ></button>
            </div>
          </div>
        </div>

        <!-- Advanced Settings Toggle -->
        <div class="advanced-toggle">
          <button class="advanced-button" @click=${this.toggleAdvanced}>
            ${this._showAdvanced ? '🔼 Hide Advanced' : '🔽 Show Advanced'}
          </button>
        </div>

        <!-- Advanced Settings -->
        <div class="advanced-section ${this._showAdvanced ? 'open' : ''}">
          <div class="settings-section">
            <h2 class="section-title">
              <span class="section-icon">🔧</span>
              Advanced
            </h2>

            <div class="setting-item">
              <div class="setting-info">
                <h3 class="setting-label">Share Analytics</h3>
                <p class="setting-description">Help improve the app by sharing anonymous usage data</p>
              </div>
              <div class="setting-control">
                <button 
                  class="toggle-switch ${this.settings.shareAnalytics ? 'active' : ''}"
                  @click=${() => this.handleToggle('shareAnalytics')}
                  aria-label="Toggle analytics sharing"
                ></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-button primary" @click=${this.handleSave}>
            💾 Save Settings
          </button>
          <button class="action-button secondary" @click=${this.handleReset}>
            🔄 Reset to Default
          </button>
          <button class="action-button secondary" @click=${this.handleExport}>
            📤 Export Settings
          </button>
        </div>
      </div>

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'settings-panel': SettingsPanel;
  }
}