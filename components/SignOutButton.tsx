'use client';

import { useClerk } from '@clerk/nextjs';

interface SignOutButtonProps {
  label: string;
  className?: string;
}

export function SignOutButton({ label, className = '' }: SignOutButtonProps) {
  const { signOut } = useClerk();

  const handleSignOut = async () => {
    await signOut({ redirectUrl: '/' });
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
