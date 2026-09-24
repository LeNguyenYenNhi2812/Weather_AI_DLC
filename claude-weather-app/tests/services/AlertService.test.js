import { describe, it, expect } from '@jest/globals';
import { AlertService } from '../../src/services/AlertService.js';

describe('AlertService', () => {
  let alertService;

  beforeEach(() => {
    alertService = new AlertService();
  });

  describe('Alert Evaluation', () => {
    it('should trigger cold alert when temperature < 0', () => {
      const weather = {
        temperature: -5,
        humidity: 50,
        windSpeed: 10,
        rainProbability: 20
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const coldAlert = alerts.find(a => a.type === 'cold');

      expect(coldAlert).toBeDefined();
      expect(coldAlert.severity).toBe('high');
    });

    it('should trigger heat alert when temperature > 35', () => {
      const weather = {
        temperature: 40,
        humidity: 70,
        windSpeed: 15,
        rainProbability: 10
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const heatAlert = alerts.find(a => a.type === 'heat');

      expect(heatAlert).toBeDefined();
      expect(heatAlert.severity).toBe('high');
    });

    it('should trigger wind alert when windSpeed > 30', () => {
      const weather = {
        temperature: 25,
        humidity: 50,
        windSpeed: 35,
        rainProbability: 20
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const windAlert = alerts.find(a => a.type === 'wind');

      expect(windAlert).toBeDefined();
      expect(windAlert.severity).toBe('medium');
    });

    it('should trigger humidity alert when humidity > 80', () => {
      const weather = {
        temperature: 25,
        humidity: 85,
        windSpeed: 10,
        rainProbability: 30
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const humidityAlert = alerts.find(a => a.type === 'humidity');

      expect(humidityAlert).toBeDefined();
      expect(humidityAlert.severity).toBe('low');
    });

    it('should trigger rain alert when rainProbability > 60', () => {
      const weather = {
        temperature: 20,
        humidity: 60,
        windSpeed: 10,
        rainProbability: 75
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const rainAlert = alerts.find(a => a.type === 'rain');

      expect(rainAlert).toBeDefined();
    });

    it('should return empty array when no alerts triggered', () => {
      const weather = {
        temperature: 22,
        humidity: 50,
        windSpeed: 10,
        rainProbability: 20
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      expect(alerts).toEqual([]);
    });
  });

  describe('Bilingual Support', () => {
    it('should provide alerts in English', () => {
      const weather = {
        temperature: -5,
        humidity: 50,
        windSpeed: 10,
        rainProbability: 20
      };

      const alerts = alertService.evaluateAlerts(weather, 'en');
      const coldAlert = alerts.find(a => a.type === 'cold');

      expect(coldAlert.title).toBe('Extreme Cold');
      expect(coldAlert.message).toContain('indoors');
    });

    it('should provide alerts in Vietnamese', () => {
      const weather = {
        temperature: -5,
        humidity: 50,
        windSpeed: 10,
        rainProbability: 20
      };

      const alerts = alertService.evaluateAlerts(weather, 'vi');
      const coldAlert = alerts.find(a => a.type === 'cold');

      expect(coldAlert.title).toBe('Lạnh Cực Độ');
      expect(coldAlert.message).toContain('nhà');
    });
  });

  describe('Severity Levels', () => {
    it('should calculate low severity for minor threshold exceedance', () => {
      const severity = alertService.calculateSeverityLevel('cold', {
        temperature: -2
      });

      expect(severity).toBe('low');
    });

    it('should calculate high severity for major threshold exceedance', () => {
      const severity = alertService.calculateSeverityLevel('cold', {
        temperature: -20
      });

      expect(severity).toBe('high');
    });
  });

  describe('Alert Formatting', () => {
    it('should format alerts for display', () => {
      const alerts = [
        {
          type: 'cold',
          title: 'Extreme Cold',
          message: 'Stay inside',
          severity: 'high',
          currentValue: '-5°C',
          icon: '🥶',
          timestamp: new Date().toISOString()
        }
      ];

      const formatted = alertService.formatAlerts(alerts, 'en');

      expect(formatted).toHaveLength(1);
      expect(formatted[0]).toHaveProperty('id');
      expect(formatted[0]).toHaveProperty('icon');
      expect(formatted[0]).toHaveProperty('severity');
    });
  });

  describe('Recommendations', () => {
    it('should provide recommendations prioritized by severity', () => {
      const alerts = [
        { type: 'cold', severity: 'high', message: 'Stay warm' },
        { type: 'humidity', severity: 'low', message: 'Use AC' },
        { type: 'wind', severity: 'medium', message: 'Stay inside' }
      ];

      const recommendations = alertService.getRecommendations(alerts, 'en');

      expect(recommendations[0].priority).toBe(1);
      expect(recommendations[1].priority).toBe(2);
      expect(recommendations[2].priority).toBe(3);
    });
  });
});
