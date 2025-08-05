import { html, css, CSSResultGroup } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from '../common/base-component';

interface LocationData {
  state: string;
  zipcode: string;
}

interface ValidationErrors {
  state?: string;
  zipcode?: string;
}

@customElement('location-collection')
export class LocationCollection extends BaseComponent {
  @state()
  private _locationData: LocationData = {
    state: '',
    zipcode: ''
  };

  @state()
  private _validationErrors: ValidationErrors = {};

  @state()
  private _isValid = false;

  @state()
  private _isSubmitting = false;

  // US States list for validation
  private readonly US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  /**
   * Validate US zipcode format (5 digits)
   */
  private isValidZipcode(zipcode: string): boolean {
    return /^\d{5}$/.test(zipcode);
  }

  static styles: CSSResultGroup = [
    BaseComponent.styles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: var(--spacing-xl);
        background: linear-gradient(135deg, var(--color-primary-container) 0%, var(--color-secondary-container) 100%);
      }

      .collection-container {
        background: var(--color-surface);
        border-radius: var(--border-radius-xl);
        padding: var(--spacing-xl);
        box-shadow: var(--shadow-xl);
        width: 100%;
        max-width: 400px;
        text-align: center;
      }

      .icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-lg);
        color: var(--color-primary);
      }

      .title {
        font-size: var(--font-size-xxl);
        font-weight: var(--font-weight-bold);
        color: var(--color-on-surface);
        margin-bottom: var(--spacing-md);
      }

      .subtitle {
        font-size: var(--font-size-md);
        color: var(--color-on-surface-variant);
        margin-bottom: var(--spacing-xl);
        line-height: 1.5;
      }

      .form-group {
        margin-bottom: var(--spacing-lg);
        text-align: left;
      }

      .form-label {
        display: block;
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-on-surface);
        margin-bottom: var(--spacing-sm);
      }

      .form-input, .form-select {
        width: 100%;
        padding: var(--spacing-md);
        border: 2px solid var(--color-outline-variant);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-md);
        background: var(--color-surface);
        color: var(--color-on-surface);
        transition: border-color var(--transition-fast);
        box-sizing: border-box;
      }

      .form-input:focus, .form-select:focus {
        outline: none;
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.2);
      }

      .form-input.error, .form-select.error {
        border-color: var(--color-error);
      }

      .form-input.valid, .form-select.valid {
        border-color: var(--color-success);
      }

      .error-message {
        display: block;
        font-size: var(--font-size-xs);
        color: var(--color-error);
        margin-top: var(--spacing-xs);
        font-weight: var(--font-weight-medium);
      }

      .success-indicator {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--font-size-xs);
        color: var(--color-success);
        margin-top: var(--spacing-xs);
        font-weight: var(--font-weight-medium);
      }

      .start-button {
        width: 100%;
        background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
        color: var(--color-primary-contrast);
        padding: var(--spacing-md) var(--spacing-lg);
        border-radius: var(--border-radius-lg);
        border: none;
        font-size: var(--font-size-lg);
        font-weight: var(--font-weight-semibold);
        cursor: pointer;
        transition: all var(--transition-fast);
        margin-top: var(--spacing-lg);
        position: relative;
        overflow: hidden;
      }

      .start-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      .start-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        background: var(--color-outline-variant);
        color: var(--color-on-surface-variant);
        transform: none;
        box-shadow: none;
      }

      .start-button.loading {
        cursor: not-allowed;
      }

      .start-button.loading::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid transparent;
        border-top: 2px solid currentColor;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .privacy-note {
        font-size: var(--font-size-xs);
        color: var(--color-on-surface-variant);
        margin-top: var(--spacing-md);
        line-height: 1.4;
        opacity: 0.8;
      }

      .validation-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        border-radius: var(--border-radius-md);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-medium);
        opacity: 0;
        transform: translateY(10px);
        transition: all var(--transition-normal);
      }

      .validation-status.show {
        opacity: 1;
        transform: translateY(0);
      }

      .validation-status.valid {
        background: rgba(var(--color-success-rgb), 0.1);
        color: var(--color-success);
        border: 1px solid rgba(var(--color-success-rgb), 0.3);
      }

      .validation-status.invalid {
        background: rgba(var(--color-error-rgb), 0.1);
        color: var(--color-error);
        border: 1px solid rgba(var(--color-error-rgb), 0.3);
      }

      @media (max-width: 768px) {
        :host {
          padding: var(--spacing-lg);
        }

        .collection-container {
          padding: var(--spacing-lg);
        }

        .title {
          font-size: var(--font-size-xl);
        }
      }
    `
  ];

  connectedCallback(): void {
    super.connectedCallback();
    console.log('📍 Location collection component initialized');
  }

  private handleStateChange(event: Event): void {
    const input = event.target as HTMLSelectElement;
    this._locationData = {
      ...this._locationData,
      state: input.value
    };
    this.validateForm();
  }

  private handleZipcodeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, ''); // Only allow digits
    if (value.length > 5) {
      value = value.substring(0, 5); // Limit to 5 digits
    }
    
    this._locationData = {
      ...this._locationData,
      zipcode: value
    };
    
    // Update the input value to reflect the cleaned value
    input.value = value;
    
    this.validateForm();
  }

  private validateForm(): void {
    const errors: ValidationErrors = {};
    
    // Validate state
    if (!this._locationData.state) {
      errors.state = 'Please select your state';
    } else if (!this.US_STATES.includes(this._locationData.state)) {
      errors.state = 'Please select a valid US state';
    }

    // Validate zipcode
    if (!this._locationData.zipcode) {
      errors.zipcode = 'Please enter your zipcode';
    } else if (!this.isValidZipcode(this._locationData.zipcode)) {
      errors.zipcode = 'Please enter a valid 5-digit US zipcode';
    }

    this._validationErrors = errors;
    this._isValid = Object.keys(errors).length === 0;

    console.log('🔍 Form validation:', {
      data: this._locationData,
      errors,
      isValid: this._isValid
    });
  }

  private async handleStartScanning(): Promise<void> {
    if (!this._isValid || this._isSubmitting) {
      return;
    }

    this._isSubmitting = true;

    try {
      console.log('📍 Starting scanning with location data:', this._locationData);
      
      // Store location data for use by camera scanner
      await this.storeLocationData();
      
      // Navigate to camera scanner
      const { navigationService } = await import('../../services/navigation-service.js');
      await navigationService.navigate('/scan', {
        data: {
          locationData: this._locationData
        }
      });

    } catch (error) {
      console.error('❌ Failed to start scanning:', error);
      this.error = 'Failed to start scanning. Please try again.';
    } finally {
      this._isSubmitting = false;
    }
  }

  private async storeLocationData(): Promise<void> {
    try {
      // Store in localStorage for immediate use
      localStorage.setItem('keylike_location_data', JSON.stringify(this._locationData));
      
      // Also store in preferences for persistence
      const { Preferences } = await import('@capacitor/preferences');
      await Preferences.set({
        key: 'location_data',
        value: JSON.stringify(this._locationData)
      });
      
      console.log('✅ Location data stored successfully');
    } catch (error) {
      console.warn('⚠️ Failed to store location data:', error);
      // Don't throw - this shouldn't block the scanning flow
    }
  }

  private renderStateOptions() {
    return this.US_STATES.map(state => html`
      <option value="${state}" ?selected=${this._locationData.state === state}>
        ${state}
      </option>
    `);
  }

  private getFieldClassName(field: keyof ValidationErrors): string {
    if (this._validationErrors[field]) {
      return 'error';
    }
    if (this._locationData[field] && !this._validationErrors[field]) {
      return 'valid';
    }
    return '';
  }

  render() {
    return html`
      <div class="collection-container">
        <div class="icon">📍</div>
        <h1 class="title">Location Setup</h1>
        <p class="subtitle">
          We need your location to provide accurate security analysis based on regional lock patterns.
        </p>

        <form @submit=${(e: Event) => e.preventDefault()}>
          <div class="form-group">
            <label class="form-label" for="state">State *</label>
            <select
              id="state"
              class="form-select ${this.getFieldClassName('state')}"
              @change=${this.handleStateChange}
              .value=${this._locationData.state}
            >
              <option value="">Select your state...</option>
              ${this.renderStateOptions()}
            </select>
            ${this._validationErrors.state ? html`
              <span class="error-message">${this._validationErrors.state}</span>
            ` : ''}
            ${this._locationData.state && !this._validationErrors.state ? html`
              <span class="success-indicator">
                <span>✓</span>
                <span>Valid state selected</span>
              </span>
            ` : ''}
          </div>

          <div class="form-group">
            <label class="form-label" for="zipcode">ZIP Code *</label>
            <input
              id="zipcode"
              type="text"
              class="form-input ${this.getFieldClassName('zipcode')}"
              placeholder="Enter 5-digit ZIP code"
              inputmode="numeric"
              maxlength="5"
              @input=${this.handleZipcodeChange}
              .value=${this._locationData.zipcode}
            />
            ${this._validationErrors.zipcode ? html`
              <span class="error-message">${this._validationErrors.zipcode}</span>
            ` : ''}
            ${this._locationData.zipcode && !this._validationErrors.zipcode ? html`
              <span class="success-indicator">
                <span>✓</span>
                <span>Valid ZIP code format</span>
              </span>
            ` : ''}
          </div>

          <div class="validation-status ${this._isValid ? 'valid show' : this._locationData.state || this._locationData.zipcode ? 'invalid show' : ''}">
            ${this._isValid ? html`
              <span>✓</span>
              <span>Ready to start scanning!</span>
            ` : html`
              <span>!</span>
              <span>Please complete all required fields</span>
            `}
          </div>

          <button
            type="button"
            class="start-button ${this._isSubmitting ? 'loading' : ''}"
            ?disabled=${!this._isValid || this._isSubmitting}
            @click=${this.handleStartScanning}
          >
            ${this._isSubmitting ? '' : 'Start Scanning'}
          </button>
        </form>

        <div class="privacy-note">
          <strong>Privacy Protected:</strong> Your location is used only for analysis and stored locally on your device.
        </div>
      </div>

      ${this.renderLoadingOverlay()}
      ${this.renderError()}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'location-collection': LocationCollection;
  }
}