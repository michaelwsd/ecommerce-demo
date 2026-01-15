'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher, SignOutButton } from '@/components';

export default function OnboardPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Language state
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  // Form state
  const [verificationCode, setVerificationCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    const checkAuth = async () => {
      // Must be signed in with Clerk to access this page
      if (!isSignedIn) {
        router.push('/');
        return;
      }

      // Check if already registered
      const clerkRes = await fetch('/api/clerk-user');
      const clerkData = await clerkRes.json();

      if (clerkData.exists) {
        // Already registered, go to products
        router.push('/products');
        return;
      }

      // Automatically request verification code for new user
      try {
        await fetch('/api/clerk-user/request-code', { method: 'POST' });
        setSuccess(t('codeRequested'));
      } catch {
        // Code request failed, but still show onboarding
      }

      setLoading(false);
    };

    checkAuth();
  }, [isLoaded, isSignedIn, router]);

  const handleRequestCode = async () => {
    setCodeLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/clerk-user/request-code', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(t('codeRequested'));
      } else {
        setError(data.error || 'Failed to request code');
      }
    } catch {
      setError('Failed to request verification code');
    } finally {
      setCodeLoading(false);
    }
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const res = await fetch('/api/clerk-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: verificationCode,
          email: user?.primaryEmailAddress?.emailAddress || '',
          name: customerName,
          phone: customerPhone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        router.push('/products');
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <SignOutButton label={t('signOut')} />
        </div>
        <h1>{t('verificationRequired')}</h1>
        <p>{t('newCustomerVerification')}</p>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        <div style={{ marginBottom: '24px' }}>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={handleRequestCode}
            disabled={codeLoading}
          >
            {codeLoading ? t('requestingCode') : t('requestCode')}
          </button>
        </div>

        <form onSubmit={handleOnboard}>
          <div className="form-group">
            <label className="label">{t('verificationCode')}</label>
            <input
              type="text"
              className="input"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder={t('enterCode')}
              maxLength={4}
              pattern="[0-9]{4}"
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
              required
            />
          </div>

          <h3 style={{ marginTop: '24px', marginBottom: '16px' }}>{t('enterYourDetails')}</h3>

          <div className="form-group">
            <label className="label">{t('email')}</label>
            <input
              type="email"
              className="input"
              value={user?.primaryEmailAddress?.emailAddress || ''}
              disabled
              style={{ backgroundColor: '#f3f4f6' }}
            />
          </div>

          <div className="form-group">
            <label className="label">{t('yourName')}</label>
            <input
              type="text"
              className="input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('namePlaceholder')}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">{t('phoneNumber')}</label>
            <input
              type="tel"
              className="input"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder={t('phonePlaceholder')}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={formLoading}
          >
            {formLoading ? t('saving') : t('continueToProducts')}
          </button>
        </form>
      </div>
    </div>
  );
}
