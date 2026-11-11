"use client";

import { useEffect, useRef } from "react";

export function CanvasProjectBootstrap({
  locale,
  name,
  entrySceneId,
  entryModelUrl,
}: {
  locale: string;
  name: string;
  entrySceneId?: string;
  entryModelUrl?: string;
}) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const createProject = async () => {
      const response = await fetch("/api/workbench/canvas-projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          entrySceneId,
          entryModelUrl,
          meta: {
            source: "canvas",
          },
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || result?.code !== 0 || !result?.data?.project?.id) {
        return;
      }

      window.location.replace(`/${locale}/create/canvas/${result.data.project.id}`);
    };

    void createProject();
  }, [entryModelUrl, entrySceneId, locale, name]);

  return null;
}
