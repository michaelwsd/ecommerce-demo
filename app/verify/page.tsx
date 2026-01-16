'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher } from '@/components';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Language state
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  // Form state
  const [verificationCode, setVerificationCode] = useState('');
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (!phone) {
      router.push('/');
    }
  }, [phone, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/phone-auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: verificationCode,
          name: customerName,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(t('verificationSuccess'));
        router.push('/products');
      } else {
        setError(data.error || t('verificationFailed'));
      }
    } catch {
      setError(t('verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (!phone) {
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
        <h1>{t('verificationRequired')}</h1>
        <p>{t('newCustomerVerification')}</p>
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>{t('phoneNumber')}</p>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{phone}</p>
        </div>

        <form onSubmit={handleVerify}>
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px' }}
            disabled={loading}
          >
            {loading ? t('verifying') : t('verifyAndContinue')}
          </button>
        </form>

        <button
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '12px' }}
          onClick={() => router.push('/')}
        >
          {t('back')}
        </button>
      </div>
    </div>
  );
}
