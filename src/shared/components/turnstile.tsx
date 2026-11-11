"use client";

import { useEffect, useRef } from "react";

interface TurnstileProps {
    siteKey: string;
    onVerify: (token: string) => void;
}

// Cloudflare Turnstile 客户端组件，仅在浏览器端渲染
export function Turnstile({ siteKey, onVerify }: TurnstileProps) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<string | null>(null);
    const hasRenderedRef = useRef(false);

    useEffect(() => {
        if (!siteKey) return;

        function renderWidget() {
            if (typeof window === "undefined") return;
            const anyWindow = window as any;
            if (!anyWindow.turnstile || !containerRef.current) return;

            // Avoid rendering multiple times (React re-render / HMR / strict mode)
            if (hasRenderedRef.current) return;

            // Clear previous widget if any
            if (widgetIdRef.current) {
                try {
                    anyWindow.turnstile.remove(widgetIdRef.current);
                } catch {
                    // ignore
                }
                widgetIdRef.current = null;
            }
            containerRef.current.innerHTML = "";

            const id = anyWindow.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: (token: string) => {
                    onVerify(token);
                },
            });
            widgetIdRef.current = id;
            hasRenderedRef.current = true;
        }

        // 已有脚本则复用
        const existingScript = Array.from(
            document.querySelectorAll("script")
        ).find((s) =>
            (s as HTMLScriptElement).src?.startsWith(
                "https://challenges.cloudflare.com/turnstile/v0/api.js"
            )
        ) as HTMLScriptElement | undefined;

        if (existingScript) {
            if ((window as any).turnstile) {
                renderWidget();
            } else {
                existingScript.addEventListener("load", renderWidget, { once: true });
            }
            return;
        }

        const script = document.createElement("script");
        script.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = renderWidget;
        document.body.appendChild(script);

        return () => {
            script.onload = null;
            // Cleanup widget on unmount
            try {
                const anyWindow = window as any;
                if (anyWindow.turnstile && widgetIdRef.current) {
                    anyWindow.turnstile.remove(widgetIdRef.current);
                }
            } catch {
                // ignore
            } finally {
                widgetIdRef.current = null;
                hasRenderedRef.current = false;
            }
        };
    }, [siteKey, onVerify]);

    return <div ref={containerRef} />;
}


