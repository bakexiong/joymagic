import { NextRequest, NextResponse } from "next/server";

import { getVideoPosterUrl, isOssVideoUrl } from "@/shared/lib/oss-video-thumbnail";

export const runtime = "nodejs";

const ALLOWED_HOSTS = new Set([
  "ocdn.10b.ai",
  "cdn-10b.ai.wemiaow.com",
]);

function isAllowedManagedVideo(url: string) {
  if (!isOssVideoUrl(url)) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const src = request.nextUrl.searchParams.get("src") || "";
  const width = Number(request.nextUrl.searchParams.get("width") || "960");
  const snapshotTime = Number(
    request.nextUrl.searchParams.get("snapshotTime") || "1000",
  );

  if (!src || !isAllowedManagedVideo(src)) {
    return NextResponse.json(
      { error: "Invalid or unsupported src" },
      { status: 400 },
    );
  }

  const posterUrl = getVideoPosterUrl(src, {
    width: Number.isFinite(width) && width > 0 ? width : 960,
    height: 0,
    snapshotTime:
      Number.isFinite(snapshotTime) && snapshotTime >= 0
        ? snapshotTime
        : 1000,
    quality: 80,
  });

  if (!posterUrl) {
    return NextResponse.json(
      { error: "Unable to build poster url" },
      { status: 400 },
    );
  }

  const response = await fetch(posterUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; z-image.ai video poster proxy)",
    },
    next: {
      revalidate: 60 * 60 * 24,
    },
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `Poster fetch failed: ${response.status}` },
      { status: 502 },
    );
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = await response.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=14400, s-maxage=86400",
    },
  });
}
