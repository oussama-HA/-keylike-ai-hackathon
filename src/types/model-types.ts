export interface ModelInfo {
  name: string;
  version: string;
  description: string;
  inputShape: number[];
  outputShape: number[];
  size: number; // bytes
  quantized: boolean;
  backend: 'webgl' | 'wasm' | 'cpu';
  loadedFrom: 'network' | 'cache' | 'indexeddb';
  checksum?: string;
}

export interface ModelMetadata {
  trainingData: {
    samples: number;
    keyways: string[];
    lockTypes: string[];
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
  performance: {
    inferenceTime: number; // ms
    memoryUsage: number; // MB
    gpuMemoryUsage?: number; // MB
  };
  lastUpdated: number;
  changelog?: string[];
}

export interface ModelCache {
  modelUrl: string;
  weightsUrl: string;
  metadataUrl: string;
  cachedAt: number;
  expiresAt: number;
  version: string;
  size: number;
  checksum: string;
}

export interface ModelPerformanceMetrics {
  loadTime: number;
  averageInferenceTime: number;
  memoryPeakUsage: number;
  accuracyScore?: number;
  inferenceCount: number;
  errors: number;
  lastInferenceTime?: number;
  trends: {
    inferenceTimeHistory: number[];
    memoryUsageHistory: number[];
    accuracyHistory: number[];
  };
}

export interface TensorInfo {
  shape: number[];
  dtype: string;
  size: number;
  min?: number;
  max?: number;
  mean?: number;
}

export interface ModelPredictionRaw {
  classScores: Float32Array;
  boundingBoxes?: Float32Array;
  features?: Float32Array;
  attention?: Float32Array;
}

export interface ModelValidationResult {
  isValid: boolean;
  version: string;
  compatibility: {
    tensorflowVersion: string;
    browserSupport: boolean;
    webglSupport: boolean;
    wasmSupport: boolean;
  };
  errors: string[];
  warnings: string[];
}

export interface ModelLoadOptions {
  backend?: 'webgl' | 'wasm' | 'cpu' | 'auto';
  enableCache: boolean;
  maxCacheAge?: number; // milliseconds
  onProgress?: (fraction: number) => void;
  onError?: (error: Error) => void;
  validateModel?: boolean;
}

export interface InferenceOptions {
  maxBatchSize?: number;
  enableProfiling?: boolean;
  warmupRuns?: number;
  precision?: 'float32' | 'float16';
}

export interface ModelUpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseNotes: string;
  downloadSize: number;
  critical: boolean;
  autoUpdate: boolean;
}

export interface ModelTrainingData {
  keyways: Record<string, {
    name: string;
    samples: number;
    accuracy: number;
    examples: string[];
  }>;
  lockTypes: Record<string, {
    name: string;
    keyways: string[];
    samples: number;
    characteristics: string[];
  }>;
  brands: Record<string, {
    name: string;
    keyways: string[];
    models: string[];
    marketShare: number;
  }>;
}

export interface ModelDiagnostics {
  modelLoaded: boolean;
  backendActive: string;
  memoryInfo: {
    numTensors: number;
    numDataBuffers: number;
    numBytes: number;
    unreliable?: boolean;
  };
  deviceInfo: {
    webglVersion?: string;
    maxTextureSize?: number;
    supportsFloat32Textures?: boolean;
    supportsHalfFloatTextures?: boolean;
  };
  performance: ModelPerformanceMetrics;
  lastError?: string;
}


export interface PreprocessingPipeline {
  resize: {
    width: number;
    height: number;
    method: 'bilinear' | 'nearest';
  };
  normalize: {
    mean: number[];
    std: number[];
  };
  augmentation?: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    rotation?: number;
  };
  lockSpecific?: {
    contrastEnhancement: boolean;
    edgeSharpening: boolean;
    noiseReduction: boolean;
    metalDetection: boolean;
    keywayHighlight: boolean;
  };
}

export interface PostprocessingPipeline {
  softmax: boolean;
  topK?: number;
  threshold?: number;
  nms?: {
    iouThreshold: number;
    scoreThreshold: number;
  };
}

// Additional types for benchmarking and health monitoring
export interface ModelBenchmarkResult {
  averageInferenceTime: number;
  minInferenceTime: number;
  maxInferenceTime: number;
  memoryUsage: number;
  throughput: number;
}

export interface ModelHealthCheck {
  status: 'healthy' | 'warning' | 'error';
  checks: {
    modelLoaded: boolean;
    backendActive: boolean;
    memoryWithinLimits: boolean;
    inferenceWorking: boolean;
  };
  issues: string[];
  recommendations: string[];
}

export interface ModelMemoryUsage {
  numTensors: number;
  numDataBuffers: number;
  numBytes: number;
  megabytes: number;
  withinLimits: boolean;
}

export interface ModelCacheEntry {
  modelUrl: string;
  saveResult: any;
  cachedAt: number;
  expiresAt: number;
  version: string;
  size: number;
  checksum: string | null;
}

// Lock/Key Analysis specific types
export interface LockAnalysisResult {
  lockType: 'deadbolt' | 'knob' | 'padlock' | 'commercial' | 'automotive' | 'specialty';
  keyway: string;
  pinCount: number;
  securityFeatures: string[];
  vulnerabilities: LockVulnerability[];
  confidence: number;
  metalType: 'brass' | 'steel' | 'aluminum' | 'unknown';
  manufacturingMarks: string[];
}

export interface LockVulnerability {
  type: 'picking' | 'bumping' | 'drilling' | 'bypass' | 'impressioning';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  exploitDifficulty: 'trivial' | 'easy' | 'moderate' | 'difficult' | 'expert';
  timeToExploit: number; // seconds
  mitigations: string[];
}

export interface ImageQualityMetrics {
  sharpness: number;
  contrast: number;
  brightness: number;
  noiseLevel: number;
  resolution: number;
  overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
  recommendations: string[];
  qualityScore?: number;
}

export interface LockDetectionRegions {
  keyway: {
    boundingBox: [number, number, number, number];
    confidence: number;
    angle: number;
  };
  pins: Array<{
    position: [number, number];
    height: number;
    confidence: number;
  }>;
  body: {
    boundingBox: [number, number, number, number];
    material: string;
    condition: 'new' | 'worn' | 'damaged';
  };
}

export interface EnhancedInferenceOptions extends InferenceOptions {
  imageQualityThreshold?: number;
  enableLockSpecificProcessing?: boolean;
  detectMultipleObjects?: boolean;
  confidenceThreshold?: number;
  returnIntermediateResults?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

// Extended model service interface for additional functionality
export interface ModelServiceExtensions {
  benchmarkModel(iterations?: number): Promise<ModelBenchmarkResult>;
  runHealthCheck(): Promise<ModelHealthCheck>;
  clearModelCache(): Promise<void>;
  getMemoryUsage(): ModelMemoryUsage;
  optimizeMemory(): Promise<void>;
  
  // Lock/Key analysis specific methods
  analyzeLockImage(imageData: ImageData, options?: EnhancedInferenceOptions): Promise<LockAnalysisResult>;
  validateImageQuality(imageData: ImageData): Promise<ImageQualityMetrics>;
  detectLockRegions(imageData: ImageData): Promise<LockDetectionRegions>;
  enhanceImageForAnalysis(imageData: ImageData): Promise<ImageData>;
}