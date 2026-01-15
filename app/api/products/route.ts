import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const products = getAllProducts();
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const price = parseFloat(formData.get('price') as string);
    const image = formData.get('image') as File | null;

    if (!name || isNaN(price)) {
      return NextResponse.json(
        { error: 'Name and price are required' },
        { status: 400 }
      );
    }

    let imagePath: string | null = null;

    if (image && image.size > 0) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      await mkdir(uploadsDir, { recursive: true });

      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `${Date.now()}-${image.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filepath = path.join(uploadsDir, filename);

      await writeFile(filepath, buffer);
      imagePath = `/uploads/${filename}`;
    }

    const result = createProduct(name, description || '', price, imagePath);

    return NextResponse.json({
      success: true,
      productId: result.lastInsertRowid,
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
