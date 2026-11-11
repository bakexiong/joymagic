import {
  CTA as CTAType,
  Showcases as ShowcasesType,
} from "@/shared/types/blocks/landing";
import { CTA } from "@/themes/default/blocks/cta";
import { Showcases } from "@/themes/default/blocks/showcases";

export default async function ShowcasesPage({
  locale,
  showcases,
  cta,
}: {
  locale?: string;
  showcases: ShowcasesType;
  cta?: CTAType;
}) {
  return (
    <>
      <Showcases showcases={showcases} />
      {cta && <CTA cta={cta} className="bg-muted" />}
    </>
  );
}
