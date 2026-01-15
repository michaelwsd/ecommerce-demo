import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createPendingVerification, clerkUserExists } from '@/lib/db';
import { sendVerificationCodeToOwner } from '@/lib/email';

// Request a verification code for a new Clerk user
export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated with Clerk' },
        { status: 401 }
      );
    }

    // Check if user already exists
    const exists = await clerkUserExists(userId);
    if (exists) {
      return NextResponse.json(
        { error: 'User already registered' },
        { status: 400 }
      );
    }

    // Generate a 4-digit verification code
    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Use a temporary device ID based on the Clerk user ID
    const tempDeviceId = `clerk_${userId}`;

    // Store the pending verification
    await createPendingVerification(tempDeviceId, code);

    // Send the code to the owner
    await sendVerificationCodeToOwner(code, tempDeviceId);

    return NextResponse.json({
      success: true,
      message: 'Verification code sent to store owner',
      // In development, return the code for testing
      ...(process.env.NODE_ENV === 'development' && { code }),
    });
  } catch (error) {
    console.error('Error requesting verification code:', error);
    return NextResponse.json(
      { error: 'Failed to request verification code' },
      { status: 500 }
    );
  }
}
