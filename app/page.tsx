'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher } from '@/components';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if owner is logged in
        const ownerRes = await fetch('/api/auth/check');
        const ownerData = await ownerRes.json();

        if (ownerData.authenticated) {
          router.push('/owner');
          return;
        }

        // Check if customer is logged in via phone session
        const customerRes = await fetch('/api/customer/check');
        const customerData = await customerRes.json();

        if (customerData.authenticated) {
          router.push('/products');
          return;
        }

        setLoading(false);
      } catch {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    try {
      const res = await fetch('/api/phone-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.loggedIn) {
          // Returning user - already logged in, go to products
          router.push('/products');
        } else {
          // New user - redirect to verification page to enter code and name
          router.push(`/verify?phone=${encodeURIComponent(phoneNumber)}`);
        }
      } else {
        setError(data.error || t('phoneSubmitFailed'));
      }
    } catch {
      setError(t('phoneSubmitFailed'));
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
        <h1>{t('welcomeTitle')}</h1>
        <p>{t('welcomeSubtitle')}</p>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginBottom: '24px' }}
          onClick={() => router.push('/owner')}
        >
          {t('iAmOwner')}
        </button>

        <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
          <h3 style={{ marginBottom: '16px', textAlign: 'center' }}>{t('iAmCustomer')}</h3>

          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handlePhoneSubmit}>
            <div className="form-group">
              <label className="label">{t('phoneNumber')}</label>
              <input
                type="tel"
                className="input"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder={t('phonePlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              disabled={formLoading}
            >
              {formLoading ? t('loading') : t('continueWithPhone')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
