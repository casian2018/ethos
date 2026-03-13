import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');
  if (!room || !username) {
    return NextResponse.json(
      { error: 'Missing "room" or "username" query parameter' },
      { status: 400 }
    );
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'devkey';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'secret';
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

  console.log('API Key exists:', !!apiKey);
  console.log('API Secret exists:', !!apiSecret);
  console.log('WS URL exists:', !!wsUrl);

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { 
        error: 'Server misconfigured', 
        details: {
          apiKey: !!apiKey,
          apiSecret: !!apiSecret,
          wsUrl: !!wsUrl
        }
      },
      { status: 500 }
    );
  }

  try {
    const at = new AccessToken(apiKey, apiSecret, { identity: username });

  at.addGrant({
    room,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

    const token = at.toJwt();
    console.log('Token generated successfully for:', wsUrl);
    
    return NextResponse.json({ token });
  } catch (err) {
    console.error('Error generating token:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate token' },
      { status: 500 }
    );
  }
}
