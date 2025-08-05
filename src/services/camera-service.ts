import { Camera, CameraResultType, CameraSource, CameraDirection } from '@capacitor/camera';
import type { CapturedImage } from '../types/scan-types';
import type { UserPermissions } from '../types/app-types';

export interface ICameraService {
  requestPermissions(): Promise<boolean>;
  captureImage(): Promise<CapturedImage>;
  startPreview(): Promise<void>;
  stopPreview(): Promise<void>;
  checkCameraAvailability(): Promise<boolean>;
  getPermissionStatus(): Promise<UserPermissions['camera']>;
  switchCamera(): Promise<void>;
  setFlashMode(enabled: boolean): Promise<void>;
  getDeviceInfo(): Promise<CameraDeviceInfo>;
}

export interface CameraDeviceInfo {
  hasCamera: boolean;
  hasFrontCamera: boolean;
  hasBackCamera: boolean;
  hasFlash: boolean;
  supportedResolutions: Array<{
    width: number;
    height: number;
    label: string;
  }>;
  currentFacing: 'front' | 'back';
  flashEnabled: boolean;
}

export interface CameraOptions {
  quality: number; // 0-100
  allowEditing: boolean;
  resultType: 'uri' | 'base64' | 'dataUrl';
  source: 'camera' | 'photos' | 'prompt';
  direction: 'front' | 'rear';
  presentationStyle: 'fullscreen' | 'popover';
  width?: number;
  height?: number;
}

export class CameraService implements ICameraService {
  private isPreviewActive = false;
  private currentFacing: 'front' | 'back' = 'back';
  private flashEnabled = false;
  private permissionStatus: UserPermissions['camera'] = 'prompt';

