import { describe, it, expect } from '@jest/globals';

describe('API Input Validation', () => {
  describe('Weather Endpoint Validation', () => {
    it('should require city parameter', () => {
      const params = { units: 'metric' };
      const validation = validateWeatherParams(params);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('city');
    });

    it('should accept valid units', () => {
      const params = { city: 'Tokyo', units: 'metric' };
      const validation = validateWeatherParams(params);

      expect(validation.valid).toBe(true);
    });

    it('should validate units parameter', () => {
      const params = { city: 'Tokyo', units: 'invalid' };
      const validation = validateWeatherParams(params);

      expect(validation.valid).toBe(false);
    });
  });

  describe('City Validation Endpoint', () => {
    it('should require minimum query length', () => {
      const query = 'T';
      const validation = validateCityQuery(query);

      expect(validation.valid).toBe(false);
    });

    it('should accept valid city queries', () => {
      const query = 'Tokyo';
      const validation = validateCityQuery(query);

      expect(validation.valid).toBe(true);
    });

    it('should handle special characters', () => {
      const query = 'São Paulo';
      const validation = validateCityQuery(query);

      expect(validation.valid).toBe(true);
    });
  });

  describe('History Endpoint Validation', () => {
    it('should validate days parameter range', () => {
      const params = { city: 'Tokyo', days: 120 };
      const validation = validateHistoryParams(params);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('days');
    });

    it('should accept valid day ranges', () => {
      const params = { city: 'Tokyo', days: 30 };
      const validation = validateHistoryParams(params);

      expect(validation.valid).toBe(true);
    });

    it('should default days to 7', () => {
      const params = { city: 'Tokyo' };
      const defaults = applyDefaults(params);

      expect(defaults.days).toBe(7);
    });
  });

  describe('Coordinate Validation', () => {
    it('should validate latitude range', () => {
      const coords = { lat: 95, lon: 100 };
      const validation = validateCoordinates(coords);

      expect(validation.valid).toBe(false);
    });

    it('should validate longitude range', () => {
      const coords = { lat: 40, lon: 200 };
      const validation = validateCoordinates(coords);

      expect(validation.valid).toBe(false);
    });

    it('should accept valid coordinates', () => {
      const coords = { lat: 35.6762, lon: 139.6503 };
      const validation = validateCoordinates(coords);

      expect(validation.valid).toBe(true);
    });
  });
});

// Validation helper functions
function validateWeatherParams(params) {
  const errors = [];

  if (!params.city) errors.push('city');
  if (params.units && !['metric', 'imperial'].includes(params.units)) {
    errors.push('units');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function validateCityQuery(query) {
  return {
    valid: query && query.length >= 2 && query.length <= 100
  };
}

function validateHistoryParams(params) {
  const errors = [];

  if (!params.city) errors.push('city');
  if (params.days && (params.days < 1 || params.days > 90)) {
    errors.push('days');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

function applyDefaults(params) {
  return {
    ...params,
    days: params.days || 7
  };
}

function validateCoordinates(coords) {
  const latValid = coords.lat >= -90 && coords.lat <= 90;
  const lonValid = coords.lon >= -180 && coords.lon <= 180;

  return {
    valid: latValid && lonValid
  };
}
