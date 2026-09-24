// Unit API-001: Weather Endpoint
import express from 'express';
import { weatherService } from '../services/WeatherService.js';
import { alertService } from '../services/AlertService.js';

const router = express.Router();

/**
 * GET /api/weather?city=HoChiMinh&units=metric&lang=vi
 * Returns current weather for a city
 */
router.get('/', async(req, res) => {
  try {
    const { city, units = 'metric', lang = 'en' } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    // Fetch weather
    const weather = await weatherService.getCurrentWeather(city, units, lang);

    // Evaluate alerts
    const alerts = alertService.evaluateAlerts(weather, lang);

    return res.json({
      success: true,
      weather,
      alerts,
      timestamp: new Date().toISOString(),
      cacheInfo: {
        source: weather.cache.source,
        age: weather.cache.age,
        fresh: weather.cache.fresh
      }
    });
  } catch (error) {
    console.error('Weather endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch weather'
    });
  }
});

/**
 * GET /api/weather/multiple?cities=HoChiMinh,Hanoi&units=metric
 * Returns weather for multiple cities
 */
router.get('/multiple', async(req, res) => {
  try {
    const { cities, units = 'metric' } = req.query;

    if (!cities) {
      return res.status(400).json({
        error: 'cities parameter is required (comma-separated)'
      });
    }

    const cityList = cities.split(',').map(c => c.trim());
    const results = await weatherService.getWeatherMultiple(cityList, units);

    return res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/weather/cache-stats
 * Returns cache statistics
 */
router.get('/cache-stats', (req, res) => {
  try {
    const stats = weatherService.getCacheStats();
    return res.json({
      success: true,
      stats
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
