'use client';

import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
}

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
  noImageText: string;
}

export function ProductCard({ product, onClick, noImageText }: ProductCardProps) {
  return (
    <div
      className="product-card"
      onClick={() => onClick(product)}
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
          {noImageText}
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
  );
}
