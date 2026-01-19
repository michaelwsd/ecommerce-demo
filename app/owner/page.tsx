'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher } from '@/components';

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
  quantity: number;
  collection_date: string | null;
  collection_time: string | null;
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

export default function OwnerPage() {
  const router = useRouter();
  const [view, setView] = useState<'login' | 'dashboard'>('login');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
  const [formLoading, setFormLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check authentication status on load
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();

      if (data.authenticated) {
        await loadProducts();
        await loadInquiries();
        await loadInbox();
        setView('dashboard');
      }
      setLoading(false);
    } catch {
      setLoading(false);
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadProducts(), loadInquiries(), loadInbox()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleOwnerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);

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
        setView('dashboard');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOwnerLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFormLoading(true);

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
      setFormLoading(false);
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

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ fontSize: '24px' }}>{t('loading')}</p>
      </div>
    );
  }

  // Render owner login
  if (view === 'login') {
    return (
      <div className="container">
        <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
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
              disabled={formLoading}
            >
              {formLoading ? t('loggingIn') : t('login')}
            </button>
          </form>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => router.push('/')}
          >
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  // Render owner dashboard
  return (
    <div className="container">
      <LanguageSwitcher language={language} onLanguageChange={setLanguage} />
      <div className="header">
        <h1>{t('dashboardTitle')}</h1>
        <p>{t('dashboardSubtitle')}</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
          <button
            className="btn btn-primary"
            style={{ padding: '8px 16px', minHeight: 'auto' }}
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? t('refreshing') : t('refresh')}
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '8px 16px', minHeight: 'auto' }}
            onClick={handleOwnerLogout}
          >
            {t('logout')}
          </button>
        </div>
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
                disabled={formLoading}
              >
                {formLoading ? t('adding') : t('addProduct')}
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
                    <th>{t('quantity')}</th>
                    <th>{t('preferredCollection')}</th>
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
                      <td>{inquiry.quantity ?? '-'}</td>
                      <td>
                        {inquiry.collection_date && inquiry.collection_time ? (
                          <span>
                            {new Date(inquiry.collection_date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')} {inquiry.collection_time}
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>-</span>
                        )}
                      </td>
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
