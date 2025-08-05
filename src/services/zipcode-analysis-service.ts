/**
 * Zipcode Analysis Service - Geographic Duplicate Risk Assessment
 * Calculates location-based keyed-alike probability using zipcode data
 */

export class ZipcodeAnalysisService {
  
  // Population density data for major US areas
  private readonly POPULATION_DENSITY = new Map([
    // Very High Density (Major Cities)
    ['10001', { density: 'very_high', multiplier: 2.5, city: 'NYC' }],
    ['10002', { density: 'very_high', multiplier: 2.5, city: 'NYC' }],
    ['90210', { density: 'very_high', multiplier: 2.3, city: 'Beverly Hills' }],
    ['90211', { density: 'very_high', multiplier: 2.3, city: 'Beverly Hills' }],
    ['60601', { density: 'very_high', multiplier: 2.4, city: 'Chicago' }],
    ['60602', { density: 'very_high', multiplier: 2.4, city: 'Chicago' }],
    ['02101', { density: 'very_high', multiplier: 2.2, city: 'Boston' }],
    ['02102', { density: 'very_high', multiplier: 2.2, city: 'Boston' }],
    ['94102', { density: 'very_high', multiplier: 2.6, city: 'San Francisco' }],
    ['94103', { density: 'very_high', multiplier: 2.6, city: 'San Francisco' }],
    
    // High Density (Major Metro Areas)
    ['30301', { density: 'high', multiplier: 1.8, city: 'Atlanta' }],
    ['75201', { density: 'high', multiplier: 1.7, city: 'Dallas' }],
    ['77001', { density: 'high', multiplier: 1.6, city: 'Houston' }],
    ['33101', { density: 'high', multiplier: 1.9, city: 'Miami' }],
    ['98101', { density: 'high', multiplier: 1.8, city: 'Seattle' }],
    
    // Default for unknown zipcodes
    ['default', { density: 'medium', multiplier: 1.0, city: 'Unknown' }]
  ]);

  // Apartment complex concentration factors
  private readonly APARTMENT_FACTORS = new Map([
    // High apartment concentration zipcodes (known for bulk lock installations)
    ['10001', 3.5], ['10002', 3.5], ['10003', 3.0], // NYC
    ['90210', 2.8], ['90211', 2.8], // LA
    ['60601', 3.2], ['60602', 3.2], // Chicago
    ['02101', 2.9], ['02102', 2.9], // Boston
  ]);

  constructor() {
    console.log('📍 Zipcode Analysis Service initialized');
  }

  /**
   * Calculate duplicate probability based on geographic factors
   */
  calculateDuplicateProbability(
    bitting: number[], 
    keyway: string, 
    zipcode: string
  ): { certainty: number; duplicatesInArea: number; riskLevel: string; analysis: any } {
    
    console.log(`🌍 Analyzing geographic risk for ${keyway} in zipcode ${zipcode}`);
    
    // Step 1: Get base duplicate count from your Gemma 3n mathematical model
    const baseDuplicates = this.getBaseDuplicateCount(keyway);
    
    // Step 2: Apply population density multiplier
    const densityData = this.getDensityData(zipcode);
    const densityMultiplier = densityData.multiplier;
    
    // Step 3: Apply apartment concentration factor
    const apartmentMultiplier = this.getApartmentMultiplier(zipcode);
    
    // Step 4: Apply pattern-specific geographic risk
    const patternRisk = this.analyzeBittingPatternGeographic(bitting);
    
    // Step 5: Calculate local duplicates
    const localDuplicates = Math.round(
      baseDuplicates * densityMultiplier * apartmentMultiplier * patternRisk.multiplier
    );
    
    // Step 6: Calculate certainty percentage based on all factors
    const certainty = this.calculateGeographicCertainty(
      localDuplicates, 
      densityData, 
      patternRisk,
      apartmentMultiplier
    );
    
    const analysis = {
      baseDuplicates,
      densityFactor: densityMultiplier,
      apartmentFactor: apartmentMultiplier,
      patternFactor: patternRisk.multiplier,
      cityName: densityData.city,
      patternDescription: patternRisk.description
    };
    
    return {
      certainty: Math.min(certainty, 100), // Cap at 100%
      duplicatesInArea: localDuplicates,
      riskLevel: this.getRiskLevel(certainty),
      analysis
    };
  }

