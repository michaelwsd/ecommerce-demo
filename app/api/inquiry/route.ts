import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createInquiry, getAllInquiries, getVerifiedDevice, deleteInquiry, getClerkUser } from '@/lib/db';
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

    // First try Clerk authentication
    const { userId } = await auth();
    if (userId) {
      const clerkUser = await getClerkUser(userId);
      if (clerkUser) {
        customerName = clerkUser.name;
        customerPhone = clerkUser.phone;
      }
    }

    // Fall back to device-based authentication
    if (!customerName || !customerPhone) {
      const deviceId = request.cookies.get('device_id')?.value;
      if (deviceId) {
        const device = await getVerifiedDevice(deviceId) as { name?: string; phone?: string } | null;
        if (device?.name && device?.phone) {
          customerName = device.name;
          customerPhone = device.phone;
        }
      }
    }

    // Check if we have customer info from either method
    if (!customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { productId, productName, collectionDate, collectionTime } = await request.json();

    if (!productId || !productName) {
      return NextResponse.json(
        { error: 'Product information required' },
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
    await createInquiry(customerName, customerPhone, productName, productId, collectionDate, collectionTime);

    // Send notification to owner with collection info
    await sendInquiryNotificationToOwner(customerName, customerPhone, productName, collectionDate, collectionTime);

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
