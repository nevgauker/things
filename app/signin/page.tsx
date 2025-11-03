import { Suspense } from 'react';
import SignInClient from './SignInClient';

export default async function SignInPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const nextParam = (Array.isArray(sp?.next) ? sp.next[0] : sp?.next) || '/';
  const unauthorized = Array.isArray(sp?.unauthorized) ? sp.unauthorized[0] : sp?.unauthorized;
  return (
    <Suspense fallback={null}>
      <SignInClient next={nextParam} unauthorized={unauthorized} />
    </Suspense>
  );
}
