import { respData, respErr } from '@/shared/lib/resp';
import { getCountryCodeFromRequest } from '@/shared/lib/geo-server';
import { getUserInfo, updateUser } from '@/shared/models/user';

export async function POST(req: Request) {
    try {
        const user = await getUserInfo();
        if (!user) {
            return respErr('no auth, please sign in');
        }

        const currentCountry = (user as any)?.country;
        if (currentCountry) {
            return respData({ updated: false, country: currentCountry });
        }

        const country = await getCountryCodeFromRequest(req.headers);
        if (!country) {
            console.log("update country for user：" + user.id + " failed, country not detected");
            return respData({ updated: false, country: null });
        }

        console.log("update country for user：" + user.id + " to " + country);
        await updateUser(user.id, { country });
        return respData({ updated: true, country });
    } catch (e) {
        console.log('update country failed:', e);
        return respErr('update country failed');
    }
}

