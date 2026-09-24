// Unit BE-003: Alert Service - Weather Alerts & Thresholds
export class AlertService {
  constructor() {
    this.ALERT_CONFIG = {
      cold: {
        threshold: 0,
        icon: '🥶',
        message_en: 'Extreme Cold',
        message_vi: 'Lạnh Cực Độ',
        recommendation_en: 'Stay indoors, wear warm clothing, avoid prolonged exposure',
        recommendation_vi: 'Ở trong nhà, mặc quần áo ấm, tránh tiếp xúc lâu dài',
        severity: 'high'
      },
      heat: {
        threshold: 35,
        icon: '🔥',
        message_en: 'Extreme Heat',
        message_vi: 'Nóng Cực Độ',
        recommendation_en: 'Stay hydrated, seek air conditioning, limit outdoor activities',
        recommendation_vi: 'Uống nước đầy đủ, tìm nơi có điều hòa, hạn chế hoạt động ngoài trời',
        severity: 'high'
      },
      wind: {
        threshold: 30,
        icon: '💨',
        message_en: 'Strong Winds',
        message_vi: 'Gió Mạnh',
        recommendation_en: 'Secure loose items, avoid tall structures, be careful outdoors',
        recommendation_vi: 'Cố định đồ vật lỏng lẻo, tránh các cấu trúc cao, thận trọng ngoài trời',
        severity: 'medium'
      },
      humidity: {
        threshold: 80,
        icon: '💧',
        message_en: 'High Humidity',
        message_vi: 'Độ Ẩm Cao',
        recommendation_en: 'Use air conditioning, avoid strenuous activities, stay hydrated',
        recommendation_vi: 'Sử dụng điều hòa, tránh hoạt động nặng, uống nước đầy đủ',
        severity: 'low'
      },
      rain: {
        threshold: 60,
        icon: '🌧️',
        message_en: 'Heavy Rain Expected',
        message_vi: 'Mưa Lớn Dự Kiến',
        recommendation_en: 'Bring umbrella, avoid driving if possible, watch for flooding',
        recommendation_vi: 'Mang ô, tránh lái xe nếu có thể, chú ý đến lũ lụt',
        severity: 'medium'
      }
    };
  }

  /**
   * Evaluate all applicable alerts for given weather
   */
  evaluateAlerts(weather, language = 'en') {
    const alerts = [];

    // Cold alert
    if (weather.temperature < this.ALERT_CONFIG.cold.threshold) {
      alerts.push(this.createAlert('cold', weather, language));
    }

    // Heat alert
    if (weather.temperature > this.ALERT_CONFIG.heat.threshold) {
      alerts.push(this.createAlert('heat', weather, language));
    }

    // Wind alert
    if (weather.windSpeed > this.ALERT_CONFIG.wind.threshold) {
      alerts.push(this.createAlert('wind', weather, language));
    }

    // Humidity alert
    if (weather.humidity > this.ALERT_CONFIG.humidity.threshold) {
      alerts.push(this.createAlert('humidity', weather, language));
    }

    // Rain alert
    if (weather.rainProbability > this.ALERT_CONFIG.rain.threshold) {
      alerts.push(this.createAlert('rain', weather, language));
    }

    return alerts;
  }

  /**
   * Create individual alert object
   */
  createAlert(type, weather, language = 'en') {
    const config = this.ALERT_CONFIG[type];
    const messageKey = `message_${language}`;
    const recommendationKey = `recommendation_${language}`;

    return {
      type,
      icon: config.icon,
      title: config[messageKey] || config.message_en,
      message: config[recommendationKey] || config.recommendation_en,
      severity: config.severity,
      currentValue: this.getCurrentValue(type, weather),
      threshold: config.threshold,
      timestamp: new Date().toISOString(),
      language
    };
  }

  /**
   * Get the current value for alert type
   */
  getCurrentValue(type, weather) {
    const valueMap = {
      cold: `${weather.temperature}°C`,
      heat: `${weather.temperature}°C`,
      wind: `${weather.windSpeed} km/h`,
      humidity: `${weather.humidity}%`,
      rain: `${weather.rainProbability}%`
    };

    return valueMap[type] || 'N/A';
  }

  /**
   * Get alert severity level based on how much threshold is exceeded
   */
  calculateSeverityLevel(type, weather) {
    const config = this.ALERT_CONFIG[type];
    let excess = 0;

    switch (type) {
    case 'cold':
      excess = Math.abs(weather.temperature - config.threshold);
      break;
    case 'heat':
      excess = weather.temperature - config.threshold;
      break;
    case 'wind':
      excess = weather.windSpeed - config.threshold;
      break;
    case 'humidity':
      excess = weather.humidity - config.threshold;
      break;
    case 'rain':
      excess = weather.rainProbability - config.threshold;
      break;
    }

    // Determine severity based on excess amount
    if (excess < 5) {return 'low';}
    if (excess < 15) {return 'medium';}
    return 'high';
  }

  /**
   * Check if alert should be triggered (considering threshold and delta)
   */
  shouldTriggerAlert(type, currentValue, lastValue) {
    const config = this.ALERT_CONFIG[type];

    // Basic threshold check
    const thresholdExceeded = currentValue > config.threshold;

    // Also check if value is increasing toward critical
    if (lastValue) {
      const delta = currentValue - lastValue;
      const approachingCritical = delta > 2; // 2 unit increase is significant

      return thresholdExceeded || approachingCritical;
    }

    return thresholdExceeded;
  }

  /**
   * Get recommended actions for alerts
   */
  getRecommendations(alerts, _language = 'en') {
    return alerts.map(alert => ({
      type: alert.type,
      action: alert.message,
      priority: alert.severity === 'high' ? 1 : alert.severity === 'medium' ? 2 : 3
    })).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Format alerts for display
   */
  formatAlerts(alerts, _language = 'en') {
    return alerts.map(alert => ({
      id: `${alert.type}_${alert.timestamp}`,
      icon: alert.icon,
      title: alert.title,
      description: alert.message,
      severity: alert.severity,
      value: alert.currentValue,
      threshold: alert.threshold,
      actionable: true
    }));
  }
}

export const alertService = new AlertService();
