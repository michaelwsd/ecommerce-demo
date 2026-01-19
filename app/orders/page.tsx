'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { translations, Language, TranslationKey } from '@/lib/translations';
import { LanguageSwitcher, SignOutButton } from '@/components';

interface Order {
  id: number;
  product_name: string;
  quantity: number;
  collection_date: string | null;
  collection_time: string | null;
  created_at: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [language, setLanguage] = useState<Language>('en');
  const t = (key: TranslationKey) => translations[language][key];

  useEffect(() => {
    checkAuthAndLoad();
  }, []);

  const checkAuthAndLoad = async () => {
    try {
      const customerRes = await fetch('/api/customer/check');
      const customerData = await customerRes.json();

      if (customerData.authenticated) {
        await loadOrders();
        setLoading(false);
        return;
      }

      router.push('/');
    } catch {
      router.push('/');
    }
  };

  const loadOrders = async () => {
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      console.error('Failed to load orders');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm(t('confirmDeleteOrder'))) return;

    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/orders', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();

      if (data.success) {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
        setSuccess(t('orderDeleted'));
      } else {
        setError(data.error || t('failedDeleteOrder'));
      }
    } catch {
      setError(t('failedDeleteOrder'));
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
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
          <Link
            className="btn btn-secondary"
            style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
            href="/products"
          >
            {t('backToProducts')}
          </Link>
          <SignOutButton label={t('signOut')} />
        </div>
        <h1>{t('myOrders')}</h1>
        <p>{t('myOrdersSubtitle')}</p>
      </div>

      {error && <div className="message message-error">{error}</div>}
      {success && <div className="message message-success">{success}</div>}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '20px', color: '#6b7280' }}>{t('noOrders')}</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>{t('product')}</th>
                <th>{t('quantity')}</th>
                <th>{t('preferredCollection')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontWeight: '600' }}>{order.product_name}</td>
                  <td>{order.quantity ?? '-'}</td>
                  <td>
                    {order.collection_date && order.collection_time ? (
                      <span>
                        {new Date(order.collection_date).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')} {order.collection_time}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>-</span>
                    )}
                  </td>
                  <td>{new Date(order.created_at).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US')}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
                      onClick={() => handleDeleteOrder(order.id)}
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
    </div>
  );
}
