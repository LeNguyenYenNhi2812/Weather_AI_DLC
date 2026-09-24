// Unit FE-004: API Client

class APIClient {
  constructor(baseURL = '/api') {
    this.baseURL = baseURL;
    this.timeout = 10000;
    this.retries = 3;
  }

  /**
   * Make HTTP request with retry and error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    let lastError;
    for (let attempt = 0; attempt < this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }

        // Wait before retry
        if (attempt < this.retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Get current weather
   */
  async getWeather(city, units = 'metric', lang = 'en') {
    return this.request('/weather', {
      method: 'GET',
      headers: {
        'Accept-Language': lang
      },
      urlParams: { city, units, lang }
    }).then(res => {
      // Note: URL params need to be added manually in fetch
      const params = new URLSearchParams({ city, units, lang });
      return fetch(`${this.baseURL}/weather?${params}`).then(r => r.json());
    });
  }

  /**
   * Get forecast
   */
  async getForecast(city, units = 'metric', lang = 'en') {
    const params = new URLSearchParams({ city, units, lang });
    return this.request(`/forecast?${params}`);
  }

  /**
   * Get alerts
   */
  async getAlerts(city, lang = 'en') {
    const params = new URLSearchParams({ city, lang });
    return this.request(`/alerts?${params}`);
  }

  /**
   * Get weather history
   */
  async getHistory(city, days = 7) {
    const params = new URLSearchParams({ city, days });
    return this.request(`/history?${params}`);
  }

  /**
   * Get aggregate history
   */
  async getHistoryAggregate(city, period = 'daily', days = 30) {
    const params = new URLSearchParams({ city, period, days });
    return this.request(`/history/aggregate?${params}`);
  }

  /**
   * Validate city name
   */
  async validateCity(query) {
    const params = new URLSearchParams({ q: query });
    return this.request(`/validate-city?${params}`);
  }

  /**
   * Validate multiple cities
   */
  async validateCitiesBulk(cities) {
    return this.request('/validate-city/bulk', {
      method: 'POST',
      body: JSON.stringify({ cities })
    });
  }

  /**
   * Get city from coordinates (reverse geocoding)
   */
  async getCityFromCoordinates(lat, lon) {
    const params = new URLSearchParams({ lat, lon });
    return this.request(`/validate-city/coordinates?${params}`);
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId) {
    return this.request(`/preferences/${userId}`);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId, preferences) {
    return this.request(`/preferences/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(preferences)
    });
  }

  /**
   * Add favorite city
   */
  async addFavoriteCity(userId, city) {
    return this.request(`/preferences/${userId}/favorite-cities`, {
      method: 'POST',
      body: JSON.stringify({ city })
    });
  }

  /**
   * Remove favorite city
   */
  async removeFavoriteCity(userId, city) {
    return this.request(`/preferences/${userId}/favorite-cities/${city}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get health status
   */
  async getHealth() {
    return fetch('/health').then(r => r.json());
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return this.request('/weather/cache-stats');
  }
}

// Initialize API client globally
const api = new APIClient();
window.api = api;
