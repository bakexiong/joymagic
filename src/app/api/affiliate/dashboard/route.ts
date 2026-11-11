import { envConfigs } from "@/config";
import { respData, respErr } from "@/shared/lib/resp";
import { getAffiliateDashboardForUser } from "@/shared/models/affiliate";
import { getUserInfo } from "@/shared/models/user";

export async function GET() {
  try {
    const user = await getUserInfo();
    if (!user) {
      return respErr("no auth, please sign in");
    }

    const dashboard = await getAffiliateDashboardForUser(user.id);

    return respData({
      userEmail: user.email || "",
      referralLink: dashboard.profile
        ? `${envConfigs.app_url}?rk=${dashboard.profile.code}`
        : "",
      dashboard,
    });
  } catch (error: any) {
    return respErr(error?.message || "failed to get affiliate dashboard");
  }
}
