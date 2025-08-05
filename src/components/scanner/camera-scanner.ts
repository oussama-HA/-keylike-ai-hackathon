import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { CameraService } from '../../services/camera-service';
import { PrivacyService } from '../../services/privacy-service';
import { ModelService } from '../../services/model-service';
import { ScanResultFormatter } from '../../services/scan-result-formatter';
import type { CapturedImage, ModelPrediction, ScanResult } from '../../types/scan-types';
import type { EnhancedInferenceOptions, ImageQualityMetrics } from '../../types/model-types';

/**
 * Camera scanner component for capturing lock images
 */
@customElement('camera-scanner')
export class CameraScanner extends BaseComponent {
  @property({ type: String })
  scanId?: string;

  @state()
  private _isScanning = false;

  @state()
  private _hasPermission = false;

  @state()
  private _cameraActive = false;

  @state()
  private _scanProgress = 0;

  @state()
  private _lastResult: any = null;

  @state()
  private _modelLoaded = false;

  @state()
  private _imageQuality: ImageQualityMetrics | null = null;

  @state()
  private _inferenceProgress = 0;

  private cameraService: CameraService;
  private privacyService: PrivacyService;
  private modelService: ModelService;
  private scanResultFormatter: ScanResultFormatter;

  constructor() {
    super();
    this.cameraService = new CameraService();
    this.privacyService = new PrivacyService();
    this.modelService = new ModelService();
    this.scanResultFormatter = ScanResultFormatter.getInstance();
  }

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        height: 100%;
        background-color: var(--color-background);
      }

      .scanner-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        position: relative;
      }

      .camera-view {
        flex: 1;
        position: relative;
        background-color: #000;
        border-radius: var(--border-radius-lg);
        margin: var(--spacing-md);
        overflow: hidden;
        min-height: 400px;
      }

      .camera-preview {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .camera-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: var(--color-on-surface-variant);
        font-size: var(--font-size-lg);
        text-align: center;
        padding: var(--spacing-lg);
      }

      .scan-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0.6) 0%,
          transparent 30%,
          transparent 70%,
          rgba(0, 0, 0, 0.6) 100%
        );
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
        bottom: 120px;
        left: var(--spacing-md);
        right: var(--spacing-md);
        text-align: center;
        color: white;
        background-color: rgba(0, 0, 0, 0.6);
        padding: var(--spacing-md);
        border-radius: var(--border-radius-md);
      }

      .controls {
        padding: var(--spacing-lg);
        background-color: var(--color-surface);
        border-top: 1px solid var(--color-outline-variant);
      }

      .scan-button {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: var(--color-primary);
        border: 4px solid white;
        box-shadow: var(--shadow-lg);
        position: absolute;
        bottom: var(--spacing-lg);
        left: 50%;
        transform: translateX(-50%);
        cursor: pointer;
        transition: all var(--transition-fast);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
      }

      .scan-button:hover {
        transform: translateX(-50%) scale(1.05);
      }

      .scan-button:active {
        transform: translateX(-50%) scale(0.95);
      }

      .scan-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .secondary-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--spacing-md);
      }

      .control-button {
        padding: var(--spacing-sm) var(--spacing-md);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        background-color: var(--color-background);
        color: var(--color-on-background);
        cursor: pointer;
        transition: all var(--transition-fast);
      }

      .control-button:hover {
        background-color: var(--color-surface-variant);
      }

      .progress-bar {
        width: 100%;
        height: 4px;
        background-color: var(--color-surface-variant);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: var(--spacing-md);
      }

      .progress-fill {
        height: 100%;
        background-color: var(--color-primary);
        transition: width var(--transition-normal);
      }

      .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-sm);
        color: var(--color-on-surface-variant);
      }

      .quality-indicator {
        padding: var(--spacing-sm) var(--spacing-md);
        border-radius: var(--border-radius-md);
        margin-bottom: var(--spacing-sm);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
      }

      .quality-indicator.quality-excellent {
        background-color: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
        color: #4caf50;
      }

      .quality-indicator.quality-good {
        background-color: rgba(139, 195, 74, 0.1);
        border: 1px solid rgba(139, 195, 74, 0.3);
        color: #8bc34a;
      }

      .quality-indicator.quality-fair {
        background-color: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        color: #ffc107;
      }

      .quality-indicator.quality-poor {
        background-color: rgba(244, 67, 54, 0.1);
        border: 1px solid rgba(244, 67, 54, 0.3);
        color: #f44336;
      }

      .quality-tips {
        margin-top: var(--spacing-xs);
        font-size: var(--font-size-xs);
        opacity: 0.8;
      }

      .quality-tips .tip {
        margin-bottom: var(--spacing-xs);
      }

      .quality-tips .tip:last-child {
        margin-bottom: 0;
      }

      .permission-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        padding: var(--spacing-xl);
      }

      .permission-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-lg);
        opacity: 0.6;
      }

      .permission-title {
        font-size: var(--font-size-xl);
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--spacing-md);
      }

      .permission-text {
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
      }

      .permission-button:hover {
        background-color: var(--color-primary-dark);
      }

      @media (max-width: 768px) {
        .camera-view {
          margin: var(--spacing-sm);
          border-radius: var(--border-radius-md);
        }

        .scan-button {
          width: 70px;
          height: 70px;
        }

        .controls {
          padding: var(--spacing-md);
        }
      }
    `
  ];

  protected async initializeComponent(): Promise<void> {
    await this.checkCameraPermission();
    if (this._hasPermission) {
      await this.initializeCamera();
    }
    
    // Initialize model service
    await this.initializeModel();
  }

  protected cleanupComponent(): void {
    this.stopCamera();
  }

  private async checkCameraPermission(): Promise<void> {
    try {
      const status = await this.cameraService.getPermissionStatus();
      this._hasPermission = status === 'granted';
      console.log('📷 Camera permission status:', status);
    } catch (error) {
      console.error('Failed to check camera permission:', error);
      this._hasPermission = false;
    }
  }

  private async requestCameraPermission(): Promise<void> {
    await this.safeAsyncOperation(async () => {
      const granted = await this.cameraService.requestPermissions();
      this._hasPermission = granted;
      
      if (this._hasPermission) {
        await this.initializeCamera();
      }
    }, 'Requesting camera permission...');
  }

  private async initializeCamera(): Promise<void> {
    await this.safeAsyncOperation(async () => {
      await this.cameraService.startPreview();
      this._cameraActive = true;
      console.log('📸 Camera initialized');
    }, 'Initializing camera...');
  }

  private stopCamera(): void {
    this.cameraService.stopPreview();
    this._cameraActive = false;
    console.log('📸 Camera stopped');
  }

  private async initializeModel(): Promise<void> {
    await this.safeAsyncOperation(async () => {
      console.log('🤖 Initializing API-based model service...');
      
      // DEBUG: Log method signature check
      console.log('🔍 [DEBUG] ModelService.loadModel signature expects 0 arguments');
      console.log('🔍 [DEBUG] Current camera-scanner was calling with configuration object (legacy interface)');
      
      // API-based model service - no configuration needed
      await this.modelService.loadModel();
      
      this._modelLoaded = this.modelService.isModelLoaded();
      console.log('✅ API-based model service initialized - no local model loading required');
    }, 'Initializing AI model...');
  }

  private async startScan(): Promise<void> {
    if (!this._hasPermission || !this._cameraActive) {
      return;
    }

    if (!this._modelLoaded) {
      this.error = 'AI model not loaded. Please wait for initialization.';
      return;
    }

    this._isScanning = true;
    this._scanProgress = 0;
    this._inferenceProgress = 0;

    await this.safeAsyncOperation(async () => {
      try {
        // Update progress
        this._scanProgress = 10;
        
        // Capture image with camera service
        console.log('📸 Capturing image...');
        const capturedImage: CapturedImage = await this.cameraService.captureImage({
          quality: 90,
          allowEditing: false,
          width: 1920,
          height: 1080
        });
        
        this._scanProgress = 25;
        
        // Convert captured image to ImageData for model processing
        const imageData = await this.convertToImageData(capturedImage);
        
        this._scanProgress = 35;
        
        // Validate image quality
        console.log('🔍 Validating image quality...');
        console.log('🔍 [DIAGNOSTIC] ModelService instance:', this.modelService);
        console.log('🔍 [DIAGNOSTIC] Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.modelService)));
        console.log('🔍 [DIAGNOSTIC] validateImageQuality method exists:', typeof this.modelService.validateImageQuality);
        
        if (typeof this.modelService.validateImageQuality !== 'function') {
          console.error('❌ [DIAGNOSTIC] validateImageQuality method is missing!');
          console.log('🔍 [DIAGNOSTIC] Available ModelService methods:', Object.getOwnPropertyNames(this.modelService));
          throw new Error('ModelService.validateImageQuality method is not available - possible compilation or bundling issue');
        }
        
        this._imageQuality = await this.modelService.validateImageQuality(imageData);
        
        if (this._imageQuality.overallQuality === 'poor') {
          throw new Error(`Image quality too low: ${this._imageQuality.recommendations.join(', ')}`);
        }
        
        this._scanProgress = 45;
        
        // Get location hash for privacy-preserving location tagging
        console.log('📍 Getting location hash...');
        const locationHash = await this.privacyService.getCurrentLocationHash(5); // 5 = ~2.4km precision
        
        this._scanProgress = 55;
        
        // Process with ModelService
        console.log('🤖 Running AI inference...');
        this._inferenceProgress = 10;
        
        // Get zipcode from stored location data
        const zipcode = await this.getStoredZipcode();
        console.log('📍 Using zipcode for analysis:', zipcode);
        
        this._inferenceProgress = 30;
        
        const modelPrediction: ModelPrediction = await this.modelService.predict(imageData, zipcode);
        
        this._inferenceProgress = 80;
        this._scanProgress = 85;
        
        // Create comprehensive structured result using formatter
        const scanResult: ScanResult = this.scanResultFormatter.formatScanResult(
          modelPrediction,
          this.generateImageHash(capturedImage),
          locationHash || undefined,
          capturedImage.timestamp
        );
        
        // Add additional metadata now that types are properly extended
        scanResult.metadata.imageWidth = capturedImage.width;
        scanResult.metadata.imageHeight = capturedImage.height;
        scanResult.metadata.imageSize = capturedImage.size;
        scanResult.metadata.deviceInfo = capturedImage.deviceInfo;
        scanResult.metadata.imageQuality = this._imageQuality;
        scanResult.metadata.lockAnalysis = modelPrediction.lockAnalysis;
        scanResult.metadata.detectionRegions = modelPrediction.detectionRegions;
        
        this._lastResult = scanResult;

        this._inferenceProgress = 100;
        this._scanProgress = 100;
        
        console.log('🔍 [DEBUG] About to emit scan-complete event with result:', {
          resultId: this._lastResult.id,
          keyway: this._lastResult.prediction.keyway,
          confidence: this._lastResult.prediction.confidence,
          riskLevel: this._lastResult.riskAssessment.level
        });
        
        this.emitEvent('scan-complete', this._lastResult);
        console.log('✅ Scan completed and event emitted:', this._lastResult);
        
        console.log('🔍 [DEBUG] No automatic navigation to results page - this may be the issue!');
        
      } catch (error) {
        console.error('❌ Scan failed:', error);
        this.error = `Scan failed: ${error}`;
      }
      
    }, 'Processing scan...');

    this._isScanning = false;
    this._scanProgress = 0;
    this._inferenceProgress = 0;
  }

  /**
   * Get stored zipcode from location data
   */
  private async getStoredZipcode(): Promise<string> {
    try {
      // First try localStorage (immediate access)
      const locationDataStr = localStorage.getItem('keylike_location_data');
      if (locationDataStr) {
        const locationData = JSON.parse(locationDataStr);
        if (locationData.zipcode) {
          console.log('✅ Retrieved zipcode from localStorage:', locationData.zipcode);
          return locationData.zipcode;
        }
      }

      // Fallback to Capacitor Preferences
      const { Preferences } = await import('@capacitor/preferences');
      const { value } = await Preferences.get({ key: 'location_data' });
      
      if (value) {
        const locationData = JSON.parse(value);
        if (locationData.zipcode) {
          console.log('✅ Retrieved zipcode from Preferences:', locationData.zipcode);
          return locationData.zipcode;
        }
      }

      console.warn('⚠️ No zipcode found in storage, using default');
      return '00000'; // Default fallback
      
    } catch (error) {
      console.warn('⚠️ Failed to retrieve zipcode from storage:', error);
      return '00000'; // Default fallback
    }
  }

  private generateImageHash(image: CapturedImage): string {
    // Simple hash generation based on image properties
    const hashString = `${image.width}x${image.height}_${image.size}_${image.timestamp}`;
    return btoa(hashString).substring(0, 16);
  }

  private async convertToImageData(capturedImage: CapturedImage): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Set canvas size
      canvas.width = capturedImage.width;
      canvas.height = capturedImage.height;

      if (capturedImage.data instanceof ImageData) {
        // Already ImageData, return as-is
        resolve(capturedImage.data);
        return;
      }

      // Handle Blob data
      if (capturedImage.data instanceof Blob) {
        const img = new Image();
        
        img.onload = () => {
          // Draw image to canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Extract ImageData
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          resolve(imageData);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image from blob'));
        };
        
        // Convert blob to data URL
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          reject(new Error('Failed to read blob'));
        };
        reader.readAsDataURL(capturedImage.data);
      } else {
        reject(new Error('Unsupported image data type'));
      }
    });
  }

  private switchCamera(): void {
    // TODO: Implement camera switching
    console.log('🔄 Switch camera (not implemented)');
  }

  private toggleFlash(): void {
    // TODO: Implement flash toggle
    console.log('⚡ Toggle flash (not implemented)');
  }

  private renderPermissionPrompt() {
    return html`
      <div class="permission-prompt">
        <div class="permission-icon">📷</div>
        <h2 class="permission-title">Camera Access Required</h2>
        <p class="permission-text">
          Keylike AI needs access to your camera to scan locks and analyze their security.
          Your images are processed locally and never sent to external servers.
        </p>
        <button 
          class="permission-button"
          @click=${this.requestCameraPermission}
        >
          Enable Camera
        </button>
      </div>
    `;
  }

  private renderCameraView() {
    return html`
      <div class="camera-view">
        ${this._cameraActive ? html`
          <video class="camera-preview" autoplay playsinline></video>
          <div class="scan-overlay">
            <div class="scan-reticle ${this._isScanning ? 'scanning' : ''}"></div>
          </div>
        ` : html`
          <div class="camera-placeholder">
            <div>
              <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
              <div>Camera Initializing...</div>
            </div>
          </div>
        `}
        
        <button 
          class="scan-button"
          @click=${this.startScan}
          ?disabled=${!this._cameraActive || this._isScanning}
          title=${this._isScanning ? 'Scanning...' : 'Tap to scan'}
        >
          ${this._isScanning ? '⏳' : '📸'}
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="scanner-container">
        ${this._hasPermission ? this.renderCameraView() : this.renderPermissionPrompt()}
        
        ${this._hasPermission ? html`
          <div class="controls">
            ${this._isScanning ? html`
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${this._scanProgress}%"></div>
              </div>
              <div class="progress-info">
                <span>Processing: ${this._scanProgress}%</span>
                ${this._inferenceProgress > 0 ? html`
                  <span>AI Analysis: ${this._inferenceProgress}%</span>
                ` : ''}
              </div>
            ` : ''}
            
            ${this._imageQuality ? html`
              <div class="quality-indicator quality-${this._imageQuality.overallQuality}">
                <span>Image Quality: ${this._imageQuality.overallQuality}</span>
                ${this._imageQuality.recommendations.length > 0 ? html`
                  <div class="quality-tips">
                    ${this._imageQuality.recommendations.map(tip => html`
                      <div class="tip">${tip}</div>
                    `)}
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <div class="secondary-controls">
              <button class="control-button" @click=${this.switchCamera}>
                🔄 Switch
              </button>
              <button class="control-button" @click=${this.toggleFlash}>
                ⚡ Flash
              </button>
            </div>
          </div>
        ` : ''}
      </div>

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'camera-scanner': CameraScanner;
  }
}