"use client";

import { useMemo, useState } from "react";

type Option = { value: string; label: string };

export function Combobox({
  label,
  name,
  options,
  defaultValue,
  placeholder = "Search…",
  onValueChange,
  required,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  placeholder?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 200);
    return options
      .filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q))
      .slice(0, 200);
  }, [options, query]);

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-700" htmlFor={`${name}-search`}>
        {label}
      </label>
      <input type="hidden" name={name} value={selected} required={required} />
      <input
        id={`${name}-search`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none ring-emerald-500/30 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4"
      />
      <div className="max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        {filtered.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setSelected(o.value);
              setQuery(o.label);
              onValueChange?.(o.value);
            }}
            className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition hover:bg-slate-50 ${
              selected === o.value ? "bg-emerald-50" : ""
            }`}
          >
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600 opacity-80" />
            <span className="text-slate-900">{o.label}</span>
          </button>
        ))}
        {filtered.length === 0 ? (
          <div className="px-3 py-3 text-sm text-slate-600">No matches.</div>
        ) : null}
      </div>
      <p className="text-xs text-slate-500">Tip: search for “Los Angeles”, “New York”, or “America/…”.</p>
    </div>
  );
}

