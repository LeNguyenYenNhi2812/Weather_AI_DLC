// Unit BE-004: Forecast Service - Weather Forecasting
import axios from 'axios';
import { db } from '../db.js';
import { cacheService } from './CacheService.js';

export class ForecastService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cacheService = cacheService;
    this.CACHE_TTL = 60 * 60 * 1000; // 1 hour for forecast
  }

  /**
   * Get 5-day forecast (40 forecasts total, 3-hour intervals)
   */
  async getForecast(city, units = 'metric', language = 'en') {
    const cacheKey = `forecast:${city}:${units}`;

    try {
      // Check cache
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        return {
          ...cachedData.value,
          fromCache: true
        };
      }

      // Fetch from API
      const response = await axios.get(`${this.baseUrl}/forecast`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: units,
          lang: language
        }
      });

      const forecastData = this.normalizeForecastData(response.data, city, units);

      // Cache the data
      await this.cacheService.set(cacheKey, forecastData, this.CACHE_TTL);

      // Store in database
      await this.storeForecastInDatabase(city, forecastData);

      return {
        ...forecastData,
        fromCache: false,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Forecast fetch error:', error.message);
      throw new Error(`Failed to fetch forecast for ${city}: ${error.message}`);
    }
  }

  /**
   * Normalize OpenWeather forecast response
   */
  normalizeForecastData(apiData, city, units) {
    const forecasts = {};

    apiData.list.forEach(item => {
      const date = new Date(item.dt * 1000);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!forecasts[dateKey]) {
        forecasts[dateKey] = {
          date: dateKey,
          temps: [],
          conditions: [],
          humidity: [],
          windSpeeds: [],
          rainProbability: [],
          forecasts: []
        };
      }

      const forecast = {
        time: date.toISOString().split('T')[1].substring(0, 5), // HH:MM
        temperature: item.main.temp,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        feelsLike: item.main.feels_like,
        humidity: item.main.humidity,
        pressure: item.main.pressure,
        windSpeed: item.wind.speed,
        windDirection: item.wind.deg || null,
        cloudiness: item.clouds.all,
        condition: item.weather[0].main,
        description: item.weather[0].description,
        iconId: item.weather[0].icon,
        rainProbability: item.pop * 100,
        rainAmount: item.rain?.['3h'] || 0,
        visibility: item.visibility,
        timestamp: date.toISOString()
      };

      forecasts[dateKey].forecasts.push(forecast);
      forecasts[dateKey].temps.push(item.main.temp);
      forecasts[dateKey].humidity.push(item.main.humidity);
      forecasts[dateKey].windSpeeds.push(item.wind.speed);
      forecasts[dateKey].rainProbability.push(item.pop * 100);
      forecasts[dateKey].conditions.push(item.weather[0].main);
    });

    // Calculate daily aggregates
    const dailyForecasts = Object.entries(forecasts).map(([date, data]) => ({
      date,
      forecastTime: '12:00', // Noon forecast
      temperatureHigh: Math.max(...data.temps),
      temperatureLow: Math.min(...data.temps),
      temperatureAvg: Math.round(data.temps.reduce((a, b) => a + b) / data.temps.length),
      humidity: Math.round(data.humidity.reduce((a, b) => a + b) / data.humidity.length),
      windSpeed: Math.max(...data.windSpeeds),
      rainProbability: Math.max(...data.rainProbability),
      rainAmount: data.forecasts.reduce((sum, f) => sum + f.rainAmount, 0),
      condition: this.getMostLikelyCondition(data.conditions),
      detailedForecasts: data.forecasts // Keep 3-hourly breakdowns
    }));

    return {
      city,
      timezone: apiData.city.timezone,
      coordinates: {
        latitude: apiData.city.coord.lat,
        longitude: apiData.city.coord.lon
      },
      units,
      dailyForecasts
    };
  }

  /**
   * Get most likely weather condition for a day
   */
  getMostLikelyCondition(conditions) {
    const conditionCounts = {};

    conditions.forEach(cond => {
      conditionCounts[cond] = (conditionCounts[cond] || 0) + 1;
    });

    return Object.entries(conditionCounts)
      .sort(([, a], [, b]) => b - a)[0][0] || 'Unknown';
  }

  /**
   * Store forecast in database
   */
  async storeForecastInDatabase(city, forecastData) {
    try {
      for (const daily of forecastData.dailyForecasts) {
        await db.query(
          `INSERT INTO forecasts (
            city, forecast_date, forecast_time, temperature_high, temperature_low,
            temperature_avg, condition, humidity, wind_speed, rain_probability, rain_amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (city, forecast_date) DO UPDATE SET
          temperature_high = $4, temperature_low = $5, temperature_avg = $6,
          condition = $7, humidity = $8, wind_speed = $9,
          rain_probability = $10, rain_amount = $11, updated_at = CURRENT_TIMESTAMP`,
          [
            city,
            daily.date,
            daily.forecastTime,
            daily.temperatureHigh,
            daily.temperatureLow,
            daily.temperatureAvg,
            daily.condition,
            daily.humidity,
            daily.windSpeed,
            daily.rainProbability,
            daily.rainAmount
          ]
        );
      }
    } catch (error) {
      console.error('Database store error:', error);
    }
  }

  /**
   * Get upcoming alerts based on forecast
   */
  async getForecastAlerts(city, units = 'metric') {
    try {
      const forecast = await this.getForecast(city, units);
      const alerts = [];

      forecast.dailyForecasts.forEach(daily => {
        // Check for extreme temperatures
        if (daily.temperatureHigh > 35) {
          alerts.push({
            type: 'heat_forecast',
            date: daily.date,
            message: `High temperature expected: ${daily.temperatureHigh}°C`,
            severity: 'high'
          });
        }

        if (daily.temperatureLow < 0) {
          alerts.push({
            type: 'cold_forecast',
            date: daily.date,
            message: `Freezing temperature expected: ${daily.temperatureLow}°C`,
            severity: 'high'
          });
        }

        // Check for rain
        if (daily.rainProbability > 70) {
          alerts.push({
            type: 'rain_forecast',
            date: daily.date,
            message: `High chance of rain: ${daily.rainProbability}%`,
            severity: 'medium'
          });
        }

        // Check for strong wind
        if (daily.windSpeed > 30) {
          alerts.push({
            type: 'wind_forecast',
            date: daily.date,
            message: `Strong winds expected: ${daily.windSpeed} km/h`,
            severity: 'medium'
          });
        }
      });

      return alerts;
    } catch (error) {
      console.error('Forecast alerts error:', error);
      return [];
    }
  }

  /**
   * Clear forecast cache
   */
  async clearCache(city) {
    const cacheKey = `forecast:${city}:metric`;
    await this.cacheService.invalidate(cacheKey);
  }
}

export const forecastService = new ForecastService();
