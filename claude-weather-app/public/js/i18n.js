// Unit SW-002: Internationalization (i18n) System

class I18n {
  constructor() {
    this.locale = localStorage.getItem('locale') || 'en';
    this.messages = {};
    this.translations = {
      en: {
        'app.title': 'Weather App',
        'search.title': 'Search Weather',
        'search.placeholder': 'Enter city name...',
        'search.button': 'Search',
        'weather.temperature': 'Temperature',
        'weather.feelsLike': 'Feels Like',
        'weather.humidity': 'Humidity',
        'weather.windSpeed': 'Wind Speed',
        'weather.pressure': 'Pressure',
        'weather.visibility': 'Visibility',
        'weather.sunrise': 'Sunrise',
        'weather.sunset': 'Sunset',
        'alerts.title': '🚨 Active Alerts',
        'forecast.title': '📅 5-Day Forecast',
        'history.title': '📊 7-Day History',
        'favorites.title': '⭐ Favorite Cities',
        'favorites.add': '+ Add',
        'offline.label': 'Offline',
        'offline.message': 'You are offline',
        'offline.description': 'Using cached data',
        'footer.credit': 'Weather data powered by OpenWeatherMap'
      },
      vi: {
        'app.title': 'Ứng Dụng Thời Tiết',
        'search.title': 'Tìm Kiếm Thời Tiết',
        'search.placeholder': 'Nhập tên thành phố...',
        'search.button': 'Tìm Kiếm',
        'weather.temperature': 'Nhiệt Độ',
        'weather.feelsLike': 'Cảm Giác Như',
        'weather.humidity': 'Độ Ẩm',
        'weather.windSpeed': 'Tốc Độ Gió',
        'weather.pressure': 'Áp Suất',
        'weather.visibility': 'Tầm Nhìn',
        'weather.sunrise': 'Mặt Trời Mọc',
        'weather.sunset': 'Mặt Trời Lặn',
        'alerts.title': '🚨 Cảnh Báo Hoạt Động',
        'forecast.title': '📅 Dự Báo 5 Ngày',
        'history.title': '📊 Lịch Sử 7 Ngày',
        'favorites.title': '⭐ Thành Phố Yêu Thích',
        'favorites.add': '+ Thêm',
        'offline.label': 'Ngoại Tuyến',
        'offline.message': 'Bạn đang ngoại tuyến',
        'offline.description': 'Đang sử dụng dữ liệu được lưu',
        'footer.credit': 'Dữ liệu thời tiết được cấp bởi OpenWeatherMap'
      }
    };

    this.init();
  }

  async init() {
    this.messages = this.translations[this.locale] || this.translations.en;
    this.updateDOM();
    this.setupLanguageSwitcher();
  }

  /**
   * Translate a key with optional parameters
   */
  t(key, params = {}) {
    let value = this.messages[key] || key;

    // Replace parameters if provided
    Object.keys(params).forEach(param => {
      value = value.replace(`{{${param}}}`, params[param]);
    });

    return value;
  }

  /**
   * Change language
   */
  setLocale(locale) {
    if (this.translations[locale]) {
      this.locale = locale;
      this.messages = this.translations[locale];
      localStorage.setItem('locale', locale);
      this.updateDOM();

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('locale-changed', { detail: { locale } }));
    }
  }

  /**
   * Get current locale
   */
  getLocale() {
    return this.locale;
  }

  /**
   * Update all DOM elements with data-i18n attribute
   */
  updateDOM() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.dataset.i18n;
      element.textContent = this.t(key);
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.dataset.i18nPlaceholder;
      element.placeholder = this.t(key);
    });

    // Update titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.dataset.i18nTitle;
      element.title = this.t(key);
    });

    // Update document lang attribute
    document.documentElement.lang = this.locale;
    document.documentElement.dir = this.locale === 'ar' ? 'rtl' : 'ltr';

    // Update language display
    this.updateLanguageDisplay();
  }

  /**
   * Setup language switcher
   */
  setupLanguageSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (switcher) {
      switcher.addEventListener('click', () => {
        const newLocale = this.locale === 'en' ? 'vi' : 'en';
        this.setLocale(newLocale);
      });
    }
  }

  /**
   * Update language display text
   */
  updateLanguageDisplay() {
    const display = document.getElementById('lang-display');
    const alt = document.getElementById('lang-alt');

    if (display && alt) {
      if (this.locale === 'en') {
        display.textContent = 'EN';
        alt.textContent = 'VI';
      } else {
        display.textContent = 'VI';
        alt.textContent = 'EN';
      }
    }
  }

  /**
   * Format date based on locale
   */
  formatDate(date, options = {}) {
    const locale = this.locale === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(new Date(date));
  }

  /**
   * Format time based on locale
   */
  formatTime(date, options = {}) {
    const locale = this.locale === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(new Date(date));
  }

  /**
   * Format number based on locale
   */
  formatNumber(number, options = {}) {
    const locale = this.locale === 'vi' ? 'vi-VN' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  }
}

// Initialize i18n globally
const i18n = new I18n();

// Make it available globally
window.i18n = i18n;
