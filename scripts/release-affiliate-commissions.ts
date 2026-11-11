import "@/config";

import { releaseMatureAffiliateCommissions } from "@/shared/models/affiliate";

async function main() {
  const released = await releaseMatureAffiliateCommissions();
  console.log(`[affiliate] released commissions: ${released}`);
}

main().catch((error) => {
  console.error("[affiliate] release commissions failed:", error);
  process.exit(1);
});
