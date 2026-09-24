-- Unit DB-001: Database Schema Design
-- PostgreSQL Schema for Weather Application

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: weather_readings (Current weather observations)
CREATE TABLE IF NOT EXISTS weather_readings (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100),
  latitude DECIMAL(10, 6),
  longitude DECIMAL(10, 6),
  temperature DECIMAL(5, 2) NOT NULL,
  feels_like DECIMAL(5, 2),
  humidity INT CHECK (humidity >= 0 AND humidity <= 100),
  pressure INT,
  cloudiness INT CHECK (cloudiness >= 0 AND cloudiness <= 100),
  visibility INT,
  wind_speed DECIMAL(5, 2),
  wind_direction INT CHECK (wind_direction >= 0 AND wind_direction < 360),
  condition VARCHAR(50),
  icon_id VARCHAR(10),
  description TEXT,
  rain_probability DECIMAL(3, 2),
  rain_amount DECIMAL(5, 2),
  sunrise TIMESTAMP,
  sunset TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_city_time UNIQUE (city, created_at)
);

-- Create indexes for weather_readings
CREATE INDEX IF NOT EXISTS idx_weather_city_timestamp
ON weather_readings (city, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_created_at
ON weather_readings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_weather_city
ON weather_readings (city);

-- Table 2: forecasts (Weather forecasts)
CREATE TABLE IF NOT EXISTS forecasts (
  id BIGSERIAL PRIMARY KEY,
  city VARCHAR(100) NOT NULL,
  forecast_date DATE NOT NULL,
  forecast_time TIME,
  temperature_high DECIMAL(5, 2),
  temperature_low DECIMAL(5, 2),
  temperature_avg DECIMAL(5, 2),
  condition VARCHAR(50),
  humidity INT CHECK (humidity >= 0 AND humidity <= 100),
  wind_speed DECIMAL(5, 2),
  rain_probability DECIMAL(3, 2),
  rain_amount DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for forecasts
CREATE INDEX IF NOT EXISTS idx_forecast_city_date
ON forecasts (city, forecast_date DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_city
ON forecasts (city);

-- Table 3: user_preferences (User settings)
CREATE TABLE IF NOT EXISTS user_preferences (
  id BIGSERIAL PRIMARY KEY,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  favorite_cities TEXT[] DEFAULT ARRAY[]::TEXT[],
  language VARCHAR(2) DEFAULT 'en',
  temperature_unit VARCHAR(1) DEFAULT 'C',
  wind_unit VARCHAR(5) DEFAULT 'kmh',
  notification_enabled BOOLEAN DEFAULT true,
  alert_cold BOOLEAN DEFAULT true,
  alert_heat BOOLEAN DEFAULT true,
  alert_wind BOOLEAN DEFAULT true,
  alert_humidity BOOLEAN DEFAULT true,
  theme VARCHAR(10) DEFAULT 'light',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id
ON user_preferences (user_id);

-- Table 4: cache_entries (Cache management)
CREATE TABLE IF NOT EXISTS cache_entries (
  id BIGSERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_value JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for cache_entries
CREATE INDEX IF NOT EXISTS idx_cache_expires
ON cache_entries (expires_at);

CREATE INDEX IF NOT EXISTS idx_cache_key
ON cache_entries (cache_key);

-- Table 5: audit_logs (API request logging)
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  ip_address VARCHAR(45),
  response_time_ms INT,
  status_code INT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_created_at
ON audit_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_endpoint
ON audit_logs (endpoint, created_at DESC);

-- Trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_weather_readings_timestamp
BEFORE UPDATE ON weather_readings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_forecasts_timestamp
BEFORE UPDATE ON forecasts
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_cache_entries_timestamp
BEFORE UPDATE ON cache_entries
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();
