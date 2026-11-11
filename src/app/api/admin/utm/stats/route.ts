import { and, count, desc, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { PERMISSIONS } from '@/core/rbac';
import { respData, respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

/**
 * GET /api/admin/utm/stats
 * 查询 UTM 统计数据
 */
export async function GET(req: NextRequest) {
  try {
    // 验证用户权限
    const user = await getUserInfo();
    if (!user) {
      return respErr('Unauthorized');
    }

    // 检查管理员权限
    const hasAccess = await hasPermission(user.id, PERMISSIONS.PAYMENTS_READ);
    if (!hasAccess) {
      return respErr('Forbidden: Admin permission required');
    }

    const { searchParams } = new URL(req.url);
    const campaign = searchParams.get('campaign');
    const source = searchParams.get('source');
    const medium = searchParams.get('medium');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // 构建查询条件
    const conditions = [];
    if (campaign) {
      conditions.push(eq(order.utmCampaign, campaign));
    }
    if (source) {
      conditions.push(eq(order.utmSource, source));
    }
    if (medium) {
      conditions.push(eq(order.utmMedium, medium));
    }
    if (startDate) {
      conditions.push(gte(order.createdAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(order.createdAt, new Date(endDate)));
    }

    // 只统计已支付的订单
    conditions.push(eq(order.status, 'paid'));

    // 查询总体统计
    const [totalStats] = await db()
      .select({
        totalOrders: count(),
        totalAmount: sum(order.amount),
      })
      .from(order)
      .where(and(...conditions));

    // 按来源分组统计
    const sourceBreakdown = await db()
      .select({
        source: order.utmSource,
        orders: count(),
        amount: sum(order.amount),
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(order.utmSource)
      .orderBy(desc(sum(order.amount)));

    // 按内容分组统计
    const contentBreakdown = await db()
      .select({
        content: order.utmContent,
        orders: count(),
        amount: sum(order.amount),
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(order.utmContent)
      .orderBy(desc(sum(order.amount)));

    // 按活动分组统计
    const campaignBreakdown = await db()
      .select({
        campaign: order.utmCampaign,
        orders: count(),
        amount: sum(order.amount),
      })
      .from(order)
      .where(and(...conditions))
      .groupBy(order.utmCampaign)
      .orderBy(desc(sum(order.amount)));

    return respData({
      campaign,
      source,
      medium,
      date_range: {
        start: startDate,
        end: endDate,
      },
      total_orders: totalStats?.totalOrders || 0,
      total_amount: totalStats?.totalAmount || 0,
      breakdown_by_source: sourceBreakdown,
      breakdown_by_content: contentBreakdown,
      breakdown_by_campaign: campaignBreakdown,
    });
  } catch (error: any) {
    console.error('UTM stats query failed:', error);
    return respErr('Failed to query UTM stats: ' + error.message);
  }
}
