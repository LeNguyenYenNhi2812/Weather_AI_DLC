// Unit BE-005: Cache Service - 4-Layer Caching Strategy
import { db } from '../db.js';

const CACHE_TTL_MEMORY = 2 * 60 * 1000; // 2 minutes
const CACHE_TTL_DB = 30 * 60 * 1000; // 30 minutes

export class CacheService {
  constructor() {
    // L1: In-memory cache (server process)
    this.memoryCache = new Map();

    // Initialize cleanup of expired entries every 5 minutes
    setInterval(() => this.cleanupMemoryCache(), 5 * 60 * 1000);
  }

  /**
   * L1: Memory Cache - Fastest, process-local
   */
  getMemory(key) {
    const entry = this.memoryCache.get(key);
    if (!entry) {return null;}

    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    entry.hits = (entry.hits || 0) + 1;
    return entry.value;
  }

  setMemory(key, value, ttl = CACHE_TTL_MEMORY) {
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      hits: 0,
      createdAt: Date.now()
    });
  }

  /**
   * L2: Database Cache Layer
   */
  async getDatabase(key) {
    try {
      const result = await db.query(
        'SELECT cache_value, expires_at FROM cache_entries WHERE cache_key = $1',
        [key]
      );

      if (result.rows.length === 0) {return null;}

      const entry = result.rows[0];
      if (entry.expires_at && new Date(entry.expires_at) < new Date()) {
        // Delete expired entry
        await db.query('DELETE FROM cache_entries WHERE cache_key = $1', [key]);
        return null;
      }

      return entry.cache_value;
    } catch (error) {
      console.error('Cache database read error:', error);
      return null;
    }
  }

  async setDatabase(key, value, ttl = CACHE_TTL_DB) {
    try {
      const expiresAt = new Date(Date.now() + ttl);
      await db.query(
        `INSERT INTO cache_entries (cache_key, cache_value, expires_at)
         VALUES ($1, $2, $3)
         ON CONFLICT (cache_key) DO UPDATE SET
         cache_value = $2, expires_at = $3, updated_at = CURRENT_TIMESTAMP`,
        [key, JSON.stringify(value), expiresAt]
      );
    } catch (error) {
      console.error('Cache database write error:', error);
    }
  }

  /**
   * Multi-layer cache retrieval (L1 → L2)
   */
  async get(key) {
    // L1: Memory
    const memResult = this.getMemory(key);
    if (memResult) {
      return {
        value: memResult,
        source: 'memory',
        timestamp: Date.now()
      };
    }

    // L2: Database
    const dbResult = await this.getDatabase(key);
    if (dbResult) {
      // Promote to memory cache
      this.setMemory(key, dbResult);
      return {
        value: dbResult,
        source: 'database',
        timestamp: Date.now()
      };
    }

    return null;
  }

  /**
   * Multi-layer cache storage (L1 + L2)
   */
  async set(key, value, ttl = CACHE_TTL_DB) {
    this.setMemory(key, value, Math.min(ttl, CACHE_TTL_MEMORY));
    await this.setDatabase(key, value, ttl);
  }

  /**
   * Invalidate cache entry across all layers
   */
  async invalidate(key) {
    this.memoryCache.delete(key);
    try {
      await db.query('DELETE FROM cache_entries WHERE cache_key = $1', [key]);
    } catch (error) {
      console.error('Cache invalidation error:', error);
    }
  }

  /**
   * Invalidate all entries with pattern
   */
  async invalidatePattern(pattern) {
    // Memory cache
    for (const [key] of this.memoryCache.entries()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Database cache
    try {
      await db.query(
        'DELETE FROM cache_entries WHERE cache_key LIKE $1',
        [`%${pattern}%`]
      );
    } catch (error) {
      console.error('Pattern invalidation error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let hits = 0;
    for (const [, entry] of this.memoryCache.entries()) {
      hits += entry.hits || 0;
    }

    return {
      memoryEntries: this.memoryCache.size,
      memoryHits: hits,
      ttl: {
        memory: `${CACHE_TTL_MEMORY / 1000}s`,
        database: `${CACHE_TTL_DB / 1000}s`
      }
    };
  }

  /**
   * Cleanup expired memory cache entries
   */
  cleanupMemoryCache() {
    let cleaned = 0;
    for (const [key, entry] of this.memoryCache.entries()) {
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired memory cache entries`);
    }
  }
}

export const cacheService = new CacheService();