  /**
   * Get base duplicate count using your Gemma 3n data
   */
  private getBaseDuplicateCount(keyway: string): number {
    // Based on your test: 35-45M locks / 60K patterns = 583-750 duplicates
    const duplicateRates = {
      'SC1': 667,   // Your exact Gemma 3n calculation: 40M / 60K
      'KW1': 800,   // Kwikset higher production, looser tolerances
      'WR5': 200,   // Weiser lower production volume
      'WR3': 180,   // Weiser lower production
      'Y1': 300,    // Yale moderate production
      'default': 500 // Conservative estimate for unknown keyways
    };
    
    return duplicateRates[keyway] || duplicateRates['default'];
  }

  /**
   * Get population density data for zipcode
   */
  private getDensityData(zipcode: string): { density: string; multiplier: number; city: string } {
    // Try exact match first
    if (this.POPULATION_DENSITY.has(zipcode)) {
      return this.POPULATION_DENSITY.get(zipcode)!;
    }
    
    // Try prefix matching for zipcode families
    const prefix3 = zipcode.substring(0, 3);
    const prefix2 = zipcode.substring(0, 2);
    
    // NYC area (100xx)
    if (prefix3 === '100' || prefix2 === '10') {
      return { density: 'very_high', multiplier: 2.4, city: 'NYC Metro' };
    }
    
    // LA area (902xx)
    if (prefix3 === '902' || prefix3 === '900') {
      return { density: 'very_high', multiplier: 2.2, city: 'LA Metro' };
    }
    
    // Chicago area (606xx)
    if (prefix3 === '606' || prefix3 === '607') {
      return { density: 'high', multiplier: 1.9, city: 'Chicago Metro' };
    }
    
    // Default
    return this.POPULATION_DENSITY.get('default')!;
  }

  /**
   * Get apartment complex concentration multiplier
   */
  private getApartmentMultiplier(zipcode: string): number {
    return this.APARTMENT_FACTORS.get(zipcode) || 1.0;
  }

  /**
   * Analyze bitting pattern for geographic risk factors
   */
  private analyzeBittingPatternGeographic(bitting: number[]): { multiplier: number; description: string } {
    if (bitting.length === 0) {
      return { multiplier: 1.0, description: 'No pattern data' };
    }

    // Sequential patterns are MORE dangerous in dense areas (contractors use them)
    if (this.isSequential(bitting)) {
      return { 
        multiplier: 2.1, 
        description: 'Sequential pattern (common in bulk installations)' 
      };
    }

    // Date patterns are extremely dangerous in dense areas
    if (this.isDatePattern(bitting)) {
      return { 
        multiplier: 3.8, 
        description: 'Date pattern (contractors use building year/address)' 
      };
    }

    // Repeated digits common in apartment complexes
    if (this.hasRepeatedDigits(bitting)) {
      const repeatCount = this.getRepeatCount(bitting);
      return { 
        multiplier: 1.4 + (repeatCount * 0.3), 
        description: `Repeated digits (${repeatCount} repeats - common in bulk orders)` 
      };
    }

    // Keyboard patterns used by lazy contractors
    if (this.isKeyboardPattern(bitting)) {
      return { 
        multiplier: 1.8, 
        description: 'Keyboard pattern (human-selected, predictable)' 
      };
    }

    // Irregular patterns are safer even in dense areas
    if (this.isIrregular(bitting)) {
      return { 
        multiplier: 0.4, 
        description: 'Irregular pattern (less likely in bulk installations)' 
      };
    }

    // Default moderate risk
    return { 
      multiplier: 1.0, 
      description: 'Standard random pattern' 
    };
  }

