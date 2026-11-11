import { SITE_COMPANY, SUPPORT_EMAIL } from "@/config/site";

export function CompanyOverview({ locale = "en" }: { locale?: string }) {
  const chinese = locale.startsWith("zh");
  const prefix = locale === "en" ? "" : `/${locale}`;
  return (
    <section
      className="mx-auto max-w-[1320px] px-6 py-14 text-zinc-900"
      aria-label="Company and public beta information"
    >
      <p className="text-sm font-medium">
        {SITE_COMPANY} · {chinese ? "公开测试" : "Public beta"}
      </p>
      <h2 className="mt-3 text-2xl font-semibold">
        {chinese
          ? "面向创作者与小型团队的在线 AI 视觉软件"
          : "Online AI visual software for creators and small teams"}
      </h2>
      <p className="mt-4 max-w-4xl text-sm leading-7 text-zinc-600">
        {chinese
          ? "由 Barko Bear LLC 开发和运营。通过浏览器提供图片生成、图片编辑及受支持的视频创作工具，以数字方式交付预览和输出。目前尚未正式收费，支付服务未开放；定价页展示的是计划方案，正式收费前会公布最终条款。"
          : "Developed and operated by Barko Bear LLC. We deliver image generation, editing, and supported video creation tools through the browser, with digital previews and outputs. The product is in public beta and has not launched paid access. Pricing shows planned offerings; final terms will be published before purchases open."}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-7 gap-y-3 text-sm underline underline-offset-4">
        <a href={`${prefix}/about`}>
          {chinese ? "公司介绍" : "About the company"}
        </a>
        <a href={`${prefix}/business-model`}>
          {chinese ? "产品与业务模式" : "Product & business model"}
        </a>
        <a href={`${prefix}/contact`}>{chinese ? "联系我们" : "Contact"}</a>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </div>
    </section>
  );
}
