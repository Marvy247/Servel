'use client';

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, Folder, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  children?: FileNode[];
  content?: string;
  selected?: boolean;
  contractInfo?: {
    name: string;
    pragma: string;
    hasConstructor: boolean;
    estimatedGas: number;
  };
}

interface ContractFileTreeProps {
  owner: string;
  repo: string;
  branch?: string;
  onContractsSelected: (contracts: FileNode[]) => void;
}

export function ContractFileTree({ 
  owner, 
  repo, 
  branch = 'main', 
  onContractsSelected 
}: ContractFileTreeProps) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set());
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadRepositoryStructure();
  }, [owner, repo, branch]);

  const loadRepositoryStructure = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/github/repos/${owner}/${repo}/contents?branch=${branch}`
      );
      const data = await response.json();
      
      if (data.success) {
        const structure = await buildFileTree(data.contents || []);
        setTree(structure);
      } else {
        throw new Error(data.error || 'Failed to load repository structure');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load repository',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const buildFileTree = async (contents: any[]): Promise<FileNode[]> => {
    const tree: FileNode[] = [];
    
    for (const item of contents) {
      const node: FileNode = {
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size
      };

      if (item.type === 'dir') {
        // Load directory contents
        try {
          const response = await fetch(
            `/api/github/repos/${owner}/${repo}/contents/${item.path}?branch=${branch}`
          );
          const data = await response.json();
          
          if (data.success) {
            node.children = await buildFileTree(data.contents || []);
          }
        } catch (error) {
          console.warn(`Failed to load directory ${item.path}:`, error);
        }
      } else if (item.name.endsWith('.sol')) {
        // Load contract file
        try {
          const response = await fetch(
            `/api/github/repos/${owner}/${repo}/contents/${item.path}?branch=${branch}`
          );
          const data = await response.json();
          
          if (data.success && data.content) {
            const content = data.content;
            node.content = content;
            node.contractInfo = parseContractInfo(content);
          }
        } catch (error) {
          console.warn(`Failed to load contract ${item.path}:`, error);
        }
      }

      tree.push(node);
    }
    
    return tree;
  };

  const parseContractInfo = (content: string) => {
    const contractMatch = content.match(/contract\s+(\w+)/);
    const pragmaMatch = content.match(/pragma\s+solidity\s+([^;]+);/);
    const constructorMatch = content.match(/constructor\s*\(/);
    
    // Simple gas estimation based on content length
    const estimatedGas = Math.min(5000000, content.length * 100);

    return {
      name: contractMatch ? contractMatch[1] : 'Unknown',
      pragma: pragmaMatch ? pragmaMatch[1].trim() : '^0.8.0',
      hasConstructor: !!constructorMatch,
      estimatedGas
    };
  };

  const toggleDirectory = (path: string) => {
    setExpandedDirs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleContractSelection = (path: string) => {
    setSelectedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      
      // Notify parent of selection change
      const selectedNodes = getSelectedContracts(newSet);
      onContractsSelected(selectedNodes);
      
      return newSet;
    });
  };

  const getSelectedContracts = (selectedPaths: Set<string>): FileNode[] => {
    const selected: FileNode[] = [];
    
    const findSelected = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name.endsWith('.sol') && selectedPaths.has(node.path)) {
          selected.push(node);
        }
        if (node.children) {
          findSelected(node.children);
        }
      }
    };
    
    findSelected(tree);
    return selected;
  };

  const selectAllContracts = () => {
    const allContracts = new Set<string>();
    
    const collectContracts = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file' && node.name.endsWith('.sol')) {
          allContracts.add(node.path);
        }
        if (node.children) {
          collectContracts(node.children);
        }
      }
    };
    
    collectContracts(tree);
    setSelectedContracts(allContracts);
    
    const selectedNodes = getSelectedContracts(allContracts);
    onContractsSelected(selectedNodes);
  };

  const clearSelection = () => {
    setSelectedContracts(new Set());
    onContractsSelected([]);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedContracts.has(node.path);
    const isContract = node.type === 'file' && node.name.endsWith('.sol');

    return (
      <div key={node.path} style={{ paddingLeft: `${depth * 20}px` }}>
        <div
          className={`flex items-center gap-2 py-2 px-2 hover:bg-gray-100 rounded cursor-pointer ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          onClick={() => {
            if (node.type === 'dir') {
              toggleDirectory(node.path);
            } else if (isContract) {
              toggleContractSelection(node.path);
            }
          }}
        >
          {node.type === 'dir' ? (
            <>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Folder className="h-4 w-4 text-yellow-600" />
            </>
          ) : (
            <>
              {isContract ? (
                <CheckSquare
                  className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}
                />
              ) : (
                <File className="h-4 w-4 text-gray-400" />
              )}
            </>
          )}
          
          <span className="text-sm">{node.name}</span>
          
          {isContract && node.contractInfo && (
            <div className="ml-auto flex items-center gap-2">
              <span className="px-2 py-1 border border-gray-300 text-gray-700 text-xs rounded">
                {node.contractInfo.pragma}
              </span>
              <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">
                ~{Math.round(node.contractInfo.estimatedGas / 1000)}k gas
              </span>
            </div>
          )}
        </div>
        
        {node.type === 'dir' && isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const selectedCount = selectedContracts.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Select Contracts</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAllContracts}
            disabled={loading}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={clearSelection}
            disabled={selectedCount === 0}
          >
            Clear
          </Button>
        </div>
      </div>

      <Card>
        <div className="p-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(node => renderNode(node))}
            </div>
          )}
        </div>
      </Card>

      {selectedCount > 0 && (
        <div className="text-sm text-gray-600">
          {selectedCount} contract{selectedCount > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
