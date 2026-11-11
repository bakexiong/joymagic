export type HomeTabId = "video-tools" | "image-tools" | "image-effects";

export type PreviewCard = {
  copyKey: string;
  href: string;
  mediaType: "image" | "video";
  imageSrc: string;
  videoSrc?: string;
};

export type MangoHomepageTab = {
  id: HomeTabId;
  descriptionKey: string;
  cards: PreviewCard[];
};

export type ScenarioPath = {
  title: string;
  description: string;
  href: string;
  intent: string;
};
