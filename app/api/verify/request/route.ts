import { NextRequest, NextResponse } from 'next/server';
import { generateVerificationCode, generateDeviceId } from '@/lib/auth';
import { createPendingVerification, isDeviceVerified, getVerifiedDevice } from '@/lib/db';
import { sendVerificationCodeToOwner } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { deviceId: existingDeviceId } = await request.json();

    // Check if device is already verified
    if (existingDeviceId) {
      const verified = isDeviceVerified(existingDeviceId);
      if (verified) {
        const device = getVerifiedDevice(existingDeviceId);
        return NextResponse.json({
          verified: true,
          hasOnboarded: !!(device as { name?: string })?.name,
          deviceId: existingDeviceId,
        });
      }
    }

    // Generate new device ID if not provided
    const deviceId = existingDeviceId || generateDeviceId();

    // Generate verification code
    const code = generateVerificationCode();

    // Store pending verification
    createPendingVerification(deviceId, code);

    // Send code to owner (placeholder)
    await sendVerificationCodeToOwner(code, deviceId);

    return NextResponse.json({
      verified: false,
      deviceId,
      message: 'Verification code sent to owner. Please enter the code.',
      // In development, we return the code for testing
      ...(process.env.NODE_ENV !== 'production' && { code }),
    });
  } catch (error) {
    console.error('Verification request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
