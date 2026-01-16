import { NextRequest, NextResponse } from 'next/server';
import { phoneUserExists, createPhonePendingVerification, getPhoneUser } from '@/lib/db';
import { generateVerificationCode } from '@/lib/auth';
import { sendVerificationCodeToOwner } from '@/lib/email';
import { cookies } from 'next/headers';

// Handle phone submission - check if user exists and send verification code
export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const exists = await phoneUserExists(phone);

    if (exists) {
      // Returning user - log them in directly without verification code
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
        isNewUser: false,
        loggedIn: true,
        user: {
          name: user?.name,
          phone: user?.phone,
        },
      });
    }

    // New user - generate verification code
    const code = generateVerificationCode();

    // Store pending verification
    await createPhonePendingVerification(phone, code);

    // Send code to owner's inbox
    await sendVerificationCodeToOwner(phone, code);

    return NextResponse.json({
      success: true,
      isNewUser: true,
      loggedIn: false,
    });
  } catch (error) {
    console.error('Error in phone auth:', error);
    return NextResponse.json(
      { error: 'Failed to process phone number' },
      { status: 500 }
    );
  }
}
