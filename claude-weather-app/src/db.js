// Database configuration and pool initialization
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Use a mock pool in test environment
const isTest = process.env.NODE_ENV === 'test';

export const db = isTest ? {
  query: async () => ({ rows: [] }),
  end: async () => {},
  on: () => {}
} : new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
