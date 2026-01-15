import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, getAllInquiries, getVerifiedDevice } from '@/lib/db';
import { sendInquiryNotificationToOwner } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const inquiries = getAllInquiries();
    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceId = request.cookies.get('device_id')?.value;

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const device = getVerifiedDevice(deviceId) as { name?: string; phone?: string } | undefined;

    if (!device || !device.name || !device.phone) {
      return NextResponse.json(
        { error: 'Customer information not found' },
        { status: 401 }
      );
    }

    const { productId, productName } = await request.json();

    if (!productId || !productName) {
      return NextResponse.json(
        { error: 'Product information required' },
        { status: 400 }
      );
    }

    // Create inquiry record
    createInquiry(device.name, device.phone, productName, productId);

    // Send notification to owner
    await sendInquiryNotificationToOwner(device.name, device.phone, productName);

    return NextResponse.json({
      success: true,
      message: 'Inquiry sent! The owner will contact you soon.',
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    );
  }
}
