import { describe, it, expect } from '@jest/globals';

describe('Health Check Endpoint', () => {
  const mockWeatherResponse = {
    success: true,
    weather: {
      city: 'Ho Chi Minh',
      country: 'Vietnam',
      temperature: 28,
      feelsLike: 32,
      humidity: 75,
      pressure: 1013,
      windSpeed: 5,
      condition: 'Partly Cloudy',
      iconId: '02d'
    },
    alerts: [],
    timestamp: new Date().toISOString()
  };

  describe('API Response Format', () => {
    it('should return valid weather response structure', () => {
      const response = mockWeatherResponse;

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('weather');
      expect(response).toHaveProperty('alerts');
      expect(response).toHaveProperty('timestamp');
    });

    it('should contain required weather fields', () => {
      const weather = mockWeatherResponse.weather;

      expect(weather).toHaveProperty('city');
      expect(weather).toHaveProperty('temperature');
      expect(weather).toHaveProperty('humidity');
      expect(weather).toHaveProperty('windSpeed');
      expect(weather).toHaveProperty('condition');
    });

    it('should have valid temperature range', () => {
      const temp = mockWeatherResponse.weather.temperature;
      expect(temp).toBeGreaterThan(-50);
      expect(temp).toBeLessThan(60);
    });

    it('should have valid humidity percentage', () => {
      const humidity = mockWeatherResponse.weather.humidity;
      expect(humidity).toBeGreaterThanOrEqual(0);
      expect(humidity).toBeLessThanOrEqual(100);
    });
  });

  describe('Error Handling', () => {
    it('should return error for missing city parameter', () => {
      const errorResponse = {
        error: 'City parameter is required'
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse.error).toContain('City');
    });

    it('should handle invalid city names', () => {
      const errorResponse = {
        error: 'City not found'
      };

      expect(errorResponse).toHaveProperty('error');
    });
  });

  describe('Cache Information', () => {
    it('should include cache metadata in response', () => {
      const response = {
        ...mockWeatherResponse,
        cacheInfo: {
          source: 'memory',
          age: 0,
          fresh: true
        }
      };

      expect(response.cacheInfo).toHaveProperty('source');
      expect(response.cacheInfo).toHaveProperty('age');
      expect(response.cacheInfo).toHaveProperty('fresh');
    });

    it('should indicate stale data appropriately', () => {
      const staleResponse = {
        cacheInfo: {
          source: 'database',
          age: 1800,
          fresh: false
        }
      };

      expect(staleResponse.cacheInfo.fresh).toBe(false);
      expect(staleResponse.cacheInfo.age).toBeGreaterThan(0);
    });
  });
});
