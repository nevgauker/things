import { Suspense } from 'react';
import ResetPasswordClient from '../ResetPasswordClient';

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient token={token} />
    </Suspense>
  );
}

