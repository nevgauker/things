import { Suspense } from 'react';
import SignUpClient from './SignUpClient';

export default async function SignUpPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const nextParam = (Array.isArray(sp?.next) ? sp.next[0] : sp?.next) || '/';
  return (
    <Suspense fallback={null}>
      <SignUpClient next={nextParam} />
    </Suspense>
  );
}
