'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import VoteButton from './VoteButton';

export interface AITool {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  short_description?: string;
  votes: number;
}

interface ToolTileProps {
  tool: AITool;
  index: number;
  onSelect?: (tool: AITool) => void;
}

export default function ToolTile({ tool, index, onSelect }: ToolTileProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    if (window.innerWidth < 768) {
      // Mobile: navigate to detail page
      router.push(`/ai/tools/${tool.slug}`);
    } else {
      // Desktop: show in side panel
      onSelect?.(tool);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
      className="group relative aspect-square bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer overflow-hidden"
    >
      {/* Logo */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        {tool.logo_url ? (
          <div className="relative w-full h-full min-h-[120px]">
            <Image
              src={tool.logo_url}
              alt={tool.name}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="text-4xl font-bold text-slate-300">
            {tool.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Hover overlay with description */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10"
      >
        <h3 className="text-lg font-semibold text-white mb-2 text-center">
          {tool.name}
        </h3>
        {tool.short_description && (
          <p className="text-sm text-slate-300 text-center line-clamp-3">
            {tool.short_description}
          </p>
        )}
      </motion.div>

      {/* Vote button - bottom right */}
      <div className="absolute bottom-3 right-3 z-20">
        <VoteButton
          toolId={tool.id}
          initialVotes={tool.votes}
          onVoteChange={(voted, newVotes) => {
            // Update local state if needed
            tool.votes = newVotes;
          }}
        />
      </div>
    </motion.div>
  );
}

