import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Use /auth/callback instead of /api/auth/callback for OAuth redirects.'
  });
}
