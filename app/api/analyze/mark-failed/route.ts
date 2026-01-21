// app/api/analyze/mark-failed/route.ts
// ============================================================================
// Mark stuck analysis as failed and refund credits (if applicable)
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { isAdmin, isAdminEmail } from '../../../lib/adminUtils';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
    }

    const { data: doc, error: docError } = await supabase
      .from('thesis_documents')
      .select('id, user_id, status, credits_used, created_at')
      .eq('id', documentId)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (doc.status !== 'processing') {
      return NextResponse.json({
        success: true,
        message: 'Document already finalized',
        status: doc.status
      });
    }

    const { data: updated, error: updateError } = await supabase
      .from('thesis_documents')
      .update({ status: 'failed' })
      .eq('id', documentId)
      .eq('status', 'processing')
      .select('id');

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
    }

    const wasUpdated = !!updated && updated.length > 0;

    if (!wasUpdated) {
      return NextResponse.json({
        success: true,
        message: 'Document already finalized'
      });
    }

    const userIsAdmin = isAdmin(user.id) || isAdminEmail(user.email);
    let refunded = false;

    if (!userIsAdmin && doc.credits_used && doc.credits_used > 0) {
      const { error: refundError } = await supabase.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: doc.credits_used,
        p_bonus: 0,
        p_payment_id: null,
        p_package_id: null
      });

      if (!refundError) {
        refunded = true;
      }
    }

    return NextResponse.json({
      success: true,
      refunded
    });
  } catch (error: any) {
    console.error('[MARK-FAILED] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
