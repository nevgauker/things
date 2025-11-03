import ThingEditForm from '@/components/ThingEditForm';

type Thing = {
  id: string;
  name?: string;
  imageUrl?: string;
  type?: string;
  category?: string;
  price?: number;
  currencySymbol?: string;
  city?: string;
  country?: string;
  status?: string;
  start?: string;
  end?: string;
  latitude?: number;
  longitude?: number;
};

async function getThing(id: string): Promise<Thing | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/things/${id}`, {
      next: { revalidate: 0 },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thing as Thing;
  } catch {
    return null;
  }
}

export default async function EditThingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const thing = await getThing(id);
  if (!thing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold">Thing not found</h1>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 md:px-6">
      <h1 className="mb-4 text-2xl font-semibold">Edit Thing</h1>
      <ThingEditForm thing={thing as any} />
    </div>
  );
}

