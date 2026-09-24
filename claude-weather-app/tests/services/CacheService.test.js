import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CacheService } from '../../src/services/CacheService.js';

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(() => {
    cacheService.memoryCache.clear();
  });

  describe('Memory Cache Operations', () => {
    it('should store and retrieve values from memory cache', () => {
      cacheService.setMemory('test-key', { value: 'test' });
      const result = cacheService.getMemory('test-key');

      expect(result).toBeDefined();
      expect(result.value).toBe('test');
    });

    it('should return null for expired memory cache entries', (done) => {
      cacheService.setMemory('test-key', { value: 'test' }, 100); // 100ms TTL

      setTimeout(() => {
        const result = cacheService.getMemory('test-key');
        expect(result).toBeNull();
        done();
      }, 150);
    });

    it('should track cache hits', () => {
      cacheService.setMemory('test-key', { value: 'test' });
      cacheService.getMemory('test-key');
      cacheService.getMemory('test-key');

      const entry = cacheService.memoryCache.get('test-key');
      expect(entry.hits).toBe(2);
    });
  });

  describe('Multi-layer Cache Operations', () => {
    it('should return cached value with source information', async () => {
      cacheService.setMemory('test-key', { value: 'test' });
      const result = await cacheService.get('test-key');

      expect(result).toBeDefined();
      expect(result.source).toBe('memory');
      expect(result.timestamp).toBeDefined();
    });

    it('should invalidate cache entries', async () => {
      cacheService.setMemory('test-key', { value: 'test' });
      await cacheService.invalidate('test-key');

      const result = cacheService.getMemory('test-key');
      expect(result).toBeNull();
    });
  });

  describe('Cache Statistics', () => {
    it('should return cache statistics', () => {
      cacheService.setMemory('key1', { value: 'test1' });
      cacheService.setMemory('key2', { value: 'test2' });
      cacheService.getMemory('key1');

      const stats = cacheService.getStats();

      expect(stats.memoryEntries).toBe(2);
      expect(stats.memoryHits).toBe(1);
      expect(stats.ttl).toBeDefined();
    });
  });

  describe('Cache Cleanup', () => {
    it('should cleanup expired entries', (done) => {
      cacheService.setMemory('key1', { value: 'test1' }, 50);
      cacheService.setMemory('key2', { value: 'test2' }, 50);

      setTimeout(() => {
        cacheService.cleanupMemoryCache();
        expect(cacheService.memoryCache.size).toBe(0);
        done();
      }, 100);
    });
  });
});
