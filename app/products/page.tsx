'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher, ProductCard, InquiryModal, SignOutButton } from '@/components';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
}

interface CustomerData {
  name: string;
  phone: string;
}

export default function ProductsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inquiryLoading, setInquiryLoading] = useState(false);

  // Language state
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  // Customer state
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Inquiry state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [collectionDate, setCollectionDate] = useState('');
  const [collectionTime, setCollectionTime] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    checkAuthAndLoad();
  }, [isLoaded, isSignedIn]);

  const checkAuthAndLoad = async () => {
    try {
      // If user is signed in with Clerk, check if they're registered
      if (isSignedIn) {
        const clerkRes = await fetch('/api/clerk-user');
        const clerkData = await clerkRes.json();

        if (clerkData.exists) {
          setCurrentCustomer({ name: clerkData.user.name, phone: clerkData.user.phone });
          await loadProducts();
          setLoading(false);
          return;
        } else {
          // Not registered, redirect to onboarding
          router.push('/onboard');
          return;
        }
      }

      // Check legacy device-based auth
      const customerRes = await fetch('/api/customer/check');
      const customerData = await customerRes.json();

      if (customerData.verified && customerData.hasOnboarded) {
        setCurrentCustomer({ name: customerData.name, phone: customerData.phone });
        await loadProducts();
        setLoading(false);
        return;
      }

      // Not authenticated, redirect to home
      router.push('/');
    } catch {
      router.push('/');
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      console.error('Failed to load products');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setError('');
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    setCollectionDate('');
    setCollectionTime('');
    setError('');
  };

  const handleInquiry = async () => {
    if (!selectedProduct) return;

    if (!collectionDate || !collectionTime) {
      setError(t('collectionRequired'));
      return;
    }

    setInquiryLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          collectionDate,
          collectionTime,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(t('inquirySent'));
        handleCloseModal();
      } else {
        setError(data.error || t('failedInquiry'));
      }
    } catch {
      setError(t('failedInquiryRetry'));
    } finally {
      setInquiryLoading(false);
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
        {isSignedIn && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <SignOutButton label={t('signOut')} />
          </div>
        )}
        <h1>{t('ourProducts')}</h1>
        <p>{t('welcomeCustomer')}, {currentCustomer?.name}! {t('clickToInquire')}</p>
      </div>

      {error && <div className="message message-error">{error}</div>}
      {success && <div className="message message-success">{success}</div>}

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '20px', color: '#6b7280' }}>{t('noProductsAvailable')}</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={handleProductClick}
              noImageText={t('noImage')}
            />
          ))}
        </div>
      )}

      {selectedProduct && currentCustomer && (
        <InquiryModal
          product={selectedProduct}
          customerPhone={currentCustomer.phone}
          collectionDate={collectionDate}
          collectionTime={collectionTime}
          onCollectionDateChange={setCollectionDate}
          onCollectionTimeChange={setCollectionTime}
          onSubmit={handleInquiry}
          onClose={handleCloseModal}
          loading={inquiryLoading}
          error={error}
          translations={{
            interestedInProduct: t('interestedInProduct'),
            contactMessage: t('contactMessage'),
            preferredCollection: t('preferredCollection'),
            collectionDate: t('collectionDate'),
            collectionTime: t('collectionTime'),
            yesContactMe: t('yesContactMe'),
            sending: t('sending'),
            cancel: t('cancel'),
          }}
        />
      )}
    </div>
  );
}
