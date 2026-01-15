'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

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

  // Owner state
  const [ownerEmail, setOwnerEmail] = useState('');
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
  const [pendingCode, setPendingCode] = useState('');
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
        body: JSON.stringify({ email: ownerEmail, password: ownerPassword }),
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
    setOwnerEmail('');
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
        // In development, show the code
        if (data.code) {
          setPendingCode(data.code);
        }
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
        setSuccess(data.message);
        setSelectedProduct(null);
      } else {
        setError(data.error || 'Failed to send inquiry');
      }
    } catch {
      setError('Failed to send inquiry. Please try again.');
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

  // Render loading state
  if (view === 'loading') {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: '100px' }}>
        <p style={{ fontSize: '24px' }}>Loading...</p>
      </div>
    );
  }

  // Render login choice
  if (view === 'login-choice') {
    return (
      <div className="container">
        <div className="header">
          <h1>Welcome to Our Store</h1>
          <p>Please select how you would like to continue</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginBottom: '16px' }}
            onClick={() => setView('owner-login')}
          >
            I am the Store Owner
          </button>
          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('customer-verify')}
          >
            I am a Customer
          </button>
        </div>
      </div>
    );
  }

  // Render owner login
  if (view === 'owner-login') {
    return (
      <div className="container">
        <div className="header">
          <h1>Owner Login</h1>
          <p>Enter your credentials to access the dashboard</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleOwnerLogin}>
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                value={ownerPassword}
                onChange={(e) => setOwnerPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginBottom: '16px' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('login-choice')}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Render owner dashboard
  if (view === 'owner-dashboard') {
    return (
      <div className="container">
        <div className="header">
          <h1>Owner Dashboard</h1>
          <p>Manage your products and view customer inquiries</p>
          <button
            className="btn btn-secondary"
            style={{ marginTop: '16px' }}
            onClick={handleOwnerLogout}
          >
            Logout
          </button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${adminTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setAdminTab('inbox')}
          >
            Inbox {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
          <button
            className={`tab ${adminTab === 'products' ? 'active' : ''}`}
            onClick={() => setAdminTab('products')}
          >
            Products
          </button>
          <button
            className={`tab ${adminTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setAdminTab('inquiries')}
          >
            Inquiries ({inquiries.length})
          </button>
        </div>

        {adminTab === 'inbox' && (
          <>
            <div className="inbox-header">
              <h2 className="section-title">Messages</h2>
              {inboxMessages.length > 0 && unreadCount > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', minHeight: 'auto', fontSize: '14px' }}
                  onClick={handleMarkAllRead}
                >
                  Mark All Read
                </button>
              )}
            </div>
            {inboxMessages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <p>No messages yet</p>
                <span>Verification codes and customer inquiries will appear here</span>
              </div>
            ) : (
              <div className="message-list">
                {inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`message-card ${msg.is_read ? 'read' : 'unread'}`}
                    onClick={() => !msg.is_read && handleMarkMessageRead(msg.id)}
                  >
                    <div className="message-icon">
                      {msg.type === 'verification' ? '🔑' : '💬'}
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <h3>{msg.title}</h3>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="message-body">{msg.content}</p>
                      <div className="message-actions">
                        {!msg.is_read && (
                          <span className="unread-badge">New</span>
                        )}
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMessage(msg.id);
                          }}
                          title="Delete message"
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
              <h2 className="section-title">Add New Product</h2>
              <form onSubmit={handleAddProduct}>
                <div className="form-group">
                  <label className="label">Product Name</label>
                  <input
                    type="text"
                    className="input"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="Enter product name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Enter product description"
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>

                <div className="form-group">
                  <label className="label">Price ($)</label>
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
                  <label className="label">Product Image</label>
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
                  {loading ? 'Adding...' : 'Add Product'}
                </button>
              </form>
            </div>

            <h2 className="section-title">Current Products ({products.length})</h2>
            {products.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No products yet. Add your first product above.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Price</th>
                      <th>Actions</th>
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
                              No img
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
                            Delete
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
            <h2 className="section-title">Customer Inquiries</h2>
            {inquiries.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No inquiries yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Product</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inquiry) => (
                      <tr key={inquiry.id}>
                        <td style={{ fontWeight: '600' }}>{inquiry.customer_name}</td>
                        <td>{inquiry.customer_phone}</td>
                        <td>{inquiry.product_name}</td>
                        <td>{new Date(inquiry.created_at).toLocaleDateString()}</td>
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
        <div className="header">
          <h1>Verification Required</h1>
          <p>A verification code has been sent to the store owner. Please enter the code below.</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          {pendingCode && (
            <div className="message message-success">
              <strong>Development Mode:</strong> Your verification code is <strong>{pendingCode}</strong>
            </div>
          )}

          <form onSubmit={handleCodeVerify}>
            <div className="form-group">
              <label className="label">Verification Code</label>
              <input
                type="text"
                className="input"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 4-digit code"
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
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>

          <button
            className="btn btn-secondary"
            style={{ width: '100%' }}
            onClick={() => setView('login-choice')}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Render customer onboarding
  if (view === 'customer-onboard') {
    return (
      <div className="container">
        <div className="header">
          <h1>Almost There!</h1>
          <p>Please enter your name and phone number to continue</p>
        </div>

        <div style={{ maxWidth: '400px', margin: '0 auto' }}>
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleCustomerOnboard}>
            <div className="form-group">
              <label className="label">Your Name</label>
              <input
                type="text"
                className="input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Continue to Products'}
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
        <div className="header">
          <h1>Our Products</h1>
          <p>Welcome, {currentCustomer?.name}! Click on any product to inquire.</p>
        </div>

        {error && <div className="message message-error">{error}</div>}
        {success && <div className="message message-success">{success}</div>}

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '20px', color: '#6b7280' }}>No products available yet. Please check back later.</p>
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
                    No image
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
              <h2>Interested in this product?</h2>
              <p style={{ marginBottom: '24px', fontSize: '18px' }}>
                <strong>{selectedProduct.name}</strong> - ${selectedProduct.price.toFixed(2)}
              </p>
              <p style={{ marginBottom: '24px', color: '#6b7280' }}>
                Click the button below and the store owner will contact you at{' '}
                <strong>{currentCustomer?.phone}</strong>
              </p>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={handleInquiry}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Yes, Contact Me'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => setSelectedProduct(null)}
                >
                  Cancel
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
        {error ? (
          <>
            <div className="message message-error" style={{ maxWidth: '400px', margin: '0 auto 24px' }}>
              {error}
            </div>
            <button className="btn btn-secondary" onClick={() => setView('login-choice')}>
              Back
            </button>
          </>
        ) : (
          <p style={{ fontSize: '24px' }}>Checking your device...</p>
        )}
      </div>
    );
  }

  return null;
}
