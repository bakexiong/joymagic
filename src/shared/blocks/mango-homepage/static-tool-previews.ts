import type { MangoHomepageTab, PreviewCard, ScenarioPath } from "./types";

export const homepageTabs: MangoHomepageTab[] = [
  {
    id: "video-tools",
    descriptionKey: "tabs.video-tools.description",
    cards: [
      {
        copyKey: "aiVideoGenerator",
        href: "/tools/text-to-video",
        mediaType: "video",
        imageSrc:
          "https://ocdn.10b.ai/meigen/posters/3b4db45dbfc361d53bebe30f0befb4a7.jpg",
        videoSrc:
          "https://ocdn.10b.ai/meigen/videos/58fcd5d0a926aada372d517792e431d4.mp4",
      },
      {
        copyKey: "imageToVideo",
        href: "/tools/image-to-video",
        mediaType: "image",
        imageSrc:
          "/generated/image-eraser/image-eraser-after-young-woman-cafe-v1.png",
      },
      {
        copyKey: "videoEffects",
        href: "/tools/video-effect",
        mediaType: "video",
        imageSrc:
          "https://ocdn.10b.ai/video-effects/v2/images/cd3e4bded642bb51a5fa8fb6427a5c5c.jpeg",
        videoSrc:
          "https://ocdn.10b.ai/video-effects/v2/videos/5b7e10b0c6e1954410066239f7ee3de0.mp4",
      },
      {
        copyKey: "fashionStride",
        href: "/tools/video-effect/fashion-stride",
        mediaType: "video",
        imageSrc:
          "https://ocdn.10b.ai/video-effects/v2/images/0d9e6cdde33e5b0e596d7e391c9dbb60.jpeg",
        videoSrc:
          "https://ocdn.10b.ai/video-effects/v2/videos/c280efb910c8053b15878172f60bb4ab.mp4",
      },
      {
        copyKey: "dreamyWedding",
        href: "/tools/video-effect/dreamy-wedding",
        mediaType: "video",
        imageSrc:
          "https://ocdn.10b.ai/video-effects/v2/images/7049aed9db6654742ce2d34c6ec48ac1.jpeg",
        videoSrc:
          "https://ocdn.10b.ai/video-effects/v2/videos/94b52cb27f1b84bab52e1b83777300ad.mp4",
      },
      {
        copyKey: "walkForward",
        href: "/tools/video-effect/walk-forward",
        mediaType: "video",
        imageSrc:
          "https://ocdn.10b.ai/video-effects/v2/images/8f4941171afdda62f7df445b591269b3.jpeg",
        videoSrc:
          "https://ocdn.10b.ai/video-effects/v2/videos/5564bb998c694152d91cf46d24bdd596.mp4",
      },
    ],
  },
  {
    id: "image-tools",
    descriptionKey: "tabs.image-tools.description",
    cards: [
      {
        copyKey: "aiImageGenerator",
        href: "/tools/text-to-image",
        mediaType: "image",
        imageSrc:
          "/generated/background-remover/bg-remover-before-cosmetics.svg",
      },
      {
        copyKey: "imageToImage",
        href: "/tools/image-to-image",
        mediaType: "image",
        imageSrc: "/generated/background-remover/bg-remover-before-sneaker.svg",
      },
      {
        copyKey: "imageUpscaler",
        href: "/tools/image-upscaler",
        mediaType: "image",
        imageSrc: "/generated/homepage-variations/variations-input.png",
      },
      {
        copyKey: "backgroundRemover",
        href: "/tools/image-background-remover",
        mediaType: "image",
        imageSrc: "/generated/background-remover/bg-remover-after-cat.svg",
      },
      {
        copyKey: "imageEraser",
        href: "/tools/image-eraser",
        mediaType: "image",
        imageSrc:
          "/generated/image-eraser/image-eraser-before-young-woman-cafe-v1.png",
      },
      {
        copyKey: "imageEffects",
        href: "/tools/image-effect",
        mediaType: "image",
        imageSrc: "/generated/background-remover/bg-remover-before-cat.svg",
      },
    ],
  },
  {
    id: "image-effects",
    descriptionKey: "tabs.image-effects.description",
    cards: [
      {
        copyKey: "aiGhibliEffect",
        href: "/tools/image-effect/ai-ghibli-effect",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/ai-ghibli-effect-7fc0bb3215722b48a22dfc0acf0be8c5.png",
      },
      {
        copyKey: "springBarbiecore",
        href: "/tools/image-effect/spring-barbiecore",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/spring-barbiecore-a659e7f4886293af1ad98e04aae9c574.png",
      },
      {
        copyKey: "softSpringHaze",
        href: "/tools/image-effect/soft-spring-haze",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/soft-spring-haze-3a34aa22f4ad6424b35c0b8a5cc8c419.png",
      },
      {
        copyKey: "provenceSummerGirl",
        href: "/tools/image-effect/provence-summer-girl",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/provence-summer-girl-2c144a90ad45852b58d12d185b2965a8.png",
      },
      {
        copyKey: "roseBokeh",
        href: "/tools/image-effect/rose-bokeh",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/rose-bokeh-5cf30e68e86f923e700aab2727c9f2ec.png",
      },
      {
        copyKey: "ccdStyleSnow",
        href: "/tools/image-effect/ccd-style-snow",
        mediaType: "image",
        imageSrc:
          "https://ocdn.10b.ai/image-effects/mango-photo-effects/ccd-style-snow-d4e099b1b88585a347d0096352bd4b2c.png",
      },
    ],
  },
];

