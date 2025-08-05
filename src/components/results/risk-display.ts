import { html, css, CSSResultGroup } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { RiskAssessmentService } from '../../services/risk-assessment-service';
import type { ScanResult, UIFormattedResult } from '../../types/scan-types';
import { ScanResultFormatter } from '../../services/scan-result-formatter';
import { ScanStore } from '../../stores/scan-store';

@customElement('risk-display')
export class RiskDisplay extends BaseComponent {
  @property({ type: String })
  resultId = '';

  @property({ type: Object })
  scanResult: ScanResult | null = null;

  @state()
  private _result: UIFormattedResult | null = null;

  @state()
  private _showDetails = false;

  @state()
  private _showComponentBreakdown = false;
  
  private formatter: ScanResultFormatter;

  constructor() {
    super();
    this.formatter = ScanResultFormatter.getInstance();
  }

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    
    // Try to get scan result from props first, then from store
    let resultToProcess = this.scanResult;
    
    if (!resultToProcess) {
      console.log('🔍 No scan result in props, checking scan store...');
      try {
        const { scanStore } = await import('../../stores/scan-store.js');
        
        if (this.resultId) {
          // If we have a specific result ID, get it from store
          resultToProcess = scanStore.getScanById(this.resultId);
          console.log('📋 Retrieved scan result by ID from store:', this.resultId);
        } else {
          // Otherwise get the most recent scan (current scan)
          resultToProcess = scanStore.getCurrentScan();
          console.log('📋 Retrieved current scan from store');
        }
        
        if (resultToProcess) {
          this.scanResult = resultToProcess;
        }
      } catch (error) {
        console.error('❌ Failed to load scan result from store:', error);
      }
    }
    
