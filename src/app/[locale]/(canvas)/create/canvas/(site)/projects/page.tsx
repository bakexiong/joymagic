import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { locales } from "@/config/locale";
import { CanvasSectionShell } from "@/shared/blocks/creator-workbench/canvas/page/canvas-section-shell";
import { CanvasProjectsHub } from "@/shared/blocks/creator-workbench/canvas/page/canvas-projects-hub";
import { getSignUser } from "@/shared/models/user";
import { listWorkbenchCanvasProjects } from "@/shared/models/workbench-canvas-project";
import type { Header as HeaderType } from "@/shared/types/blocks/landing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export default async function CanvasProjectsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSignUser();
  if (!user?.id) {
    redirect(
      `/${locale}/sign-in?callbackUrl=${encodeURIComponent(`/${locale}/create/canvas/projects`)}`,
    );
  }

  const tLanding = await getTranslations("landing");
  const tWorkspace = await getTranslations("landing.canvasWorkspace");
  const header = tLanding.raw("header") as HeaderType;
  const projects = await listWorkbenchCanvasProjects(user.id);
  const projectsHubCopy = tWorkspace.raw("projectsHub") as
    | {
        heroTitle?: string;
        heroPlaceholder?: string;
        heroSubmit?: string;
        sectionTitle?: string;
        sectionAction?: string;
        createCardTitle?: string;
        createCardSubtitle?: string;
        submitError?: string;
        autoLabel?: string;
        plusMenuTitle?: string;
        uploadReferenceAria?: string;
        closeDirectionAria?: string;
        virtualReferenceLabel?: string;
        virtualPromptLabel?: string;
      }
    | undefined;

  return (
    <CanvasSectionShell
      eyebrow={tWorkspace("page.projectsEyebrow")}
      title={tWorkspace("page.projectsTitle")}
      description={tWorkspace("page.projectsDescription")}
    >
      <CanvasProjectsHub
        locale={locale}
        navItems={header.nav?.items || []}
        pageTitle={tWorkspace("nav.canvas")}
        initialProjects={projects}
        copy={{
          heroTitle:
            projectsHubCopy?.heroTitle || "Unlimited Ideas, Boundless Creation",
          heroSubtitle: tWorkspace("page.projectsEyebrow"),
          heroPlaceholder:
            projectsHubCopy?.heroPlaceholder ||
            "Start with an idea and jump straight into Canvas creation",
          heroSubmit: projectsHubCopy?.heroSubmit || "Create And Generate",
          heroSceneLabel: "Scene",
          heroModelLabel: "Model",
          heroHint: "",
          sectionTitle: projectsHubCopy?.sectionTitle || "My Projects",
          sectionAction: projectsHubCopy?.sectionAction || "All Projects",
          createCardTitle: projectsHubCopy?.createCardTitle || "New Project",
          createCardSubtitle:
            projectsHubCopy?.createCardSubtitle || "Start from a fresh prompt",
          deleteConfirm: tWorkspace.raw("projectsGrid.deleteConfirm") as string,
          deleteSuccess: tWorkspace("projectsGrid.deleteSuccess"),
          deleteError: tWorkspace("projectsGrid.deleteError"),
          duplicateSuccess: tWorkspace("projectsGrid.duplicateSuccess"),
          duplicateError: tWorkspace("projectsGrid.duplicateError"),
          updatedAtPrefix: tWorkspace("projectsGrid.updatedAtPrefix"),
          duplicateAria: tWorkspace("projectsGrid.duplicateAria"),
          deleteAria: tWorkspace("projectsGrid.deleteAria"),
          submitError:
            projectsHubCopy?.submitError ||
            "Enter a prompt before creating a project",
          autoLabel: projectsHubCopy?.autoLabel || "AUTO",
          plusMenuTitle:
            projectsHubCopy?.plusMenuTitle || "Generate from this node",
          uploadReferenceAria:
            projectsHubCopy?.uploadReferenceAria || "Upload reference",
          closeDirectionAria: projectsHubCopy?.closeDirectionAria || "Close",
          virtualReferenceLabel:
            projectsHubCopy?.virtualReferenceLabel || "Reference image",
          virtualPromptLabel: projectsHubCopy?.virtualPromptLabel || "Prompt",
        }}
      />
    </CanvasSectionShell>
  );
}
