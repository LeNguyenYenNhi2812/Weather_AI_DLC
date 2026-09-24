// Unit API-004: History Endpoint
import express from 'express';
import { db } from '../db.js';

const router = express.Router();

/**
 * GET /api/history?city=HoChiMinh&days=7
 * Returns weather history for a city
 */
router.get('/', async(req, res) => {
  try {
    const { city, days = 7 } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    const daysInt = Math.min(parseInt(days) || 7, 90); // Max 90 days

    const result = await db.query(
      `SELECT
        city, temperature, feels_like, humidity, pressure,
        wind_speed, wind_direction, condition, description,
        rain_probability, rain_amount, cloudiness,
        sunrise, sunset, created_at, updated_at
       FROM weather_readings
       WHERE city = $1
       AND created_at >= NOW() - INTERVAL '${daysInt} days'
       ORDER BY created_at DESC`,
      [city]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: `No history found for ${city}`
      });
    }

    // Calculate statistics
    const temps = result.rows.map(r => r.temperature);
    const humidity = result.rows.map(r => r.humidity);
    const windSpeeds = result.rows.map(r => r.wind_speed);

    const stats = {
      tempAvg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      tempMin: Math.min(...temps).toFixed(1),
      tempMax: Math.max(...temps).toFixed(1),
      humidityAvg: (humidity.reduce((a, b) => a + b, 0) / humidity.length).toFixed(0),
      windAvg: (windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length).toFixed(1),
      windMax: Math.max(...windSpeeds).toFixed(1),
      recordCount: result.rows.length
    };

    return res.json({
      success: true,
      city,
      period: `${daysInt} days`,
      statistics: stats,
      data: result.rows.map(row => ({
        date: row.created_at.toISOString().split('T')[0],
        time: row.created_at.toISOString().split('T')[1],
        temperature: parseFloat(row.temperature),
        feelsLike: parseFloat(row.feels_like),
        humidity: row.humidity,
        pressure: row.pressure,
        windSpeed: parseFloat(row.wind_speed),
        condition: row.condition,
        description: row.description,
        rainAmount: parseFloat(row.rain_amount),
        cloudiness: row.cloudiness
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('History endpoint error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to fetch history'
    });
  }
});

/**
 * GET /api/history/aggregate?city=HoChiMinh&period=daily
 * Returns aggregated history (daily, weekly, monthly)
 */
router.get('/aggregate', async(req, res) => {
  try {
    const { city, period = 'daily', days = 30 } = req.query;

    if (!city) {
      return res.status(400).json({
        error: 'City parameter is required'
      });
    }

    let groupBy;
    switch (period) {
    case 'hourly':
      groupBy = "DATE_TRUNC('hour', created_at)";
      break;
    case 'daily':
      groupBy = "DATE_TRUNC('day', created_at)";
      break;
    case 'weekly':
      groupBy = "DATE_TRUNC('week', created_at)";
      break;
    case 'monthly':
      groupBy = "DATE_TRUNC('month', created_at)";
      break;
    default:
      groupBy = "DATE_TRUNC('day', created_at)";
    }

    const result = await db.query(
      `SELECT
        ${groupBy} AS period,
        AVG(temperature) AS temp_avg,
        MIN(temperature) AS temp_min,
        MAX(temperature) AS temp_max,
        AVG(humidity) AS humidity_avg,
        AVG(wind_speed) AS wind_avg,
        MAX(wind_speed) AS wind_max,
        SUM(rain_amount) AS rain_total,
        MODE() WITHIN GROUP (ORDER BY condition) AS condition
       FROM weather_readings
       WHERE city = $1
       AND created_at >= NOW() - INTERVAL '${parseInt(days) || 30} days'
       GROUP BY ${groupBy}
       ORDER BY period DESC`,
      [city]
    );

    return res.json({
      success: true,
      city,
      period,
      granularity: period,
      data: result.rows.map(row => ({
        period: row.period.toISOString(),
        temperature: {
          avg: parseFloat(row.temp_avg).toFixed(1),
          min: parseFloat(row.temp_min).toFixed(1),
          max: parseFloat(row.temp_max).toFixed(1)
        },
        humidity: {
          avg: parseFloat(row.humidity_avg).toFixed(0)
        },
        wind: {
          avg: parseFloat(row.wind_avg).toFixed(1),
          max: parseFloat(row.wind_max).toFixed(1)
        },
        rain: {
          total: parseFloat(row.rain_total || 0).toFixed(1)
        },
        condition: row.condition
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Aggregate endpoint error:', error);
    return res.status(500).json({
      error: error.message
    });
  }
});

export default router;
