import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdminSession } from '@/lib/admin/guards';
import { buildBillingDuplicatesReport } from '@/lib/admin/billing-report';

export async function GET(): Promise<NextResponse> {
  const adminSession = await requireAdminSession();
  if (!adminSession.ok) {
    return adminSession.response;
  }

  try {
    const admin = createAdminClient();
    const report = await buildBillingDuplicatesReport(admin);

    return NextResponse.json({
      success: true,
      generatedAt: report.generatedAt,
      generatedBy: {
        userId: adminSession.session.userId,
        email: adminSession.session.email,
      },
      activeLikeStatuses: report.activeLikeStatuses,
      totalAffectedUsers: report.totalAffectedUsers,
      duplicates: report.duplicates,
    });
  } catch (error) {
    console.error('Admin billing duplicates report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate billing duplicates report.' },
      { status: 500 },
    );
  }
}
