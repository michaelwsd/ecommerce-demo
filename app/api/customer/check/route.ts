import { NextRequest, NextResponse } from 'next/server';
import { isDeviceVerified, getVerifiedDevice } from '@/lib/db';

export async function GET(request: NextRequest) {
  const deviceId = request.cookies.get('device_id')?.value;

  if (!deviceId) {
    return NextResponse.json({
      verified: false,
      hasOnboarded: false,
    });
  }

  const verified = await isDeviceVerified(deviceId);

  if (verified) {
    const device = await getVerifiedDevice(deviceId) as { name?: string; phone?: string } | null;
    return NextResponse.json({
      verified: true,
      hasOnboarded: !!device?.name,
      deviceId,
      name: device?.name,
      phone: device?.phone,
    });
  }

  return NextResponse.json({
    verified: false,
    hasOnboarded: false,
    deviceId,
  });
}
