export interface CapturedImage {
  data: ImageData | Blob;
  width: number;
  height: number;
  format: 'jpeg' | 'png' | 'webp';
  size: number; // bytes
  timestamp: number;
  deviceInfo?: {
    cameraFacing: 'front' | 'back';
    flash: boolean;
    zoom: number;
  };
}

export interface ModelPrediction {
  keyway: string;
  confidence: number;
  lockType: string;
  brandDetected?: string;
  alternatives: Array<{
    keyway: string;
    confidence: number;
  }>;
  processingTime: number;
  modelVersion: string;
  
  // NEW: Dynamic AI prediction fields
  estimatedAnnualProduction?: number;    // Replaces hardcoded 40M
  marketPenetration?: number;            // Replaces hardcoded percentages
  manufacturingComplexity?: number;      // Replaces static scores
  timeInMarket?: number;                 // For dynamic risk calculation
  bittingPattern?: number[];             // Direct bitting from AI
  
  // NEW: Keyed-alike certainty analysis
  keyedAlikeCertainty?: {
    certainty: number;
    analysis: any;
    verdict: string;
  };
  
  // Enhanced analysis results
  lockAnalysis?: {
    pinCount: number;
    securityFeatures: string[];
    metalType: 'brass' | 'steel' | 'aluminum' | 'unknown';
    condition: 'new' | 'worn' | 'damaged';
    manufacturingMarks: string[];
  };
  
  // Image quality metrics
  imageQuality?: {
    sharpness: number;
    contrast: number;
    brightness: number;
    overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
    qualityScore: number;
  };
  
  // Detection regions
  detectionRegions?: {
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
  };
}

export interface KeyedAlikeRiskScore {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: {
    keyspaceScore: number;
    patternScore: number;
    massProductionScore: number;
    toleranceScore: number;
    duplicateRiskScore: number;
  };
  recommendations: string[];
  
  // Enhanced metadata for mathematical analysis (Phase 3+)
  metadata?: {
    patternType: 'sequential' | 'repeated' | 'date' | 'keyboard' | 'random';
    patternDescription: string;
    estimatedDuplicates: number;
    mathematicalAnalysis: string;
    duplicationEstimate: string;
    manufacturingEfficiency: number;
    bittingPattern: number[];
    processingTime: number;
  };
}

export interface ScanResult {
  id: string;
  timestamp: number;
  imageHash: string;
  prediction: ModelPrediction;
  riskAssessment: KeyedAlikeRiskScore;
  location: {
    geohash: string;
    precision: number;
    city?: string;
    country?: string;
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    appVersion: string;
    deviceType: string;
    userAgent: string;
    imageWidth?: number;
    imageHeight?: number;
    imageSize?: number;
    deviceInfo?: {
      cameraFacing: 'front' | 'back';
      flash: boolean;
      zoom: number;
    };
    imageQuality?: {
      sharpness: number;
      contrast: number;
      brightness: number;
      overallQuality: 'poor' | 'fair' | 'good' | 'excellent';
      qualityScore?: number;
    };
    lockAnalysis?: {
      pinCount: number;
      securityFeatures: string[];
      metalType: 'brass' | 'steel' | 'aluminum' | 'unknown';
      condition: 'new' | 'worn' | 'damaged';
      manufacturingMarks: string[];
    };
    detectionRegions?: {
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
    };
  };
  encrypted: boolean;
  tags?: string[];
  notes?: string;
}

// UI-compatible result format
export interface UIFormattedResult {
  id: string;
  keyway: string;
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  lockType: string;
  vulnerabilities: string[];
  recommendations: string[];
  processingTime: number;
  timestamp: Date;
  imageUrl?: string;
  
  // Enhanced fields
  securityScore: number;
  riskMessage: string;
  keyedAlikeRisk: boolean;
  componentScores: {
    lockType: number;
    keyway: number;
    pinCount: number;
    vulnerabilities: number;
    confidence: number;
  };
  additionalInfo: {
    pinCount?: number;
    securityFeatures: string[];
    metalType?: string;
    condition?: string;
    macsCode: string;
    category: string;
  };
  
  // Mathematical Analysis Fields (Phase 4)
  mathematicalAnalysis?: {
    explanation: string;
    patternType: 'sequential' | 'repeated' | 'date' | 'keyboard' | 'random';
    patternDescription?: string;
    duplicationEstimate: string;
    estimatedDuplicates?: number;
    manufacturingEfficiency?: number;
    bittingPattern?: number[];
    riskFactors: {
      patternRisk: number;
      duplicationRisk: number;
      manufacturingRisk: number;
      brandRisk: number;
    };
  };
  
  // Geographic context
  geographicContext?: {
    zipcode?: string;
    region?: string;
    city?: string;
    country?: string;
  };
}

export interface ScanSession {
  id: string;
  startTime: number;
  endTime?: number;
  results: ScanResult[];
  location?: {
    name: string;
    description: string;
    geohash: string;
  };
  purpose?: string;
  shared: boolean;
}

export interface ScanHistory {
  sessions: ScanSession[];
  totalScans: number;
  lastScanTime?: number;
  favoriteLocations: string[];
  statistics: {
    averageRiskScore: number;
    mostCommonKeyway: string;
    totalProcessingTime: number;
    accuracyFeedback: number; // user reported accuracy 0-1
  };
}

export interface ScanFilters {
  dateRange?: {
    start: number;
    end: number;
  };
  riskLevel?: ('low' | 'medium' | 'high')[];
  lockType?: string[];
  keyway?: string[];
  location?: string[];
  minConfidence?: number;
}

export interface ExportedData {
  version: string;
  exportDate: number;
  scanHistory: ScanHistory;
  userSettings: any; // will be typed in settings
  modelInfo: any; // will be typed in model-types
  privacy: {
    dataAnonymized: boolean;
    locationPrecision: number;
    encryptionUsed: boolean;
  };
}