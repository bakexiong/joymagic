import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { db } from '@/core/db';
import { utmTracking } from '@/config/db/schema';
import { getSignUser } from '@/shared/models/user';
import { sanitizeUTMValue } from '@/shared/types/utm';

/**
 * POST /api/utm/track
 * 保存 UTM 追踪记录到数据库
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      referrer,
      landing_page,
    } = body;

    // 验证至少有一个 UTM 参数
    if (!utm_source && !utm_medium && !utm_campaign && !utm_content && !utm_term) {
      return NextResponse.json(
        { error: 'At least one UTM parameter is required' },
        { status: 400 }
      );
    }

    // 获取当前用户（如果已登录）
    const user = await getSignUser();
    const userId = user?.id || null;

    // 获取客户端信息
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               request.headers.get('x-real-ip') ||
               undefined;

    // 生成会话 ID（如果客户端没有提供）
    const sessionId = body.session_id || nanoid();

    // 清理 UTM 参数
    const utmData = {
      id: nanoid(),
      userId,
      sessionId,
      utmSource: utm_source ? sanitizeUTMValue(utm_source) : null,
      utmMedium: utm_medium ? sanitizeUTMValue(utm_medium) : null,
      utmCampaign: utm_campaign ? sanitizeUTMValue(utm_campaign) : null,
      utmContent: utm_content ? sanitizeUTMValue(utm_content) : null,
      utmTerm: utm_term ? sanitizeUTMValue(utm_term) : null,
      referrer: referrer ? sanitizeUTMValue(referrer) : null,
      landingPage: landing_page ? sanitizeUTMValue(landing_page) : null,
      userAgent,
      ip,
    };

    // 保存到数据库
    await db().insert(utmTracking).values(utmData);

    return NextResponse.json({
      success: true,
      session_id: sessionId,
    });
  } catch (error) {
    console.error('Failed to save UTM tracking:', error);
    return NextResponse.json(
      { error: 'Failed to save UTM tracking' },
      { status: 500 }
    );
  }
}
