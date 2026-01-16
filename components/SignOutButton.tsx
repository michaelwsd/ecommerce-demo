'use client';

import { useRouter } from 'next/navigation';

interface SignOutButtonProps {
  label: string;
  className?: string;
}

export function SignOutButton({ label, className = '' }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch('/api/customer/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <button
      className={`btn btn-secondary ${className}`}
      onClick={handleSignOut}
      style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
    >
      {label}
    </button>
  );
}