  constructor() {
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Check initial permission status
      this.permissionStatus = await this.getPermissionStatus();
      console.log('📷 Camera service initialized, permission status:', this.permissionStatus);
    } catch (error) {
      console.error('❌ Failed to initialize camera service:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permissions = await Camera.requestPermissions();
      const granted = permissions.camera === 'granted';
      this.permissionStatus = granted ? 'granted' : 'denied';
      
      console.log('📷 Camera permission status:', this.permissionStatus);
      return granted;
      
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error);
      this.permissionStatus = 'denied';
      return false;
    }
  }

  async getPermissionStatus(): Promise<UserPermissions['camera']> {
    try {
      const permissions = await Camera.checkPermissions();
      
      // Map Capacitor permission states to our app states
      const mappedStatus: UserPermissions['camera'] =
        permissions.camera === 'granted' ? 'granted' :
        permissions.camera === 'denied' ? 'denied' : 'prompt';
      
      this.permissionStatus = mappedStatus;
      return mappedStatus;
    } catch (error) {
      console.error('❌ Failed to check camera permissions:', error);
      return 'prompt';
    }
  }

  async captureImage(options: Partial<CameraOptions> = {}): Promise<CapturedImage> {
    console.log('📸 Starting image capture with options:', options);
    
    if (this.permissionStatus !== 'granted') {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Camera permission required to capture images');
      }
    }

    // Create Capacitor-compatible options
    const capacitorOptions = {
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      direction: this.currentFacing === 'back' ? CameraDirection.Rear : CameraDirection.Front,
      width: options.width || 1920,
      height: options.height || 1080
    };
    
    console.log('🔧 Capacitor camera options:', capacitorOptions);

    try {
      console.log('📷 Calling Camera.getPhoto()...');
      const photo = await Camera.getPhoto(capacitorOptions);
      console.log('📸 Camera.getPhoto() returned:', {
        hasDataUrl: !!photo.dataUrl,
        format: photo.format,
        saved: photo.saved,
        webPath: photo.webPath
      });
      
      if (!photo.dataUrl) {
        throw new Error('No image data received from camera');
      }
      
      // Convert the captured photo to our CapturedImage format
      const capturedImage = await this.processCapacitorPhoto(photo);
      
      console.log('📸 Image captured successfully', {
        format: capturedImage.format,
        size: capturedImage.size,
        dimensions: `${capturedImage.width}x${capturedImage.height}`
      });
      
      return capturedImage;
      
    } catch (error) {
      console.error('❌ Failed to capture image:', error);
      throw new Error(`Camera capture failed: ${error}`);
    }
  }

  private async processCapacitorPhoto(photo: any): Promise<CapturedImage> {
    try {
      // Create an image element to load the data URL
      const img = new Image();
      img.src = photo.dataUrl;
      
      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Validate image before processing
      this.validateImage(img);
      
      // Create canvas to extract ImageData
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      
      // Get ImageData
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Calculate approximate file size from data URL
      const base64Length = photo.dataUrl.split(',')[1]?.length || 0;
      const estimatedSize = (base64Length * 3) / 4; // Rough estimate from base64
      
      const capturedImage: CapturedImage = {
        data: imageData,
        width: img.width,
        height: img.height,
        format: photo.format || 'jpeg',
        size: estimatedSize,
        timestamp: Date.now(),
        deviceInfo: {
          cameraFacing: this.currentFacing,
          flash: this.flashEnabled,
          zoom: 1.0
        }
      };
      
      // Perform additional quality checks
      this.validateImageQuality(capturedImage);
      
      return capturedImage;
      
    } catch (error) {
      console.error('❌ Failed to process captured photo:', error);
      throw new Error('Failed to process captured image');
    }
  }

  private validateImage(img: HTMLImageElement): void {
    console.log('🔍 Validating captured/uploaded image dimensions:', {
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    });
    
    // Check minimum dimensions - adjusted to accept common image sizes including 512x512
    const MIN_WIDTH = 320;  // Reduced to accept smaller uploaded images
    const MIN_HEIGHT = 240; // Reduced to accept smaller uploaded images
    
    if (img.width < MIN_WIDTH || img.height < MIN_HEIGHT) {
      console.error('❌ Image validation failed - dimensions too small:', {
        actual: `${img.width}x${img.height}`,
        required: `${MIN_WIDTH}x${MIN_HEIGHT}`,
        widthDiff: img.width - MIN_WIDTH,
        heightDiff: img.height - MIN_HEIGHT
      });
      throw new Error(`Image too small: ${img.width}x${img.height}. Minimum required: ${MIN_WIDTH}x${MIN_HEIGHT}`);
    }
    
    // Special note for 512x512 images which are perfectly acceptable
    if (img.width === 512 && img.height === 512) {
      console.log('✅ 512x512 image accepted - ideal size for lock scanning');
    }
    
    // Check maximum dimensions (to prevent memory issues)
    const MAX_WIDTH = 4096;
    const MAX_HEIGHT = 4096;
    
    if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
      throw new Error(`Image too large: ${img.width}x${img.height}. Maximum allowed: ${MAX_WIDTH}x${MAX_HEIGHT}`);
    }
    
    // Check aspect ratio (should be reasonable for lock scanning)
    const aspectRatio = img.width / img.height;
    const MIN_ASPECT_RATIO = 0.5; // Very tall images
    const MAX_ASPECT_RATIO = 3.0; // Very wide images
    
    if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) {
      console.warn(`Image aspect ratio ${aspectRatio.toFixed(2)} may not be optimal for lock scanning`);
    }
    
    console.log('✅ Image validation passed:', {
      dimensions: `${img.width}x${img.height}`,
      aspectRatio: aspectRatio.toFixed(2)
    });
  }

  private validateImageQuality(image: CapturedImage): void {
    // Check file size
    const MIN_SIZE = 50 * 1024; // 50KB minimum
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB maximum
    
    if (image.size < MIN_SIZE) {
      console.warn(`Image file size is very small: ${(image.size / 1024).toFixed(2)}KB. This may indicate poor quality.`);
    }
    
    if (image.size > MAX_SIZE) {
      throw new Error(`Image file too large: ${(image.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: ${MAX_SIZE / 1024 / 1024}MB`);
    }
    
    // Basic brightness check (only if we have ImageData)
    let brightnessSample: number | null = null;
    if (image.data instanceof ImageData) {
      brightnessSample = this.calculateBrightnessSample(image.data);
      
      if (brightnessSample < 30) {
        console.warn('Image appears to be very dark. Consider using flash or better lighting.');
      } else if (brightnessSample > 220) {
        console.warn('Image appears to be overexposed. Consider reducing lighting or disabling flash.');
      }
    }
    
    console.log('✅ Image quality validation passed:', {
      size: `${(image.size / 1024).toFixed(2)}KB`,
      brightness: brightnessSample !== null ? brightnessSample : 'N/A (Blob data)'
    });
  }

  private calculateBrightnessSample(imageData: ImageData): number {
    // Sample a smaller subset for performance (every 10th pixel)
    const { data, width, height } = imageData;
    let totalBrightness = 0;
    let sampleCount = 0;
    
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Calculate perceived brightness using luminance formula
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        totalBrightness += brightness;
        sampleCount++;
      }
    }
    
    return sampleCount > 0 ? totalBrightness / sampleCount : 0;
  }

  private async simulateCameraCapture(options: CameraOptions): Promise<CapturedImage> {
    // Create a mock canvas with some content
    const canvas = document.createElement('canvas');
    canvas.width = options.width || 640;
    canvas.height = options.height || 480;
    const ctx = canvas.getContext('2d')!;
    
    // Draw a simple placeholder
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Camera Placeholder', canvas.width / 2, canvas.height / 2);
    ctx.fillText(`${canvas.width}x${canvas.height}`, canvas.width / 2, canvas.height / 2 + 30);
    
    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, 'image/jpeg', options.quality / 100);
    });

    // Create ImageData
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return {
      data: imageData,
      width: canvas.width,
      height: canvas.height,
      format: 'jpeg',
      size: blob!.size,
      timestamp: Date.now(),
      deviceInfo: {
        cameraFacing: this.currentFacing,
        flash: this.flashEnabled,
        zoom: 1.0
      }
    };
  }

  async startPreview(): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      const granted = await this.requestPermissions();
      if (!granted) {
        throw new Error('Camera permission required for preview');
      }
    }

    try {
      // TODO: Implement camera preview
      // This would typically involve showing a camera feed in a video element
      
      this.isPreviewActive = true;
      console.log('📹 Camera preview started');
      
    } catch (error) {
      console.error('❌ Failed to start camera preview:', error);
      throw error;
    }
  }

  async stopPreview(): Promise<void> {
    try {
      // TODO: Stop camera preview
      // Stop video streams and release camera
      
      this.isPreviewActive = false;
      console.log('⏹️ Camera preview stopped');
      
    } catch (error) {
      console.error('❌ Failed to stop camera preview:', error);
      throw error;
    }
  }

  async checkCameraAvailability(): Promise<boolean> {
    try {
      // Check if camera is available
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        return videoDevices.length > 0;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Failed to check camera availability:', error);
      return false;
    }
  }

  async switchCamera(): Promise<void> {
    try {
      this.currentFacing = this.currentFacing === 'back' ? 'front' : 'back';
      
      if (this.isPreviewActive) {
        // Restart preview with new camera
        await this.stopPreview();
        await this.startPreview();
      }
      
      console.log(`📷 Switched to ${this.currentFacing} camera`);
      
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      throw error;
    }
  }

  async setFlashMode(enabled: boolean): Promise<void> {
    try {
      // TODO: Implement flash control via Capacitor
      this.flashEnabled = enabled;
      console.log(`⚡ Flash ${enabled ? 'enabled' : 'disabled'}`);
      
    } catch (error) {
      console.error('❌ Failed to set flash mode:', error);
      throw error;
    }
  }

  async getDeviceInfo(): Promise<CameraDeviceInfo> {
    try {
      const hasCamera = await this.checkCameraAvailability();
      
      // TODO: Get more detailed device info via Capacitor
      return {
        hasCamera,
        hasFrontCamera: hasCamera, // Assume both if camera exists
        hasBackCamera: hasCamera,
        hasFlash: hasCamera, // Most mobile devices with cameras have flash
        supportedResolutions: [
          { width: 640, height: 480, label: 'VGA' },
          { width: 1280, height: 720, label: 'HD' },
          { width: 1920, height: 1080, label: 'Full HD' },
          { width: 3840, height: 2160, label: '4K' }
        ],
        currentFacing: this.currentFacing,
        flashEnabled: this.flashEnabled
      };
      
    } catch (error) {
      console.error('❌ Failed to get device info:', error);
      return {
        hasCamera: false,
        hasFrontCamera: false,
        hasBackCamera: false,
        hasFlash: false,
        supportedResolutions: [],
        currentFacing: 'back',
        flashEnabled: false
      };
    }
  }

  // Utility methods
  getPreviewStatus(): boolean {
    return this.isPreviewActive;
  }

  getCurrentFacing(): 'front' | 'back' {
    return this.currentFacing;
  }

  isFlashEnabled(): boolean {
    return this.flashEnabled;
  }

  // Cleanup
  dispose(): void {
    if (this.isPreviewActive) {
      this.stopPreview().catch(console.error);
    }
    console.log('🗑️ Camera service disposed');
  }
}