import { NextRequest, NextResponse } from 'next/server';
import { getPhoneUser } from '@/lib/db';

export async function GET(request: NextRequest) {
  const customerPhone = request.cookies.get('customer_phone')?.value;

  if (!customerPhone) {
    return NextResponse.json({
      authenticated: false,
    });
  }

  try {
    const user = await getPhoneUser(customerPhone);

    if (user) {
      return NextResponse.json({
        authenticated: true,
        name: user.name,
        phone: user.phone,
      });
    }

    return NextResponse.json({
      authenticated: false,
    });
  } catch {
    return NextResponse.json({
      authenticated: false,
    });
  }
}
