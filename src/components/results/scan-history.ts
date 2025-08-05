import { html, css, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';
import { scanStore } from '../../stores/scan-store';
import type { ScanResult, ScanFilters } from '../../types/scan-types';
import type { ScanStoreState } from '../../stores/scan-store';

@customElement('scan-history')
export class ScanHistory extends BaseComponent {
  @state() private scanState: ScanStoreState = scanStore.getState();
  @state() private filters: ScanFilters = {};
  @state() private showFilters = false;
  @state() private selectedScan: ScanResult | null = null;
  @state() private showExportMenu = false;
  @state() private sortBy: 'timestamp' | 'riskScore' | 'confidence' = 'timestamp';
  @state() private sortDirection: 'asc' | 'desc' = 'desc';
  
  private unsubscribe?: () => void;

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        padding: var(--spacing-md);
      }

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-lg);
      }

      .history-item {
        background-color: var(--color-surface);
        border-radius: var(--border-radius-md);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        border-left: 4px solid var(--color-primary);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .history-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .scan-info {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);
      }

      .scan-details h3 {
        margin: 0 0 var(--spacing-xs) 0;
        color: var(--color-on-surface);
      }

      .scan-details p {
        margin: 0;
        color: var(--color-on-surface-variant);
        font-size: var(--font-size-sm);
      }

      .risk-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-sm);
        font-size: var(--font-size-xs);
        font-weight: 600;
        text-transform: uppercase;
      }

      .risk-low {
        background-color: var(--color-success-container);
        color: var(--color-on-success-container);
      }

      .risk-medium {
        background-color: var(--color-warning-container);
        color: var(--color-on-warning-container);
      }

      .risk-high {
        background-color: var(--color-error-container);
        color: var(--color-on-error-container);
      }

      .scan-meta {
        display: flex;
        gap: var(--spacing-md);
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--color-on-surface-variant);
      }

      .loading-state {
        text-align: center;
        padding: var(--spacing-xl);
      }

      .error-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--color-error);
      }

      .statistics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
      }

      .stat-item {
        text-align: center;
      }

      .stat-value {
        font-size: var(--font-size-lg);
        font-weight: 600;
        color: var(--color-primary);
      }

      .stat-label {
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
        text-transform: uppercase;
      }

      /* Enhanced Analysis Display Styles */
      .filter-controls {
        display: flex;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-md);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
        flex-wrap: wrap;
        align-items: center;
      }

      .filter-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .filter-label {
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
        font-weight: var(--font-weight-medium);
      }

      .filter-select {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-sm);
        background-color: var(--color-surface);
        color: var(--color-on-surface);
        font-size: var(--font-size-sm);
      }

      .sort-controls {
        display: flex;
        gap: var(--spacing-sm);
        align-items: center;
        margin-left: auto;
      }

      .sort-button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-sm);
        background-color: var(--color-surface);
        color: var(--color-on-surface);
        cursor: pointer;
        font-size: var(--font-size-sm);
        transition: all var(--transition-fast);
      }

      .sort-button:hover {
        background-color: var(--color-surface-variant);
      }

      .sort-button.active {
        background-color: var(--color-primary);
        color: var(--color-primary-contrast);
      }

      .enhanced-scan-item {
        position: relative;
        background-color: var(--color-surface);
        border-radius: var(--border-radius-md);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-sm);
        border-left: 4px solid var(--color-primary);
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .enhanced-scan-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .enhanced-scan-item.risk-high {
        border-left-color: var(--color-error);
      }

      .enhanced-scan-item.risk-medium {
        border-left-color: var(--color-warning);
      }

      .enhanced-scan-item.risk-low {
        border-left-color: var(--color-success);
      }

      .scan-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: var(--spacing-sm);
      }

      .scan-title {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xs);
      }

      .scan-title h4 {
        margin: 0;
        color: var(--color-on-surface);
        font-size: var(--font-size-md);
      }

      .scan-subtitle {
        color: var(--color-on-surface-variant);
        font-size: var(--font-size-sm);
      }

      .scan-scores {
        display: flex;
        gap: var(--spacing-sm);
        align-items: center;
      }

      .score-chip {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--border-radius-full);
        font-size: var(--font-size-xs);
        font-weight: var(--font-weight-medium);
        background-color: var(--color-surface-variant);
        color: var(--color-on-surface);
      }

      .score-chip.security {
        background-color: var(--color-primary-container);
        color: var(--color-on-primary-container);
      }

      .score-chip.confidence {
        background-color: var(--color-secondary-container);
        color: var(--color-on-secondary-container);
      }

      .vulnerability-preview {
        margin-top: var(--spacing-sm);
        padding: var(--spacing-sm);
        background-color: rgba(244, 67, 54, 0.1);
        border-radius: var(--border-radius-sm);
        border: 1px solid rgba(244, 67, 54, 0.2);
      }

      .vulnerability-count {
        font-size: var(--font-size-xs);
        color: var(--color-error);
        font-weight: var(--font-weight-medium);
      }

      .keyed-alike-indicator {
        margin-top: var(--spacing-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        background-color: rgba(255, 152, 0, 0.1);
        border-radius: var(--border-radius-sm);
        border: 1px solid rgba(255, 152, 0, 0.3);
        font-size: var(--font-size-xs);
        color: #ff9800;
        font-weight: var(--font-weight-medium);
      }

      .enhanced-scan-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: var(--spacing-sm);
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--color-outline-variant);
      }

      .meta-info {
        display: flex;
        gap: var(--spacing-md);
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-xs);
      }

      .action-button {
        padding: var(--spacing-xs) var(--spacing-sm);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-sm);
        background-color: var(--color-surface);
        color: var(--color-on-surface);
        cursor: pointer;
        font-size: var(--font-size-xs);
        transition: all var(--transition-fast);
      }

      .action-button:hover {
        background-color: var(--color-surface-variant);
      }

      .action-button.delete {
        border-color: var(--color-error);
        color: var(--color-error);
      }

      .action-button.delete:hover {
        background-color: var(--color-error);
        color: var(--color-on-error);
      }

      .export-menu {
        position: relative;
        display: inline-block;
      }

      .export-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background-color: var(--color-surface);
        border: 1px solid var(--color-outline);
        border-radius: var(--border-radius-md);
        box-shadow: var(--shadow-md);
        z-index: 1000;
        min-width: 150px;
        margin-top: var(--spacing-xs);
      }

      .export-option {
        padding: var(--spacing-sm);
        cursor: pointer;
        font-size: var(--font-size-sm);
        color: var(--color-on-surface);
        transition: background-color var(--transition-fast);
      }

      .export-option:hover {
        background-color: var(--color-surface-variant);
      }

      .export-option:first-child {
        border-radius: var(--border-radius-md) var(--border-radius-md) 0 0;
      }

      .export-option:last-child {
        border-radius: 0 0 var(--border-radius-md) var(--border-radius-md);
      }

      .enhanced-statistics {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        padding: var(--spacing-md);
        background-color: var(--color-surface-variant);
        border-radius: var(--border-radius-md);
      }

      .enhanced-stat-item {
        text-align: center;
        padding: var(--spacing-sm);
        background-color: var(--color-surface);
        border-radius: var(--border-radius-sm);
      }

      .stat-trend {
        font-size: var(--font-size-xs);
        margin-top: var(--spacing-xs);
        color: var(--color-on-surface-variant);
      }

      .stat-trend.up {
        color: var(--color-success);
      }

      .stat-trend.down {
        color: var(--color-error);
      }
    `
  ];

  connectedCallback() {
    super.connectedCallback();
    this.unsubscribe = scanStore.subscribe((state) => {
      this.scanState = state;
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private async handleClearAll() {
    if (confirm('Are you sure you want to clear all scan history? This action cannot be undone.')) {
      try {
        await scanStore.clearHistory();
      } catch (error) {
        console.error('Failed to clear history:', error);
        // Could show a toast notification here
      }
    }
  }

  private toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private handleFilterChange(type: keyof ScanFilters, value: any): void {
    this.filters = {
      ...this.filters,
      [type]: value === 'all' ? undefined : value
    };
  }

  private handleSortChange(field: 'timestamp' | 'riskScore' | 'confidence'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'desc';
    }
  }

  private getFilteredAndSortedScans(): ScanResult[] {
    let filtered = [...this.scanState.scanHistory];

    // Apply filters
    if (this.filters.riskLevel && this.filters.riskLevel.length > 0) {
      filtered = filtered.filter(scan =>
        this.filters.riskLevel!.includes(scan.riskAssessment.level)
      );
    }

    if (this.filters.lockType && this.filters.lockType.length > 0) {
      filtered = filtered.filter(scan =>
        this.filters.lockType!.includes(scan.prediction.lockType)
      );
    }

    if (this.filters.keyway && this.filters.keyway.length > 0) {
      filtered = filtered.filter(scan =>
        this.filters.keyway!.includes(scan.prediction.keyway)
      );
    }

    if (this.filters.minConfidence) {
      filtered = filtered.filter(scan =>
        scan.prediction.confidence >= this.filters.minConfidence!
      );
    }

    if (this.filters.dateRange) {
      filtered = filtered.filter(scan =>
        scan.timestamp >= this.filters.dateRange!.start &&
        scan.timestamp <= this.filters.dateRange!.end
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.sortBy) {
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'riskScore':
          aValue = a.riskAssessment.score;
          bValue = b.riskAssessment.score;
          break;
        case 'confidence':
          aValue = a.prediction.confidence;
          bValue = b.prediction.confidence;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }

      if (this.sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }

  private toggleExportMenu(): void {
    this.showExportMenu = !this.showExportMenu;
  }

  private async exportData(format: 'json' | 'csv' | 'pdf'): Promise<void> {
    this.showExportMenu = false;
    
    try {
      const filteredScans = this.getFilteredAndSortedScans();
      
      switch (format) {
        case 'json':
          await this.exportAsJSON(filteredScans);
          break;
        case 'csv':
          await this.exportAsCSV(filteredScans);
          break;
        case 'pdf':
          await this.exportAsPDF(filteredScans);
          break;
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  }

  private async exportAsJSON(scans: ScanResult[]): Promise<void> {
    const data = {
      exportDate: new Date().toISOString(),
      totalScans: scans.length,
      scans: scans.map(scan => ({
        id: scan.id,
        timestamp: scan.timestamp,
        keyway: scan.prediction.keyway,
        lockType: scan.prediction.lockType,
        confidence: scan.prediction.confidence,
        riskLevel: scan.riskAssessment.level,
        riskScore: scan.riskAssessment.score,
        vulnerabilities: scan.riskAssessment.vulnerabilities,
        recommendations: scan.riskAssessment.recommendations.map(r => r.description),
        location: scan.location,
        encrypted: scan.encrypted
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keylike-scan-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async exportAsCSV(scans: ScanResult[]): Promise<void> {
    const headers = [
      'Date',
      'Keyway',
      'Lock Type',
      'Confidence',
      'Risk Level',
      'Risk Score',
      'Vulnerabilities',
      'Location',
      'Encrypted'
    ];

    const rows = scans.map(scan => [
      new Date(scan.timestamp).toLocaleDateString(),
      scan.prediction.keyway,
      scan.prediction.lockType,
      (scan.prediction.confidence * 100).toFixed(1) + '%',
      scan.riskAssessment.level,
      scan.riskAssessment.score,
      scan.riskAssessment.vulnerabilities.join('; '),
      scan.location.city || scan.location.geohash.substring(0, 5),
      scan.encrypted ? 'Yes' : 'No'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keylike-scan-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async exportAsPDF(scans: ScanResult[]): Promise<void> {
    // This would require a PDF library like jsPDF
    // For now, we'll just show a message
    alert('PDF export functionality requires additional library integration');
  }

  private async handleDeleteScan(scanId: string) {
    if (confirm('Are you sure you want to delete this scan?')) {
      try {
        await scanStore.deleteScanResult(scanId);
      } catch (error) {
        console.error('Failed to delete scan:', error);
        // Could show a toast notification here
      }
    }
  }

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private formatLocation(geohash: string): string {
    // Truncate geohash for privacy display
    return geohash.substring(0, 5) + '...';
  }

  private renderEnhancedStatistics() {
    const { statistics } = this.scanState;
    const filteredScans = this.getFilteredAndSortedScans();
    
    // Calculate enhanced statistics
    const highRiskScans = filteredScans.filter(s => s.riskAssessment.level === 'high').length;
    const mediumRiskScans = filteredScans.filter(s => s.riskAssessment.level === 'medium').length;
    const lowRiskScans = filteredScans.filter(s => s.riskAssessment.level === 'low').length;
    const avgConfidence = filteredScans.length > 0 ?
      filteredScans.reduce((sum, s) => sum + s.prediction.confidence, 0) / filteredScans.length : 0;
    
    return html`
      <div class="enhanced-statistics">
        <div class="enhanced-stat-item">
          <div class="stat-value">${filteredScans.length}</div>
          <div class="stat-label">Total Scans</div>
          <div class="stat-trend">of ${statistics.totalScans} total</div>
        </div>
        <div class="enhanced-stat-item">
          <div class="stat-value">${(avgConfidence * 100).toFixed(1)}%</div>
          <div class="stat-label">Avg Confidence</div>
          <div class="stat-trend">AI accuracy</div>
        </div>
        <div class="enhanced-stat-item">
          <div class="stat-value">${highRiskScans}</div>
          <div class="stat-label">High Risk</div>
          <div class="stat-trend ${highRiskScans > 0 ? 'up' : ''}">vulnerabilities</div>
        </div>
        <div class="enhanced-stat-item">
          <div class="stat-value">${mediumRiskScans}</div>
          <div class="stat-label">Medium Risk</div>
          <div class="stat-trend">moderate</div>
        </div>
        <div class="enhanced-stat-item">
          <div class="stat-value">${lowRiskScans}</div>
          <div class="stat-label">Low Risk</div>
          <div class="stat-trend ${lowRiskScans > 0 ? 'down' : ''}">secure</div>
        </div>
        <div class="enhanced-stat-item">
          <div class="stat-value">${statistics.mostCommonKeyway || 'N/A'}</div>
          <div class="stat-label">Common Keyway</div>
          <div class="stat-trend">most frequent</div>
        </div>
      </div>
    `;
  }

  private renderFilterControls() {
    return html`
      <div class="filter-controls">
        <div class="filter-group">
          <label class="filter-label">Risk Level</label>
          <select
            class="filter-select"
            @change=${(e: any) => this.handleFilterChange('riskLevel', e.target.value)}
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Lock Type</label>
          <select
            class="filter-select"
            @change=${(e: any) => this.handleFilterChange('lockType', e.target.value)}
          >
            <option value="all">All</option>
            <option value="deadbolt">Deadbolt</option>
            <option value="knob">Knob</option>
            <option value="lever">Lever</option>
            <option value="padlock">Padlock</option>
          </select>
        </div>

        <div class="filter-group">
          <label class="filter-label">Keyway</label>
          <select
            class="filter-select"
            @change=${(e: any) => this.handleFilterChange('keyway', e.target.value)}
          >
            <option value="all">All</option>
            <option value="schlage">Schlage</option>
            <option value="kwikset">Kwikset</option>
            <option value="yale">Yale</option>
            <option value="medeco">Medeco</option>
          </select>
        </div>

        <div class="sort-controls">
          <label class="filter-label">Sort by</label>
          <button
            class="sort-button ${this.sortBy === 'timestamp' ? 'active' : ''}"
            @click=${() => this.handleSortChange('timestamp')}
          >
            Date ${this.sortBy === 'timestamp' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            class="sort-button ${this.sortBy === 'riskScore' ? 'active' : ''}"
            @click=${() => this.handleSortChange('riskScore')}
          >
            Risk ${this.sortBy === 'riskScore' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            class="sort-button ${this.sortBy === 'confidence' ? 'active' : ''}"
            @click=${() => this.handleSortChange('confidence')}
          >
            Confidence ${this.sortBy === 'confidence' ? (this.sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
        </div>
      </div>
    `;
  }

  private renderEnhancedScanItem(scan: ScanResult) {
    const vulnerabilityCount = scan.riskAssessment.vulnerabilities.length;
    const keyedAlikeRisk = scan.riskAssessment.vulnerabilities.some(v =>
      v.toLowerCase().includes('keyed') || v.toLowerCase().includes('alike')
    );

    return html`
      <div class="enhanced-scan-item risk-${scan.riskAssessment.level}"
           @click=${() => this.handleScanClick(scan)}>
        <div class="scan-header">
          <div class="scan-title">
            <h4>${scan.prediction.lockType} - ${scan.prediction.keyway}</h4>
            <div class="scan-subtitle">
              ${this.formatDate(scan.timestamp)} • ${scan.location.city || this.formatLocation(scan.location.geohash)}
            </div>
          </div>
          <div class="scan-scores">
            <div class="score-chip security">
              Risk: ${scan.riskAssessment.score}/100
            </div>
            <div class="score-chip confidence">
              ${(scan.prediction.confidence * 100).toFixed(1)}% confident
            </div>
            <div class="risk-badge risk-${scan.riskAssessment.level}">
              ${scan.riskAssessment.level} risk
            </div>
          </div>
        </div>

        ${vulnerabilityCount > 0 ? html`
          <div class="vulnerability-preview">
            <div class="vulnerability-count">
              ${vulnerabilityCount} vulnerabilit${vulnerabilityCount === 1 ? 'y' : 'ies'} detected
            </div>
            <div class="vulnerability-list">
              ${scan.riskAssessment.vulnerabilities.slice(0, 3).map(vuln => html`
                <div class="vulnerability-item">• ${vuln}</div>
              `)}
              ${vulnerabilityCount > 3 ? html`
                <div class="vulnerability-item">... and ${vulnerabilityCount - 3} more</div>
              ` : ''}
            </div>
          </div>
        ` : ''}

        ${keyedAlikeRisk ? html`
          <div class="keyed-alike-indicator">
            ⚠️ Keyed-alike vulnerability detected
          </div>
        ` : ''}

        <div class="enhanced-scan-meta">
          <div class="meta-info">
            <span>🔒 ${scan.encrypted ? 'Encrypted' : 'Plain'}</span>
            <span>📊 ${scan.riskAssessment.recommendations.length} recommendations</span>
            <span>🎯 ${scan.prediction.alternatives?.length || 0} alternatives</span>
          </div>
          <div class="action-buttons">
            <button
              class="action-button"
              @click=${(e: Event) => this.handleViewDetails(e, scan)}
            >
              View Details
            </button>
            <button
              class="action-button delete"
              @click=${(e: Event) => this.handleDeleteClick(e, scan.id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private renderExportMenu() {
    return html`
      <div class="export-menu">
        <button
          class="btn btn-outline"
          @click=${this.toggleExportMenu}
        >
          Export Data
        </button>
        ${this.showExportMenu ? html`
          <div class="export-dropdown">
            <div class="export-option" @click=${() => this.exportData('json')}>
              Export as JSON
            </div>
            <div class="export-option" @click=${() => this.exportData('csv')}>
              Export as CSV
            </div>
            <div class="export-option" @click=${() => this.exportData('pdf')}>
              Export as PDF
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  private renderStatistics() {
    const { statistics } = this.scanState;
    
    return html`
      <div class="statistics">
        <div class="stat-item">
          <div class="stat-value">${statistics.totalScans}</div>
          <div class="stat-label">Total Scans</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${statistics.averageRiskScore.toFixed(1)}</div>
          <div class="stat-label">Avg Risk Score</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${statistics.mostCommonKeyway || 'N/A'}</div>
          <div class="stat-label">Common Keyway</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${statistics.scansThisWeek}</div>
          <div class="stat-label">This Week</div>
        </div>
      </div>
    `;
  }

  private renderScanItem(scan: ScanResult) {
    return html`
      <div class="history-item" @click=${() => this.handleScanClick(scan)}>
        <div class="scan-info">
          <div class="scan-details">
            <h3>${scan.prediction.lockType} - ${scan.prediction.keyway}</h3>
            <p>Confidence: ${(scan.prediction.confidence * 100).toFixed(1)}%</p>
          </div>
          <div class="risk-badge risk-${scan.riskAssessment.level}">
            ${scan.riskAssessment.level} risk
          </div>
        </div>
        <div class="scan-meta">
          <span>📅 ${this.formatDate(scan.timestamp)}</span>
          <span>📍 ${this.formatLocation(scan.location.geohash)}</span>
          <span>🔒 ${scan.encrypted ? 'Encrypted' : 'Plain'}</span>
          <button
            class="btn btn-sm btn-outline"
            @click=${(e: Event) => this.handleDeleteClick(e, scan.id)}
          >
            Delete
          </button>
        </div>
      </div>
    `;
  }

  private handleScanClick(scan: ScanResult) {
    // Navigate to scan details or show modal
    console.log('Scan clicked:', scan);
    // Could dispatch custom event or navigate to details page
  }

  private handleDeleteClick(e: Event, scanId: string) {
    e.stopPropagation();
    this.handleDeleteScan(scanId);
  }

  private handleViewDetails(e: Event, scan: ScanResult) {
    e.stopPropagation();
    this.selectedScan = scan;
    // Could open a modal or navigate to details page
    console.log('View details for scan:', scan);
  }

  render() {
    const { scanHistory, loading, error, statistics } = this.scanState;
    const filteredScans = this.getFilteredAndSortedScans();

    return html`
      <div class="history-header">
        <h2>Scan History</h2>
        <div style="display: flex; gap: var(--spacing-sm); align-items: center;">
          <button
            class="btn btn-outline"
            @click=${this.toggleFilters}
            ?disabled=${loading || scanHistory.length === 0}
          >
            ${this.showFilters ? 'Hide' : 'Show'} Filters
          </button>
          ${this.renderExportMenu()}
          <button
            class="btn btn-outline"
            @click=${this.handleClearAll}
            ?disabled=${loading || scanHistory.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      ${loading ? html`
        <div class="loading-state">
          <p>Loading scan history...</p>
        </div>
      ` : ''}

      ${error ? html`
        <div class="error-state">
          <p>Error loading scan history: ${error}</p>
        </div>
      ` : ''}

      ${!loading && !error && scanHistory.length > 0 ? html`
        ${this.renderEnhancedStatistics()}
        
        ${this.showFilters ? this.renderFilterControls() : ''}
        
        <div class="scan-list">
          ${filteredScans.length > 0 ? html`
            ${filteredScans.map(scan => this.renderEnhancedScanItem(scan))}
          ` : html`
            <div class="empty-state">
              <p>No scans match the current filters.</p>
              <button class="btn btn-outline" @click=${() => this.filters = {}}>
                Clear Filters
              </button>
            </div>
          `}
        </div>
      ` : ''}

      ${!loading && !error && scanHistory.length === 0 ? html`
        <div class="empty-state">
          <p>No scans yet. Start by scanning your first lock!</p>
          <button class="btn btn-primary" @click=${() => window.history.pushState({}, '', '/scan')}>
            Start Scanning
          </button>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'scan-history': ScanHistory;
  }
}