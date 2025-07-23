'use client';

import React, { useState, useEffect } from 'react';
import { Search, Star, GitFork, Clock, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  updated_at: string;
  created_at: string;
  pushed_at: string;
}

interface RepositorySelectorProps {
  onRepositorySelect: (repo: Repository) => void;
  selectedRepo?: Repository;
}

export function RepositorySelector({ onRepositorySelect, selectedRepo }: RepositorySelectorProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'owner' | 'member'>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'pushed' | 'full_name'>('updated');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRepositories();
  }, [filterType, sortBy, page]);

  const loadRepositories = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: '30',
        page: page.toString(),
        sort: sortBy,
        type: filterType
      });

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const response = await fetch(`/api/github/repos?${params}`);
      const data = await response.json();

      if (data.success) {
        const newRepos = data.repositories || [];
        
        if (page === 1) {
          setRepositories(newRepos);
        } else {
          setRepositories(prev => [...prev, ...newRepos]);
        }
        
        setHasMore(newRepos.length === 30);
      } else {
        throw new Error(data.error || 'Failed to load repositories');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load repositories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
    // Debounced search
    setTimeout(() => {
      loadRepositories();
    }, 300);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    if (diffDays < 30) return `Updated ${Math.floor(diffDays / 7)} weeks ago`;
    return `Updated ${Math.floor(diffDays / 30)} months ago`;
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
            className="pl-10 w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">All</option>
            <option value="owner">Owner</option>
            <option value="member">Member</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Recently Created</option>
            <option value="pushed">Recently Pushed</option>
            <option value="full_name">Name</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading && page === 1 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : (
          filteredRepositories.map((repo) => (
            <Card
              key={repo.id}
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                selectedRepo?.id === repo.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div onClick={() => onRepositorySelect(repo)} role="button" tabIndex={0} className="w-full h-full" style={{ outline: 'none' }}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{repo.name}</h3>
                      <p className="text-sm text-gray-600">{repo.owner.login}</p>
                    </div>
                    {repo.private && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                        Private
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                </CardHeader>
                
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {repo.language && (
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>{repo.language}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      <span>{repo.stargazers_count}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      <span>{repo.forks_count}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(repo.updated_at)}</span>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>

      {hasMore && !loading && (
        <div className="text-center">
          <Button
            onClick={() => setPage(prev => prev + 1)}
            variant="outline"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