    if (resultToProcess) {
      this.processResult(resultToProcess);
      console.log('✅ Risk display initialized with scan result:', resultToProcess.id);
    } else {
      console.warn('⚠️ No scan result available for risk display');
    }
  }

  updated(changedProperties: Map<string, any>): void {
    super.updated(changedProperties);
    if (changedProperties.has('scanResult') && this.scanResult) {
      this.processResult(this.scanResult);
    }
  }

  private processResult(scanResult: ScanResult): void {
    this._result = this.formatter.formatForUI(scanResult);
  }

  private toggleDetails(): void {
    this._showDetails = !this._showDetails;
  }

  private toggleComponentBreakdown(): void {
    this._showComponentBreakdown = !this._showComponentBreakdown;
  }

  private handleScanAgain(): void {
    this.emitEvent('scan-again');
  }

  private handleSaveResult(): void {
    this.emitEvent('save-result', { result: this._result });
  }

  private handleShareResult(): void {
    this.emitEvent('share-result', { result: this._result });
  }

  /**
   * Render mathematical analysis section with pattern insights
   */
  private renderMathematicalAnalysis(): any {
    if (!this._result?.mathematicalAnalysis) return html``;
    
    const analysis = this._result.mathematicalAnalysis;
    
    return html`
      <div class="mathematical-analysis">
        <h4>📊 Mathematical Analysis</h4>
        <div class="analysis-details">
          <p>${analysis.explanation}</p>
          <div class="pattern-info">
            <span class="pattern-type">Pattern: ${this.formatPatternType(analysis.patternType)}</span>
            <span class="duplication-estimate">Duplication Risk: ${analysis.duplicationEstimate}</span>
          </div>
          ${analysis.estimatedDuplicates ? html`
            <div class="duplicates-info">
              <span class="duplicates-count">Estimated ~${analysis.estimatedDuplicates} duplicates per year</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render bitting pattern visualization with pin depths
   */
  private renderBittingPattern(): any {
    if (!this._result?.mathematicalAnalysis?.bittingPattern) return html``;
    
    const pattern = this._result.mathematicalAnalysis.bittingPattern;
    
    return html`
      <div class="bitting-visualization">
        <h5>🔑 Key Bitting Pattern</h5>
        <div class="bitting-display">
          ${pattern.map((depth: number, index: number) => html`
            <div class="pin-display">
              <div class="pin-bar"
                   style="height: ${depth * 8}px; background: var(--pin-color-${depth}, var(--color-primary))"></div>
              <div class="pin-depth">${depth}</div>
              <div class="pin-number">Pin ${index + 1}</div>
            </div>
          `)}
        </div>
      </div>
    `;
  }

  /**
   * Render enhanced risk factors with weighted percentages
   */
  private renderEnhancedFactors(): any {
    if (!this._result?.mathematicalAnalysis?.riskFactors) return html``;
    
    const factors = this._result.mathematicalAnalysis.riskFactors;
    
    return html`
      <div class="enhanced-factors">
        <h4>🔍 Risk Factor Analysis</h4>
        <div class="factor-grid">
          <div class="factor-item">
            <span class="factor-label">Pattern Risk (35%)</span>
            <span class="factor-value">${factors.patternRisk.toFixed(1)}</span>
            <div class="factor-bar" style="width: ${Math.min(factors.patternRisk, 100)}%"></div>
          </div>
          <div class="factor-item">
            <span class="factor-label">Duplication Risk (30%)</span>
            <span class="factor-value">${factors.duplicationRisk.toFixed(1)}</span>
            <div class="factor-bar" style="width: ${Math.min(factors.duplicationRisk, 100)}%"></div>
          </div>
          <div class="factor-item">
            <span class="factor-label">Manufacturing Risk (25%)</span>
            <span class="factor-value">${factors.manufacturingRisk.toFixed(1)}</span>
            <div class="factor-bar" style="width: ${Math.min(factors.manufacturingRisk, 100)}%"></div>
          </div>
          <div class="factor-item">
            <span class="factor-label">Brand Risk (10%)</span>
            <span class="factor-value">${factors.brandRisk.toFixed(1)}</span>
            <div class="factor-bar" style="width: ${Math.min(factors.brandRisk, 100)}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render geographic context when available
   */
  private renderGeographicContext(): any {
    if (!this._result?.geographicContext?.zipcode) return html``;
    
    const geo = this._result.geographicContext;
    
    return html`
      <div class="geographic-context">
        <h5>📍 Geographic Analysis</h5>
        <p>Analysis performed for ZIP code: ${geo.zipcode}</p>
        ${geo.region ? html`<p>Region: ${geo.region}</p>` : ''}
        <p>Regional manufacturing frequency and distribution patterns considered.</p>
      </div>
    `;
  }

  /**
   * Format pattern type for display
   */
  private formatPatternType(type: string): string {
    const typeMap: Record<string, string> = {
      'sequential': 'Sequential',
      'repeated': 'Repeated Digits',
      'date': 'Date-based',
      'keyboard': 'Keyboard Pattern',
      'random': 'Random/Irregular'
    };
    return typeMap[type] || type;
  }

  private getRiskIcon(level: string): string {
    switch (level) {
      case 'low': return '✅';
      case 'medium': return '⚠️';
      case 'high': return '🚨';
      default: return '❓';
    }
  }

  private getScoreColor(score: number): string {
    if (score <= 40) return 'var(--color-success)';
    if (score <= 75) return 'var(--color-warning)';
    return 'var(--color-error)';
  }

  private formatDate(timestamp: Date): string {
    return timestamp.toLocaleDateString();
  }

  private formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString();
  }

  render() {
    if (!this._result) {
      return html`
        <div class="result-container">
          <div class="result-header">
            <h2>Loading results...</h2>
          </div>
        </div>
      `;
    }

    return html`
      <div class="result-container">
        <!-- Result Header -->
        <div class="result-header">
          ${this._result.imageUrl ? html`
            <img src=${this._result.imageUrl} alt="Scanned lock" class="scan-image" />
          ` : ''}
          
          <h2 class="result-title">Lock Analysis Complete</h2>
          
          <div class="keyway-info">
            <div class="keyway-code">${this._result.keyway}</div>
            <div class="confidence-score">${Math.round(this._result.confidence * 100)}% confidence</div>
          </div>
          
          <div class="risk-badge risk-${this._result.riskLevel}">
            ${this.getRiskIcon(this._result.riskLevel)}
            ${this._result.riskLevel} Risk
          </div>

          <!-- Enhanced Security Score Display -->
          <div class="confidence-indicator">
            <span>Keyed-Alike Risk Score: ${this._result.securityScore}/100</span>
            <div class="confidence-bar">
              <div class="confidence-fill" style="width: ${this._result.securityScore}%; background-color: ${this.getScoreColor(this._result.securityScore)}"></div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: var(--spacing-sm); color: var(--color-on-surface-variant);">
            ${this._result.riskMessage}
          </div>
        </div>

        <!-- Mathematical Analysis Section -->
        ${this.renderMathematicalAnalysis()}
        
        <!-- Bitting Pattern Visualization -->
        ${this.renderBittingPattern()}
        
        <!-- Enhanced Risk Factors -->
        ${this.renderEnhancedFactors()}
        
        <!-- Geographic Context -->
        ${this.renderGeographicContext()}

        <!-- Component Score Breakdown -->
        <div class="details-card">
          <div class="details-header">
            <h3 class="details-title">Risk Factor Analysis</h3>
            <button class="toggle-button" @click=${this.toggleComponentBreakdown}>
              ${this._showComponentBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
            </button>
          </div>

          ${this._showComponentBreakdown ? html`
            <div class="security-score-section">
              <div class="score-breakdown">
                <div class="score-item">
                  <div class="score-value" style="color: ${this.getScoreColor(this._result.componentScores.keyway)}">${this._result.componentScores.keyway}</div>
                  <div class="score-label">Keyspace</div>
                </div>
                <div class="score-item">
                  <div class="score-value" style="color: ${this.getScoreColor(this._result.componentScores.pinCount)}">${this._result.componentScores.pinCount}</div>
                  <div class="score-label">Bitting Pattern</div>
                </div>
                <div class="score-item">
                  <div class="score-value" style="color: ${this.getScoreColor(this._result.componentScores.lockType)}">${this._result.componentScores.lockType}</div>
                  <div class="score-label">Mass Production</div>
                </div>
                <div class="score-item">
                  <div class="score-value" style="color: ${this.getScoreColor(this._result.componentScores.vulnerabilities)}">${this._result.componentScores.vulnerabilities}</div>
                  <div class="score-label">Tolerance</div>
                </div>
                <div class="score-item">
                  <div class="score-value" style="color: ${this.getScoreColor(this._result.componentScores.confidence)}">${this._result.componentScores.confidence}</div>
                  <div class="score-label">Duplicate Risk</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Detailed Results -->
        <div class="details-card">
          <div class="details-header">
            <h3 class="details-title">Recommendations</h3>
            <button class="toggle-button" @click=${this.toggleDetails}>
              ${this._showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          ${this._showDetails ? html`
            <div class="details-content">
              <div class="info-section">
                <ul class="recommendation-list">
                  ${this._result.recommendations.map(rec => html`
                    <li class="recommendation-item">
                      <span class="item-icon">💡</span>
                      <span>${rec}</span>
                    </li>
                  `)}
                </ul>
              </div>

              <div class="processing-time">
                Analysis completed in ${this._result.processingTime}ms
                <br>
                Scanned on ${this.formatDate(this._result.timestamp)} at ${this.formatTime(this._result.timestamp)}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Action Buttons -->
        <div class="action-buttons">
          <button class="action-button primary" @click=${this.handleScanAgain}>
            📸 Scan Another
          </button>
          <button class="action-button secondary" @click=${this.handleSaveResult}>
            💾 Save Result
          </button>
          <button class="action-button secondary" @click=${this.handleShareResult}>
            📤 Share
          </button>
        </div>
      </div>

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }

  static styles = css`
    /* Mathematical Analysis Styles */
    .mathematical-analysis {
      margin-bottom: var(--spacing-lg);
      background: var(--color-surface-variant);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
      border-left: 4px solid var(--color-primary);
    }

    .mathematical-analysis h4 {
      margin-top: 0;
      color: var(--color-primary);
      font-size: var(--font-size-lg);
    }

    .analysis-details p {
      margin-bottom: var(--spacing-md);
      line-height: 1.5;
      color: var(--color-on-surface-variant);
    }

    .pattern-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-md);
      margin-bottom: var(--spacing-md);
    }

    .pattern-type,
    .duplication-estimate {
      padding: var(--spacing-sm);
      background: var(--color-surface);
      border-radius: var(--border-radius-md);
      font-size: var(--font-size-sm);
      text-align: center;
      border: 1px solid var(--color-outline-variant);
    }

    .duplicates-info {
      text-align: center;
      font-weight: var(--font-weight-medium);
      color: var(--color-secondary);
    }

    /* Bitting Pattern Visualization */
    .bitting-visualization {
      margin-bottom: var(--spacing-lg);
      background: var(--color-surface-variant);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
    }

    .bitting-visualization h5 {
      margin-top: 0;
      color: var(--color-secondary);
      font-size: var(--font-size-md);
    }

    .bitting-display {
      display: flex;
      justify-content: space-around;
      align-items: flex-end;
      height: 100px;
      background: var(--color-surface);
      border-radius: var(--border-radius-md);
      padding: var(--spacing-md);
      border: 1px solid var(--color-outline-variant);
    }

    .pin-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .pin-bar {
      min-height: 8px;
      width: 12px;
      border-radius: 2px;
      transition: all var(--transition-normal);
    }

    .pin-depth {
      font-size: var(--font-size-xs);
      font-weight: var(--font-weight-bold);
      color: var(--color-on-surface);
    }

    .pin-number {
      font-size: var(--font-size-xxs);
      color: var(--color-on-surface-variant);
    }

    /* Enhanced Risk Factors */
    .enhanced-factors {
      margin-bottom: var(--spacing-lg);
      background: var(--color-surface-variant);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
    }

    .enhanced-factors h4 {
      margin-top: 0;
      color: var(--color-tertiary);
      font-size: var(--font-size-lg);
    }

    .factor-grid {
      display: grid;
      gap: var(--spacing-md);
    }

    .factor-item {
      position: relative;
      padding: var(--spacing-md);
      background: var(--color-surface);
      border-radius: var(--border-radius-md);
      border: 1px solid var(--color-outline-variant);
    }

    .factor-label {
      display: block;
      font-size: var(--font-size-sm);
      color: var(--color-on-surface-variant);
      margin-bottom: var(--spacing-sm);
    }

    .factor-value {
      position: absolute;
      top: var(--spacing-md);
      right: var(--spacing-md);
      font-weight: var(--font-weight-bold);
      color: var(--color-on-surface);
      font-size: var(--font-size-md);
    }

    .factor-bar {
      height: 6px;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
      border-radius: 3px;
      transition: width var(--transition-slow);
      margin-top: var(--spacing-sm);
    }

    /* Geographic Context */
    .geographic-context {
      margin-bottom: var(--spacing-lg);
      background: var(--color-surface-variant);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius-lg);
      border-left: 4px solid var(--color-tertiary);
    }

    .geographic-context h5 {
      margin-top: 0;
      color: var(--color-tertiary);
      font-size: var(--font-size-md);
    }

    .geographic-context p {
      margin-bottom: var(--spacing-sm);
      color: var(--color-on-surface-variant);
      font-size: var(--font-size-sm);
      line-height: 1.4;
    }

    .geographic-context p:last-child {
      margin-bottom: 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .pattern-info {
        grid-template-columns: 1fr;
      }

      .bitting-display {
        height: 80px;
        padding: var(--spacing-sm);
      }

      .pin-bar {
        width: 10px;
      }

      .factor-grid {
        gap: var(--spacing-sm);
      }
    }

    /* Accessibility */
    .pin-display:focus,
    .factor-item:focus {
      outline: 2px solid var(--color-primary);
      outline-offset: 2px;
    }

    /* High contrast mode support */
    @media (prefers-contrast: high) {
      .mathematical-analysis,
      .bitting-visualization,
      .enhanced-factors,
      .geographic-context {
        border: 2px solid var(--color-on-surface);
      }

      .factor-bar {
        background: var(--color-on-surface);
      }
    }

    /* Reduced motion support */
    @media (prefers-reduced-motion: reduce) {
      .pin-bar,
      .factor-bar {
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'risk-display': RiskDisplay;
  }
}