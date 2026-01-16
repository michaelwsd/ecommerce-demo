import { NextRequest, NextResponse } from 'next/server';
import {
  verifyPhoneCode,
  deletePendingPhoneVerification,
  phoneUserExists,
  createPhoneUser,
  getPhoneUser
} from '@/lib/db';
import { cookies } from 'next/headers';

// Verify the code and complete sign in/sign up
export async function POST(request: NextRequest) {
  try {
    const { phone, code, name } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and code are required' },
        { status: 400 }
      );
    }

    // Verify the code
    const isValidCode = await verifyPhoneCode(phone, code);

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Delete the pending verification
    await deletePendingPhoneVerification(phone);

    // Check if user exists
    const exists = await phoneUserExists(phone);

    if (!exists) {
      // New user - name is required
      if (!name) {
        return NextResponse.json(
          { error: 'Name is required for new users' },
          { status: 400 }
        );
      }

      // Create the user
      await createPhoneUser(phone, name);
    }

    // Get user data
    const user = await getPhoneUser(phone);

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('customer_phone', phone, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        name: user?.name,
        phone: user?.phone,
      },
    });
  } catch (error) {
    console.error('Error verifying phone code:', error);
    return NextResponse.json(
      { error: 'Failed to verify code' },
      { status: 500 }
    );
  }
}
