import { getGitHubAuthService } from './authService';
import { getRepositoryCacheService } from './repositoryCacheService';

interface SearchOptions {
  query?: string;
  type?: 'all' | 'owner' | 'member' | 'public' | 'private';
  sort?: 'updated' | 'created' | 'pushed' | 'full_name' | 'stars';
  language?: string;
  visibility?: 'all' | 'public' | 'private';
  per_page?: number;
  page?: number;
}

interface SearchResult {
  repositories: any[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  perPage: number;
}

interface RepositoryFilters {
  languages: string[];
  topics: string[];
  visibility: string[];
  hasIssues: boolean;
  hasWiki: boolean;
  hasPages: boolean;
}

class RepositorySearchService {
  private async getCacheService() {
    return await getRepositoryCacheService();
  }

  private cacheService: any = null;

  private async ensureCacheService() {
    if (!this.cacheService) {
      this.cacheService = await getRepositoryCacheService();
    }
    return this.cacheService;
  }

  /**
   * Search repositories with advanced filtering
   */
  async searchRepositories(
    sessionToken: string,
    userId: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    const {
      query = '',
      type = 'all',
      sort = 'updated',
      language,
      visibility = 'all',
      per_page = 30,
      page = 1
    } = options;

    // Check cache first
    const cacheService = await this.ensureCacheService();
    const cacheKey = { query, type, sort, language, visibility, per_page, page };
    const cached = await cacheService.getCachedRepositories(userId, cacheKey);
    
    if (cached) {
      return {
        repositories: cached.repositories,
        totalCount: cached.totalCount,
        hasMore: cached.repositories.length === per_page,
        page,
        perPage: per_page
      };
    }

    const authService = await getGitHubAuthService();
    
    // Get all repositories (with pagination for better filtering)
    const allRepos = await this.getAllRepositories(authService, sessionToken, type);
    
    // Apply filters
    let filteredRepos = this.applyFilters(allRepos, { query, language, visibility });
    
    // Sort repositories
    filteredRepos = this.sortRepositories(filteredRepos, sort);
    
    // Paginate results
    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedRepos = filteredRepos.slice(startIndex, endIndex);
    
    // Cache the results
    await this.cacheService.cacheRepositories(userId, cacheKey, paginatedRepos, filteredRepos.length);
    
    return {
      repositories: paginatedRepos,
      totalCount: filteredRepos.length,
      hasMore: endIndex < filteredRepos.length,
      page,
      perPage: per_page
    };
  }

  /**
   * Get all repositories for a user (with pagination)
   */
  private async getAllRepositories(
    authService: any,
    sessionToken: string,
    type: string
  ): Promise<any[]> {
    const allRepos: any[] = [];
    let page = 1;
    const perPage = 100; // GitHub max
    
    while (true) {
      try {
        const repos = await authService.getUserRepositories(sessionToken, {
          per_page: perPage,
          page,
          type
        });
        
        if (repos.length === 0) break;
        
        allRepos.push(...repos);
        
        // Limit to prevent infinite loops
        if (page >= 10) break;
        page++;
      } catch (error) {
        console.error('Error fetching repositories:', error);
        break;
      }
    }
    
    return allRepos;
  }

  /**
   * Apply filters to repositories
   */
  private applyFilters(
    repositories: any[],
    filters: { query?: string; language?: string; visibility?: string }
  ): any[] {
    let filtered = repositories;

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(repo => 
        repo.name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query)
      );
    }

    // Language filter
    if (filters.language) {
      filtered = filtered.filter(repo => 
        repo.language?.toLowerCase() === filters.language?.toLowerCase()
      );
    }

    // Visibility filter
    if (filters.visibility && filters.visibility !== 'all') {
      const isPrivate = filters.visibility === 'private';
      filtered = filtered.filter(repo => repo.private === isPrivate);
    }

    return filtered;
  }

  /**
   * Sort repositories
   */
  private sortRepositories(repositories: any[], sort: string): any[] {
    const sorted = [...repositories];
    
    switch (sort) {
      case 'updated':
        return sorted.sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      
      case 'created':
        return sorted.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      
      case 'pushed':
        return sorted.sort((a, b) => 
          new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime()
        );
      
      case 'full_name':
        return sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      case 'stars':
        return sorted.sort((a, b) => b.stargazers_count - a.stargazers_count);
      
      default:
        return sorted;
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(sessionToken: string, userId: string): Promise<{
    total: number;
    languages: { [key: string]: number };
    visibility: { public: number; private: number };
    topics: string[];
  }> {
    const authService = await getGitHubAuthService();
    const allRepos = await this.getAllRepositories(authService, sessionToken, 'all');
    
    const languages: { [key: string]: number } = {};
    let publicCount = 0;
    let privateCount = 0;
    const topics = new Set<string>();

    allRepos.forEach(repo => {
      // Count languages
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
      }

      // Count visibility
      if (repo.private) {
        privateCount++;
      } else {
        publicCount++;
      }

      // Collect topics (if available)
      if (repo.topics) {
        repo.topics.forEach((topic: string) => topics.add(topic));
      }
    });

    return {
      total: allRepos.length,
      languages,
      visibility: { public: publicCount, private: privateCount },
      topics: Array.from(topics)
    };
  }

  /**
   * Get popular repositories
   */
  async getPopularRepositories(
    sessionToken: string,
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await this.searchRepositories(sessionToken, userId, {
      sort: 'stars',
      per_page: limit,
      page: 1
    });
    
    return result.repositories;
  }

  /**
   * Search repositories by language
   */
  async searchByLanguage(
    sessionToken: string,
    userId: string,
    language: string,
    options: SearchOptions = {}
  ): Promise<SearchResult> {
    return this.searchRepositories(sessionToken, userId, {
      ...options,
      language
    });
  }

  /**
   * Get recent repositories
   */
  async getRecentRepositories(
    sessionToken: string,
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const result = await this.searchRepositories(sessionToken, userId, {
      sort: 'updated',
      per_page: limit,
      page: 1
    });
    
    return result.repositories;
  }
}

// Singleton instance
let searchService: RepositorySearchService | null = null;

export async function getRepositorySearchService(): Promise<RepositorySearchService> {
  if (!searchService) {
    searchService = new RepositorySearchService();
  }
  return searchService;
}

export { RepositorySearchService };
