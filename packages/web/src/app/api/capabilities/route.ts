import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  const enterpriseEnabled = process.env.ENTERPRISE_ENABLED === 'true';
  return NextResponse.json({
    success: true,
    data: {
      enterpriseEnabled,
      // Future: list granular modules/capabilities
    }
  });
}

