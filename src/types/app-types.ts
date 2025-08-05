export interface AppVersion {
  version: string;
  buildDate: string;
  gitCommit?: string;
}

export interface AppConfig {
  name: string;
  version: string;
  description: string;
  supportEmail: string;
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
}

export interface DeviceInfo {
  platform: 'web' | 'ios' | 'android';
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  isOnline: boolean;
  hasCamera: boolean;
  hasGeolocation: boolean;
}

export interface AppState {
  isInitialized: boolean;
  isModelReady: boolean;
  isOnline: boolean;
  currentRoute: string;
  deviceInfo: DeviceInfo;
  errorMessage?: string;
}

export interface NavigationItem {
  path: string;
  title: string;
  icon: string;
  requiresModel?: boolean;
  requiresCamera?: boolean;
}

export interface PerformanceMetrics {
  modelLoadTime?: number;
  inferenceTime?: number;
  memoryUsage?: number;
  bundleSize?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

export interface UserPermissions {
  camera: 'granted' | 'denied' | 'prompt';
  geolocation: 'granted' | 'denied' | 'prompt';
  notifications: 'granted' | 'denied' | 'prompt';
}

export type Theme = 'light' | 'dark' | 'auto';
export type Language = 'en' | 'es' | 'fr' | 'de' | 'zh';
export type InferenceBackend = 'webgl' | 'wasm' | 'auto';