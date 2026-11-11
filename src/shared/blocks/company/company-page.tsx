import { MarkdownPreview } from "@/shared/blocks/common";
import { type CompanyPage as CompanyPageData } from "@/shared/lib/company-pages";

export function CompanyPage({ page }: { page: CompanyPageData }) {
  return (
    <main className="mx-auto max-w-4xl px-6 pb-20 pt-32 text-foreground">
      <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
        {page.title}
      </h1>
      <p className="mt-4 text-muted-foreground">{page.description}</p>
      <div className="docs mt-10">
        <MarkdownPreview content={page.content} />
      </div>
    </main>
  );
}
