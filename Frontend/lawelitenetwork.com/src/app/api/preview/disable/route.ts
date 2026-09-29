import { draftMode } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

/** Exits live preview and returns to the homepage. */
export async function GET(req: NextRequest) {
  (await draftMode()).disable();
  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = '/';
  redirectUrl.search = '';
  return NextResponse.redirect(redirectUrl);
}
