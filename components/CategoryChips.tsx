"use client";
import Image from 'next/image';
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
    <div className="-mx-1 flex snap-x snap-mandatory flex-row flex-wrap gap-2 overflow-x-auto px-1 py-1">
      {categories.map((c) => {
        const active = value.includes(c.name);
        return (
          <button
            key={c.name}
            onClick={() => toggle(c.name)}
            className={`snap-start inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
              active
                ? 'border-primary bg-primary text-white'
                : 'border-gray-200 bg-white text-gray-700 hover:border-primary'
            }`}
            aria-pressed={active}
            title={c.displayName}
          >
            <Image src={`/categories/${c.name}.png`} alt="" width={16} height={16} />
            <span className="whitespace-nowrap">{c.displayName}</span>
          </button>
        );
      })}
    </div>
  );
}
