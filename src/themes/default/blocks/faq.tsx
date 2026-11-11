"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import { landingSidebarRowCn } from "@/shared/lib/landing-sidebar-layout-classes";
import { cn } from "@/shared/lib/utils";
import { FAQ as FAQType } from "@/shared/types/blocks/landing";

export function FAQ({
  faq,
  className,
  centered = false,
  variant = "dark",
}: {
  faq: FAQType;
  className?: string;
  centered?: boolean;
  variant?: "dark" | "light";
}) {
  const isLight = variant === "light";

  return (
    <section
      id={faq.id}
      className={cn(
        "py-16 md:py-24",
        isLight ? "bg-white" : "bg-[#050505]",
        className,
      )}
    >
      <div
        className={
          centered
            ? "container mx-auto max-w-3xl px-4 md:px-8"
            : "mx-auto max-w-full px-4 md:max-w-3xl md:px-8"
        }
      >
        <ScrollAnimation>
          <div className="mx-auto max-w-2xl text-center text-balance">
            <h2
              className={cn(
                "mb-4 text-3xl font-semibold tracking-tight md:text-4xl",
                isLight ? "text-[#171717]" : "text-[#f2f2f4]",
              )}
            >
              {faq.title}
            </h2>
            <p
              className={cn(
                "mb-6 md:mb-12 lg:mb-16",
                isLight ? "text-[#6a7282]" : "text-[#b9b9c0]",
              )}
            >
              {faq.description}
            </p>
          </div>
        </ScrollAnimation>

        <ScrollAnimation delay={0.2}>
          <div className="mx-auto mt-12 max-w-full">
            <Accordion
              type="single"
              collapsible
              className={cn(
                "w-full rounded-2xl p-1",
                isLight
                  ? "border border-black/8 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
                  : "border border-white/8 bg-[#0a0a0a]",
              )}
            >
              {faq.items?.map((item, idx) => (
                <div className="group" key={idx}>
                  <AccordionItem
                    value={item.question ?? ""}
                    className={cn(
                      "peer rounded-xl border-none px-7 py-1 data-[state=open]:border-none data-[state=open]:shadow-none",
                      isLight
                        ? "text-[#171717] data-[state=open]:bg-[#fff8de]"
                        : "text-[#f2f2f4] data-[state=open]:bg-white/[0.03]",
                    )}
                  >
                    <AccordionTrigger
                      className={cn(
                        "cursor-pointer text-base hover:no-underline",
                        isLight ? "text-[#171717]" : "text-[#f2f2f4]",
                      )}
                    >
                      {item.question ?? ""}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className={cn(
                          "text-base",
                          isLight ? "text-[#5d6472]" : "text-[#b9b9c0]",
                        )}
                        dangerouslySetInnerHTML={{ __html: item.answer ?? "" }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                  <hr
                    className={cn(
                      "mx-7 border-dashed group-last:hidden peer-data-[state=open]:opacity-0",
                      isLight ? "border-black/8" : "border-white/10",
                    )}
                  />
                </div>
              ))}
            </Accordion>

            <p
              className={cn(
                "mt-6 px-8",
                isLight ? "text-[#7f8795]" : "text-[#9f9fa8]",
              )}
              dangerouslySetInnerHTML={{ __html: faq.tip ?? "" }}
            />
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
}
