import { NextRequest, NextResponse } from 'next/server';
import { completeVerification, verifyCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, code, name, phone } = await request.json();

    if (!deviceId || !code || !name || !phone) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify the code again
    const isValid = verifyCode(deviceId, code);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code' },
        { status: 401 }
      );
    }

    // Complete verification and store customer info
    completeVerification(deviceId, name, phone);

    const response = NextResponse.json({
      success: true,
      message: 'Onboarding complete. Welcome!',
    });

    // Set device cookie
    response.cookies.set('device_id', deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return response;
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
