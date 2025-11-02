'use client';

import { useState, useEffect, useRef } from 'react';
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

  // Track the currently selected tool ID to prevent race conditions
  const currentSelectedIdRef = useRef<string | null>(null);

  // Fetch tools (polling only updates tools list, doesn't affect selection)
  useEffect(() => {
    const fetchTools = async (currentId: string | null) => {
      try {
        const response = await fetch('/api/ai-tools');
        if (response.ok) {
          const data = await response.json();
          setTools(data.tools || []);
          
          // Only update selected tool data if the ID matches what's currently selected
          // This prevents race conditions where polling updates stale selections
          if (currentId && currentId === currentSelectedIdRef.current) {
            const fullTool = data.tools.find((t: any) => t.id === currentId);
            if (fullTool && currentId === currentSelectedIdRef.current) {
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
            } else if (!fullTool) {
              // Tool no longer exists, clear selection
              setSelectedToolId(null);
              currentSelectedIdRef.current = null;
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
      fetchTools(selectedToolId);
    }

    // Poll for updates every 30 seconds
    // Only update if a tool is currently selected (won't reopen closed panels)
    const interval = setInterval(() => {
      const currentId = currentSelectedIdRef.current;
      if (currentId) {
        fetchTools(currentId);
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
  }, [initialTools]); // Remove selectedToolId from deps to avoid re-creating interval

  // Load details when tool is selected
  useEffect(() => {
    // Update the ref immediately when selection changes
    currentSelectedIdRef.current = selectedToolId;
    
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
        // Only update if:
        // 1. This effect wasn't cancelled (user didn't select another tool)
        // 2. We're still looking for the same tool ID
        // 3. The ref still matches (prevents race conditions with polling)
        if (!cancelled && selectedToolId === toolIdToFetch && currentSelectedIdRef.current === toolIdToFetch) {
          const fullTool = data.tools.find((t: any) => t.id === toolIdToFetch);
          if (fullTool && currentSelectedIdRef.current === toolIdToFetch) {
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
            currentSelectedIdRef.current = null;
            setSelectedToolId(null);
            // The useEffect will clear the rest when selectedToolId becomes null
          }}
        />
      )}
    </>
  );
}

