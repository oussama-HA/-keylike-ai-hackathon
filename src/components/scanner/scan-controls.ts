import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { ModelService } from '../../services/model-service';
import type { ModelDiagnostics, ImageQualityMetrics } from '../../types/model-types';

/**
 * Scanner control interface with scan button, secondary controls, and AI model status
 */
@customElement('scan-controls')
export class ScanControls extends BaseComponent {
  @property({ type: Boolean })
  isScanning = false;

  @property({ type: Boolean })
  cameraActive = false;

  @property({ type: Number })
  progress = 0;

  @property({ type: Number })
  inferenceProgress = 0;

  @property({ type: Boolean })
  modelLoaded = false;

  @property({ type: Object })
  imageQuality: ImageQualityMetrics | null = null;

  @state()
  private _flashEnabled = false;

  @state()
  private _frontCamera = false;

  @state()
  private _showModelStatus = false;

  @state()
  private _showQualitySettings = false;

  @state()
  private _qualityThreshold = 0.3;

  @state()
  private _modelDiagnostics: ModelDiagnostics | null = null;

  private modelService: ModelService;

  constructor() {
    super();
    this.modelService = new ModelService();
  }

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        position: relative;
      }

      .controls-container {
        padding: var(--spacing-lg);
        background-color: var(--color-surface);
        border-top: 1px solid var(--color-outline-variant);
      }

      /* AI Model Status Styles */
      .model-status-bar {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-md);
        font-size: var(--font-size-sm);
        transition: all var(--transition-normal);
      }

      .model-status-bar.loaded {
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }

      .model-status-bar.loading {
        background-color: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
      }

      .model-status-bar.error {
        background-color: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
      }

      .model-status-icon {
        flex-shrink: 0;
        font-size: var(--font-size-md);
      }

      .model-status-text {
        flex: 1;
        color: var(--color-on-surface);
      }

      .model-status-button {
        background: none;
        border: none;
        color: var(--color-primary);
        cursor: pointer;
        font-size: var(--font-size-xs);
        padding: var(--spacing-xs);
        border-radius: var(--border-radius-sm);
        transition: background-color var(--transition-fast);
      }

      .model-status-button:hover {
        background-color: var(--color-surface);
      }

      .model-diagnostics {
        margin-top: var(--spacing-md);
        padding: var(--spacing-md);
        background-color: var(--color-surface);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-outline-variant);
        font-size: var(--font-size-sm);
      }

      .diagnostics-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-xs);
      }

      .diagnostics-label {
        color: var(--color-on-surface-variant);
      }

      .diagnostics-value {
        color: var(--color-on-surface);
        font-weight: var(--font-weight-medium);
      }

      .quality-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-sm);
      }

      .quality-indicator.excellent {
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
        color: #4caf50;
      }

      .quality-indicator.good {
        background-color: rgba(139, 195, 74, 0.1);
        border: 1px solid rgba(139, 195, 74, 0.3);
        color: #8bc34a;
      }

      .quality-indicator.fair {
        background-color: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        color: #ffc107;
      }

      .quality-indicator.poor {
        background-color: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #f44336;
      }

      .quality-tips {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-xs);
        opacity: 0.8;
      }

      .inference-progress {
        margin-top: var(--spacing-sm);
        padding: var(--spacing-sm);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-outline-variant);
      }

      .inference-progress-bar {
        width: 100%;
        height: 6px;
        background-color: var(--color-surface);
        border-radius: 3px;
        overflow: hidden;
        margin-top: var(--spacing-xs);
      }

      .inference-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
        border-radius: inherit;
        transition: width var(--transition-normal);
      }

      .settings-panel {
        margin-top: var(--spacing-md);
        padding: var(--spacing-md);
        background-color: var(--color-surface);
        border-radius: var(--border-radius-md);
        border: 1px solid var(--color-outline-variant);
      }

      .settings-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
      }

      .settings-label {
        color: var(--color-on-surface);
        font-size: var(--font-size-sm);
      }

      .threshold-slider {
        width: 100px;
        height: 4px;
        background-color: var(--color-surface-variant);
        border-radius: 2px;
        outline: none;
        appearance: none;
      }

      .threshold-slider::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        background-color: var(--color-primary);
        border-radius: 50%;
        cursor: pointer;
      }

      .threshold-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background-color: var(--color-primary);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }

      .scan-button-container {
        display: flex;
        justify-content: center;
        margin-bottom: var(--spacing-lg);
        position: relative;
      }

      .scan-button {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: var(--color-primary);
        border: 4px solid white;
        box-shadow: var(--shadow-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        position: relative;
        overflow: hidden;
      }

      .scan-button:hover:not(:disabled) {
        transform: scale(1.05);
        background-color: var(--color-primary-dark);
      }

      .scan-button:active:not(:disabled) {
        transform: scale(0.95);
      }

      .scan-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      .scan-button.scanning {
        background-color: var(--color-error);
        animation: pulse-scan 2s infinite;
      }

      @keyframes pulse-scan {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }

      .progress-ring {
        position: absolute;
        top: -6px;
        left: -6px;
        width: 92px;
        height: 92px;
        border-radius: 50%;
        border: 3px solid transparent;
        border-top-color: var(--color-primary);
        animation: spin 1s linear infinite;
        opacity: 0;
        transition: opacity var(--transition-normal);
      }

      .progress-ring.visible {
        opacity: 1;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background-color: var(--color-surface-variant);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: var(--spacing-md);
        opacity: 0;
        transition: opacity var(--transition-normal);
      }

      .progress-bar.visible {
        opacity: 1;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
        border-radius: inherit;
        transition: width var(--transition-normal);
        width: 0%;
      }

      .secondary-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: var(--spacing-md);
      }

      .control-group {
        display: flex;
        gap: var(--spacing-sm);
      }

      .control-button {
        padding: var(--spacing-sm);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        background-color: var(--color-background);
        color: var(--color-on-background);
        cursor: pointer;
        transition: all var(--transition-fast);
        min-width: 44px;
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--font-size-lg);
      }

      .control-button:hover:not(:disabled) {
        background-color: var(--color-surface-variant);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
      }

      .control-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .control-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .control-button.active {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
        border-color: var(--color-primary);
      }

      .scan-instruction {
        text-align: center;
        color: var(--color-on-surface-variant);
        font-size: var(--font-size-sm);
        margin-bottom: var(--spacing-md);
        line-height: 1.4;
      }

      /* Mobile adjustments */
      @media (max-width: 768px) {
        .controls-container {
          padding: var(--spacing-md);
        }

        .scan-button {
          width: 70px;
          height: 70px;
          font-size: 28px;
        }

        .progress-ring {
          width: 82px;
          height: 82px;
          top: -6px;
          left: -6px;
        }

        .secondary-controls {
          gap: var(--spacing-sm);
        }

        .control-button {
          min-width: 48px;
          min-height: 48px;
          padding: var(--spacing-xs);
        }
      }

      /* Reduced motion */
      @media (prefers-reduced-motion: reduce) {
        .scan-button.scanning {
          animation: none;
        }

        .progress-ring {
          animation: none;
        }
      }
    `
  ];

  protected async initializeComponent(): Promise<void> {
    await this.updateModelStatus();
  }

  private async updateModelStatus(): Promise<void> {
    try {
      this._modelDiagnostics = this.modelService.getDiagnostics();
      this.requestUpdate();
    } catch (error) {
      console.error('Failed to get model diagnostics:', error);
    }
  }

  private handleScanClick(): void {
    if (this.isScanning) {
      this.emitEvent('scan-stop');
    } else {
      this.emitEvent('scan-start');
    }
  }

  private handleFlashToggle(): void {
    this._flashEnabled = !this._flashEnabled;
    this.emitEvent('flash-toggle', { enabled: this._flashEnabled });
  }

  private handleCameraSwitch(): void {
    this._frontCamera = !this._frontCamera;
    this.emitEvent('camera-switch', { frontCamera: this._frontCamera });
  }

  private handleGalleryClick(): void {
    this.emitEvent('gallery-open');
  }

  private handleSettingsClick(): void {
    this.emitEvent('settings-open');
  }

  private toggleModelStatus(): void {
    this._showModelStatus = !this._showModelStatus;
    if (this._showModelStatus) {
      this.updateModelStatus();
    }
  }

  private toggleQualitySettings(): void {
    this._showQualitySettings = !this._showQualitySettings;
  }

  private handleQualityThresholdChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this._qualityThreshold = parseFloat(target.value);
    this.emitEvent('quality-threshold-change', { threshold: this._qualityThreshold });
  }

  private async runModelHealthCheck(): Promise<void> {
    try {
      const healthCheck = await this.modelService.runHealthCheck();
      console.log('Model health check:', healthCheck);
      this.updateModelStatus();
    } catch (error) {
      console.error('Model health check failed:', error);
    }
  }

  private getModelStatusClass(): string {
    if (!this._modelDiagnostics) return 'loading';
    if (!this._modelDiagnostics.modelLoaded) return 'error';
    if (this._modelDiagnostics.performance.errors > 0) return 'error';
    return 'loaded';
  }

  private getModelStatusText(): string {
    if (!this._modelDiagnostics) return 'Checking model status...';
    if (!this._modelDiagnostics.modelLoaded) return 'Model not loaded';
    if (this._modelDiagnostics.performance.errors > 0) return `Model errors: ${this._modelDiagnostics.performance.errors}`;
    return `Model ready (${this._modelDiagnostics.backendActive})`;
  }

  private getModelStatusIcon(): string {
    if (!this._modelDiagnostics) return '⏳';
    if (!this._modelDiagnostics.modelLoaded) return '❌';
    if (this._modelDiagnostics.performance.errors > 0) return '⚠️';
    return '✅';
  }

  private formatMemoryUsage(bytes: number): string {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  private formatPerformanceMetric(value: number): string {
    return `${value.toFixed(1)}ms`;
  }

  render() {
    const scanButtonIcon = this.isScanning ? '⏹️' : '📸';
    const instruction = this.isScanning
      ? `Scanning... ${Math.round(this.progress)}%`
      : this.cameraActive
        ? 'Position lock in frame and tap to scan'
        : 'Enable camera to start scanning';

    return html`
      <div class="controls-container">
        <!-- AI Model Status Bar -->
        <div class="model-status-bar ${this.getModelStatusClass()}">
          <span class="model-status-icon">${this.getModelStatusIcon()}</span>
          <span class="model-status-text">${this.getModelStatusText()}</span>
          <button
            class="model-status-button"
            @click=${this.toggleModelStatus}
            title="Toggle model diagnostics"
          >
            ${this._showModelStatus ? 'Hide' : 'Details'}
          </button>
        </div>

        <!-- Model Diagnostics Panel -->
        ${this._showModelStatus && this._modelDiagnostics ? html`
          <div class="model-diagnostics">
            <div class="diagnostics-row">
              <span class="diagnostics-label">Backend:</span>
              <span class="diagnostics-value">${this._modelDiagnostics.backendActive}</span>
            </div>
            <div class="diagnostics-row">
              <span class="diagnostics-label">Memory:</span>
              <span class="diagnostics-value">${this.formatMemoryUsage(this._modelDiagnostics.memoryInfo.numBytes)}</span>
            </div>
            <div class="diagnostics-row">
              <span class="diagnostics-label">Tensors:</span>
              <span class="diagnostics-value">${this._modelDiagnostics.memoryInfo.numTensors}</span>
            </div>
            <div class="diagnostics-row">
              <span class="diagnostics-label">Avg Inference:</span>
              <span class="diagnostics-value">${this.formatPerformanceMetric(this._modelDiagnostics.performance.averageInferenceTime)}</span>
            </div>
            <div class="diagnostics-row">
              <span class="diagnostics-label">Inference Count:</span>
              <span class="diagnostics-value">${this._modelDiagnostics.performance.inferenceCount}</span>
            </div>
            <div style="margin-top: var(--spacing-sm);">
              <button
                class="model-status-button"
                @click=${this.runModelHealthCheck}
                title="Run model health check"
              >
                Health Check
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Image Quality Indicator -->
        ${this.imageQuality ? html`
          <div class="quality-indicator ${this.imageQuality.overallQuality}">
            <span>📊 Image Quality: ${this.imageQuality.overallQuality}</span>
            <button
              class="model-status-button"
              @click=${this.toggleQualitySettings}
              title="Quality settings"
            >
              Settings
            </button>
          </div>
          ${this.imageQuality.recommendations.length > 0 ? html`
            <div class="quality-tips">
              💡 ${this.imageQuality.recommendations.slice(0, 2).join(', ')}
            </div>
          ` : ''}
        ` : ''}

        <!-- Quality Settings Panel -->
        ${this._showQualitySettings ? html`
          <div class="settings-panel">
            <div class="settings-row">
              <span class="settings-label">Quality Threshold:</span>
              <input
                type="range"
                class="threshold-slider"
                min="0.1"
                max="0.9"
                step="0.1"
                .value=${this._qualityThreshold.toString()}
                @input=${this.handleQualityThresholdChange}
              />
              <span class="diagnostics-value">${this._qualityThreshold.toFixed(1)}</span>
            </div>
          </div>
        ` : ''}

        <!-- Inference Progress -->
        ${this.isScanning && this.inferenceProgress > 0 ? html`
          <div class="inference-progress">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>🤖 AI Analysis: ${Math.round(this.inferenceProgress)}%</span>
              <span style="font-size: var(--font-size-xs); opacity: 0.7;">
                ${this.inferenceProgress < 50 ? 'Preprocessing...' : 'Running inference...'}
              </span>
            </div>
            <div class="inference-progress-bar">
              <div class="inference-progress-fill" style="width: ${this.inferenceProgress}%"></div>
            </div>
          </div>
        ` : ''}

        <!-- Progress Bar -->
        <div class="progress-bar ${this.isScanning ? 'visible' : ''}">
          <div class="progress-fill" style="width: ${this.progress}%"></div>
        </div>

        <!-- Instruction Text -->
        <div class="scan-instruction">${instruction}</div>

        <!-- Main Scan Button -->
        <div class="scan-button-container">
          <button
            class="scan-button ${this.isScanning ? 'scanning' : ''}"
            @click=${this.handleScanClick}
            ?disabled=${(!this.cameraActive && !this.isScanning) || !this.modelLoaded}
            aria-label=${this.isScanning ? 'Stop scanning' : 'Start scanning'}
          >
            ${scanButtonIcon}
            <div class="progress-ring ${this.isScanning ? 'visible' : ''}"></div>
          </button>
        </div>

        <!-- Secondary Controls -->
        <div class="secondary-controls">
          <div class="control-group">
            <button
              class="control-button"
              @click=${this.handleGalleryClick}
              title="Choose from gallery"
              aria-label="Open gallery"
            >
              🖼️
            </button>
          </div>

          <div class="control-group">
            <button
              class="control-button ${this._flashEnabled ? 'active' : ''}"
              @click=${this.handleFlashToggle}
              ?disabled=${!this.cameraActive}
              title="Toggle flash"
              aria-label="Toggle flash ${this._flashEnabled ? 'off' : 'on'}"
            >
              ${this._flashEnabled ? '⚡' : '🔦'}
            </button>

            <button
              class="control-button"
              @click=${this.handleCameraSwitch}
              ?disabled=${!this.cameraActive}
              title="Switch camera"
              aria-label="Switch to ${this._frontCamera ? 'back' : 'front'} camera"
            >
              🔄
            </button>

            <button
              class="control-button"
              @click=${this.handleSettingsClick}
              title="Camera settings"
              aria-label="Open camera settings"
            >
              ⚙️
            </button>
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
    'scan-controls': ScanControls;
  }
}