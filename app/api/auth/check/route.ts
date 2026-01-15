import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const ownerSession = request.cookies.get('owner_session');

  if (ownerSession?.value === 'authenticated') {
    return NextResponse.json({ authenticated: true, role: 'owner' });
  }

  return NextResponse.json({ authenticated: false });
}