export const homepageImageEffects: PreviewCard[] = [
  ...homepageTabs.find((tab) => tab.id === "image-effects")!.cards,
  {
    copyKey: "y2kTrendCollage",
    href: "/tools/image-effect/y2k-trend-collage",
    mediaType: "image",
    imageSrc:
      "https://ocdn.10b.ai/image-effects/mango-photo-effects/y2k-trend-collage-0de42da61ebad1120450389d8680028d.png",
  },
  {
    copyKey: "y2kCyberCollage",
    href: "/tools/image-effect/y2k-cyber-collage",
    mediaType: "image",
    imageSrc:
      "https://ocdn.10b.ai/image-effects/mango-photo-effects/y2k-cyber-collage-4699e4234f314c596904f45938422f50.png",
  },
  {
    copyKey: "miniMe",
    href: "/tools/image-effect/mini-me",
    mediaType: "image",
    imageSrc:
      "https://ocdn.10b.ai/image-effects/mango-photo-effects/mini-me-96779c34af69797d98eb450bd3473175.png",
  },
];

export const homepageVideoEffects: PreviewCard[] = [
  {
    copyKey: "ghibliMotion",
    href: "/tools/video-effect/ghibli",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/cd3e4bded642bb51a5fa8fb6427a5c5c.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/5b7e10b0c6e1954410066239f7ee3de0.mp4",
  },
  {
    copyKey: "fashionStride",
    href: "/tools/video-effect/fashion-stride",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/0d9e6cdde33e5b0e596d7e391c9dbb60.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/c280efb910c8053b15878172f60bb4ab.mp4",
  },
  {
    copyKey: "dreamyWedding",
    href: "/tools/video-effect/dreamy-wedding",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/7049aed9db6654742ce2d34c6ec48ac1.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/94b52cb27f1b84bab52e1b83777300ad.mp4",
  },
  {
    copyKey: "walkForward",
    href: "/tools/video-effect/walk-forward",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/8f4941171afdda62f7df445b591269b3.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/5564bb998c694152d91cf46d24bdd596.mp4",
  },
  {
    copyKey: "starCarpet",
    href: "/tools/video-effect/star-carpet",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/967721db85e4f3ba9b152fe2f92d421c.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/98a45bf3fb5e25ec678f507cad006ef7.mp4",
  },
  {
    copyKey: "blueprintSupreme",
    href: "/tools/video-effect/blueprint-supreme",
    mediaType: "video",
    imageSrc:
      "https://ocdn.10b.ai/video-effects/v2/images/51ba9cdc5cfc1443a835ccd06de1b8f9.jpeg",
    videoSrc:
      "https://ocdn.10b.ai/video-effects/v2/videos/062b3728906a2d52b9d2128c570c5baa.mp4",
  },
];

export const homepageEffectTags: Array<{ href: string; labelKey: string }> = [
  { href: "/tools/text-to-image", labelKey: "aiImageGenerator" },
  { href: "/tools/text-to-video", labelKey: "aiVideoGenerator" },
  { href: "/tools/image-to-image", labelKey: "imageToImage" },
  { href: "/tools/image-to-video", labelKey: "imageToVideo" },
  { href: "/tools/image-effect", labelKey: "imageEffects" },
  { href: "/tools/video-effect", labelKey: "videoEffects" },
  { href: "/tools/image-upscaler", labelKey: "imageUpscaler" },
  { href: "/tools/image-background-remover", labelKey: "backgroundRemover" },
  { href: "/tools/image-eraser", labelKey: "imageEraser" },
  { href: "/tools/text-to-image", labelKey: "createImage" },
  { href: "/tools/text-to-video", labelKey: "createVideo" },
  { href: "/tools/image-effect", labelKey: "showcases" },
];

export const homepageScenarioPaths: ScenarioPath[] = [
  {
    title: "AI image generator",
    description:
      "Create product photos, portraits, posters, social visuals, and concept images from text prompts.",
    href: "/tools/text-to-image",
    intent: "ai image generator",
  },
  {
    title: "AI video generator",
    description:
      "Turn prompts into short AI videos for ads, social content, product stories, and creative tests.",
    href: "/tools/text-to-video",
    intent: "ai video generator",
  },
  {
    title: "AI image editor",
    description:
      "Retouch, restyle, erase objects, change backgrounds, and create new variations from existing images.",
    href: "/tools/image-to-image",
    intent: "ai image editor",
  },
  {
    title: "Image to video AI",
    description:
      "Animate portraits, product photos, and concept art into motion with camera movement and effects.",
    href: "/tools/image-to-video",
    intent: "image to video ai",
  },
  {
    title: "AI background remover",
    description:
      "Remove photo backgrounds for ecommerce listings, profile images, ads, and clean design assets.",
    href: "/tools/image-background-remover",
    intent: "ai background remover",
  },
  {
    title: "AI image upscaler",
    description:
      "Upscale low-resolution photos into sharper images for catalogs, social posts, banners, and print previews.",
    href: "/tools/image-upscaler",
    intent: "ai image upscaler",
  },
  {
    title: "AI product photo generator",
    description:
      "Create commercial product shots, lifestyle scenes, backgrounds, and campaign variants for ecommerce.",
    href: "/tools/text-to-image",
    intent: "ai product photo generator",
  },
  {
    title: "AI ad creative generator",
    description:
      "Generate campaign visuals, ad concepts, posters, and social variants for your creative projects.",
    href: "/tools/text-to-video",
    intent: "ai ad creative generator",
  },
];
