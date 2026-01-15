'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
}

interface Inquiry {
  id: number;
  customer_name: string;
  customer_phone: string;
  product_name: string;
  created_at: string;
}

interface OwnerMessage {
  id: number;
  type: 'verification' | 'inquiry';
  title: string;
  content: string;
  metadata: string | null;
  is_read: number;
  created_at: string;
}

type ViewState =
  | 'loading'
  | 'login-choice'
  | 'owner-login'
  | 'owner-dashboard'
  | 'customer-verify'
  | 'customer-code'
  | 'customer-onboard'
  | 'customer-products';

export default function Home() {
  const [view, setView] = useState<ViewState>('loading');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Language state
  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  // Owner state
  const [ownerUsername, setOwnerUsername] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inboxMessages, setInboxMessages] = useState<OwnerMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminTab, setAdminTab] = useState<'inbox' | 'products' | 'inquiries'>('inbox');

  // Product form state
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productImage, setProductImage] = useState<File | null>(null);

  // Customer state
  const [deviceId, setDeviceId] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [currentCustomer, setCurrentCustomer] = useState<{ name: string; phone: string } | null>(null);

  // Selected product for inquiry
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Check authentication status on load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check if owner is logged in
      const ownerRes = await fetch('/api/auth/check');
      const ownerData = await ownerRes.json();

      if (ownerData.authenticated) {
        await loadProducts();
        await loadInquiries();
        await loadInbox();
        setView('owner-dashboard');
        return;
      }

      // Check if customer is verified
      const customerRes = await fetch('/api/customer/check');
      const customerData = await customerRes.json();

      if (customerData.verified && customerData.hasOnboarded) {
        setCurrentCustomer({ name: customerData.name, phone: customerData.phone });
        setDeviceId(customerData.deviceId);
        await loadProducts();
        setView('customer-products');
        return;
      }

      if (customerData.deviceId) {
        setDeviceId(customerData.deviceId);
      }

      setView('login-choice');
    } catch {
      setView('login-choice');
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

  const loadInquiries = async () => {
    try {
      const res = await fetch('/api/inquiry');
      const data = await res.json();
      setInquiries(data.inquiries || []);
    } catch {
      console.error('Failed to load inquiries');
    }
  };

  const loadInbox = async () => {
    try {
      const res = await fetch('/api/inbox');
      const data = await res.json();
      setInboxMessages(data.messages || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      console.error('Failed to load inbox');
    }
  };

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: ownerUsername, password: ownerPassword }),
      });

      const data = await res.json();

      if (data.success) {
        await loadProducts();
        await loadInquiries();
        await loadInbox();
        setView('owner-dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOwnerLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setView('login-choice');
    setOwnerUsername('');
    setOwnerPassword('');
  };

  const handleCustomerVerifyRequest = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: deviceId || undefined }),
      });

      const data = await res.json();

      if (data.verified) {
        if (data.hasOnboarded) {
          await loadProducts();
          setView('customer-products');
        } else {
          setView('customer-onboard');
        }
      } else {
        setDeviceId(data.deviceId);
        setView('customer-code');
      }
    } catch {
      setError('Verification request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  const handleCodeVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, code: verificationCode }),
      });

      const data = await res.json();

      if (data.success) {
        setView('customer-onboard');
      } else {
        setError(data.error || 'Invalid code');
      }
    } catch {
      setError('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/customer/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          code: verificationCode,
          name: customerName,
          phone: customerPhone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentCustomer({ name: customerName, phone: customerPhone });
        await loadProducts();
        setView('customer-products');
      } else {
        setError(data.error || 'Onboarding failed');
      }
    } catch {
      setError('Onboarding failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', productName);
      formData.append('description', productDescription);
      formData.append('price', productPrice);
      if (productImage) {
        formData.append('image', productImage);
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Product added successfully!');
        setProductName('');
        setProductDescription('');
        setProductPrice('');
        setProductImage(null);
        await loadProducts();
      } else {
        setError(data.error || 'Failed to add product');
      }
    } catch {
      setError('Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        await loadProducts();
      } else {
        setError(data.error || 'Failed to delete product');
      }
    } catch {
      setError('Failed to delete product');
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleMarkMessageRead = async (messageId: number) => {
    try {
      await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', messageId }),
      });
      await loadInbox();
    } catch {
      console.error('Failed to mark message as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/inbox', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead' }),
      });
      await loadInbox();
    } catch {
      console.error('Failed to mark all messages as read');
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    try {
      await fetch('/api/inbox', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });
      await loadInbox();
    } catch {
      console.error('Failed to delete message');
    }
  };

  const handleAcknowledgeInquiry = async (inquiryId: number) => {
    try {
      await fetch('/api/inquiry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inquiryId }),
      });
      await loadInquiries();
    } catch {
      console.error('Failed to acknowledge inquiry');
    }
  };

  const handleInquiry = async () => {
    if (!selectedProduct) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          productName: selectedProduct.name,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(t('inquirySent'));
        setSelectedProduct(null);
      } else {
        setError(data.error || t('failedInquiry'));
      }
    } catch {
      setError(t('failedInquiryRetry'));
    } finally {
      setLoading(false);
    }
  };

  // Trigger verification when entering customer verify view
  useEffect(() => {
    if (view === 'customer-verify') {
      handleCustomerVerifyRequest();
    }
  }, [view, handleCustomerVerifyRequest]);

  // Language switcher component
  const LanguageSwitcher = () => (
    <div className="language-switcher">
      <span className="lang-icon">🌐</span>
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
      >
        English
      </button>
      <button
        className={`lang-btn ${language === 'zh' ? 'active' : ''}`}
        onClick={() => setLanguage('zh')}
      >
        中文
      </button>
    </div>
  );

  // Render loading state
  if (view === 'loading') {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ fontSize: '24px' }}>{t('loading')}</p>
      </div>
    );
  }

  // Render login choice
  if (view === 'login-choice') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
          <h1>{t('welcomeTitle')}</h1>
          <p>{t('welcomeSubtitle')}</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            onClick={() => setView('owner-login')}
          >
            {t('iAmOwner')}
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('customer-verify')}
          >
            {t('iAmCustomer')}
          </button>
        </div>
      </div>
    );
  }

  // Render owner login
  if (view === 'owner-login') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
          <h1>{t('ownerLoginTitle')}</h1>
          <p>{t('ownerLoginSubtitle')}</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleOwnerLogin}>
            <div className="form-group">
              <label className="label">{t('username')}</label>
              <input
                type="text"
                className="input"
                value={ownerUsername}
                onChange={(e) => setOwnerUsername(e.target.value)}
                placeholder={t('usernamePlaceholder')}
                required
              />
            </div>

            <div className="form-group">
              <label className="label">{t('password')}</label>
              <input
                type="password"
                className="input"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={loading}
            >
              {loading ? t('loggingIn') : t('login')}
            </button>
          </form>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('login-choice')}
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  // Render owner dashboard
  if (view === 'owner-dashboard') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
          <h1>{t('dashboardTitle')}</h1>
          <p>{t('dashboardSubtitle')}</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
            onClick={handleOwnerLogout}
          >
            {t('logout')}
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${adminTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setAdminTab('inbox')}
          >
            {t('inbox')} {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button
            className={`tab ${adminTab === 'products' ? 'active' : ''}`}
            onClick={() => setAdminTab('products')}
          >
            {t('products')}
          </button>
          <button
            className={`tab ${adminTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setAdminTab('inquiries')}
          >
            {t('inquiries')} ({inquiries.length})
          </button>
        </div>

        {adminTab === 'inbox' && (
          <>
            <div className="inbox-header">
              <h2 className="section-title">{t('messages')}</h2>
              {inboxMessages.length > 0 && unreadCount > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
                  onClick={handleMarkAllRead}
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>
            {inboxMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>{t('noMessages')}</p>
                <span>{t('messagesWillAppear')}</span>
              </div>
            ) : (
              <div className="message-list">
                {inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-card ${msg.is_read ? 'read' : 'unread'} ${msg.type === 'verification' ? 'verification-message' : ''}`}
                    onClick={() => !msg.is_read && handleMarkMessageRead(msg.id)}
                  >
                    <div className="message-icon">
                      {msg.type === 'verification' ? '🔑' : '💬'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <h3>{msg.title}</h3>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')} {new Date(msg.created_at).toLocaleTimeString(language === 'zh' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {msg.type === 'verification' ? (
                        <div className="verification-code-display">
                          <span className="code-label">{t('verificationCode')}: </span>
                          <span className="code-value">{msg.content}</span>
                        </div>
                      ) : (
                        <p className="message-body">{msg.content}</p>
                      )}
                      <div className="message-actions">
                        {!msg.is_read && (
                          <span className="unread-badge">{t('new')}</span>
                        )}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          title={t('delete')}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {adminTab === 'products' && (
          <>
            {error && <div className="message message-error">{error}</div>}
            {success && <div className="message message-success">{success}</div>}

            <div className="card" style={{ marginBottom: '32px' }}>
              <h2 className="section-title">{t('addNewProduct')}</h2>
              <form onSubmit={handleAddProduct}>
                <div className="form-group">
                  <label className="label">{t('productName')}</label>
                  <input
                    type="text"
                    className="input"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t('productNamePlaceholder')}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">{t('description')}</label>
                  <textarea
                    className="input"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">{t('price')}</label>
                  <input
                    type="number"
                    className="input"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">{t('productImage')}</label>
                  <input
                    type="file"
                    className="input"
                    accept="image/*"
                    onChange={(e) => setProductImage(e.target.files?.[0] || null)}
                    style={{ padding: '12px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? t('adding') : t('addProduct')}
                </button>
              </form>
            </div>

            <h2 className="section-title">{t('currentProducts')} ({products.length})</h2>
            {products.length === 0 ? (
              <p style={{ color: '#6b7280' }}>{t('noProducts')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('image')}</th>
                      <th>{t('name')}</th>
                      <th>{t('price')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>
                          {product.image_path ? (
                            <Image
                              src={product.image_path}
                              alt={product.name}
                              width={60}
                              height={60}
                              style={{ objectFit: 'cover', borderRadius: '8px' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 60,
                                height: 60,
                                background: '#f3f4f6',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#9ca3af',
                              }}
                            >
                              {t('noImg')}
                            </div>
                          )}
                        </td>
                        <td style={{ fontWeight: '600' }}>{product.name}</td>
                        <td>${product.price.toFixed(2)}</td>
                        <td>
                          <button
                            className="btn btn-danger"
                            style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '16px' }}
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            {t('delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {adminTab === 'inquiries' && (
          <>
            <h2 className="section-title">{t('customerInquiries')}</h2>
            {inquiries.length === 0 ? (
              <p style={{ color: '#6b7280' }}>{t('noInquiries')}</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t('customerName')}</th>
                      <th>{t('phone')}</th>
                      <th>{t('product')}</th>
                      <th>{t('date')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td style={{ fontWeight: '600' }}>{inquiry.customer_name}</td>
                        <td>{inquiry.customer_phone}</td>
                        <td>{inquiry.product_name}</td>
                        <td>{new Date(inquiry.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
                            onClick={() => handleAcknowledgeInquiry(inquiry.id)}
                          >
                            {t('acknowledge')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Render customer code verification
  if (view === 'customer-code') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
          <h1>{t('verificationTitle')}</h1>
          <p>{t('verificationSubtitle')}</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleCodeVerify}>
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

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={loading}
            >
              {loading ? t('verifying') : t('verifyCode')}
            </button>
          </form>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('login-choice')}
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  // Render customer onboarding
  if (view === 'customer-onboard') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
          <h1>{t('almostThere')}</h1>
          <p>{t('onboardingSubtitle')}</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleCustomerOnboard}>
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
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? t('saving') : t('continueToProducts')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render customer products view
  if (view === 'customer-products') {
    return (
      <div className="container">
        <LanguageSwitcher />
        <div className="header">
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
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleProductClick(product)}
              >
                {product.image_path ? (
                  <Image
                    src={product.image_path}
                    alt={product.name}
                    width={300}
                    height={200}
                    className="product-image"
                    style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="product-image"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#9ca3af',
                      fontSize: '16px',
                    }}
                  >
                    {t('noImage')}
                  </div>
                )}
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <p className="product-price">${product.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inquiry Modal */}
        {selectedProduct && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t('interestedInProduct')}</h2>
              <p style={{ marginBottom: '24px', fontSize: '18px' }}>
                <strong>{selectedProduct.name}</strong> - ${selectedProduct.price.toFixed(2)}
              </p>
              <p style={{ marginBottom: '24px', color: '#6b7280' }}>
                {t('contactMessage')}{' '}
                <strong>{currentCustomer?.phone}</strong>
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleInquiry}
                  disabled={loading}
                >
                  {loading ? t('sending') : t('yesContactMe')}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedProduct(null)}
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Render customer verify (loading state)
  if (view === 'customer-verify') {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <LanguageSwitcher />
        {error ? (
          <>
            <div className="message message-error" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
              {error}
            </div>
            <button className="btn btn-secondary" onClick={() => setView('login-choice')}>
              {t('back')}
            </button>
          </>
        ) : (
          <p style={{ fontSize: '24px' }}>{t('checkingDevice')}</p>
        )}
      </div>
    );
  }

  return null;
}
