import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getClerkUser, createClerkUser, clerkUserExists, verifyCode } from '@/lib/db';

// Check if the current Clerk user exists in our database
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated with Clerk' },
        { status: 401 }
      );
    }

    const exists = await clerkUserExists(userId);

    if (exists) {
      const user = await getClerkUser(userId);
      return NextResponse.json({
        exists: true,
        user: {
          name: user?.name,
          phone: user?.phone,
          email: user?.email,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking clerk user:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}

// Create a new Clerk user after code verification
export async function POST(request: NextRequest) {
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

    const { code, email, name, phone } = await request.json();

    if (!code || !email || !name || !phone) {
      return NextResponse.json(
        { error: 'Code, email, name, and phone are required' },
        { status: 400 }
      );
    }

    // Verify the code using a temporary device ID based on the Clerk user ID
    const tempDeviceId = `clerk_${userId}`;
    const isValidCode = await verifyCode(tempDeviceId, code);

    if (!isValidCode) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Create the user in our database
    const user = await createClerkUser(userId, email, name, phone);

    return NextResponse.json({
      success: true,
      user: {
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error creating clerk user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
