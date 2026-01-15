'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, SignInButton, SignUpButton } from '@clerk/nextjs';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher } from '@/components';

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  useEffect(() => {
    if (!isLoaded) return;

    const checkAuth = async () => {
      try {
        // Check if owner is logged in
        const ownerRes = await fetch('/api/auth/check');
        const ownerData = await ownerRes.json();

        if (ownerData.authenticated) {
          router.push('/owner');
          return;
        }

        // If user is signed in with Clerk, check if they're registered
        if (isSignedIn) {
          const clerkRes = await fetch('/api/clerk-user');
          const clerkData = await clerkRes.json();

          if (clerkData.exists) {
            router.push('/products');
          } else {
            router.push('/onboard');
          }
          return;
        }

        // Check if customer is verified (legacy device-based auth)
        const customerRes = await fetch('/api/customer/check');
        const customerData = await customerRes.json();

        if (customerData.verified && customerData.hasOnboarded) {
          router.push('/products');
          return;
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    checkAuth();
  }, [isLoaded, isSignedIn, router]);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ fontSize: '24px' }}>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      <div className="header">
        <h1>{t('welcomeTitle')}</h1>
        <p>{t('welcomeSubtitle')}</p>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '16px' }}
          onClick={() => router.push('/owner')}
        >
          {t('iAmOwner')}
        </button>
        <div style={{ marginBottom: '16px' }}>
          <SignInButton mode="modal">
            <button
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              {t('signIn')} ({t('iAmCustomer')})
            </button>
          </SignInButton>
        </div>
        <SignUpButton mode="modal">
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
          >
            {t('signUp')} ({t('iAmCustomer')})
          </button>
        </SignUpButton>
      </div>
    </div>
  );
}
