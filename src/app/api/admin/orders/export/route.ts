import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { NextRequest } from 'next/server';

import { db } from '@/core/db';
import { order } from '@/config/db/schema';
import { PERMISSIONS } from '@/core/rbac';
import { respErr } from '@/shared/lib/resp';
import { getUserInfo } from '@/shared/models/user';
import { hasPermission } from '@/shared/services/rbac';

/**
 * GET /api/admin/orders/export
 * 导出订单数据（CSV 格式）
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
    const status = searchParams.get('status') || 'paid';

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
    if (status) {
      conditions.push(eq(order.status, status));
    }

    // 查询订单数据
    const orders = await db()
      .select({
        id: order.id,
        orderNo: order.orderNo,
        userId: order.userId,
        userEmail: order.userEmail,
        amount: order.amount,
        currency: order.currency,
        status: order.status,
        productName: order.productName,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        utmSource: order.utmSource,
        utmMedium: order.utmMedium,
        utmCampaign: order.utmCampaign,
        utmContent: order.utmContent,
        utmTerm: order.utmTerm,
      })
      .from(order)
      .where(and(...conditions))
      .orderBy(desc(order.createdAt))
      .limit(10000); // 限制最多导出 10000 条

    // 生成 CSV
    const csvHeader = [
      'Order ID',
      'Order No',
      'User ID',
      'User Email',
      'Amount',
      'Currency',
      'Status',
      'Product Name',
      'Created At',
      'Paid At',
      'UTM Source',
      'UTM Medium',
      'UTM Campaign',
      'UTM Content',
      'UTM Term',
    ].join(',');

    const csvRows = orders.map((o) => {
      return [
        o.id,
        o.orderNo,
        o.userId,
        o.userEmail || '',
        o.amount,
        o.currency,
        o.status,
        `"${(o.productName || '').replace(/"/g, '""')}"`, // 转义双引号
        o.createdAt?.toISOString() || '',
        o.paidAt?.toISOString() || '',
        o.utmSource || '',
        o.utmMedium || '',
        o.utmCampaign || '',
        o.utmContent || '',
        o.utmTerm || '',
      ].join(',');
    });

    const csv = [csvHeader, ...csvRows].join('\n');

    // 返回 CSV 文件
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders_export_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Order export failed:', error);
    return respErr('Failed to export orders: ' + error.message);
  }
}
