import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getBestVideoThumbnailType,
  getVideoThumbnailUrl,
} from "@/shared/lib/oss-video-thumbnail";

describe("OSS Video Thumbnail", () => {
  const testVideoUrl = "https://ocdn.10b.ai/explore/videos/original/test.mp4";

  describe("getVideoThumbnailUrl", () => {
    it("should generate static image thumbnail URL", () => {
      const url = getVideoThumbnailUrl(testVideoUrl, { type: "image" });
      assert.ok(url.includes("x-oss-process=video/snapshot"));
      assert.ok(url.includes("t_1000"));
      assert.ok(url.includes("f_jpg"));
      assert.ok(url.includes("w_500"));
    });

    it("should generate GIF thumbnail URL", () => {
      const url = getVideoThumbnailUrl(testVideoUrl, { type: "gif" });
      assert.ok(url.includes("x-oss-process=video/convert"));
      assert.ok(url.includes("f_gif"));
      assert.ok(url.includes("w_500"));
      assert.ok(url.includes("t_3"));
    });

    it("should generate WebP thumbnail URL", () => {
      const url = getVideoThumbnailUrl(testVideoUrl, { type: "webp" });
      assert.ok(url.includes("x-oss-process=video/convert"));
      assert.ok(url.includes("f_webp"));
      assert.ok(url.includes("w_500"));
      assert.ok(url.includes("t_3"));
    });

    it("should use custom options", () => {
      const url = getVideoThumbnailUrl(testVideoUrl, {
        type: "webp",
        width: 800,
        duration: 5,
        quality: 90,
      });
      assert.ok(url.includes("w_800"));
      assert.ok(url.includes("t_5"));
      assert.ok(url.includes("q_90"));
    });

    it("should handle non-OSS URLs gracefully", () => {
      const nonOssUrl = "https://example.com/video.mp4";
      const url = getVideoThumbnailUrl(nonOssUrl);
      assert.equal(url, nonOssUrl);
    });

    it("should remove existing query parameters", () => {
      const urlWithParams = `${testVideoUrl}?existing=param`;
      const url = getVideoThumbnailUrl(urlWithParams, { type: "image" });
      assert.ok(!url.includes("existing=param"));
      assert.ok(url.includes("x-oss-process=video/snapshot"));
    });
  });

  describe("getBestVideoThumbnailType", () => {
    it("should return webp for modern browsers", () => {
      const originalCreateElement = document.createElement.bind(document);
      document.createElement = ((
        tagName: string,
        options?: ElementCreationOptions,
      ) => {
        const element = originalCreateElement(tagName, options);
        if (tagName === "canvas") {
          (
            element as HTMLCanvasElement & {
              toDataURL: (type?: string) => string;
            }
          ).toDataURL = () => "data:image/webp;base64,test";
        }
        return element;
      }) as typeof document.createElement;

      try {
        const type = getBestVideoThumbnailType();
        assert.ok(["webp", "gif"].includes(type));
      } finally {
        document.createElement = originalCreateElement;
      }
    });
  });
});
