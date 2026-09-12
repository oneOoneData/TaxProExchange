// /components/SpecializationPicker.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, COMMON_WORK, ALL_ITEMS, SpecItem, SpecCategory } from "@/constants/specializations";

type Props = {
  selected: string[];                   // store item.value strings
  onToggle: (value: string) => void;    // add/remove from selected
  onClear: () => void;                  // clear all selections
  title?: string;
  subtitle?: string;
  // Category ids to render first, ahead of the rest (e.g. bookkeeper
  // profiles want "bookkeeping-close" surfaced instead of buried third).
  // Omit to keep the original catalog order.
  priorityCategoryIds?: string[];
  // Category ids to default-open. Omit to keep the original default
  // ("common" + "returns-entities") -- callers pass this to focus a
  // role-specific view (e.g. a bookkeeper-only profile) without changing
  // behavior for everyone else. May arrive after the initial render if the
  // caller has to fetch the profile's role first -- see the effect below.
  defaultOpenIds?: string[];
  // Hides the "Common Work" section entirely (it's a fixed, tax-filing
  // oriented bucket -- 1040, S-Corp, etc. -- that doesn't fit a
  // bookkeeper-only profile even collapsed, since its own label invites a
  // click). Omit/false to keep showing it.
  hideCommonWork?: boolean;
};

export default function SpecializationPicker({
  selected,
  onToggle,
  onClear,
  title = "Specializations",
  subtitle = "Select all the areas where you have expertise and experience",
  priorityCategoryIds,
  defaultOpenIds,
  hideCommonWork = false,
}: Props) {
  const [q, setQ] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [openCats, setOpenCats] = useState<Record<string, boolean>>(() => {
    const ids = defaultOpenIds ?? ["common", "returns-entities"];
    const defaults: Record<string, boolean> = {};
    ids.forEach((id) => { defaults[id] = true; });
    return defaults;
  });

  // defaultOpenIds often depends on the profile's professional_roles, which
  // the caller may still be fetching when this component first mounts --
  // the useState initializer above only runs once, so a role that resolves
  // after mount would otherwise be silently ignored. Re-apply it the first
  // time it actually changes (keyed by value, not array identity, so this
  // doesn't fire on every render and doesn't stomp on the user's own
  // manual expand/collapse clicks afterward).
  const defaultOpenKey = (defaultOpenIds || []).join(",");
  const appliedDefaultOpenKey = useRef<string | null>(null);
  useEffect(() => {
    if (appliedDefaultOpenKey.current === defaultOpenKey) return;
    appliedDefaultOpenKey.current = defaultOpenKey;
    if (defaultOpenIds && defaultOpenIds.length > 0) {
      const defaults: Record<string, boolean> = {};
      defaultOpenIds.forEach((id) => { defaults[id] = true; });
      setOpenCats(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultOpenKey]);

  const orderedCategories = useMemo(() => {
    if (!priorityCategoryIds || priorityCategoryIds.length === 0) return CATEGORIES;
    const priority = CATEGORIES
      .filter((c) => priorityCategoryIds.includes(c.id))
      .sort((a, b) => priorityCategoryIds.indexOf(a.id) - priorityCategoryIds.indexOf(b.id));
    const rest = CATEGORIES.filter((c) => !priorityCategoryIds.includes(c.id));
    return [...priority, ...rest];
  }, [priorityCategoryIds]);

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
      {!normalizedQuery && !hideCommonWork && (
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
          {orderedCategories.filter((c) => (c.advanced ? showAdvanced : true)).map((cat) => (
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
