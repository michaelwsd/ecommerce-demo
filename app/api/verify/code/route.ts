import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { deviceId, code } = await request.json();

    if (!deviceId || !code) {
      return NextResponse.json(
        { error: 'Device ID and code are required' },
        { status: 400 }
      );
    }

    const isValid = verifyCode(deviceId, code);

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Code verified. Please complete onboarding.',
      });
    }

    return NextResponse.json(
      { error: 'Invalid verification code' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Code verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
