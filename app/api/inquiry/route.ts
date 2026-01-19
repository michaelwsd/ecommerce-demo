import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, getAllInquiries, deleteInquiry, getPhoneUser } from '@/lib/db';
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

    const inquiries = await getAllInquiries();
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
    let customerName: string | undefined;
    let customerPhone: string | undefined;

    // Check phone-based authentication
    const phoneFromCookie = request.cookies.get('customer_phone')?.value;
    if (phoneFromCookie) {
      const phoneUser = await getPhoneUser(phoneFromCookie);
      if (phoneUser) {
        customerName = phoneUser.name;
        customerPhone = phoneUser.phone;
      }
    }

    // Check if we have customer info
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { productId, productName, quantity, collectionDate, collectionTime } = await request.json();

    if (!productId || !productName) {
      return NextResponse.json(
        { error: 'Product information required' },
        { status: 400 }
      );
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity is required' },
        { status: 400 }
      );
    }

    if (!collectionDate || !collectionTime) {
      return NextResponse.json(
        { error: 'Collection date and time are required' },
        { status: 400 }
      );
    }

    // Create inquiry record with collection date/time
    await createInquiry(
      customerName,
      customerPhone,
      productName,
      productId,
      quantity,
      collectionDate,
      collectionTime
    );

    // Send notification to owner with collection info
    await sendInquiryNotificationToOwner(
      customerName,
      customerPhone,
      productName,
      quantity,
      collectionDate,
      collectionTime
    );

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

export async function DELETE(request: NextRequest) {
  try {
    // Check owner authentication
    const ownerSession = request.cookies.get('owner_session');
    if (ownerSession?.value !== 'authenticated') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inquiryId } = await request.json();

    if (!inquiryId) {
      return NextResponse.json({ error: 'Inquiry ID required' }, { status: 400 });
    }

    await deleteInquiry(inquiryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to delete inquiry' },
      { status: 500 }
    );
  }
}
