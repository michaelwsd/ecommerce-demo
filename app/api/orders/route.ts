import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCustomerInquiry,
  getCustomerInquiries,
  getCustomerInquiryById,
  getPhoneUser,
} from '@/lib/db';
import { sendOrderCancellationToOwner } from '@/lib/email';

export async function GET(request: NextRequest) {
  const customerPhone = request.cookies.get('customer_phone')?.value;

  if (!customerPhone) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await getPhoneUser(customerPhone);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const orders = await getCustomerInquiries(customerPhone);
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const customerPhone = request.cookies.get('customer_phone')?.value;

  if (!customerPhone) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const user = await getPhoneUser(customerPhone);
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const order = await getCustomerInquiryById(orderId, customerPhone);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    await deleteCustomerInquiry(orderId, customerPhone);
    await sendOrderCancellationToOwner(
      user.name,
      user.phone,
      order.product_name,
      order.quantity || 1
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting customer order:', error);
    return NextResponse.json(
      { error: 'Failed to delete order' },
      { status: 500 }
    );
  }
}
