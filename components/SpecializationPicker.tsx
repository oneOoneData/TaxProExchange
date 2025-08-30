// /components/SpecializationPicker.tsx
"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, COMMON_WORK, ALL_ITEMS, SpecItem, SpecCategory } from "@/constants/specializations";

type Props = {
  selected: string[];                   // store item.value strings
  onToggle: (value: string) => void;    // add/remove from selected
  onClear: () => void;                  // clear all selections
  title?: string;
  subtitle?: string;
};

export default function SpecializationPicker({ selected, onToggle, onClear, title = "Tax Specializations", subtitle = "Select all the areas where you have expertise and experience", }: Props) {
  const [q, setQ] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    // Default open common + core returns
    const defaults: Record<string, boolean> = { common: true, "returns-entities": true };
    return defaults;
  });

  const normalizedQuery = q.trim().toLowerCase();

  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [] as SpecItem[];
    return ALL_ITEMS.filter((i) => {
      const label = i.label.toLowerCase();
      const hitLabel = label.includes(normalizedQuery);
      const hitSyn = (i.synonyms || []).some((s) => s.toLowerCase().includes(normalizedQuery));
      return hitLabel || hitSyn;
    });
  }, [normalizedQuery]);

  const toggleCat = (id: string) => setOpenCats((p) => ({ ...p, [id]: !p[id] }));
  const isSelected = (v: string) => selected.includes(v);

  const Chip = ({ item }: { item: SpecItem }) => (
    <button
      type="button"
      onClick={() => onToggle(item.value)}
      className={`px-3 py-2 rounded-full border text-sm transition ${
        isSelected(item.value)
          ? "bg-black text-white border-black"
          : "bg-white text-gray-800 border-gray-300 hover:border-gray-500"
      }`}
      aria-pressed={isSelected(item.value)}
    >
      {item.label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search specializations..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
          aria-label="Search specializations"
        />
        {selected.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm underline text-gray-700">Clear all</button>
        )}
      </div>

      {/* Selected summary */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-700">{selected.length} selected</span>
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" className="accent-black" checked={showAdvanced} onChange={() => setShowAdvanced((s) => !s)} />
          Show advanced categories
        </label>
      </div>

      {/* Selected pills (quick remove) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((v) => {
            const item = ALL_ITEMS.find((i) => i.value === v) || ({ value: v, label: v } as SpecItem);
            return (
              <button
                key={v}
                onClick={() => onToggle(v)}
                className="px-3 py-1.5 rounded-full bg-black text-white text-xs"
                aria-label={`Remove ${item.label}`}
              >
                {item.label} ✕
              </button>
            );
          })}
        </div>
      )}

      {/* Search mode */}
      {normalizedQuery && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Search results</h4>
            <span className="text-xs text-gray-500">{searchResults.length} matches</span>
          </div>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-600">No matches. Try a different term.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {searchResults.map((item) => (
                <Chip key={`sr-${item.value}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Common work */}
      {!normalizedQuery && (
        <section>
          <button type="button" onClick={() => toggleCat("common")} className="w-full text-left py-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Common Work</h4>
              <span className="text-sm text-gray-500">{openCats["common"] ? "−" : "+"}</span>
            </div>
          </button>
          {openCats["common"] && (
            <div className="mt-2 flex flex-wrap gap-2">
              {COMMON_WORK.map((item) => (
                <Chip key={`common-${item.value}`} item={item} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Categories */}
      {!normalizedQuery && (
        <div className="space-y-3">
          {CATEGORIES.filter((c) => (c.advanced ? showAdvanced : true)).map((cat) => (
            <section key={cat.id} className="border border-gray-200 rounded-lg p-3">
              <button type="button" onClick={() => toggleCat(cat.id)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium">{cat.label}</h5>
                  <span className="text-sm text-gray-500">{openCats[cat.id] ? "−" : "+"}</span>
                </div>
              </button>
              {openCats[cat.id] && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {cat.items.map((item) => (
                    <Chip key={`${cat.id}-${item.value}`} item={item} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
