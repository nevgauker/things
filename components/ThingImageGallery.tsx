"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function ThingImageGallery({ images, name }: { images: string[]; name?: string | null }) {
  const safeImages = Array.isArray(images) && images.length ? images : [];
  const [index, setIndex] = useState(0);
  const main = safeImages[index] || '/placeholder.png';

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <div className="relative h-64 w-full bg-gray-100 md:h-80">
        <Image
          src={main}
          alt={name || 'Thing'}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {safeImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-2">
          {safeImages.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative h-16 w-16 overflow-hidden rounded border ${i === index ? 'ring-2 ring-primary' : ''}`}
            >
              <Image src={src} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

