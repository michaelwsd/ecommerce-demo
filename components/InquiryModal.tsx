'use client';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
}

interface InquiryModalProps {
  product: Product;
  customerPhone: string;
  quantity: string;
  collectionDate: string;
  collectionTime: string;
  onQuantityChange: (quantity: string) => void;
  onCollectionDateChange: (date: string) => void;
  onCollectionTimeChange: (time: string) => void;
  onSubmit: () => void;
  onClose: () => void;
  loading: boolean;
  error: string;
  translations: {
    interestedInProduct: string;
    contactMessage: string;
    quantityLabel: string;
    quantityPlaceholder: string;
    preferredCollection: string;
    collectionDate: string;
    collectionTime: string;
    yesContactMe: string;
    sending: string;
    cancel: string;
  };
}

export function InquiryModal({
  product,
  customerPhone,
  quantity,
  collectionDate,
  collectionTime,
  onQuantityChange,
  onCollectionDateChange,
  onCollectionTimeChange,
  onSubmit,
  onClose,
  loading,
  error,
  translations: t,
}: InquiryModalProps) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{t.interestedInProduct}</h2>
        <p style={{ marginBottom: '24px', fontSize: '18px' }}>
          <strong>{product.name}</strong> - ${product.price.toFixed(2)}
        </p>
        <p style={{ marginBottom: '16px', color: '#6b7280' }}>
          {t.contactMessage}{' '}
          <strong>{customerPhone}</strong>
        </p>

        {error && <div className="message message-error" style={{ marginBottom: '16px' }}>{error}</div>}

        <div style={{ marginBottom: '24px' }}>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="label">{t.quantityLabel}</label>
            <input
              type="number"
              className="input"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              min="1"
              placeholder={t.quantityPlaceholder}
              required
            />
          </div>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>{t.preferredCollection}</h3>
          <div className="form-group" style={{ marginBottom: '12px' }}>
            <label className="label">{t.collectionDate}</label>
            <input
              type="date"
              className="input"
              value={collectionDate}
              onChange={(e) => onCollectionDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">{t.collectionTime}</label>
            <input
              type="time"
              className="input"
              value={collectionTime}
              onChange={(e) => onCollectionTimeChange(e.target.value)}
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="btn btn-primary"
            style={{ flex: 1 }}
            onClick={onSubmit}
            disabled={loading}
          >
            {loading ? t.sending : t.yesContactMe}
          </button>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={onClose}
          >
            {t.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
