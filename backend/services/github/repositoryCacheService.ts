/**
 * Repository Cache Service - In-memory cache for development
 * This provides a simple in-memory cache for repository data
 */

interface CacheConfig {
  ttl: number; // Time to live in seconds
  prefix: string;
}

interface RepositoryCacheData {
  repositories: any[];
  timestamp: number;
  totalCount: number;
  queryHash: string;
}

class RepositoryCacheService {
  private config: CacheConfig = {
    ttl: 3600, // 1 hour
    prefix: 'github:repos:'
  };
  
  // In-memory cache storage
  private memoryCache = new Map<string, { data: RepositoryCacheData; expires: number }>();

  /**
   * Generate cache key based on query parameters
   */
  private generateCacheKey(userId: string, params: any): string {
    const queryHash = Buffer.from(JSON.stringify(params)).toString('base64');
    return `${this.config.prefix}${userId}:${queryHash}`;
  }

  /**
   * Get cached repositories
   */
  async getCachedRepositories(userId: string, params: any): Promise<RepositoryCacheData | null> {
    const key = this.generateCacheKey(userId, params);
    const cached = this.memoryCache.get(key);
    
    if (cached && Date.now() < cached.expires) {
      return cached.data;
    }
    
    return null;
  }

  /**
   * Cache repositories
   */
  async cacheRepositories(userId: string, params: any, data: any[], totalCount: number): Promise<void> {
    const key = this.generateCacheKey(userId, params);
    const cacheData: RepositoryCacheData = {
      repositories: data,
      timestamp: Date.now(),
      totalCount,
      queryHash: Buffer.from(JSON.stringify(params)).toString('base64')
    };
    
    this.memoryCache.set(key, {
      data: cacheData,
      expires: Date.now() + (this.config.ttl * 1000)
    });
  }

  /**
   * invalidate cache for user
   */
  async invalidateUserCache(userId: string): Promise<void> {
    const keys = Array.from(this.memoryCache.keys()).filter(key => 
      key.startsWith(`${this.config.prefix}${userId}:`)
    );
    
    keys.forEach(key => this.memoryCache.delete(key));
  }

  /**
   * get cache statistics
   */
  async getCacheStats(): Promise<{
    hitRate: number;
    totalKeys: number;
    totalCached: number;
    }> {
    return {
      hitRate: 0,
      totalKeys: this.memoryCache.size,
      totalCached: this.memoryCache.size
    };
  }
}

// Singleton instance
let cacheService: RepositoryCacheService | null = null;

export async function getRepositoryCacheService(): Promise<RepositoryCacheService> {
  if (!cacheService) {
    cacheService = new RepositoryCacheService();
  }
  return cacheService;
}

export { RepositoryCacheService };
