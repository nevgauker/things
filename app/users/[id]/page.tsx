import Image from 'next/image';
import type { User } from '@/lib/api/types';

async function getUser(id: string): Promise<User | null> {
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const res = await fetch(`${base}/api/users/${id}`, { cache: 'no-store', next: { revalidate: 0 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user as User;
  } catch {
    return null;
  }
}

export const dynamic = 'force-dynamic';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold">User not found</h1>
        <p className="mt-2 text-gray-600">We couldn’t load that user.</p>
      </div>
    );
  }

  const avatar = user.userAvatar || '/avatar.png';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <div className="flex items-center gap-4">
        <Image src={avatar} alt="User avatar" width={80} height={80} className="h-20 w-20 rounded-full object-cover ring-1 ring-gray-200" />
        <div>
          <h1 className="text-2xl font-semibold">{user.name || 'Profile'}</h1>
          {user.email && <div className="text-gray-600">{user.email}</div>}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {user.preferredCurrency && (
          <div className="text-sm"><span className="text-gray-500">Preferred currency:</span> <span className="font-medium">{user.preferredCurrency}</span></div>
        )}
        {user.phoneNumber && (
          <div className="text-sm"><span className="text-gray-500">Phone:</span> <span className="font-medium">{user.phoneNumber}</span></div>
        )}
      </div>
    </div>
  );
}

