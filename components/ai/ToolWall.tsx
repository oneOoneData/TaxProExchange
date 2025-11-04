'use client';

import { useState, useEffect } from 'react';
import { AITool } from './ToolTile';
import ToolTile from './ToolTile';

interface ToolWallProps {
  initialTools?: AITool[];
}

export default function ToolWall({ initialTools = [] }: ToolWallProps) {
  const [tools, setTools] = useState<AITool[]>(initialTools);
  const [loading, setLoading] = useState(!initialTools.length);

  // Fetch tools on mount and poll for updates
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/ai-tools');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTools(data.tools || []);
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setLoading(false);
      }
    };

    if (initialTools.length === 0) {
      fetchTools();
    }

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetch('/api/ai-tools')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          setTools(data.tools || []);
        })
        .catch(err => {
          // Ignore network errors
          if (!err.message.includes('network')) {
            console.error('Error fetching tools:', err);
          }
        });
    }, 30000);
    
    return () => {
      clearInterval(interval);
    };
  }, [initialTools]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading tools...</div>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No AI tools yet. Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {tools.map((tool, index) => (
        <ToolTile
          key={tool.id}
          tool={tool}
          index={index}
        />
      ))}
    </div>
  );
}