  /**
   * Calculate geographic certainty based on all factors
   */
  private calculateGeographicCertainty(
    duplicates: number, 
    densityData: any, 
    patternRisk: any,
    apartmentFactor: number
  ): number {
    
    // Base certainty from duplicate count
    let certainty = Math.min((duplicates / 1000) * 100, 75);
    
    // Density bonus
    if (densityData.density === 'very_high') {
      certainty += 15;
    } else if (densityData.density === 'high') {
      certainty += 10;
    }
    
    // Apartment concentration bonus
    if (apartmentFactor > 2.0) {
      certainty += 12;
    } else if (apartmentFactor > 1.5) {
      certainty += 8;
    }
    
    // Pattern risk bonus
    if (patternRisk.multiplier > 2.0) {
      certainty += 10;
    }
    
    return Math.round(certainty);
  }

  /**
   * Convert certainty to risk level
   */
  private getRiskLevel(certainty: number): string {
    if (certainty >= 90) return 'CERTAIN';
    if (certainty >= 75) return 'HIGH';
    if (certainty >= 50) return 'MEDIUM';
    return 'LOW';
  }

  // === PATTERN DETECTION METHODS ===

  private isSequential(bitting: number[]): boolean {
    if (bitting.length < 3) return false;
    
    for (let i = 0; i < bitting.length - 2; i++) {
      const diff1 = bitting[i + 1] - bitting[i];
      const diff2 = bitting[i + 2] - bitting[i + 1];
      if (Math.abs(diff1) === Math.abs(diff2) && diff1 !== 0 && Math.abs(diff1) <= 2) {
        return true;
      }
    }
    return false;
  }

  private isDatePattern(bitting: number[]): boolean {
    const pattern = bitting.join('');
    const datePatterns = [
      /202[0-9]/, /201[0-9]/, // Years 2010-2029
      /[0-1][0-9]/, // Months 01-12
      /1234/, /4321/, /1111/, /2222/, /0000/ // Common sequences
    ];
    
    return datePatterns.some(regex => regex.test(pattern));
  }

  private hasRepeatedDigits(bitting: number[]): boolean {
    const counts = bitting.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Object.values(counts).some(count => count >= 2);
  }

  private getRepeatCount(bitting: number[]): number {
    const counts = bitting.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);
    
    return Math.max(...Object.values(counts)) - 1;
  }

  private isKeyboardPattern(bitting: number[]): boolean {
    const pattern = bitting.join('');
    const keyboardSequences = ['1234', '4321', '1357', '2468', '5432', '6789'];
    
    return keyboardSequences.some(seq => pattern.includes(seq));
  }

  private isIrregular(bitting: number[]): boolean {
    if (bitting.length < 3) return false;
    
    const mean = bitting.reduce((sum, val) => sum + val, 0) / bitting.length;
    const variance = bitting.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bitting.length;
    
    const hasHighVariance = variance > 4;
    const noRepeats = !this.hasRepeatedDigits(bitting);
    const noSequence = !this.isSequential(bitting);
    
    return hasHighVariance && noRepeats && noSequence;
  }

  /**
   * Get detailed geographic analysis for UI display
   */
  getDetailedAnalysis(zipcode: string): { 
    city: string; 
    density: string; 
    apartmentRisk: string; 
    riskFactors: string[] 
  } {
    const densityData = this.getDensityData(zipcode);
    const apartmentFactor = this.getApartmentMultiplier(zipcode);
    
    const riskFactors: string[] = [];
    
    if (densityData.multiplier > 2.0) {
      riskFactors.push('Very high population density');
    }
    
    if (apartmentFactor > 2.0) {
      riskFactors.push('High apartment complex concentration');
    }
    
    if (apartmentFactor > 1.5) {
      riskFactors.push('Known bulk lock installation area');
    }
    
    return {
      city: densityData.city,
      density: densityData.density.replace('_', ' ').toUpperCase(),
      apartmentRisk: apartmentFactor > 2.0 ? 'HIGH' : apartmentFactor > 1.5 ? 'MEDIUM' : 'LOW',
      riskFactors
    };
  }
}
