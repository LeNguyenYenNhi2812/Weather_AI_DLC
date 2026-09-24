// Unit API-006: User Preferences Endpoint
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET /api/preferences/:userId
 * Get user preferences
 */
router.get('/:userId', async(req, res) => {
  try {
    const { userId } = req.params;

    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default preferences
      const defaults = {
        user_id: userId,
        language: 'en',
        temperature_unit: 'C',
        wind_unit: 'kmh',
        theme: 'light',
        favorite_cities: [],
        notification_enabled: true
      };

      await db.query(
        `INSERT INTO user_preferences (user_id, language, temperature_unit, wind_unit, theme, favorite_cities)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, defaults.language, defaults.temperature_unit, defaults.wind_unit, defaults.theme, defaults.favorite_cities]
      );

      return res.json({
        success: true,
        preferences: defaults,
        new: true
      });
    }

    const prefs = result.rows[0];
    return res.json({
      success: true,
      preferences: {
        userId: prefs.user_id,
        language: prefs.language,
        temperatureUnit: prefs.temperature_unit,
        windUnit: prefs.wind_unit,
        theme: prefs.theme,
        favoriteCities: prefs.favorite_cities || [],
        notificationEnabled: prefs.notification_enabled,
        alerts: {
          cold: prefs.alert_cold,
          heat: prefs.alert_heat,
          wind: prefs.alert_wind,
          humidity: prefs.alert_humidity
        }
      }
    });
  } catch (error) {
    console.error('Preferences fetch error:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * PUT /api/preferences/:userId
 * Update user preferences
 */
router.put('/:userId', async(req, res) => {
  try {
    const { userId } = req.params;
    const {
      language,
      temperatureUnit,
      windUnit,
      theme,
      notificationEnabled,
      alerts
    } = req.body;

    const result = await db.query(
      `UPDATE user_preferences SET
        language = COALESCE($1, language),
        temperature_unit = COALESCE($2, temperature_unit),
        wind_unit = COALESCE($3, wind_unit),
        theme = COALESCE($4, theme),
        notification_enabled = COALESCE($5, notification_enabled),
        alert_cold = COALESCE($6, alert_cold),
        alert_heat = COALESCE($7, alert_heat),
        alert_wind = COALESCE($8, alert_wind),
        alert_humidity = COALESCE($9, alert_humidity),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $10
       RETURNING *`,
      [
        language,
        temperatureUnit,
        windUnit,
        theme,
        notificationEnabled,
        alerts?.cold,
        alerts?.heat,
        alerts?.wind,
        alerts?.humidity,
        userId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    const prefs = result.rows[0];
    return res.json({
      success: true,
      preferences: {
        userId: prefs.user_id,
        language: prefs.language,
        temperatureUnit: prefs.temperature_unit,
        windUnit: prefs.wind_unit,
        theme: prefs.theme,
        notificationEnabled: prefs.notification_enabled,
        alerts: {
          cold: prefs.alert_cold,
          heat: prefs.alert_heat,
          wind: prefs.alert_wind,
          humidity: prefs.alert_humidity
        }
      }
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * POST /api/preferences/:userId/favorite-cities
 * Add favorite city
 */
router.post('/:userId/favorite-cities', async(req, res) => {
  try {
    const { userId } = req.params;
    const { city } = req.body;

    if (!city) {
      return res.status(400).json({
        error: 'City is required'
      });
    }

    const result = await db.query(
      `UPDATE user_preferences SET
        favorite_cities = array_append(favorite_cities, $1),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING favorite_cities`,
      [city, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    return res.json({
      success: true,
      favoriteCities: result.rows[0].favorite_cities
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

/**
 * DELETE /api/preferences/:userId/favorite-cities/:city
 * Remove favorite city
 */
router.delete('/:userId/favorite-cities/:city', async(req, res) => {
  try {
    const { userId, city } = req.params;

    const result = await db.query(
      `UPDATE user_preferences SET
        favorite_cities = array_remove(favorite_cities, $1),
        updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING favorite_cities`,
      [city, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'User preferences not found'
      });
    }

    return res.json({
      success: true,
      favoriteCities: result.rows[0].favorite_cities
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
