import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct, getProductById, deleteProductImage } from '@/lib/db';

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image_path: string | null;
  created_at: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    // Get product to delete image file
    const product = await getProductById(productId) as Product | null;

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete image from Supabase Storage if exists
    if (product.image_path) {
      try {
        // Extract filename from the full URL
        const filename = product.image_path.split('/').pop();
        if (filename) {
          await deleteProductImage(filename);
        }
      } catch {
        // Ignore file deletion errors
      }
    }

    await deleteProduct(productId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
