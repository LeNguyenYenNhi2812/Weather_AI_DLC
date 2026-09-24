// Unit FE-005: Main Application Logic

class WeatherApp {
  constructor() {
    this.currentCity = null;
    this.currentWeather = null;
    this.chart = null;
    this.userId = this.generateUserId();
    this.preferences = null;
    this.debounceTimer = null;
    this.isOnline = navigator.onLine;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    this.setupEventListeners();
    this.setupOnlineOfflineDetection();
    this.setupThemeToggle();
    this.registerServiceWorker();

    // Load user preferences
    await this.loadPreferences();

    // Load initial city or use browser geolocation
    this.loadInitialLocation();
  }

  /**
   * Generate or get user ID
   */
  generateUserId() {
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');

    if (cityInput) {
      cityInput.addEventListener('input', (e) => this.handleCityInput(e));
      cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.searchWeather(e.target.value);
        }
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        this.searchWeather(cityInput.value);
      });
    }

    // Listen for locale changes
    window.addEventListener('locale-changed', () => {
      if (this.currentWeather) {
        this.displayWeather(this.currentWeather);
      }
    });
  }

  /**
   * Setup online/offline detection
   */
  setupOnlineOfflineDetection() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      const badge = document.getElementById('offline-badge');
      const banner = document.getElementById('offline-banner');
      badge?.classList.add('d-none');
      banner?.classList.add('d-none');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      const badge = document.getElementById('offline-badge');
      const banner = document.getElementById('offline-banner');
      badge?.classList.remove('d-none');
      banner?.classList.remove('d-none');
    });
  }

  /**
   * Setup theme toggle
   */
  setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'light' ? '🌙' : '☀️';

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'light' ? '🌙' : '☀️';
      });
    }
  }

  /**
   * Register Service Worker for offline support
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registered:', registration);
      } catch (error) {
        console.log('⚠️ Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Handle city input with debouncing
   */
  async handleCityInput(e) {
    const query = e.target.value.trim();

    clearTimeout(this.debounceTimer);

    if (query.length < 2) {
      document.getElementById('search-suggestions')?.classList.add('d-none');
      return;
    }

    this.debounceTimer = setTimeout(async () => {
      try {
        const result = await api.validateCity(query);
        this.showSearchSuggestions(result.suggestions);
      } catch (error) {
        console.error('Search error:', error);
      }
    }, 300);
  }

  /**
   * Show search suggestions
   */
  showSearchSuggestions(suggestions) {
    const container = document.getElementById('search-suggestions');
    if (!container) return;

    if (suggestions.length === 0) {
      container.classList.add('d-none');
      return;
    }

    container.innerHTML = suggestions
      .slice(0, 5)
      .map(suggestion => `
        <div class="search-suggestion" onclick="app.selectCity('${suggestion.name}')">
          <strong>${suggestion.name}</strong>
          <span class="text-muted">${suggestion.country}</span>
        </div>
      `)
      .join('');

    container.classList.remove('d-none');
  }

  /**
   * Select city from suggestions
   */
  selectCity(city) {
    document.getElementById('city-input').value = city;
    document.getElementById('search-suggestions').classList.add('d-none');
    this.searchWeather(city);
  }

  /**
   * Search weather for a city
   */
  async searchWeather(city) {
    if (!city.trim()) return;

    try {
      this.showLoading(true);

      const lang = i18n.getLocale();
      const result = await api.request(`/weather?city=${encodeURIComponent(city)}&lang=${lang}`);

      if (result.success) {
        this.currentCity = city;
        this.currentWeather = result.weather;
        this.displayWeather(result.weather, result.alerts);

        // Load additional data
        this.loadForecast(city);
        this.loadHistory(city);
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      this.showError(error.message);
    } finally {
      this.showLoading(false);
    }
  }

  /**
   * Display weather information
   */
  displayWeather(weather, alerts = []) {
    const section = document.getElementById('current-weather-section');
    if (!section) return;

    // Update city name
    document.getElementById('city-name').textContent =
      `${weather.city}${weather.country ? ', ' + weather.country : ''}`;

    // Update weather description
    document.getElementById('weather-description').textContent = weather.description;

    // Update temperature
    document.getElementById('current-temp').textContent =
      `${Math.round(weather.temperature)}°${this.getTemperatureUnit()}`;
    document.getElementById('feels-like').textContent =
      `${Math.round(weather.feelsLike)}°${this.getTemperatureUnit()}`;

    // Update humidity
    document.getElementById('humidity').textContent = `${weather.humidity}%`;

    // Update wind speed
    document.getElementById('wind-speed').textContent =
      `${weather.windSpeed.toFixed(1)} ${this.getWindUnit()}`;

    // Update other details
    document.getElementById('pressure').textContent = `${weather.pressure} hPa`;
    document.getElementById('visibility').textContent =
      `${(weather.visibility / 1000).toFixed(1)} km`;
    document.getElementById('sunrise').textContent =
      i18n.formatTime(weather.sunrise);
    document.getElementById('sunset').textContent =
      i18n.formatTime(weather.sunset);

    // Update weather icon
    this.updateWeatherIcon(weather.iconId);

    // Update last updated time
    document.getElementById('last-updated').textContent =
      `Updated: ${i18n.formatTime(new Date())}`;

    // Show section
    section.style.display = 'block';

    // Display alerts
    if (alerts && alerts.length > 0) {
      this.displayAlerts(alerts);
    } else {
      const alertsCard = document.getElementById('alerts-card');
      if (alertsCard) alertsCard.style.display = 'none';
    }

    // Add to favorites option
    this.updateFavoritesUI();
  }

  /**
   * Update weather icon based on icon ID
   */
  updateWeatherIcon(iconId) {
    const iconMap = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };

    const icon = iconMap[iconId] || '🌦️';
    const iconDiv = document.getElementById('weather-icon');
    if (iconDiv) {
      iconDiv.innerHTML = `<div class="display-4">${icon}</div>`;
    }
  }

  /**
   * Display alerts
   */
  displayAlerts(alerts) {
    const alertsCard = document.getElementById('alerts-card');
    const alertsList = document.getElementById('alerts-list');

    if (!alertsCard || !alertsList) return;

    if (alerts.length === 0) {
      alertsCard.style.display = 'none';
      return;
    }

    alertsList.innerHTML = alerts
      .map(alert => `
        <div class="alert-item ${alert.severity || 'low'}">
          <span class="alert-icon">${alert.icon}</span>
          <div>
            <strong>${alert.title}</strong>
            <p class="mb-0 small mt-1">${alert.message}</p>
          </div>
        </div>
      `)
      .join('');

    alertsCard.style.display = 'block';
  }

  /**
   * Load forecast
   */
  async loadForecast(city) {
    try {
      const lang = i18n.getLocale();
      const result = await api.request(`/forecast?city=${encodeURIComponent(city)}&lang=${lang}`);

      if (result.success && result.forecast.dailyForecasts) {
        this.displayForecast(result.forecast.dailyForecasts);
      }
    } catch (error) {
      console.error('Forecast error:', error);
    }
  }

  /**
   * Display forecast
   */
  displayForecast(dailyForecasts) {
    const section = document.getElementById('forecast-section');
    const container = document.getElementById('forecast-container');

    if (!section || !container) return;

    container.innerHTML = dailyForecasts
      .slice(0, 5)
      .map(day => `
        <div class="col-12 col-sm-6 col-lg-2">
          <div class="forecast-day">
            <div class="small text-muted">${i18n.formatDate(day.date)}</div>
            <div class="forecast-icon">${this.getIconForCondition(day.condition)}</div>
            <div class="forecast-temp">
              ${Math.round(day.temperatureHigh)}° / ${Math.round(day.temperatureLow)}°
            </div>
            <div class="forecast-desc">${day.condition}</div>
            <div class="small mt-2">💧 ${Math.round(day.rainProbability)}%</div>
          </div>
        </div>
      `)
      .join('');

    section.style.display = 'block';
  }

  /**
   * Get icon for weather condition
   */
  getIconForCondition(condition) {
    const iconMap = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Drizzle': '🌦️',
      'Thunderstorm': '⛈️',
      'Snow': '❄️',
      'Mist': '🌫️'
    };

    return iconMap[condition] || '🌦️';
  }

  /**
   * Load weather history
   */
  async loadHistory(city) {
    try {
      const result = await api.request(`/history?city=${encodeURIComponent(city)}&days=7`);

      if (result.success && result.data) {
        this.displayHistory(result.data);
      }
    } catch (error) {
      console.error('History error:', error);
    }
  }

  /**
   * Display history chart
   */
  displayHistory(historyData) {
    const section = document.getElementById('history-section');
    const canvas = document.getElementById('history-canvas');

    if (!section || !canvas) return;

    // Prepare data
    const labels = historyData.map(d =>
      i18n.formatDate(d.date, { month: 'short', day: 'numeric' })
    );
    const temps = historyData.map(d => d.temperature);
    const humidity = historyData.map(d => d.humidity);

    // Destroy old chart if exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Create new chart
    const ctx = canvas.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels.reverse(),
        datasets: [
          {
            label: i18n.t('weather.temperature'),
            data: temps.reverse(),
            borderColor: '#ff6384',
            backgroundColor: 'rgba(255, 99, 132, 0.1)',
            yAxisID: 'y',
            tension: 0.4
          },
          {
            label: i18n.t('weather.humidity'),
            data: humidity.reverse(),
            borderColor: '#36a2eb',
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: '°C'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: '%'
            },
            grid: {
              drawOnChartArea: false
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        }
      }
    });

    section.style.display = 'block';
  }

  /**
   * Load initial location
   */
  async loadInitialLocation() {
    // Try to get last viewed city
    const lastCity = localStorage.getItem('lastCity');
    if (lastCity) {
      this.searchWeather(lastCity);
      return;
    }

    // Try geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const cityResult = await api.request(
              `/validate-city/coordinates?lat=${latitude}&lon=${longitude}`
            );
            if (cityResult.found) {
              this.searchWeather(cityResult.city.name);
            }
          } catch (error) {
            console.log('Geolocation error:', error);
          }
        }
      );
    }
  }

  /**
   * Load user preferences
   */
  async loadPreferences() {
    try {
      const result = await api.request(`/preferences/${this.userId}`);
      this.preferences = result.preferences;
    } catch (error) {
      console.log('Preferences load error:', error);
    }
  }

  /**
   * Get temperature unit from preferences
   */
  getTemperatureUnit() {
    return this.preferences?.temperatureUnit || 'C';
  }

  /**
   * Get wind unit from preferences
   */
  getWindUnit() {
    return this.preferences?.windUnit === 'ms' ? 'm/s' : 'km/h';
  }

  /**
   * Update favorites UI
   */
  updateFavoritesUI() {
    localStorage.setItem('lastCity', this.currentCity);
  }

  /**
   * Show loading indicator
   */
  showLoading(show) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    console.error('Error:', message);
    alert(`Error: ${message}`);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WeatherApp();
});
