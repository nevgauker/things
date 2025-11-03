"use client";
import { categories } from '@/lib/api/types';

export default function CategoryChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (name: string) => {
    const set = new Set(value);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    onChange(Array.from(set));
  };

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => (
        <button
          key={c.name}
          onClick={() => toggle(c.name)}
          className={`rounded-full border px-3 py-1 text-sm ${
            value.includes(c.name)
              ? 'border-primary bg-primary text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-primary'
          }`}
        >
          {c.displayName}
        </button>
      ))}
    </div>
  );
}

