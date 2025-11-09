"use client";
import { useState } from 'react';
import Image from 'next/image';

export default function ThingImageGallery({ images, name }: { images: string[]; name?: string | null }) {
  const safeImages = Array.isArray(images) && images.length ? images : [];
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const main = safeImages[index] || '/placeholder.png';

  return (
    <>
    <div className="overflow-hidden rounded-lg border bg-white">
      <button type="button" className="relative h-64 w-full bg-gray-100 md:h-80" onClick={()=>setOpen(true)} aria-label="Open image viewer">
        <Image
          src={main}
          alt={name || 'Thing'}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </button>
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
    {open && (
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80" onClick={()=>setOpen(false)}>
        <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded bg-white/10 p-2 text-white hover:bg-white/20" onClick={()=>setOpen(false)}>✕</button>
        {safeImages.length>1 && (
          <>
            <button type="button" aria-label="Prev" className="absolute left-4 top-1/2 -translate-y-1/2 rounded bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e)=>{ e.stopPropagation(); setIndex((i)=> (i-1+safeImages.length)%safeImages.length); }}>‹</button>
            <button type="button" aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 rounded bg-white/10 p-2 text-white hover:bg-white/20" onClick={(e)=>{ e.stopPropagation(); setIndex((i)=> (i+1)%safeImages.length); }}>›</button>
          </>
        )}
        <div className="relative h-[70vh] w-[90vw] max-w-4xl">
          <Image src={main} alt={name || ''} fill sizes="80vw" className="object-contain" />
        </div>
      </div>
    )}
    </>
  );
}
