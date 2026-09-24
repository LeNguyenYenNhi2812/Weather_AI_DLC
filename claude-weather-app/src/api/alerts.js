// Unit API-003: Alerts Endpoint
import express from 'express';
import { weatherService } from '../services/WeatherService.js';
import { alertService } from '../services/AlertService.js';
import { forecastService } from '../services/ForecastService.js';

const router = express.Router();

/**
 * GET /api/alerts?city=HoChiMinh&lang=vi
 * Returns current and forecast alerts for a city
 */
router.get('/', async(req, res) => {
  try {
    const { city, lang = 'en' } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    // Get current weather alerts
    const weather = await weatherService.getCurrentWeather(city, 'metric', lang);
    const currentAlerts = alertService.evaluateAlerts(weather, lang);

    // Get forecast alerts
    const forecastAlerts = await forecastService.getForecastAlerts(city, 'metric');

    // Format alerts
    const formattedCurrent = alertService.formatAlerts(currentAlerts, lang);
    const allAlerts = [
      ...formattedCurrent,
      ...forecastAlerts
    ];

    return res.json({
      success: true,
      alerts: {
        current: formattedCurrent,
        forecast: forecastAlerts,
        total: allAlerts.length
      },
      recommendations: alertService.getRecommendations(currentAlerts, lang),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Alerts endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch alerts'
    });
  }
});

/**
 * GET /api/alerts/severity?city=HoChiMinh&lang=vi
 * Returns alerts grouped by severity
 */
router.get('/severity', async(req, res) => {
  try {
    const { city, lang = 'en' } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    const weather = await weatherService.getCurrentWeather(city, 'metric', lang);
    const alerts = alertService.evaluateAlerts(weather, lang);

    const bySeverity = {
      high: alerts.filter(a => a.severity === 'high'),
      medium: alerts.filter(a => a.severity === 'medium'),
      low: alerts.filter(a => a.severity === 'low')
    };

    return res.json({
      success: true,
      alerts: bySeverity,
      hasHighSeverity: bySeverity.high.length > 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
