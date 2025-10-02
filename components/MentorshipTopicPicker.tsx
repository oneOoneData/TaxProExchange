"use client";
import { MENTORSHIP_TOPICS } from "@/lib/types";
import { useState } from "react";

interface MentorshipTopicPickerProps {
  value: string[];
  onChange: (v: string[]) => void;
}

export default function MentorshipTopicPicker({ value, onChange }: MentorshipTopicPickerProps) {
  const [topics, setTopics] = useState<string[]>(value ?? []);
  
  const toggle = (t: string) => {
    const next = topics.includes(t) ? topics.filter(x => x !== t) : [...topics, t];
    setTopics(next);
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {MENTORSHIP_TOPICS.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => toggle(t)}
          className={`px-3 py-1 rounded-full border text-sm transition-colors ${
            topics.includes(t) 
              ? "bg-black text-white border-black" 
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
          }`}
        >
          {t.replace("software_", "").replace(/_/g, " ").toUpperCase()}
        </button>
      ))}
    </div>
  );
}
