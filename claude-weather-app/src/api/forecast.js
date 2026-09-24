// Unit API-002: Forecast Endpoint
import express from 'express';
import { forecastService } from '../services/ForecastService.js';

const router = express.Router();

/**
 * GET /api/forecast?city=HoChiMinh&units=metric&lang=vi
 * Returns 5-day forecast for a city
 */
router.get('/', async(req, res) => {
  try {
    const { city, units = 'metric', lang = 'en' } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    const forecast = await forecastService.getForecast(city, units, lang);

    return res.json({
      success: true,
      forecast,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Forecast endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch forecast'
    });
  }
});

/**
 * GET /api/forecast/alerts?city=HoChiMinh&units=metric
 * Returns forecast-based alerts
 */
router.get('/alerts', async(req, res) => {
  try {
    const { city, units = 'metric' } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    const alerts = await forecastService.getForecastAlerts(city, units);

    return res.json({
      success: true,
      alerts,
      count: alerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
