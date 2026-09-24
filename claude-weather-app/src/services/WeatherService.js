// Unit BE-002: Weather Service - Weather Data Fetching & Caching
import axios from 'axios';
import { db } from '../db.js';
import { cacheService } from './CacheService.js';

export class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.cacheService = cacheService;
    this.CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    this.FRESH_THRESHOLD = 60 * 1000; // 1 minute for "fresh" data
  }

  /**
   * Get current weather for a city with multi-layer caching
   */
  async getCurrentWeather(city, units = 'metric', language = 'en') {
    const cacheKey = `weather:${city}:${units}`;

    try {
      // Check cache first
      const cachedData = await this.cacheService.get(cacheKey);
      if (cachedData) {
        const ageMs = Date.now() - (cachedData.value.timestamp || 0);
        return {
          ...cachedData.value,
          cache: {
            source: cachedData.source,
            age: Math.floor(ageMs / 1000),
            fresh: ageMs < this.FRESH_THRESHOLD
          }
        };
      }

      // Fetch from external API
      const response = await axios.get(`${this.baseUrl}/weather`, {
        params: {
          q: city,
          appid: this.apiKey,
          units: units,
          lang: language
        }
      });

      const weatherData = this.normalizeWeatherData(response.data, units);
      weatherData.timestamp = Date.now();

      // Store in multi-layer cache
      await this.cacheService.set(cacheKey, weatherData, this.CACHE_TTL);

      // Store in database
      await this.storeWeatherInDatabase(weatherData);

      return {
        ...weatherData,
        cache: {
          source: 'api',
          age: 0,
          fresh: true
        }
      };
    } catch (error) {
      console.error('Weather fetch error:', error.message);

      // Try to get stale data as fallback
      const staleData = await this.cacheService.get(cacheKey);
      if (staleData) {
        return {
          ...staleData.value,
          cache: { source: 'stale', age: -1, error: error.message }
        };
      }

      throw new Error(`Failed to fetch weather for ${city}: ${error.message}`);
    }
  }

  /**
   * Normalize OpenWeather API response to our format
   */
  normalizeWeatherData(apiData, units) {
    const unitsConfig = {
      metric: { temp: '°C', wind: 'km/h' },
      imperial: { temp: '°F', wind: 'mph' }
    };

    return {
      city: apiData.name,
      country: apiData.sys?.country,
      coordinates: {
        latitude: apiData.coord.lat,
        longitude: apiData.coord.lon
      },
      temperature: apiData.main.temp,
      feelsLike: apiData.main.feels_like,
      tempMin: apiData.main.temp_min,
      tempMax: apiData.main.temp_max,
      humidity: apiData.main.humidity,
      pressure: apiData.main.pressure,
      cloudiness: apiData.clouds.all,
      visibility: apiData.visibility,
      windSpeed: apiData.wind.speed,
      windDirection: apiData.wind.deg || null,
      condition: apiData.weather[0].main,
      description: apiData.weather[0].description,
      iconId: apiData.weather[0].icon,
      rainProbability: apiData.rain?.['1h'] ? 100 : 0,
      rainAmount: apiData.rain?.['1h'] || 0,
      snowAmount: apiData.snow?.['1h'] || 0,
      sunrise: new Date(apiData.sys.sunrise * 1000),
      sunset: new Date(apiData.sys.sunset * 1000),
      units: unitsConfig[units],
      timezone: apiData.timezone,
      apiTimestamp: new Date(apiData.dt * 1000)
    };
  }

  /**
   * Store weather data in database for history
   */
  async storeWeatherInDatabase(weatherData) {
    try {
      await db.query(
        `INSERT INTO weather_readings (
          city, country, latitude, longitude, temperature, feels_like,
          humidity, pressure, cloudiness, visibility, wind_speed,
          wind_direction, condition, icon_id, description,
          rain_probability, rain_amount, sunrise, sunset
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT (city, created_at) DO UPDATE SET updated_at = CURRENT_TIMESTAMP`,
        [
          weatherData.city,
          weatherData.country,
          weatherData.coordinates.latitude,
          weatherData.coordinates.longitude,
          weatherData.temperature,
          weatherData.feelsLike,
          weatherData.humidity,
          weatherData.pressure,
          weatherData.cloudiness,
          weatherData.visibility,
          weatherData.windSpeed,
          weatherData.windDirection,
          weatherData.condition,
          weatherData.iconId,
          weatherData.description,
          weatherData.rainProbability,
          weatherData.rainAmount,
          weatherData.sunrise,
          weatherData.sunset
        ]
      );
    } catch (error) {
      console.error('Database store error:', error);
      // Don't throw, cache is still valid
    }
  }

  /**
   * Get weather for multiple cities
   */
  async getWeatherMultiple(cities, units = 'metric') {
    const results = await Promise.allSettled(
      cities.map(city => this.getCurrentWeather(city, units))
    );

    return results.map((result, index) => ({
      city: cities[index],
      status: result.status,
      data: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason.message : null
    }));
  }

  /**
   * Clear weather cache for a city
   */
  async clearCache(city, units = 'metric') {
    const cacheKey = `weather:${city}:${units}`;
    await this.cacheService.invalidate(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cacheService.getStats();
  }
}

export const weatherService = new WeatherService();
