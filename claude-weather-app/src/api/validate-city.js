// Unit API-005: City Validation Endpoint
import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/validate-city?q=ho%20chi%20minh
 * Validates city name and returns suggestions
 */
router.get('/', async(req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'Query must be at least 2 characters',
        suggestions: []
      });
    }

    // Use OpenWeather Geocoding API
    const response = await axios.get('https://api.openweathermap.org/geo/1.0/direct', {
      params: {
        q: q,
        limit: 10,
        appid: process.env.OPENWEATHER_API_KEY
      }
    });

    if (response.data.length === 0) {
      return res.json({
        success: true,
        found: false,
        suggestions: [],
        query: q
      });
    }

    const suggestions = response.data.map(item => ({
      name: item.name,
      country: item.country,
      state: item.state || null,
      latitude: item.lat,
      longitude: item.lon,
      displayName: `${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`,
      id: `${item.name}:${item.country}:${item.lat}:${item.lon}`
    }));

    return res.json({
      success: true,
      found: suggestions.length > 0,
      suggestions,
      query: q,
      count: suggestions.length
    });
  } catch (error) {
    console.error('City validation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to validate city',
      suggestions: []
    });
  }
});

/**
 * POST /api/validate-city/bulk
 * Validates multiple city names at once
 */
router.post('/bulk', async(req, res) => {
  try {
    const { cities } = req.body;

    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        error: 'cities array is required'
      });
    }

    const results = await Promise.allSettled(
      cities.map(city =>
        axios.get('https://api.openweathermap.org/geo/1.0/direct', {
          params: {
            q: city,
            limit: 1,
            appid: process.env.OPENWEATHER_API_KEY
          }
        })
      )
    );

    const validated = results.map((result, index) => {
      if (result.status === 'rejected') {
        return {
          query: cities[index],
          valid: false,
          error: result.reason.message
        };
      }

      const data = result.value.data[0];
      return {
        query: cities[index],
        valid: !!data,
        city: data ? {
          name: data.name,
          country: data.country,
          coordinates: {
            latitude: data.lat,
            longitude: data.lon
          },
          displayName: `${data.name}, ${data.country}`
        } : null
      };
    });

    const validCount = validated.filter(v => v.valid).length;

    return res.json({
      success: true,
      results: validated,
      summary: {
        total: cities.length,
        valid: validCount,
        invalid: cities.length - validCount
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * GET /api/validate-city/coordinates?lat=10.776889&lon=106.700981
 * Reverse geocoding - get city name from coordinates
 */
router.get('/coordinates', async(req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({
        error: 'lat and lon parameters are required'
      });
    }

    const response = await axios.get('https://api.openweathermap.org/geo/1.0/reverse', {
      params: {
        lat: parseFloat(lat),
        lon: parseFloat(lon),
        limit: 1,
        appid: process.env.OPENWEATHER_API_KEY
      }
    });

    if (!response.data || response.data.length === 0) {
      return res.json({
        success: true,
        found: false,
        coordinates: { lat, lon }
      });
    }

    const data = response.data[0];
    return res.json({
      success: true,
      found: true,
      city: {
        name: data.name,
        country: data.country,
        state: data.state || null,
        displayName: `${data.name}${data.state ? ', ' + data.state : ''}, ${data.country}`,
        coordinates: {
          latitude: data.lat,
          longitude: data.lon
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
