'use client';

import { useState, useEffect } from 'react';
import { AITool } from './ToolTile';
import ToolTile from './ToolTile';
import ToolDetailPanel from './ToolDetailPanel';

interface Review {
  author?: string;
  content: string;
  permalink?: string;
  upvotes?: number;
}

interface ToolWallProps {
  initialTools?: AITool[];
}

interface Sentiment {
  label: 'positive' | 'mixed' | 'negative';
  summary: string;
  updated_at?: string;
}

interface FullTool extends AITool {
  long_description?: string;
  category?: string;
  website_url?: string;
}

export default function ToolWall({ initialTools = [] }: ToolWallProps) {
  const [tools, setTools] = useState<AITool[]>(initialTools);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedToolData, setSelectedToolData] = useState<FullTool | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [collateralLinks, setCollateralLinks] = useState<Array<{ title: string; url: string; type?: string }>>([]);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [loading, setLoading] = useState(!initialTools.length);

  // Fetch tools (polling only updates tools list, doesn't affect selection)
  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('/api/ai-tools');
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools || []);
          
          // Only update selected tool data if one is currently selected
          // This prevents reopening the panel after closing
          if (selectedToolId) {
            const fullTool = data.tools.find((t: any) => t.id === selectedToolId);
            if (fullTool) {
              setSelectedToolData({
                id: fullTool.id,
                name: fullTool.name,
                slug: fullTool.slug,
                logo_url: fullTool.logo_url,
                short_description: fullTool.short_description,
                votes: fullTool.votes,
                long_description: fullTool.long_description,
                category: fullTool.category,
                website_url: fullTool.website_url,
              });
              setReviews(fullTool.reviews || []);
              setCollateralLinks(fullTool.collateral_links || []);
              setSentiment(fullTool.sentiment || null);
            } else {
              // Tool no longer exists, clear selection
              setSelectedToolId(null);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching tools:', error);
      } finally {
        setLoading(false);
      }
    };

    if (!initialTools.length) {
      fetchTools();
    }

    // Poll for updates every 30 seconds
    // Only update if a tool is currently selected (won't reopen closed panels)
    const interval = setInterval(() => {
      if (selectedToolId) {
        fetchTools();
      } else {
        // Just update the tools list without affecting selection
        fetch('/api/ai-tools')
          .then(res => res.json())
          .then(data => {
            setTools(data.tools || []);
          })
          .catch(err => console.error('Error fetching tools:', err));
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [initialTools, selectedToolId]); // Include selectedToolId in deps

  // Load details when tool is selected
  useEffect(() => {
    if (!selectedToolId) {
      setSelectedToolData(null);
      setReviews([]);
      setCollateralLinks([]);
      setSentiment(null);
      return;
    }

    // Clear previous data immediately when a new tool is selected
    // This prevents showing stale data while fetching
    setSelectedToolData(null);
    setReviews([]);
    setCollateralLinks([]);
    setSentiment(null);

    let cancelled = false;
    const toolIdToFetch = selectedToolId; // Capture the ID at the start of the effect

    // Fetch full tool details from API
    fetch('/api/ai-tools')
      .then(res => res.json())
      .then(data => {
        // Only update if this effect wasn't cancelled (user didn't select another tool)
        // and we're still looking for the same tool ID
        if (!cancelled && selectedToolId === toolIdToFetch) {
          const fullTool = data.tools.find((t: any) => t.id === toolIdToFetch);
          if (fullTool) {
            setSelectedToolData({
              id: fullTool.id,
              name: fullTool.name,
              slug: fullTool.slug,
              logo_url: fullTool.logo_url,
              short_description: fullTool.short_description,
              votes: fullTool.votes,
              long_description: fullTool.long_description,
              category: fullTool.category,
              website_url: fullTool.website_url,
            });
            setReviews(fullTool.reviews || []);
            setCollateralLinks(fullTool.collateral_links || []);
            setSentiment(fullTool.sentiment || null);
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('Error fetching tool details:', err);
        }
      });

    // Cleanup function: cancel if user selects a different tool
    return () => {
      cancelled = true;
    };
  }, [selectedToolId]); // Only depend on tool ID

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
    <>
      {/* Grid of tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tools.map((tool, index) => (
          <ToolTile
            key={tool.id}
            tool={tool}
            index={index}
            onSelect={(tool) => setSelectedToolId(tool.id)}
          />
        ))}
      </div>

      {/* Bottom detail panel overlay (all screen sizes, only show when tool selected) */}
      {selectedToolId && selectedToolData && (
        <ToolDetailPanel
          tool={selectedToolData}
          reviews={reviews}
          collateralLinks={collateralLinks}
          sentiment={sentiment}
          onClose={() => {
            setSelectedToolId(null);
            // The useEffect will clear the rest when selectedToolId becomes null
          }}
        />
      )}
    </>
  );
}

