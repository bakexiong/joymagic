type FeatureItem = {
  title: string;
  description: string;
};

type FAQItem = {
  question: string;
  answer: string;
};

type Wan27TextToImagePageCopy = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroTitle: string;
  heroDescription: string;
  keyFeaturesTitle: string;
  keyFeaturesDescription: string;
  features: FeatureItem[];
  tipsTitle: string;
  tips: FeatureItem[];
  useCasesTitle: string;
  useCases: FeatureItem[];
  faqTitle: string;
  faqDescription: string;
  faq: FAQItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  breadcrumbModel: string;
  howToName: string;
  howToDescription: string;
  softwareName: string;
  featureList: string[];
};

type Wan27ImageToImagePageCopy = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroTitle: string;
  heroDescription: string;
  featuresTitle: string;
  featuresDescription: string;
  features: FeatureItem[];
  tipsTitle: string;
  tips: FeatureItem[];
  useCasesTitle: string;
  useCases: FeatureItem[];
  faqTitle: string;
  faqDescription: string;
  faq: FAQItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  breadcrumbModel: string;
  howToName: string;
  howToDescription: string;
  softwareName: string;
  featureList: string[];
};

type CommonLabels = {
  tryNow: string;
  viewPricing: string;
  home: string;
  textToImage: string;
  imageToImage: string;
  textToVideo: string;
  imageToVideo: string;
};

const commonLabels: Record<string, CommonLabels> = {
  en: {
    tryNow: "Try Now",
    viewPricing: "View Pricing",
    home: "Home",
    textToImage: "Text to Image",
    imageToImage: "Image to Image",
    textToVideo: "Text to Video",
    imageToVideo: "Image to Video",
  },
  "en-IN": {
    tryNow: "Try Now",
    viewPricing: "View Pricing",
    home: "Home",
    textToImage: "Text to Image",
    imageToImage: "Image to Image",
    textToVideo: "Text to Video",
    imageToVideo: "Image to Video",
  },
  zh: {
    tryNow: "立即试用",
    viewPricing: "查看价格",
    home: "首页",
    textToImage: "文本生成图片",
    imageToImage: "图生图",
    textToVideo: "文本生成视频",
    imageToVideo: "图片生成视频",
  },
  "zh-Hant-TW": {
    tryNow: "立即試用",
    viewPricing: "查看價格",
    home: "首頁",
    textToImage: "文字生成圖片",
    imageToImage: "圖生圖",
    textToVideo: "文字生成影片",
    imageToVideo: "圖片生成影片",
  },
  "zh-hk": {
    tryNow: "立即試用",
    viewPricing: "查看價格",
    home: "首頁",
    textToImage: "文字生成圖片",
    imageToImage: "圖生圖",
    textToVideo: "文字生成影片",
    imageToVideo: "圖片生成影片",
  },
  "de-DE": {
    tryNow: "Jetzt testen",
    viewPricing: "Preise ansehen",
    home: "Startseite",
    textToImage: "Text zu Bild",
    imageToImage: "Bild zu Bild",
    textToVideo: "Text zu Video",
    imageToVideo: "Bild zu Video",
  },
  "ko-KR": {
    tryNow: "지금 사용해 보기",
    viewPricing: "요금 보기",
    home: "홈",
    textToImage: "텍스트 이미지 생성",
    imageToImage: "이미지 편집",
    textToVideo: "텍스트 비디오 생성",
    imageToVideo: "이미지 비디오 생성",
  },
  "ja-JP": {
    tryNow: "今すぐ試す",
    viewPricing: "料金を見る",
    home: "ホーム",
    textToImage: "テキストから画像",
    imageToImage: "画像から画像",
    textToVideo: "テキストから動画",
    imageToVideo: "画像から動画",
  },
  "es-ES": {
    tryNow: "Probar ahora",
    viewPricing: "Ver precios",
    home: "Inicio",
    textToImage: "Texto a imagen",
    imageToImage: "Imagen a imagen",
    textToVideo: "Texto a video",
    imageToVideo: "Imagen a video",
  },
  "it-IT": {
    tryNow: "Prova ora",
    viewPricing: "Vedi prezzi",
    home: "Home",
    textToImage: "Testo in immagine",
    imageToImage: "Immagine a immagine",
    textToVideo: "Testo in video",
    imageToVideo: "Immagine in video",
  },
  "pt-BR": {
    tryNow: "Testar agora",
    viewPricing: "Ver preços",
    home: "Início",
    textToImage: "Texto para imagem",
    imageToImage: "Imagem para imagem",
    textToVideo: "Texto para vídeo",
    imageToVideo: "Imagem para vídeo",
  },
  "ru-RU": {
    tryNow: "Попробовать",
    viewPricing: "Посмотреть цены",
    home: "Главная",
    textToImage: "Текст в изображение",
    imageToImage: "Изображение в изображение",
    textToVideo: "Текст в видео",
    imageToVideo: "Изображение в видео",
  },
  "tr-TR": {
    tryNow: "Hemen dene",
    viewPricing: "Fiyatları gör",
    home: "Ana Sayfa",
    textToImage: "Metinden görsele",
    imageToImage: "Görselden görsele",
    textToVideo: "Metinden videoya",
    imageToVideo: "Görselden videoya",
  },
  "ps-AF": {
    tryNow: "اوس وازمویه",
    viewPricing: "بیې وګورئ",
    home: "کور",
    textToImage: "له متن څخه انځور",
    imageToImage: "له انځور څخه انځور",
    textToVideo: "له متن څخه ویډیو",
    imageToVideo: "له انځور څخه ویډیو",
  },
};

const textToImageCopy: Record<string, Wan27TextToImagePageCopy> = {
  en: {
    metaTitle: "Wan 2.7 Text to Image - Thinking Mode and 4096 Size | joymagic",
    metaDescription:
      "Generate high-quality images with Wan 2.7 text to image. Set custom width and height, enable Thinking Mode, and use seed control for reproducible results.",
    metaKeywords:
      "Wan 2.7, text to image, AI image generator, Thinking Mode, seed, custom size, Alibaba Cloud",
    heroTitle: "Wan 2.7 Text to Image",
    heroDescription:
      "Wan 2.7 is a high-detail text-to-image model for creator workflows that need stronger prompt understanding, flexible size control, and stable iteration. You can set width and height directly, turn on Thinking Mode, and keep a fixed seed when you want to refine a promising direction.",
    keyFeaturesTitle: "Why use Wan 2.7?",
    keyFeaturesDescription:
      "A practical text-to-image workflow for high resolution, prompt reasoning, and repeatable results.",
    features: [
      { title: "Thinking Mode", description: "Give the model more reasoning time for complex materials, lighting, composition, and atmosphere." },
      { title: "Custom size up to 4096", description: "Use width and height sliders to build large square, vertical, horizontal, or poster-style outputs." },
      { title: "Seed control", description: "Keep a direction stable while refining prompts instead of restarting from a new random result every time." },
      { title: "Good with detailed prompts", description: "Works well for portraits, products, concept scenes, fashion visuals, and other detail-heavy ideas." },
    ],
    tipsTitle: "Prompt tips",
    tips: [
      { title: "Start with subject and framing", description: "State the subject, shot type, and composition first so the model locks onto the right structure." },
      { title: "Specify materials and lighting", description: "Precise words for surface, texture, and light direction usually improve fidelity." },
      { title: "Use Thinking Mode for larger outputs", description: "It is especially helpful when you generate at 2048 or above or need lots of fine detail." },
      { title: "Explore first, then lock the seed", description: "Use random generations to search, then switch to a fixed seed for controlled iteration." },
    ],
    useCasesTitle: "Best use cases",
    useCases: [
      { title: "Fashion and beauty", description: "Create close-up portraits, editorial concepts, and beauty campaign directions." },
      { title: "Brand visuals", description: "Generate product heroes, key visuals, covers, and marketing images." },
      { title: "Concept exploration", description: "Test worldbuilding, color language, material studies, and cinematic moods quickly." },
      { title: "Social covers", description: "Adapt outputs to square, vertical, or wide layouts for banners, covers, and posters." },
    ],
    faqTitle: "Frequently asked questions",
    faqDescription: "Common questions about Wan 2.7 text to image.",
    faq: [
      { question: "Which parameters are supported?", answer: "This page supports prompt, width, height, Thinking Mode, and seed. Width and height are submitted as a combined size value." },
      { question: "What does Thinking Mode do?", answer: "It gives the model more reasoning time, which usually improves complex scenes and detail quality, but it also increases generation time." },
      { question: "How large can the image be?", answer: "The current form supports width and height from 512 to 4096, with a 64-pixel step and a default size of 2048 by 2048." },
      { question: "What does seed = -1 mean?", answer: "A seed of -1 means random generation. Use a fixed integer if you want reproducible results." },
    ],
    ctaTitle: "Start generating with Wan 2.7",
    ctaDescription:
      "Open the Wan 2.7 creator form and test how custom resolution and Thinking Mode change your outputs.",
    ctaButton: "Try Wan 2.7 now",
    breadcrumbModel: "Wan 2.7",
    howToName: "How to generate images with Wan 2.7",
    howToDescription: "Generate high-quality images from text using Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Text to Image",
    featureList: ["AI text-to-image generation", "Thinking Mode enhancement", "Custom sizes up to 4096"],
  },
  "en-IN": {} as Wan27TextToImagePageCopy,
  zh: {
    metaTitle: "Wan 2.7 文本生成图片 - Thinking Mode 与 4096 尺寸 | joymagic",
    metaDescription:
      "使用 Wan 2.7 文生图模型生成高质量图片，支持自定义宽高、Thinking Mode 和 seed 控制，适合高分辨率创作。",
    metaKeywords:
      "Wan 2.7, 文生图, AI 图片生成, Thinking Mode, seed, 自定义尺寸, 阿里云",
    heroTitle: "Wan 2.7 文本生成图片",
    heroDescription:
      "Wan 2.7 适合需要更强提示词理解、更高分辨率和更稳定迭代的创作流程。你可以直接设置宽高、开启 Thinking Mode，并用固定 seed 持续微调同一视觉方向。",
    keyFeaturesTitle: "为什么使用 Wan 2.7？",
    keyFeaturesDescription:
      "面向高分辨率、推理增强和结果复现的实用型文生图工作流。",
    features: [
      { title: "Thinking Mode", description: "为复杂材质、打光、构图和氛围留出更多推理空间。" },
      { title: "最高 4096 自定义尺寸", description: "通过宽高滑杆生成大尺寸方图、竖图、横图和海报构图。" },
      { title: "Seed 可复现", description: "锁定满意方向后继续调 prompt，而不是每次都从新的随机结果开始。" },
      { title: "适合细节丰富提示词", description: "适用于人像、产品图、概念设定、时尚视觉等高细节场景。" },
    ],
    tipsTitle: "提示词建议",
    tips: [
      { title: "先写主体和镜头关系", description: "先说明主体、景别和构图，能更稳定地锁定画面结构。" },
      { title: "把材质和光线写具体", description: "越明确的表面、纹理和光线方向，通常越容易得到理想质感。" },
      { title: "大尺寸建议开 Thinking Mode", description: "当尺寸到 2048 以上，或者细节很多时，Thinking Mode 往往更稳。" },
      { title: "先探索，再固定 seed", description: "先随机找方向，再锁 seed 做连续微调，效率通常更高。" },
    ],
    useCasesTitle: "适合场景",
    useCases: [
      { title: "时尚与美妆", description: "适合人物特写、杂志风格视觉和美妆 campaign 探索。" },
      { title: "品牌主视觉", description: "可用于产品主图、KV、封面和营销素材。" },
      { title: "概念探索", description: "适合快速测试世界观、色彩语言、材质和电影感氛围。" },
      { title: "社媒封面", description: "方便输出适配 banner、封面、海报等不同版式。" },
    ],
    faqTitle: "常见问题",
    faqDescription: "关于 Wan 2.7 文生图的常见问题。",
    faq: [
      { question: "支持哪些参数？", answer: "当前页面支持 prompt、width、height、Thinking Mode 和 seed。提交时会自动拼成 size 参数。" },
      { question: "Thinking Mode 有什么作用？", answer: "它会让模型进行更强的推理，通常有助于复杂画面和细节表现，但生成时间也会更长。" },
      { question: "最大尺寸是多少？", answer: "当前宽高范围为 512 到 4096，步进 64，默认尺寸是 2048 乘 2048。" },
      { question: "seed = -1 是什么意思？", answer: "表示随机种子。如果想稳定复现结果，请改成固定整数。" },
    ],
    ctaTitle: "开始用 Wan 2.7 生成图片",
    ctaDescription:
      "打开 Wan 2.7 表单，直接测试自定义分辨率和 Thinking Mode 的效果。",
    ctaButton: "立即体验 Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 生成图片",
    howToDescription: "使用 Wan 2.7 根据文本生成高质量图片。",
    softwareName: "joymagic Wan 2.7 文本生成图片",
    featureList: ["AI 文本生成图片", "Thinking Mode 增强", "最高 4096 自定义尺寸"],
  },
  "zh-Hant-TW": {
    metaTitle: "Wan 2.7 文字生成圖片 - Thinking Mode 與 4096 尺寸 | joymagic",
    metaDescription:
      "使用 Wan 2.7 文生圖模型生成高品質圖片，支援自訂寬高、Thinking Mode 與 seed 控制，適合高解析度創作。",
    metaKeywords:
      "Wan 2.7, 文生圖, AI 圖片生成, Thinking Mode, seed, 自訂尺寸, 阿里雲",
    heroTitle: "Wan 2.7 文字生成圖片",
    heroDescription:
      "Wan 2.7 適合需要更強提示理解、更高解析度與更穩定迭代的創作流程。你可以直接設定寬高、開啟 Thinking Mode，並用固定 seed 持續微調同一個視覺方向。",
    keyFeaturesTitle: "為什麼使用 Wan 2.7？",
    keyFeaturesDescription:
      "面向高解析度、推理增強與結果重現的實用型文生圖工作流。",
    features: [
      { title: "Thinking Mode", description: "為複雜材質、打光、構圖與氛圍保留更多推理空間。" },
      { title: "最高 4096 自訂尺寸", description: "透過寬高滑桿輸出大尺寸方圖、直式、橫式與海報構圖。" },
      { title: "Seed 可重現", description: "鎖定滿意方向後繼續微調 prompt，不必每次都從新的隨機結果開始。" },
      { title: "適合細節豐富提示詞", description: "適用於人像、產品圖、概念設計、時尚視覺等高細節場景。" },
    ],
    tipsTitle: "提示詞建議",
    tips: [
      { title: "先寫主體與鏡頭關係", description: "先說明主體、景別與構圖，能更穩定地鎖定畫面結構。" },
      { title: "把材質與光線寫清楚", description: "越明確的表面、紋理與光線方向，通常越容易得到理想質感。" },
      { title: "大尺寸建議開啟 Thinking Mode", description: "當尺寸超過 2048，或畫面細節很多時，Thinking Mode 通常更穩。" },
      { title: "先探索，再固定 seed", description: "先用隨機結果找方向，再鎖 seed 做連續微調會更有效率。" },
    ],
    useCasesTitle: "適合場景",
    useCases: [
      { title: "時尚與美妝", description: "適合人物特寫、雜誌風格視覺與美妝 campaign 探索。" },
      { title: "品牌主視覺", description: "可用於產品主圖、KV、封面與行銷素材。" },
      { title: "概念探索", description: "適合快速測試世界觀、色彩語言、材質與電影感氛圍。" },
      { title: "社群封面", description: "方便輸出適配 banner、封面與海報等不同版式。" },
    ],
    faqTitle: "常見問題",
    faqDescription: "關於 Wan 2.7 文生圖的常見問題。",
    faq: [
      { question: "支援哪些參數？", answer: "目前頁面支援 prompt、width、height、Thinking Mode 與 seed。提交時會自動組成 size 參數。" },
      { question: "Thinking Mode 有什麼作用？", answer: "它會讓模型進行更強的推理，通常有助於複雜畫面與細節表現，但生成時間也會增加。" },
      { question: "最大尺寸是多少？", answer: "目前寬高範圍為 512 到 4096，步進 64，預設尺寸是 2048 乘 2048。" },
      { question: "seed = -1 是什麼意思？", answer: "表示隨機種子。若想穩定重現結果，請改成固定整數。" },
    ],
    ctaTitle: "開始用 Wan 2.7 生成圖片",
    ctaDescription: "打開 Wan 2.7 表單，直接測試自訂解析度與 Thinking Mode 的效果。",
    ctaButton: "立即體驗 Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 生成圖片",
    howToDescription: "使用 Wan 2.7 根據文字生成高品質圖片。",
    softwareName: "joymagic Wan 2.7 文字生成圖片",
    featureList: ["AI 文字生成圖片", "Thinking Mode 增強", "最高 4096 自訂尺寸"],
  },
  "zh-hk": {} as Wan27TextToImagePageCopy,
  "de-DE": {
    metaTitle: "Wan 2.7 Text-zu-Bild - Thinking Mode und 4096 Größe | joymagic",
    metaDescription:
      "Erstellen Sie hochwertige Bilder mit Wan 2.7 Text-zu-Bild. Nutzen Sie benutzerdefinierte Breite und Höhe, Thinking Mode und Seed-Kontrolle.",
    metaKeywords:
      "Wan 2.7, Text zu Bild, KI Bildgenerator, Thinking Mode, Seed, benutzerdefinierte Größe, Alibaba Cloud",
    heroTitle: "Wan 2.7 Text-zu-Bild",
    heroDescription:
      "Wan 2.7 eignet sich für kreative Workflows mit starker Prompt-Verarbeitung, hoher Auflösung und stabiler Iteration. Sie können Breite und Höhe direkt festlegen, Thinking Mode aktivieren und mit einem festen Seed gezielt weiter verfeinern.",
    keyFeaturesTitle: "Warum Wan 2.7?",
    keyFeaturesDescription:
      "Ein praktischer Text-zu-Bild-Workflow für hohe Auflösung, mehr Reasoning und reproduzierbare Ergebnisse.",
    features: [
      { title: "Thinking Mode", description: "Mehr Reasoning für komplexe Materialien, Licht, Komposition und Stimmung." },
      { title: "Benutzerdefinierte Größen bis 4096", description: "Erstellen Sie große quadratische, vertikale, horizontale und posterartige Formate." },
      { title: "Seed-Kontrolle", description: "Verfeinern Sie eine gute Richtung weiter, ohne jedes Mal neu zufällig zu starten." },
      { title: "Stark bei detailreichen Prompts", description: "Geeignet für Porträts, Produktvisuals, Konzeptkunst und Fashion-Bilder." },
    ],
    tipsTitle: "Prompt-Tipps",
    tips: [
      { title: "Motiv und Bildausschnitt zuerst definieren", description: "Beschreiben Sie zuerst Motiv, Bildausschnitt und Komposition, damit die Struktur stabil bleibt." },
      { title: "Material und Licht präzise angeben", description: "Konkrete Begriffe für Oberfläche, Textur und Licht verbessern die Bildtreue." },
      { title: "Thinking Mode für große Ausgaben aktivieren", description: "Besonders ab 2048 oder bei vielen Details lohnt sich Thinking Mode." },
      { title: "Erst erkunden, dann Seed sperren", description: "Suchen Sie zuerst mit Zufall nach einer Richtung und wechseln Sie danach zu einem festen Seed." },
    ],
    useCasesTitle: "Typische Einsatzfälle",
    useCases: [
      { title: "Fashion und Beauty", description: "Für Close-ups, Editorial-Konzepte und Beauty-Kampagnen." },
      { title: "Markenvisuals", description: "Für Produktbilder, Key Visuals, Cover und Marketingmotive." },
      { title: "Konzeptentwicklung", description: "Für Worldbuilding, Materialstudien, Farbrichtung und cineastische Atmosphäre." },
      { title: "Social-Cover", description: "Für Banner, Cover und Poster in unterschiedlichen Formaten." },
    ],
    faqTitle: "Häufige Fragen",
    faqDescription: "Häufige Fragen zu Wan 2.7 Text-zu-Bild.",
    faq: [
      { question: "Welche Parameter werden unterstützt?", answer: "Diese Seite unterstützt Prompt, Breite, Höhe, Thinking Mode und Seed. Breite und Höhe werden als kombinierter size-Wert gesendet." },
      { question: "Was macht Thinking Mode?", answer: "Thinking Mode gibt dem Modell mehr Reasoning-Zeit. Das verbessert oft komplexe Szenen und Details, verlängert aber auch die Generierungszeit." },
      { question: "Wie groß kann das Bild werden?", answer: "Die aktuelle Konfiguration unterstützt Breite und Höhe von 512 bis 4096 in 64er-Schritten. Standard ist 2048 mal 2048." },
      { question: "Was bedeutet seed = -1?", answer: "Das steht für eine zufällige Generierung. Für reproduzierbare Ergebnisse verwenden Sie einen festen ganzzahligen Seed." },
    ],
    ctaTitle: "Mit Wan 2.7 Bilder erzeugen",
    ctaDescription:
      "Öffnen Sie das Wan-2.7-Formular und testen Sie benutzerdefinierte Auflösung und Thinking Mode direkt.",
    ctaButton: "Wan 2.7 testen",
    breadcrumbModel: "Wan 2.7",
    howToName: "So erzeugen Sie Bilder mit Wan 2.7",
    howToDescription: "Erzeugen Sie mit Wan 2.7 hochwertige Bilder aus Text.",
    softwareName: "joymagic Wan 2.7 Text zu Bild",
    featureList: ["KI Text-zu-Bild", "Thinking Mode", "Benutzerdefinierte Größen bis 4096"],
  },
  "ko-KR": {
    metaTitle: "Wan 2.7 텍스트 이미지 생성 - Thinking Mode와 4096 크기 | joymagic",
    metaDescription:
      "Wan 2.7 텍스트 이미지 생성으로 고품질 이미지를 만드세요. 사용자 지정 너비와 높이, Thinking Mode, seed 제어를 지원합니다.",
    metaKeywords:
      "Wan 2.7, 텍스트 이미지 생성, AI 이미지 생성기, Thinking Mode, seed, 사용자 지정 크기, 알리바바 클라우드",
    heroTitle: "Wan 2.7 텍스트 이미지 생성",
    heroDescription:
      "Wan 2.7은 더 강한 프롬프트 이해, 높은 해상도, 안정적인 반복 작업이 필요한 크리에이터 워크플로에 잘 맞습니다. 너비와 높이를 직접 설정하고 Thinking Mode를 켜고 고정 seed로 같은 방향을 계속 다듬을 수 있습니다.",
    keyFeaturesTitle: "왜 Wan 2.7인가요?",
    keyFeaturesDescription:
      "고해상도, 향상된 추론, 재현 가능한 결과를 위한 실용적인 텍스트 이미지 생성 워크플로입니다.",
    features: [
      { title: "Thinking Mode", description: "복잡한 재질, 조명, 구도, 분위기를 더 깊게 이해하도록 돕습니다." },
      { title: "최대 4096 사용자 지정 크기", description: "정사각형, 세로형, 가로형, 포스터형 결과를 크게 만들 수 있습니다." },
      { title: "Seed 제어", description: "마음에 드는 방향을 찾은 뒤 계속 미세 조정할 수 있습니다." },
      { title: "디테일한 프롬프트에 강함", description: "인물, 제품, 콘셉트 아트, 패션 비주얼 같은 장면에 잘 맞습니다." },
    ],
    tipsTitle: "프롬프트 팁",
    tips: [
      { title: "주제와 프레이밍부터 쓰기", description: "피사체, 샷 타입, 구도를 먼저 적으면 구조가 더 안정적입니다." },
      { title: "재질과 조명을 구체적으로 쓰기", description: "표면, 질감, 빛 방향을 구체적으로 적을수록 결과가 좋아집니다." },
      { title: "큰 해상도에서는 Thinking Mode 사용", description: "2048 이상이거나 디테일이 많을 때 특히 유용합니다." },
      { title: "먼저 탐색한 뒤 seed 고정", description: "처음에는 랜덤으로 방향을 찾고, 이후 고정 seed로 반복하는 편이 효율적입니다." },
    ],
    useCasesTitle: "추천 활용 사례",
    useCases: [
      { title: "패션과 뷰티", description: "클로즈업 인물, 에디토리얼 콘셉트, 뷰티 캠페인에 적합합니다." },
      { title: "브랜드 비주얼", description: "제품 메인 컷, 키 비주얼, 커버, 마케팅 이미지에 활용할 수 있습니다." },
      { title: "콘셉트 탐색", description: "세계관, 색감, 재질, 시네마틱 무드를 빠르게 실험할 수 있습니다." },
      { title: "소셜 커버", description: "배너, 커버, 포스터처럼 다양한 비율에 맞게 출력할 수 있습니다." },
    ],
    faqTitle: "자주 묻는 질문",
    faqDescription: "Wan 2.7 텍스트 이미지 생성에 대한 자주 묻는 질문입니다.",
    faq: [
      { question: "어떤 파라미터를 지원하나요?", answer: "이 페이지는 prompt, width, height, Thinking Mode, seed를 지원합니다. width와 height는 하나의 size 값으로 전송됩니다." },
      { question: "Thinking Mode는 무엇인가요?", answer: "모델에 더 많은 추론 시간을 주어 복잡한 장면과 디테일 품질을 높이는 데 도움이 되지만 생성 시간은 늘어납니다." },
      { question: "최대 크기는 얼마인가요?", answer: "현재 너비와 높이는 512부터 4096까지, 64 단위로 설정할 수 있으며 기본값은 2048 곱하기 2048입니다." },
      { question: "seed = -1은 무슨 뜻인가요?", answer: "무작위 생성이라는 뜻입니다. 재현 가능한 결과가 필요하면 고정된 정수 seed를 사용하세요." },
    ],
    ctaTitle: "Wan 2.7으로 이미지 만들기",
    ctaDescription: "Wan 2.7 폼을 열고 사용자 지정 해상도와 Thinking Mode의 차이를 바로 확인해 보세요.",
    ctaButton: "Wan 2.7 사용하기",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7으로 이미지 생성하는 방법",
    howToDescription: "Wan 2.7으로 텍스트에서 고품질 이미지를 생성합니다.",
    softwareName: "joymagic Wan 2.7 텍스트 이미지 생성",
    featureList: ["AI 텍스트 이미지 생성", "Thinking Mode", "최대 4096 사용자 지정 크기"],
  },
  "ja-JP": {
    metaTitle: "Wan 2.7 テキストから画像 - Thinking Mode と 4096 サイズ | joymagic",
    metaDescription:
      "Wan 2.7 のテキストから画像で高品質な画像を生成。幅と高さの指定、Thinking Mode、seed 制御に対応しています。",
    metaKeywords:
      "Wan 2.7, テキストから画像, AI画像生成, Thinking Mode, seed, カスタムサイズ, Alibaba Cloud",
    heroTitle: "Wan 2.7 テキストから画像",
    heroDescription:
      "Wan 2.7 は、より強いプロンプト理解、高解像度出力、安定した反復調整が必要な制作フローに向いたモデルです。幅と高さを直接設定し、Thinking Mode を有効にし、固定 seed で同じ方向性を磨き続けられます。",
    keyFeaturesTitle: "Wan 2.7 を使う理由",
    keyFeaturesDescription:
      "高解像度、推論強化、再現性の高い結果を重視した実用的なワークフローです。",
    features: [
      { title: "Thinking Mode", description: "複雑な質感、光、構図、雰囲気をより深く理解させます。" },
      { title: "最大 4096 のカスタムサイズ", description: "正方形、縦長、横長、ポスター風レイアウトを大きく出力できます。" },
      { title: "Seed 制御", description: "気に入った方向性を保ちながらプロンプトを細かく調整できます。" },
      { title: "詳細なプロンプトに強い", description: "人物、商品、コンセプトアート、ファッションビジュアルに向いています。" },
    ],
    tipsTitle: "プロンプトのコツ",
    tips: [
      { title: "被写体と構図から始める", description: "被写体、画角、構図を最初に書くと全体の構造が安定します。" },
      { title: "材質と光を具体的に書く", description: "表面、質感、光の方向を具体的にすると再現性が上がります。" },
      { title: "大きなサイズでは Thinking Mode を使う", description: "2048 以上や細部が多い画像では特に有効です。" },
      { title: "まず探索してから seed を固定", description: "最初はランダムで方向性を探し、その後固定 seed で調整すると効率的です。" },
    ],
    useCasesTitle: "おすすめ用途",
    useCases: [
      { title: "ファッションとビューティー", description: "クローズアップ人物、エディトリアル案、ビューティーキャンペーンに適しています。" },
      { title: "ブランドビジュアル", description: "商品メインビジュアル、KV、カバー、販促素材に使えます。" },
      { title: "コンセプト探索", description: "世界観、色、素材、シネマティックな雰囲気を素早く試せます。" },
      { title: "SNS カバー", description: "バナー、カバー、ポスター向けに異なる比率で出力できます。" },
    ],
    faqTitle: "よくある質問",
    faqDescription: "Wan 2.7 テキストから画像に関するよくある質問です。",
    faq: [
      { question: "どのパラメータに対応していますか？", answer: "このページは prompt、width、height、Thinking Mode、seed に対応しています。width と height は 1 つの size 値として送信されます。" },
      { question: "Thinking Mode とは何ですか？", answer: "モデルにより多くの推論時間を与える機能で、複雑なシーンや細部の品質向上に役立ちますが、生成時間は長くなります。" },
      { question: "最大サイズはどれくらいですか？", answer: "現在は幅と高さを 512 から 4096 まで、64 刻みで指定できます。初期値は 2048 かける 2048 です。" },
      { question: "seed = -1 は何を意味しますか？", answer: "ランダム生成を意味します。再現したい場合は固定の整数 seed を使ってください。" },
    ],
    ctaTitle: "Wan 2.7 で画像を生成する",
    ctaDescription: "Wan 2.7 フォームを開いて、カスタム解像度と Thinking Mode の効果を確認してください。",
    ctaButton: "Wan 2.7 を試す",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 で画像を生成する方法",
    howToDescription: "Wan 2.7 を使ってテキストから高品質な画像を生成します。",
    softwareName: "joymagic Wan 2.7 テキストから画像",
    featureList: ["AI テキストから画像", "Thinking Mode", "最大 4096 のカスタムサイズ"],
  },
  "es-ES": {
    metaTitle: "Wan 2.7 Texto a Imagen - Thinking Mode y tamaño 4096 | joymagic",
    metaDescription:
      "Genera imágenes de alta calidad con Wan 2.7 texto a imagen. Usa ancho y alto personalizados, Thinking Mode y control de seed.",
    metaKeywords:
      "Wan 2.7, texto a imagen, generador de imágenes IA, Thinking Mode, seed, tamaño personalizado, Alibaba Cloud",
    heroTitle: "Wan 2.7 Texto a Imagen",
    heroDescription:
      "Wan 2.7 encaja bien en flujos creativos que necesitan mejor comprensión del prompt, alta resolución e iteración estable. Puedes definir ancho y alto, activar Thinking Mode y mantener una seed fija para refinar una dirección visual concreta.",
    keyFeaturesTitle: "¿Por qué usar Wan 2.7?",
    keyFeaturesDescription:
      "Un flujo práctico de texto a imagen pensado para alta resolución, razonamiento adicional y resultados reproducibles.",
    features: [
      { title: "Thinking Mode", description: "Da al modelo más tiempo de razonamiento para materiales, luz, composición y atmósfera complejos." },
      { title: "Tamaños personalizados hasta 4096", description: "Genera salidas cuadradas, verticales, horizontales o tipo póster con control total de dimensiones." },
      { title: "Control de seed", description: "Refina una dirección prometedora sin reiniciar desde un resultado aleatorio nuevo cada vez." },
      { title: "Bueno con prompts detallados", description: "Funciona bien para retratos, productos, escenas conceptuales y visuales de moda." },
    ],
    tipsTitle: "Consejos de prompt",
    tips: [
      { title: "Empieza por sujeto y encuadre", description: "Define primero el sujeto, el tipo de plano y la composición para fijar mejor la estructura." },
      { title: "Describe materiales y luz", description: "Las palabras concretas sobre superficie, textura y dirección de la luz suelen mejorar el resultado." },
      { title: "Activa Thinking Mode en tamaños grandes", description: "Es especialmente útil a 2048 o más, o cuando hay mucho detalle fino." },
      { title: "Explora y luego fija la seed", description: "Primero busca una dirección con aleatoriedad y luego cambia a una seed fija para iterar." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Moda y belleza", description: "Para retratos cercanos, conceptos editoriales y campañas de belleza." },
      { title: "Visuales de marca", description: "Útil para héroes de producto, key visuals, portadas y materiales de marketing." },
      { title: "Exploración conceptual", description: "Prueba rápidamente mundos, color, materiales y atmósferas cinematográficas." },
      { title: "Portadas sociales", description: "Adapta salidas a banners, portadas y pósteres en distintos formatos." },
    ],
    faqTitle: "Preguntas frecuentes",
    faqDescription: "Preguntas comunes sobre Wan 2.7 texto a imagen.",
    faq: [
      { question: "¿Qué parámetros admite?", answer: "Esta página admite prompt, width, height, Thinking Mode y seed. Width y height se envían como un valor size combinado." },
      { question: "¿Qué hace Thinking Mode?", answer: "Da al modelo más tiempo de razonamiento, lo que suele mejorar escenas complejas y detalle, aunque también aumenta el tiempo de generación." },
      { question: "¿Cuál es el tamaño máximo?", answer: "La configuración actual admite width y height de 512 a 4096 en pasos de 64. El tamaño por defecto es 2048 por 2048." },
      { question: "¿Qué significa seed = -1?", answer: "Significa generación aleatoria. Si quieres resultados reproducibles, usa una seed entera fija." },
    ],
    ctaTitle: "Empieza a generar con Wan 2.7",
    ctaDescription:
      "Abre el formulario de Wan 2.7 y prueba cómo cambian los resultados con resolución personalizada y Thinking Mode.",
    ctaButton: "Probar Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Cómo generar imágenes con Wan 2.7",
    howToDescription: "Genera imágenes de alta calidad a partir de texto con Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Texto a Imagen",
    featureList: ["IA de texto a imagen", "Thinking Mode", "Tamaños personalizados hasta 4096"],
  },
  "it-IT": {
    metaTitle: "Wan 2.7 Testo in Immagine - Thinking Mode e dimensione 4096 | joymagic",
    metaDescription:
      "Genera immagini di alta qualità con Wan 2.7 testo in immagine. Supporta larghezza e altezza personalizzate, Thinking Mode e controllo seed.",
    metaKeywords:
      "Wan 2.7, testo in immagine, generatore immagini AI, Thinking Mode, seed, dimensione personalizzata, Alibaba Cloud",
    heroTitle: "Wan 2.7 Testo in Immagine",
    heroDescription:
      "Wan 2.7 è adatto a flussi creativi che richiedono migliore comprensione del prompt, alta risoluzione e iterazione stabile. Puoi impostare larghezza e altezza, attivare Thinking Mode e usare un seed fisso per affinare la stessa direzione visiva.",
    keyFeaturesTitle: "Perché usare Wan 2.7?",
    keyFeaturesDescription:
      "Un flusso pratico testo in immagine per alta risoluzione, reasoning più forte e risultati riproducibili.",
    features: [
      { title: "Thinking Mode", description: "Concede al modello più tempo di reasoning per materiali, luce, composizione e atmosfera complesse." },
      { title: "Dimensioni personalizzate fino a 4096", description: "Crea output quadrati, verticali, orizzontali o in stile poster con pieno controllo." },
      { title: "Controllo seed", description: "Affina una direzione promettente senza ripartire ogni volta da un nuovo risultato casuale." },
      { title: "Ottimo con prompt ricchi di dettagli", description: "Funziona bene per ritratti, prodotti, concept art e visual di moda." },
    ],
    tipsTitle: "Suggerimenti per il prompt",
    tips: [
      { title: "Inizia da soggetto e inquadratura", description: "Definisci prima soggetto, tipo di shot e composizione per mantenere stabile la struttura." },
      { title: "Specifica materiali e luce", description: "Termini precisi per superficie, texture e direzione della luce migliorano spesso il risultato." },
      { title: "Attiva Thinking Mode per output grandi", description: "È particolarmente utile a 2048 o oltre, o quando servono molti dettagli." },
      { title: "Esplora prima, poi blocca il seed", description: "Trova prima una direzione con generazioni casuali e poi passa a un seed fisso." },
    ],
    useCasesTitle: "Casi d'uso",
    useCases: [
      { title: "Moda e beauty", description: "Per ritratti ravvicinati, concept editoriali e campagne beauty." },
      { title: "Visual di brand", description: "Utile per hero product, key visual, copertine e asset marketing." },
      { title: "Esplorazione concettuale", description: "Prova rapidamente mondi, colore, materiali e atmosfere cinematografiche." },
      { title: "Copertine social", description: "Adatta l'output a banner, copertine e poster in diversi formati." },
    ],
    faqTitle: "Domande frequenti",
    faqDescription: "Domande comuni su Wan 2.7 testo in immagine.",
    faq: [
      { question: "Quali parametri sono supportati?", answer: "Questa pagina supporta prompt, width, height, Thinking Mode e seed. Width e height vengono inviati come un valore size combinato." },
      { question: "Cosa fa Thinking Mode?", answer: "Dà al modello più tempo di reasoning, migliorando di solito scene complesse e dettaglio, ma aumenta anche il tempo di generazione." },
      { question: "Qual è la dimensione massima?", answer: "La configurazione attuale supporta width e height da 512 a 4096 con step di 64. La dimensione predefinita è 2048 per 2048." },
      { question: "Cosa significa seed = -1?", answer: "Significa generazione casuale. Se vuoi risultati riproducibili, usa un seed intero fisso." },
    ],
    ctaTitle: "Inizia a generare con Wan 2.7",
    ctaDescription:
      "Apri il modulo Wan 2.7 e prova subito la differenza tra risoluzione personalizzata e Thinking Mode.",
    ctaButton: "Prova Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Come generare immagini con Wan 2.7",
    howToDescription: "Genera immagini di alta qualità da testo con Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Testo in Immagine",
    featureList: ["AI testo in immagine", "Thinking Mode", "Dimensioni personalizzate fino a 4096"],
  },
  "pt-BR": {
    metaTitle: "Wan 2.7 Texto para Imagem - Thinking Mode e tamanho 4096 | joymagic",
    metaDescription:
      "Gere imagens de alta qualidade com Wan 2.7 texto para imagem. Use largura e altura personalizadas, Thinking Mode e controle de seed.",
    metaKeywords:
      "Wan 2.7, texto para imagem, gerador de imagens IA, Thinking Mode, seed, tamanho personalizado, Alibaba Cloud",
    heroTitle: "Wan 2.7 Texto para Imagem",
    heroDescription:
      "Wan 2.7 é uma boa escolha para fluxos criativos que precisam de melhor compreensão de prompt, alta resolução e iteração estável. Você pode definir largura e altura, ativar o Thinking Mode e manter uma seed fixa para refinar a mesma direção visual.",
    keyFeaturesTitle: "Por que usar Wan 2.7?",
    keyFeaturesDescription:
      "Um fluxo prático de texto para imagem focado em alta resolução, raciocínio ampliado e resultados reproduzíveis.",
    features: [
      { title: "Thinking Mode", description: "Dá ao modelo mais tempo de raciocínio para materiais, luz, composição e atmosfera complexos." },
      { title: "Tamanhos personalizados até 4096", description: "Crie saídas quadradas, verticais, horizontais ou em formato de pôster com controle total." },
      { title: "Controle de seed", description: "Refine uma direção promissora sem reiniciar de um novo resultado aleatório toda vez." },
      { title: "Bom com prompts detalhados", description: "Funciona bem para retratos, produtos, cenas conceituais e visuais de moda." },
    ],
    tipsTitle: "Dicas de prompt",
    tips: [
      { title: "Comece com assunto e enquadramento", description: "Defina primeiro o sujeito, o tipo de plano e a composição para estabilizar a estrutura." },
      { title: "Especifique materiais e luz", description: "Palavras precisas sobre superfície, textura e direção da luz costumam melhorar o resultado." },
      { title: "Ative Thinking Mode em tamanhos grandes", description: "Ele é especialmente útil em 2048 ou mais, ou quando há muito detalhe fino." },
      { title: "Explore primeiro, fixe a seed depois", description: "Procure uma direção com aleatoriedade e depois mude para uma seed fixa para iterar." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Moda e beleza", description: "Para retratos close-up, conceitos editoriais e campanhas de beleza." },
      { title: "Visuais de marca", description: "Útil para hero images de produto, key visuals, capas e materiais de marketing." },
      { title: "Exploração conceitual", description: "Teste rapidamente mundos, cores, materiais e atmosferas cinematográficas." },
      { title: "Capas sociais", description: "Adapte saídas para banners, capas e pôsteres em vários formatos." },
    ],
    faqTitle: "Perguntas frequentes",
    faqDescription: "Perguntas comuns sobre Wan 2.7 texto para imagem.",
    faq: [
      { question: "Quais parâmetros são suportados?", answer: "Esta página suporta prompt, width, height, Thinking Mode e seed. Width e height são enviados como um valor size combinado." },
      { question: "O que o Thinking Mode faz?", answer: "Ele dá mais tempo de raciocínio ao modelo, o que normalmente melhora cenas complexas e qualidade de detalhe, mas também aumenta o tempo de geração." },
      { question: "Qual é o tamanho máximo?", answer: "A configuração atual suporta width e height de 512 a 4096, com passo de 64. O tamanho padrão é 2048 por 2048." },
      { question: "O que significa seed = -1?", answer: "Significa geração aleatória. Se quiser resultados reproduzíveis, use uma seed inteira fixa." },
    ],
    ctaTitle: "Comece a gerar com Wan 2.7",
    ctaDescription:
      "Abra o formulário do Wan 2.7 e veja como resolução personalizada e Thinking Mode mudam os resultados.",
    ctaButton: "Testar Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Como gerar imagens com Wan 2.7",
    howToDescription: "Gere imagens de alta qualidade a partir de texto com Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Texto para Imagem",
    featureList: ["IA texto para imagem", "Thinking Mode", "Tamanhos personalizados até 4096"],
  },
  "ru-RU": {
    metaTitle: "Wan 2.7 Текст в изображение - Thinking Mode и размер 4096 | joymagic",
    metaDescription:
      "Создавайте качественные изображения с Wan 2.7 текст в изображение. Поддерживаются настраиваемые ширина и высота, Thinking Mode и seed.",
    metaKeywords:
      "Wan 2.7, текст в изображение, генератор изображений ИИ, Thinking Mode, seed, пользовательский размер, Alibaba Cloud",
    heroTitle: "Wan 2.7 Текст в изображение",
    heroDescription:
      "Wan 2.7 подходит для творческих процессов, где важны лучшее понимание промпта, высокое разрешение и стабильные итерации. Вы можете задать ширину и высоту, включить Thinking Mode и использовать фиксированный seed для последовательной доработки.",
    keyFeaturesTitle: "Почему Wan 2.7?",
    keyFeaturesDescription:
      "Практичный workflow text-to-image для высокого разрешения, усиленного reasoning и воспроизводимых результатов.",
    features: [
      { title: "Thinking Mode", description: "Дает модели больше времени на reasoning для сложных материалов, света, композиции и атмосферы." },
      { title: "Пользовательский размер до 4096", description: "Создавайте квадратные, вертикальные, горизонтальные и постерные изображения большого формата." },
      { title: "Контроль seed", description: "Развивайте удачное направление без нового случайного старта каждый раз." },
      { title: "Хорошо работает с подробными промптами", description: "Подходит для портретов, продуктов, концепт-сцен и fashion-визуалов." },
    ],
    tipsTitle: "Советы по промптам",
    tips: [
      { title: "Начните с объекта и кадра", description: "Сначала опишите объект, тип кадра и композицию, чтобы зафиксировать структуру." },
      { title: "Уточняйте материалы и свет", description: "Точные слова о поверхности, текстуре и направлении света обычно улучшают результат." },
      { title: "Включайте Thinking Mode для больших размеров", description: "Это особенно полезно при 2048 и выше или когда в кадре много мелких деталей." },
      { title: "Сначала исследуйте, потом фиксируйте seed", description: "Сначала найдите направление случайной генерацией, затем переключайтесь на фиксированный seed." },
    ],
    useCasesTitle: "Сценарии использования",
    useCases: [
      { title: "Мода и beauty", description: "Для крупных портретов, редакционных концептов и beauty-кампаний." },
      { title: "Брендовые визуалы", description: "Подходит для продуктовых hero-изображений, key visual, обложек и маркетинговых материалов." },
      { title: "Концепт-исследование", description: "Быстро тестируйте миры, цвет, материалы и кинематографичную атмосферу." },
      { title: "Обложки для соцсетей", description: "Адаптируйте вывод под баннеры, обложки и постеры разных форматов." },
    ],
    faqTitle: "Частые вопросы",
    faqDescription: "Частые вопросы о Wan 2.7 текст в изображение.",
    faq: [
      { question: "Какие параметры поддерживаются?", answer: "Эта страница поддерживает prompt, width, height, Thinking Mode и seed. Width и height отправляются как объединенное значение size." },
      { question: "Что делает Thinking Mode?", answer: "Он дает модели больше времени на reasoning, что обычно улучшает сложные сцены и качество деталей, но увеличивает время генерации." },
      { question: "Какой максимальный размер?", answer: "Текущая конфигурация поддерживает width и height от 512 до 4096 с шагом 64. Размер по умолчанию — 2048 на 2048." },
      { question: "Что означает seed = -1?", answer: "Это случайная генерация. Для воспроизводимых результатов используйте фиксированный целый seed." },
    ],
    ctaTitle: "Начните генерировать с Wan 2.7",
    ctaDescription:
      "Откройте форму Wan 2.7 и проверьте, как пользовательское разрешение и Thinking Mode меняют результат.",
    ctaButton: "Попробовать Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Как генерировать изображения с Wan 2.7",
    howToDescription: "Создавайте качественные изображения из текста с помощью Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Текст в изображение",
    featureList: ["ИИ текст в изображение", "Thinking Mode", "Пользовательские размеры до 4096"],
  },
  "tr-TR": {
    metaTitle: "Wan 2.7 Metinden Görsele - Thinking Mode ve 4096 boyut | joymagic",
    metaDescription:
      "Wan 2.7 metinden görsele ile yüksek kaliteli görseller oluşturun. Özel genişlik ve yükseklik, Thinking Mode ve seed kontrolü desteklenir.",
    metaKeywords:
      "Wan 2.7, metinden görsele, yapay zeka görsel oluşturucu, Thinking Mode, seed, özel boyut, Alibaba Cloud",
    heroTitle: "Wan 2.7 Metinden Görsele",
    heroDescription:
      "Wan 2.7, daha iyi prompt anlama, yüksek çözünürlük ve kararlı yineleme gerektiren yaratıcı akışlar için uygundur. Genişlik ve yüksekliği doğrudan ayarlayabilir, Thinking Mode'u açabilir ve sabit bir seed ile aynı görsel yönü geliştirebilirsiniz.",
    keyFeaturesTitle: "Neden Wan 2.7?",
    keyFeaturesDescription:
      "Yüksek çözünürlük, daha güçlü reasoning ve tekrar üretilebilir sonuçlar için pratik bir metinden görsele akışı.",
    features: [
      { title: "Thinking Mode", description: "Karmaşık malzeme, ışık, kompozisyon ve atmosfer için modele daha fazla reasoning süresi verir." },
      { title: "4096'ya kadar özel boyut", description: "Kare, dikey, yatay ve poster tarzı büyük çıktılar oluşturun." },
      { title: "Seed kontrolü", description: "Beğendiğiniz bir yönü her seferinde yeniden rastgele başlamadan geliştirin." },
      { title: "Detaylı promptlarda güçlü", description: "Portre, ürün, konsept sahne ve moda görselleri için uygundur." },
    ],
    tipsTitle: "Prompt ipuçları",
    tips: [
      { title: "Önce konu ve kadrajı yazın", description: "Önce özne, çekim türü ve kompozisyonu belirtmek yapıyı daha stabil hale getirir." },
      { title: "Malzeme ve ışığı açık yazın", description: "Yüzey, doku ve ışık yönü için net kelimeler sonucu iyileştirir." },
      { title: "Büyük çıktılarda Thinking Mode kullanın", description: "Özellikle 2048 ve üzeri veya çok detaylı sahnelerde faydalıdır." },
      { title: "Önce keşfedin, sonra seed'i sabitleyin", description: "Önce rastgele sonuçlarla yön bulun, ardından sabit seed ile yineleyin." },
    ],
    useCasesTitle: "Kullanım alanları",
    useCases: [
      { title: "Moda ve güzellik", description: "Yakın plan portreler, editoryal konseptler ve güzellik kampanyaları için uygundur." },
      { title: "Marka görselleri", description: "Ürün hero görselleri, ana görseller, kapaklar ve pazarlama materyalleri için kullanışlıdır." },
      { title: "Konsept keşfi", description: "Dünya kurma, renk dili, malzeme ve sinematik atmosferleri hızlıca test edin." },
      { title: "Sosyal kapaklar", description: "Banner, kapak ve poster gibi farklı oranlara uyarlanmış çıktılar üretin." },
    ],
    faqTitle: "Sık sorulan sorular",
    faqDescription: "Wan 2.7 metinden görsele hakkında sık sorulan sorular.",
    faq: [
      { question: "Hangi parametreler destekleniyor?", answer: "Bu sayfa prompt, width, height, Thinking Mode ve seed destekler. Width ve height tek bir size değeri olarak gönderilir." },
      { question: "Thinking Mode ne yapar?", answer: "Modele daha fazla reasoning süresi verir; bu da genellikle karmaşık sahneleri ve detay kalitesini iyileştirir, ancak üretim süresini artırır." },
      { question: "Maksimum boyut nedir?", answer: "Geçerli yapılandırma width ve height için 512'den 4096'ya kadar, 64 adımlı destek sunar. Varsayılan boyut 2048'e 2048'dir." },
      { question: "seed = -1 ne anlama gelir?", answer: "Rastgele üretim anlamına gelir. Tekrarlanabilir sonuçlar için sabit bir tam sayı seed kullanın." },
    ],
    ctaTitle: "Wan 2.7 ile oluşturmaya başlayın",
    ctaDescription:
      "Wan 2.7 formunu açın ve özel çözünürlük ile Thinking Mode'un sonuçları nasıl değiştirdiğini görün.",
    ctaButton: "Wan 2.7'yi dene",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 ile görsel nasıl üretilir",
    howToDescription: "Wan 2.7 ile metinden yüksek kaliteli görseller üretin.",
    softwareName: "joymagic Wan 2.7 Metinden Görsele",
    featureList: ["Yapay zeka metinden görsele", "Thinking Mode", "4096'ya kadar özel boyutlar"],
  },
  "ps-AF": {
    metaTitle: "Wan 2.7 له متن څخه انځور - Thinking Mode او 4096 اندازه | joymagic",
    metaDescription:
      "د Wan 2.7 له متن څخه انځور ماډل په مرسته لوړ کیفیت انځورونه جوړ کړئ. د عرض، لوړوالي، Thinking Mode او seed کنټرول ملاتړ کوي.",
    metaKeywords:
      "Wan 2.7, له متن څخه انځور, AI انځور جوړوونکی, Thinking Mode, seed, دودیزه اندازه, Alibaba Cloud",
    heroTitle: "Wan 2.7 له متن څخه انځور",
    heroDescription:
      "Wan 2.7 د هغو تخلیقي بهیرونو لپاره مناسب دی چې ښه prompt پوهه، لوړ ریزولوشن او باثباته بیا تکرار غواړي. تاسو کولی شئ عرض او لوړوالی وټاکئ، Thinking Mode فعال کړئ او د ثابت seed په مرسته هماغه لوری نور هم ښه کړئ.",
    keyFeaturesTitle: "ولې Wan 2.7؟",
    keyFeaturesDescription:
      "د لوړ ریزولوشن، ژور reasoning او بیا تولیدېدونکو پایلو لپاره یو عملي text-to-image بهیر.",
    features: [
      { title: "Thinking Mode", description: "ماډل ته د پېچلو موادو، رڼا، جوړښت او فضا لپاره ډېر reasoning وخت ورکوي." },
      { title: "تر 4096 پورې دودیزه اندازه", description: "ستر مربع، عمودي، افقي او پوسټر بڼه انځورونه جوړ کړئ." },
      { title: "Seed کنټرول", description: "هغه لوری چې خوښ مو شو، له سره د نوې تصادفي پایلې پرته نور هم ښه کړئ." },
      { title: "له تفصیلي prompt سره ښه کار کوي", description: "د پرتره، محصولاتو، مفهومي صحنو او فېشن ویژوالونو لپاره مناسب دی." },
    ],
    tipsTitle: "د prompt سپارښتنې",
    tips: [
      { title: "لومړی موضوع او کادر ولیکئ", description: "که موضوع، شاټ او جوړښت لومړی ولیکئ، د انځور بنسټ به ثابت پاتې شي." },
      { title: "مواد او رڼا روښانه کړئ", description: "د سطحې، جوړښت او رڼا د لوري دقیق ټکي اکثره ښه نتیجه ورکوي." },
      { title: "په لویو اندازو کې Thinking Mode وکاروئ", description: "په ځانګړي ډول د 2048 او تر دې پورته اندازو یا ډېرو جزیاتو لپاره ګټور دی." },
      { title: "لومړی وپلټئ، بیا seed ثابت کړئ", description: "په پیل کې تصادفي لارې وازمویئ، وروسته ثابت seed وکاروئ." },
    ],
    useCasesTitle: "د کارونې بېلګې",
    useCases: [
      { title: "فېشن او ښکلا", description: "د نږدې پرتره، ادیتوریال مفکورو او ښکلا کمپاینونو لپاره مناسب دی." },
      { title: "د برانډ ویژوالونه", description: "د محصول اصلي انځورونو، KV، پوښونو او مارکېټینګ موادو لپاره ګټور دی." },
      { title: "مفهومي سپړنه", description: "نړۍ جوړونه، رنګ، مواد او سینمایي فضا ژر وازمویئ." },
      { title: "د ټولنیزو شبکو پوښونه", description: "د بېنر، پوښ او پوسټر لپاره بېلابېل تناسب لرونکي انځورونه برابروي." },
    ],
    faqTitle: "عامې پوښتنې",
    faqDescription: "د Wan 2.7 له متن څخه انځور په اړه عامې پوښتنې.",
    faq: [
      { question: "کوم پارامیټرونه ملاتړ کېږي؟", answer: "دا پاڼه prompt، width، height، Thinking Mode او seed ملاتړ کوي. width او height د یوه ګډ size ارزښت په توګه لېږل کېږي." },
      { question: "Thinking Mode څه کوي؟", answer: "ماډل ته د reasoning لپاره زیات وخت ورکوي، چې اکثره پېچلې صحنې او جزیات ښه کوي، خو د تولید وخت هم زیاتوي." },
      { question: "اعظمي اندازه څومره ده؟", answer: "اوسنی جوړښت width او height له 512 تر 4096 پورې د 64 په ګامونو ملاتړ کوي. ډیفالټ اندازه 2048 په 2048 ده." },
      { question: "seed = -1 څه معنی لري؟", answer: "یعنې تصادفي تولید. که بیا تولیدېدونکې پایلې غواړئ، ثابت صحیح seed وکاروئ." },
    ],
    ctaTitle: "له Wan 2.7 سره انځورونه جوړول پیل کړئ",
    ctaDescription:
      "د Wan 2.7 فورم پرانیزئ او د دودیز ریزولوشن او Thinking Mode اغېز مستقیم وګورئ.",
    ctaButton: "Wan 2.7 وازمویه",
    breadcrumbModel: "Wan 2.7",
    howToName: "په Wan 2.7 سره انځور څنګه جوړ کړو",
    howToDescription: "په Wan 2.7 سره له متن څخه لوړ کیفیت انځورونه جوړ کړئ.",
    softwareName: "joymagic Wan 2.7 له متن څخه انځور",
    featureList: ["AI له متن څخه انځور", "Thinking Mode", "تر 4096 پورې دودیزه اندازه"],
  },
};

textToImageCopy["en-IN"] = textToImageCopy.en;
textToImageCopy["zh-hk"] = textToImageCopy["zh-Hant-TW"];

export function getWan27TextToImagePageCopy(locale: string) {
  return textToImageCopy[locale] || textToImageCopy.en;
}

export function getWan27CommonLabels(locale: string) {
  return commonLabels[locale] || commonLabels.en;
}

export function getWan27TextToImageHowToSteps(locale: string) {
  const steps: Record<string, Array<{ name: string; text: string }>> = {
    en: [
      { name: "Write your prompt", text: "Describe subject, material, lighting, composition, and style." },
      { name: "Set size and mode", text: "Choose width and height, enable Thinking Mode if needed, and set a seed." },
      { name: "Generate and iterate", text: "Run the model, review the output, and refine the prompt as needed." },
    ],
    "en-IN": [
      { name: "Write your prompt", text: "Describe subject, material, lighting, composition, and style." },
      { name: "Set size and mode", text: "Choose width and height, enable Thinking Mode if needed, and set a seed." },
      { name: "Generate and iterate", text: "Run the model, review the output, and refine the prompt as needed." },
    ],
    zh: [
      { name: "输入提示词", text: "描述主体、材质、光线、构图和风格。" },
      { name: "设置尺寸和模式", text: "选择宽度、高度，按需开启 Thinking Mode，并设置 Seed。" },
      { name: "生成并继续迭代", text: "生成图片，预览结果，再微调提示词继续优化。" },
    ],
    "zh-Hant-TW": [
      { name: "輸入提示詞", text: "描述主體、材質、光線、構圖與風格。" },
      { name: "設定尺寸與模式", text: "選擇寬度、高度，按需開啟 Thinking Mode，並設定 Seed。" },
      { name: "生成並持續迭代", text: "生成圖片、預覽結果，再微調提示詞持續優化。" },
    ],
    "zh-hk": [
      { name: "輸入提示詞", text: "描述主體、材質、光線、構圖與風格。" },
      { name: "設定尺寸與模式", text: "選擇寬度、高度，按需開啟 Thinking Mode，並設定 Seed。" },
      { name: "生成並持續迭代", text: "生成圖片、預覽結果，再微調提示詞持續優化。" },
    ],
    "de-DE": [
      { name: "Prompt schreiben", text: "Beschreiben Sie Motiv, Material, Licht, Komposition und Stil." },
      { name: "Größe und Modus festlegen", text: "Wählen Sie Breite und Höhe, aktivieren Sie bei Bedarf Thinking Mode und setzen Sie einen Seed." },
      { name: "Generieren und iterieren", text: "Starten Sie das Modell, prüfen Sie das Ergebnis und verfeinern Sie den Prompt weiter." },
    ],
    "ko-KR": [
      { name: "프롬프트 작성", text: "주제, 재질, 조명, 구도, 스타일을 설명하세요." },
      { name: "크기와 모드 설정", text: "너비와 높이를 선택하고 필요하면 Thinking Mode를 켜고 seed를 설정하세요." },
      { name: "생성 후 반복 수정", text: "모델을 실행하고 결과를 확인한 뒤 프롬프트를 계속 다듬으세요." },
    ],
    "ja-JP": [
      { name: "プロンプトを書く", text: "被写体、材質、光、構図、スタイルを説明します。" },
      { name: "サイズとモードを設定", text: "幅と高さを選び、必要に応じて Thinking Mode を有効にし、seed を設定します。" },
      { name: "生成して調整", text: "モデルを実行し、結果を確認しながらプロンプトを調整します。" },
    ],
    "es-ES": [
      { name: "Escribe el prompt", text: "Describe sujeto, material, iluminación, composición y estilo." },
      { name: "Define tamaño y modo", text: "Elige width y height, activa Thinking Mode si hace falta y establece una seed." },
      { name: "Genera e itera", text: "Ejecuta el modelo, revisa el resultado y sigue refinando el prompt." },
    ],
    "it-IT": [
      { name: "Scrivi il prompt", text: "Descrivi soggetto, materiale, luce, composizione e stile." },
      { name: "Imposta dimensione e modalità", text: "Scegli width e height, attiva Thinking Mode se serve e imposta un seed." },
      { name: "Genera e rifinisci", text: "Esegui il modello, controlla il risultato e continua a migliorare il prompt." },
    ],
    "pt-BR": [
      { name: "Escreva o prompt", text: "Descreva assunto, material, iluminação, composição e estilo." },
      { name: "Defina tamanho e modo", text: "Escolha width e height, ative o Thinking Mode se necessário e configure uma seed." },
      { name: "Gere e refine", text: "Execute o modelo, revise o resultado e continue ajustando o prompt." },
    ],
    "ru-RU": [
      { name: "Напишите промпт", text: "Опишите объект, материал, свет, композицию и стиль." },
      { name: "Задайте размер и режим", text: "Выберите width и height, при необходимости включите Thinking Mode и задайте seed." },
      { name: "Сгенерируйте и доработайте", text: "Запустите модель, проверьте результат и продолжайте улучшать промпт." },
    ],
    "tr-TR": [
      { name: "Prompt yazın", text: "Özne, malzeme, ışık, kompozisyon ve stili açıklayın." },
      { name: "Boyut ve modu ayarlayın", text: "Width ve height seçin, gerekirse Thinking Mode'u açın ve bir seed belirleyin." },
      { name: "Üretin ve yineleyin", text: "Modeli çalıştırın, sonucu inceleyin ve prompt'u geliştirmeye devam edin." },
    ],
    "ps-AF": [
      { name: "Prompt ولیکئ", text: "موضوع، مواد، رڼا، جوړښت او سټایل تشریح کړئ." },
      { name: "اندازه او حالت وټاکئ", text: "Width او height وټاکئ، که اړتیا وي Thinking Mode فعال کړئ او seed وټاکئ." },
      { name: "جوړ کړئ او بیا یې ښه کړئ", text: "ماډل وچلوئ، پایله وګورئ او prompt نور هم اصلاح کړئ." },
    ],
  };

  return steps[locale] || steps.en;
}

export function getWan27ImageToImageHowToSteps(locale: string) {
  const steps: Record<string, Array<{ name: string; text: string }>> = {
    en: [
      { name: "Upload references", text: "Upload one or more source images for structure, silhouette, or composition guidance." },
      { name: "Set the size", text: "Use width and height sliders to control output size; the page will generate the size parameter automatically." },
      { name: "Write the prompt and generate", text: "Be explicit about what to preserve and what to change, then run the edit and iterate." },
    ],
    "en-IN": [
      { name: "Upload references", text: "Upload one or more source images for structure, silhouette, or composition guidance." },
      { name: "Set the size", text: "Use width and height sliders to control output size; the page will generate the size parameter automatically." },
      { name: "Write the prompt and generate", text: "Be explicit about what to preserve and what to change, then run the edit and iterate." },
    ],
    zh: [
      { name: "上传参考图", text: "上传一张或多张参考图片作为结构或轮廓输入。" },
      { name: "设置 size", text: "通过宽高滑杆设置输出尺寸，系统会自动生成 size 参数。" },
      { name: "填写 prompt 并生成", text: "写清楚要保留和要改变的内容，然后生成并继续迭代。" },
    ],
    "zh-Hant-TW": [
      { name: "上傳參考圖", text: "上傳一張或多張參考圖片作為結構或輪廓輸入。" },
      { name: "設定 size", text: "透過寬高滑桿設定輸出尺寸，系統會自動生成 size 參數。" },
      { name: "填寫 prompt 並生成", text: "寫清楚要保留與要改變的內容，然後生成並持續迭代。" },
    ],
    "zh-hk": [
      { name: "上傳參考圖", text: "上傳一張或多張參考圖片作為結構或輪廓輸入。" },
      { name: "設定 size", text: "透過寬高滑桿設定輸出尺寸，系統會自動生成 size 參數。" },
      { name: "填寫 prompt 並生成", text: "寫清楚要保留與要改變的內容，然後生成並持續迭代。" },
    ],
    "de-DE": [
      { name: "Referenzen hochladen", text: "Laden Sie ein oder mehrere Quellbilder als Struktur-, Silhouetten- oder Kompositionshilfe hoch." },
      { name: "Größe festlegen", text: "Steuern Sie die Ausgabegröße über width und height; die Seite erzeugt den size-Parameter automatisch." },
      { name: "Prompt schreiben und generieren", text: "Schreiben Sie klar, was erhalten und was verändert werden soll, und starten Sie dann die Bearbeitung." },
    ],
    "ko-KR": [
      { name: "참조 이미지 업로드", text: "구조, 실루엣, 구도 가이드를 위해 한 장 이상 이미지를 업로드하세요." },
      { name: "크기 설정", text: "width와 height 슬라이더로 출력 크기를 정하면 페이지가 size 값을 자동 생성합니다." },
      { name: "프롬프트 작성 후 생성", text: "무엇을 유지하고 무엇을 바꿀지 명확히 쓴 뒤 편집을 실행하고 반복 수정하세요." },
    ],
    "ja-JP": [
      { name: "参照画像をアップロード", text: "構造、シルエット、構図のガイドとして 1 枚以上の画像をアップロードします。" },
      { name: "サイズを設定", text: "width と height のスライダーで出力サイズを決めると、ページが size パラメータを自動生成します。" },
      { name: "プロンプトを書いて生成", text: "残したい要素と変えたい要素を明確にしてから編集を実行し、必要に応じて調整します。" },
    ],
    "es-ES": [
      { name: "Sube referencias", text: "Sube una o varias imágenes base como guía de estructura, silueta o composición." },
      { name: "Define el tamaño", text: "Usa los controles de width y height para fijar el tamaño; la página generará el parámetro size automáticamente." },
      { name: "Escribe el prompt y genera", text: "Aclara qué debe mantenerse y qué debe cambiar, luego ejecuta la edición e itera." },
    ],
    "it-IT": [
      { name: "Carica i riferimenti", text: "Carica una o più immagini sorgente come guida per struttura, silhouette o composizione." },
      { name: "Imposta la dimensione", text: "Usa i controlli di width e height per definire la dimensione; la pagina genererà automaticamente il parametro size." },
      { name: "Scrivi il prompt e genera", text: "Specifica cosa conservare e cosa modificare, poi avvia l'editing e continua a iterare." },
    ],
    "pt-BR": [
      { name: "Envie referências", text: "Envie uma ou mais imagens de origem como guia de estrutura, silhueta ou composição." },
      { name: "Defina o tamanho", text: "Use os controles de width e height para definir o tamanho; a página gerará o parâmetro size automaticamente." },
      { name: "Escreva o prompt e gere", text: "Explique o que deve ser preservado e o que deve mudar, depois execute a edição e continue iterando." },
    ],
    "ru-RU": [
      { name: "Загрузите референсы", text: "Загрузите одно или несколько исходных изображений как подсказку по структуре, силуэту или композиции." },
      { name: "Задайте размер", text: "Используйте контролы width и height для размера вывода; страница автоматически сформирует параметр size." },
      { name: "Напишите промпт и запустите", text: "Четко укажите, что сохранить и что изменить, затем запустите редактирование и продолжайте дорабатывать." },
    ],
    "tr-TR": [
      { name: "Referans yükleyin", text: "Yapı, silüet veya kompozisyon rehberi olarak bir veya daha fazla kaynak görsel yükleyin." },
      { name: "Boyutu ayarlayın", text: "Width ve height kontrolleriyle çıktı boyutunu belirleyin; sayfa size parametresini otomatik oluşturur." },
      { name: "Prompt yazın ve üretin", text: "Neyin korunacağını ve neyin değişeceğini açıkça yazın, ardından düzenlemeyi başlatıp yineleyin." },
    ],
    "ps-AF": [
      { name: "مرستندویه انځورونه پورته کړئ", text: "یو یا څو سرچینه انځورونه د جوړښت، سیلوېټ یا composition د لارښوونې لپاره پورته کړئ." },
      { name: "اندازه وټاکئ", text: "د width او height کنټرولونه وکاروئ؛ پاڼه به size پارامیټر په اوتومات ډول جوړ کړي." },
      { name: "Prompt ولیکئ او تولید یې کړئ", text: "روښانه کړئ چې څه باید پاتې شي او څه باید بدل شي، بیا سمون پیل کړئ او بیا یې تکرار کړئ." },
    ],
  };

  return steps[locale] || steps.en;
}

export function getWan27ImageToImagePageCopy(locale: string): Wan27ImageToImagePageCopy {
  const labels = getWan27CommonLabels(locale);
  const textCopy = getWan27TextToImagePageCopy(locale);

  const localized: Record<string, Wan27ImageToImagePageCopy> = {
    en: {
      metaTitle: "Wan 2.7 Image to Image - Custom Size and Seed Control | joymagic",
      metaDescription:
        "Edit and transform images with Wan 2.7 image to image. Upload reference images, control size up to 4096, and refine results with seed.",
      metaKeywords:
        "Wan 2.7, image to image, AI image editing, custom size, width, height, seed, Alibaba Cloud",
      heroTitle: "Wan 2.7 Image to Image",
      heroDescription:
        "Wan 2.7 also works well for image-to-image editing. Upload one or more reference images, describe what should stay and what should change, then control the result with width, height, size, and seed.",
      featuresTitle: "Why use Wan 2.7 for image editing?",
      featuresDescription:
        "A flexible image-to-image workflow for structure guidance, high resolution, and reproducible edits.",
      features: [
        { title: "Multiple image inputs", description: "Use up to 4 reference images when you need stronger structure, silhouette, or appearance guidance." },
        { title: "Custom size control", description: "Adjust width and height directly and submit the combined size parameter automatically." },
        { title: "Seed for stable iteration", description: "Keep a promising edit direction stable while refining the prompt." },
        { title: "Great for structure-led edits", description: "Useful for silhouette redraws, sketch refinement, character restyling, and controlled reconstruction." },
      ],
      tipsTitle: "Editing tips",
      tips: [
        { title: "Say what to preserve", description: "Mention pose, outline, silhouette, composition, or other structure you want to keep." },
        { title: "Add appearance details next", description: "Describe hair, accessories, clothing, materials, and mood precisely for more stable edits." },
        { title: "Increase size for finer detail", description: "Higher sizes usually help with faces, small accessories, and fabric texture." },
        { title: "Use -1 first, then a fixed seed", description: "Explore directions with random generation, then switch to a fixed seed for controlled revision." },
      ],
      useCasesTitle: "Best use cases",
      useCases: [
        { title: "Silhouette-guided redraws", description: "Turn outlines, sketches, or simple structure references into more complete images." },
        { title: "Character refinement", description: "Improve clothing, hairstyle, accessories, and facial expression with text guidance." },
        { title: "Style transfer", description: "Transform a source image into a more polished commercial, poster, or photo-like result." },
        { title: "High-resolution output", description: "Prepare larger assets for product visuals, covers, and social key art." },
      ],
      faqTitle: "Frequently asked questions",
      faqDescription: "Common questions about Wan 2.7 image to image.",
      faq: [
        { question: "Which parameters are supported?", answer: "This page supports images, prompt, width, height, and seed. Width and height are submitted as a combined size value." },
        { question: "How is size sent?", answer: "The page automatically combines width and height into a size string like 512*512 or 2048*1024." },
        { question: "How many images can I upload?", answer: "The current form supports up to 4 reference images." },
        { question: "What does seed = -1 mean?", answer: "It means random generation. Use a fixed integer seed when you want reproducible edits." },
      ],
      ctaTitle: "Start editing with Wan 2.7",
      ctaDescription: "Upload your references, set the output size, and test Wan 2.7 in image-to-image workflows.",
      ctaButton: "Try Wan 2.7 image to image",
      breadcrumbModel: "Wan 2.7",
      howToName: "How to edit images with Wan 2.7",
      howToDescription: "Edit images with Wan 2.7 using reference images and prompts.",
      softwareName: "joymagic Wan 2.7 Image to Image",
      featureList: ["AI image-to-image editing", "Custom size control", "Multi-image input and seed control"],
    },
    "en-IN": {} as Wan27ImageToImagePageCopy,
    zh: {
      metaTitle: "Wan 2.7 图生图 - 自定义 Size 与 Seed 控制 | joymagic",
      metaDescription:
        "使用 Wan 2.7 图生图编辑和转换图片，支持多图输入、自定义 size、宽高控制和 seed 复现。",
      metaKeywords:
        "Wan 2.7, 图生图, AI 图片编辑, size, 宽高, seed, 阿里云",
      heroTitle: "Wan 2.7 图生图",
      heroDescription:
        "Wan 2.7 也适合图生图编辑。上传一张或多张参考图，说明要保留什么、要改变什么，再通过 width、height、size 和 seed 控制最终结果。",
      featuresTitle: "为什么用 Wan 2.7 做图生图？",
      featuresDescription:
        "面向结构引导、高分辨率和稳定复现的灵活图像编辑工作流。",
      features: [
        { title: "支持多图输入", description: "最多上传 4 张参考图，增强结构、轮廓或外观引导。" },
        { title: "自定义 size", description: "直接调节宽高，页面会自动提交组合后的 size 参数。" },
        { title: "Seed 稳定迭代", description: "锁定满意方向后继续调 prompt，不必每次重新随机。" },
        { title: "适合结构引导编辑", description: "适用于轮廓重绘、线稿细化、角色换装和受控重建。" },
      ],
      tipsTitle: "编辑建议",
      tips: [
        { title: "先说明要保留什么", description: "先写 pose、轮廓、构图或其他需要保留的结构信息。" },
        { title: "再补充外观细节", description: "对发型、配饰、服装、材质和表情写得越具体，结果通常越稳。" },
        { title: "更高 size 更适合细节", description: "脸部、小配件和布料纹理通常在更大尺寸下表现更好。" },
        { title: "先随机探索，再固定 seed", description: "先用随机结果找方向，再用固定 seed 做可控微调。" },
      ],
      useCasesTitle: "适合场景",
      useCases: [
        { title: "轮廓引导重绘", description: "把线稿、轮廓图或结构参考转成更完整的画面。" },
        { title: "角色细化", description: "通过文字描述强化服装、发型、配饰和表情。" },
        { title: "风格迁移", description: "把参考图转成更商业化、更海报化或更摄影感的结果。" },
        { title: "高分辨率输出", description: "适合产品图、封面图和社媒主视觉等更大尺寸成品。" },
      ],
      faqTitle: "常见问题",
      faqDescription: "关于 Wan 2.7 图生图的常见问题。",
      faq: [
        { question: "支持哪些参数？", answer: "当前页面支持 images、prompt、width、height 和 seed。width 和 height 会自动拼成 size 参数。" },
        { question: "size 是怎么传的？", answer: "页面会自动把 width 和 height 组合成类似 512*512 或 2048*1024 的 size 字符串。" },
        { question: "最多可以上传几张图？", answer: "当前表单支持最多 4 张参考图。" },
        { question: "seed = -1 是什么意思？", answer: "表示随机生成。如果想稳定复现结果，请使用固定整数 seed。" },
      ],
      ctaTitle: "开始用 Wan 2.7 编辑图片",
      ctaDescription: "上传参考图，设置输出尺寸，直接测试 Wan 2.7 在图生图场景里的表现。",
      ctaButton: "立即体验 Wan 2.7 图生图",
      breadcrumbModel: "Wan 2.7",
      howToName: "如何使用 Wan 2.7 编辑图片",
      howToDescription: "使用 Wan 2.7 结合参考图和提示词编辑图片。",
      softwareName: "joymagic Wan 2.7 图生图",
      featureList: ["AI 图生图编辑", "自定义 size", "多图输入与 seed 控制"],
    },
  };

  localized["en-IN"] = localized.en;
  localized["zh-Hant-TW"] = {
    metaTitle: "Wan 2.7 圖生圖 - 自訂 Size 與 Seed 控制 | joymagic",
    metaDescription:
      "使用 Wan 2.7 圖生圖編輯與轉換圖片，支援多圖輸入、自訂 size、寬高控制與 seed 重現。",
    metaKeywords: "Wan 2.7, 圖生圖, AI 圖片編輯, size, 寬高, seed, 阿里雲",
    heroTitle: "Wan 2.7 圖生圖",
    heroDescription:
      "Wan 2.7 也很適合圖生圖編輯。上傳一張或多張參考圖，說明要保留什麼、要改變什麼，再透過 width、height、size 與 seed 控制最終結果。",
    featuresTitle: "為什麼用 Wan 2.7 做圖生圖？",
    featuresDescription: "面向結構引導、高解析度與穩定重現的靈活影像編輯工作流。",
    features: [
      { title: "支援多圖輸入", description: "最多可上傳 4 張參考圖，加強結構、輪廓或外觀引導。" },
      { title: "自訂 size", description: "直接調整寬高，頁面會自動提交組合後的 size 參數。" },
      { title: "Seed 穩定迭代", description: "鎖定滿意方向後持續微調 prompt，不必每次重新隨機。" },
      { title: "適合結構引導編輯", description: "適用於輪廓重繪、線稿細化、角色換裝與受控重建。" },
    ],
    tipsTitle: "編輯建議",
    tips: [
      { title: "先說明要保留什麼", description: "先寫 pose、輪廓、構圖或其他需要保留的結構資訊。" },
      { title: "再補充外觀細節", description: "對髮型、配件、服裝、材質與表情寫得越具體，結果通常越穩。" },
      { title: "更高 size 更適合細節", description: "臉部、小配件與布料紋理通常在更大尺寸下表現更好。" },
      { title: "先隨機探索，再固定 seed", description: "先用隨機結果找方向，再用固定 seed 做可控微調。" },
    ],
    useCasesTitle: "適合場景",
    useCases: [
      { title: "輪廓引導重繪", description: "把線稿、輪廓圖或結構參考轉成更完整的畫面。" },
      { title: "角色細化", description: "透過文字描述強化服裝、髮型、配件與表情。" },
      { title: "風格轉換", description: "把參考圖轉成更商業化、更海報感或更攝影感的結果。" },
      { title: "高解析度輸出", description: "適合產品圖、封面圖與社群主視覺等更大尺寸成品。" },
    ],
    faqTitle: "常見問題",
    faqDescription: "關於 Wan 2.7 圖生圖的常見問題。",
    faq: [
      { question: "支援哪些參數？", answer: "目前頁面支援 images、prompt、width、height 與 seed。width 和 height 會自動組成 size 參數。" },
      { question: "size 是怎麼傳的？", answer: "頁面會自動把 width 和 height 組合成類似 512*512 或 2048*1024 的 size 字串。" },
      { question: "最多可以上傳幾張圖？", answer: "目前表單支援最多 4 張參考圖。" },
      { question: "seed = -1 是什麼意思？", answer: "表示隨機生成。若想穩定重現結果，請使用固定整數 seed。" },
    ],
    ctaTitle: "開始用 Wan 2.7 編輯圖片",
    ctaDescription: "上傳參考圖，設定輸出尺寸，直接測試 Wan 2.7 在圖生圖場景中的表現。",
    ctaButton: "立即體驗 Wan 2.7 圖生圖",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 編輯圖片",
    howToDescription: "使用 Wan 2.7 結合參考圖與提示詞編輯圖片。",
    softwareName: "joymagic Wan 2.7 圖生圖",
    featureList: ["AI 圖生圖編輯", "自訂 size", "多圖輸入與 seed 控制"],
  };
  localized["zh-hk"] = localized["zh-Hant-TW"];
  localized["de-DE"] = {
    metaTitle: "Wan 2.7 Bild-zu-Bild - Benutzerdefinierte Größe und Seed | joymagic",
    metaDescription: "Bearbeiten und transformieren Sie Bilder mit Wan 2.7 Bild-zu-Bild. Laden Sie Referenzbilder hoch, steuern Sie die Größe bis 4096 und verfeinern Sie Ergebnisse mit Seed.",
    metaKeywords: "Wan 2.7, Bild zu Bild, KI Bildbearbeitung, benutzerdefinierte Größe, Breite, Höhe, Seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Bild-zu-Bild",
    heroDescription: "Wan 2.7 eignet sich auch für Bild-zu-Bild-Editing. Laden Sie ein oder mehrere Referenzbilder hoch, beschreiben Sie, was erhalten bleiben und was geändert werden soll, und steuern Sie das Ergebnis mit width, height, size und seed.",
    featuresTitle: "Warum Wan 2.7 für Bildbearbeitung?",
    featuresDescription: "Ein flexibler Bild-zu-Bild-Workflow für Strukturführung, hohe Auflösung und reproduzierbare Bearbeitungen.",
    features: [
      { title: "Mehrere Bildeingaben", description: "Nutzen Sie bis zu 4 Referenzbilder für stärkere Struktur-, Silhouetten- oder Erscheinungsführung." },
      { title: "Benutzerdefinierte Größenkontrolle", description: "Passen Sie width und height direkt an; der kombinierte size-Parameter wird automatisch gesendet." },
      { title: "Seed für stabile Iteration", description: "Halten Sie eine gute Bearbeitungsrichtung stabil, während Sie den Prompt weiter verfeinern." },
      { title: "Ideal für strukturgeführte Edits", description: "Nützlich für Silhouetten-Redraws, Skizzenverfeinerung, Character-Restyling und kontrollierte Rekonstruktion." },
    ],
    tipsTitle: "Bearbeitungstipps",
    tips: [
      { title: "Zuerst sagen, was bleiben soll", description: "Nennen Sie Pose, Kontur, Silhouette, Komposition oder andere Strukturen, die erhalten bleiben sollen." },
      { title: "Dann Erscheinungsdetails ergänzen", description: "Beschreiben Sie Haare, Accessoires, Kleidung, Materialien und Stimmung möglichst präzise." },
      { title: "Größere Ausgabe für mehr Details", description: "Höhere Größen helfen oft bei Gesichtern, kleinen Accessoires und Stofftexturen." },
      { title: "Erst -1, dann fester Seed", description: "Erkunden Sie zuerst zufällig und wechseln Sie dann zu einem festen Seed für kontrollierte Iteration." },
    ],
    useCasesTitle: "Typische Einsatzfälle",
    useCases: [
      { title: "Silhouetten-geführte Redraws", description: "Verwandeln Sie Umrisse, Skizzen oder einfache Strukturvorlagen in vollständigere Bilder." },
      { title: "Charakterverfeinerung", description: "Verbessern Sie Kleidung, Frisur, Accessoires und Mimik mit Textanweisungen." },
      { title: "Stiltransfer", description: "Transformieren Sie ein Quellbild in ein polierteres kommerzielles, posterartiges oder fotografisches Ergebnis." },
      { title: "Hochauflösende Ausgabe", description: "Erstellen Sie größere Assets für Produktvisuals, Cover und Social-Key-Art." },
    ],
    faqTitle: "Häufige Fragen",
    faqDescription: "Häufige Fragen zu Wan 2.7 Bild-zu-Bild.",
    faq: [
      { question: "Welche Parameter werden unterstützt?", answer: "Diese Seite unterstützt images, prompt, width, height und seed. Width und height werden als kombinierter size-Wert gesendet." },
      { question: "Wie wird size gesendet?", answer: "Die Seite kombiniert width und height automatisch zu einer size-Zeichenfolge wie 512*512 oder 2048*1024." },
      { question: "Wie viele Bilder kann ich hochladen?", answer: "Das aktuelle Formular unterstützt bis zu 4 Referenzbilder." },
      { question: "Was bedeutet seed = -1?", answer: "Das bedeutet zufällige Generierung. Für reproduzierbare Bearbeitungen verwenden Sie einen festen ganzzahligen Seed." },
    ],
    ctaTitle: "Mit Wan 2.7 Bilder bearbeiten",
    ctaDescription: "Laden Sie Referenzen hoch, setzen Sie die Zielgröße und testen Sie Wan 2.7 für Bild-zu-Bild-Workflows.",
    ctaButton: "Wan 2.7 Bild-zu-Bild testen",
    breadcrumbModel: "Wan 2.7",
    howToName: "So bearbeiten Sie Bilder mit Wan 2.7",
    howToDescription: "Bearbeiten Sie Bilder mit Wan 2.7 anhand von Referenzbildern und Prompts.",
    softwareName: "joymagic Wan 2.7 Bild zu Bild",
    featureList: ["KI Bild-zu-Bild-Bearbeitung", "Benutzerdefinierte Größenkontrolle", "Mehrfachbild-Eingabe und Seed-Kontrolle"],
  };
  localized["ko-KR"] = {
    metaTitle: "Wan 2.7 이미지 편집 - 사용자 지정 크기와 seed 제어 | joymagic",
    metaDescription: "Wan 2.7 이미지 편집으로 이미지를 변환하세요. 참조 이미지를 업로드하고 최대 4096 크기를 제어하며 seed로 결과를 다듬을 수 있습니다.",
    metaKeywords: "Wan 2.7, 이미지 편집, AI 이미지 편집, 사용자 지정 크기, 너비, 높이, seed, 알리바바 클라우드",
    heroTitle: "Wan 2.7 이미지 편집",
    heroDescription: "Wan 2.7은 이미지 투 이미지 편집에도 잘 맞습니다. 하나 이상의 참조 이미지를 업로드하고 무엇을 유지하고 무엇을 바꿀지 설명한 뒤 width, height, size, seed로 결과를 제어할 수 있습니다.",
    featuresTitle: "왜 Wan 2.7으로 이미지 편집을 하나요?",
    featuresDescription: "구조 가이드, 고해상도, 재현 가능한 편집을 위한 유연한 이미지 편집 워크플로입니다.",
    features: [
      { title: "여러 이미지 입력", description: "구조, 실루엣, 외형 가이드를 강화하고 싶을 때 최대 4장의 참조 이미지를 사용할 수 있습니다." },
      { title: "사용자 지정 크기 제어", description: "너비와 높이를 직접 조정하면 결합된 size 파라미터가 자동으로 전송됩니다." },
      { title: "안정적인 반복을 위한 seed", description: "좋은 편집 방향을 유지한 채 프롬프트만 계속 다듬을 수 있습니다." },
      { title: "구조 기반 편집에 적합", description: "실루엣 리드로우, 스케치 보정, 캐릭터 리스타일링, 제어된 재구성에 유용합니다." },
    ],
    tipsTitle: "편집 팁",
    tips: [
      { title: "무엇을 유지할지 먼저 쓰기", description: "포즈, 윤곽, 실루엣, 구도 등 유지해야 할 구조를 먼저 적어 주세요." },
      { title: "그다음 외형 디테일 추가", description: "머리, 액세서리, 의상, 재질, 분위기를 구체적으로 쓸수록 결과가 더 안정적입니다." },
      { title: "디테일이 많으면 큰 크기 사용", description: "얼굴, 작은 액세서리, 천 질감은 더 큰 size에서 보통 더 잘 나옵니다." },
      { title: "처음엔 -1, 이후 고정 seed", description: "처음엔 랜덤으로 방향을 찾고, 이후 고정 seed로 제어된 수정을 진행하세요." },
    ],
    useCasesTitle: "추천 활용 사례",
    useCases: [
      { title: "실루엣 기반 리드로우", description: "윤곽선, 스케치, 단순 구조 이미지를 더 완성도 높은 결과로 바꿉니다." },
      { title: "캐릭터 디테일 보강", description: "텍스트 지시로 의상, 헤어스타일, 액세서리, 표정을 강화할 수 있습니다." },
      { title: "스타일 전환", description: "원본 이미지를 더 상업적이거나 포스터풍, 사진풍 결과로 바꿀 수 있습니다." },
      { title: "고해상도 출력", description: "제품 비주얼, 커버, 소셜 키아트용 큰 결과물을 준비할 수 있습니다." },
    ],
    faqTitle: "자주 묻는 질문",
    faqDescription: "Wan 2.7 이미지 편집에 대한 자주 묻는 질문입니다.",
    faq: [
      { question: "어떤 파라미터를 지원하나요?", answer: "이 페이지는 images, prompt, width, height, seed를 지원합니다. width와 height는 하나의 size 값으로 전송됩니다." },
      { question: "size는 어떻게 전송되나요?", answer: "페이지가 width와 height를 512*512 또는 2048*1024 같은 size 문자열로 자동 결합합니다." },
      { question: "몇 장까지 업로드할 수 있나요?", answer: "현재 폼은 최대 4장의 참조 이미지를 지원합니다." },
      { question: "seed = -1은 무슨 뜻인가요?", answer: "무작위 생성입니다. 재현 가능한 편집이 필요하면 고정된 정수 seed를 사용하세요." },
    ],
    ctaTitle: "Wan 2.7으로 이미지 편집 시작",
    ctaDescription: "참조 이미지를 업로드하고 출력 크기를 설정한 뒤 Wan 2.7 이미지 편집 성능을 직접 확인해 보세요.",
    ctaButton: "Wan 2.7 이미지 편집 사용하기",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7으로 이미지 편집하는 방법",
    howToDescription: "참조 이미지와 프롬프트를 사용해 Wan 2.7으로 이미지를 편집합니다.",
    softwareName: "joymagic Wan 2.7 이미지 편집",
    featureList: ["AI 이미지 편집", "사용자 지정 크기 제어", "멀티 이미지 입력과 seed 제어"],
  };
  localized["ja-JP"] = {
    metaTitle: "Wan 2.7 画像から画像 - カスタム size と seed 制御 | joymagic",
    metaDescription: "Wan 2.7 画像から画像で画像を編集・変換。参照画像をアップロードし、最大 4096 の size と seed で結果を調整できます。",
    metaKeywords: "Wan 2.7, 画像から画像, AI画像編集, カスタムサイズ, 幅, 高さ, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 画像から画像",
    heroDescription: "Wan 2.7 は画像編集ワークフローにも適しています。1 枚または複数の参照画像をアップロードし、何を残して何を変えるかを説明したうえで、width、height、size、seed で結果をコントロールできます。",
    featuresTitle: "Wan 2.7 を画像編集に使う理由",
    featuresDescription: "構造ガイド、高解像度、再現しやすい編集に向いた柔軟な image-to-image ワークフローです。",
    features: [
      { title: "複数画像入力", description: "構造、シルエット、見た目のガイドを強めたいときに最大 4 枚の参照画像を使えます。" },
      { title: "カスタム size 制御", description: "幅と高さを直接調整すると、結合された size パラメータが自動送信されます。" },
      { title: "安定した反復のための seed", description: "良い編集方向を保ちながら prompt だけを継続的に調整できます。" },
      { title: "構造主導の編集に最適", description: "シルエット再描画、スケッチ補正、キャラクターの再スタイリング、制御された再構成に役立ちます。" },
    ],
    tipsTitle: "編集のコツ",
    tips: [
      { title: "残したい要素を先に書く", description: "ポーズ、輪郭、シルエット、構図など残したい構造を最初に明示します。" },
      { title: "次に外観の詳細を足す", description: "髪、アクセサリー、服、素材、雰囲気を具体的に書くほど安定しやすくなります。" },
      { title: "細部には大きめ size", description: "顔、小さなアクセサリー、布の質感は大きいサイズの方がきれいに出やすいです。" },
      { title: "最初は -1、その後固定 seed", description: "まずランダムで方向性を探し、その後固定 seed で制御しながら調整しましょう。" },
    ],
    useCasesTitle: "おすすめ用途",
    useCases: [
      { title: "シルエット主導の再描画", description: "輪郭、スケッチ、簡易構造をより完成度の高い画像に変換します。" },
      { title: "キャラクター調整", description: "テキストの指示で服装、髪型、アクセサリー、表情を洗練できます。" },
      { title: "スタイル変換", description: "元画像をより商業的、ポスター風、写真風の結果に変換できます。" },
      { title: "高解像度出力", description: "商品ビジュアル、カバー、SNS キーアート向けの大きな出力に便利です。" },
    ],
    faqTitle: "よくある質問",
    faqDescription: "Wan 2.7 画像から画像に関するよくある質問です。",
    faq: [
      { question: "どのパラメータに対応していますか？", answer: "このページは images、prompt、width、height、seed に対応しています。width と height は 1 つの size 値として送信されます。" },
      { question: "size はどう送信されますか？", answer: "ページが width と height を 512*512 や 2048*1024 のような size 文字列に自動変換します。" },
      { question: "何枚までアップロードできますか？", answer: "現在のフォームでは最大 4 枚の参照画像をアップロードできます。" },
      { question: "seed = -1 は何を意味しますか？", answer: "ランダム生成を意味します。再現したい編集では固定の整数 seed を使ってください。" },
    ],
    ctaTitle: "Wan 2.7 で画像編集を始める",
    ctaDescription: "参照画像をアップロードし、出力サイズを設定して、Wan 2.7 の image-to-image を試してください。",
    ctaButton: "Wan 2.7 画像から画像を試す",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 で画像を編集する方法",
    howToDescription: "参照画像とプロンプトを使って Wan 2.7 で画像を編集します。",
    softwareName: "joymagic Wan 2.7 画像から画像",
    featureList: ["AI 画像編集", "カスタム size 制御", "複数画像入力と seed 制御"],
  };
  localized["es-ES"] = {
    metaTitle: "Wan 2.7 Imagen a Imagen - Tamaño personalizado y seed | joymagic",
    metaDescription: "Edita y transforma imágenes con Wan 2.7 imagen a imagen. Sube referencias, controla el tamaño hasta 4096 y ajusta el resultado con seed.",
    metaKeywords: "Wan 2.7, imagen a imagen, edición de imágenes IA, tamaño personalizado, ancho, alto, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Imagen a Imagen",
    heroDescription: "Wan 2.7 también funciona muy bien para edición imagen a imagen. Sube una o varias referencias, explica qué debe mantenerse y qué debe cambiar, y controla el resultado con width, height, size y seed.",
    featuresTitle: "¿Por qué usar Wan 2.7 para editar imágenes?",
    featuresDescription: "Un flujo flexible de image-to-image para guía estructural, alta resolución y ediciones reproducibles.",
    features: [
      { title: "Múltiples imágenes de entrada", description: "Usa hasta 4 referencias cuando necesites más guía de estructura, silueta o apariencia." },
      { title: "Control de tamaño personalizado", description: "Ajusta width y height directamente y envía automáticamente el parámetro size combinado." },
      { title: "Seed para iteración estable", description: "Mantén una dirección de edición prometedora mientras sigues refinando el prompt." },
      { title: "Ideal para ediciones guiadas por estructura", description: "Útil para redibujar siluetas, refinar bocetos, reajustar personajes y reconstrucciones controladas." },
    ],
    tipsTitle: "Consejos de edición",
    tips: [
      { title: "Di primero qué conservar", description: "Menciona pose, contorno, silueta, composición u otra estructura que deba mantenerse." },
      { title: "Añade luego los detalles visuales", description: "Describe con precisión cabello, accesorios, ropa, materiales y ambiente." },
      { title: "Sube el size para más detalle", description: "Los tamaños mayores suelen ayudar con rostros, accesorios pequeños y textura de telas." },
      { title: "Primero -1 y luego seed fija", description: "Explora con aleatoriedad y después cambia a una seed fija para revisiones controladas." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Redibujos guiados por silueta", description: "Convierte contornos, bocetos o referencias estructurales en imágenes más completas." },
      { title: "Refinamiento de personajes", description: "Mejora ropa, peinado, accesorios y expresión con guía textual." },
      { title: "Transferencia de estilo", description: "Transforma una imagen base en un resultado más comercial, tipo póster o fotográfico." },
      { title: "Salida en alta resolución", description: "Prepara assets más grandes para productos, portadas y visuales sociales." },
    ],
    faqTitle: "Preguntas frecuentes",
    faqDescription: "Preguntas comunes sobre Wan 2.7 imagen a imagen.",
    faq: [
      { question: "¿Qué parámetros admite?", answer: "Esta página admite images, prompt, width, height y seed. Width y height se envían como un valor size combinado." },
      { question: "¿Cómo se envía size?", answer: "La página combina automáticamente width y height en una cadena como 512*512 o 2048*1024." },
      { question: "¿Cuántas imágenes puedo subir?", answer: "El formulario actual admite hasta 4 imágenes de referencia." },
      { question: "¿Qué significa seed = -1?", answer: "Significa generación aleatoria. Usa una seed entera fija si quieres ediciones reproducibles." },
    ],
    ctaTitle: "Empieza a editar con Wan 2.7",
    ctaDescription: "Sube tus referencias, define el tamaño de salida y prueba Wan 2.7 en flujos imagen a imagen.",
    ctaButton: "Probar Wan 2.7 imagen a imagen",
    breadcrumbModel: "Wan 2.7",
    howToName: "Cómo editar imágenes con Wan 2.7",
    howToDescription: "Edita imágenes con Wan 2.7 usando referencias y prompts.",
    softwareName: "joymagic Wan 2.7 Imagen a Imagen",
    featureList: ["Edición IA imagen a imagen", "Control de tamaño personalizado", "Entrada múltiple de imágenes y control de seed"],
  };
  localized["it-IT"] = {
    metaTitle: "Wan 2.7 Immagine a Immagine - Dimensione personalizzata e seed | joymagic",
    metaDescription: "Modifica e trasforma immagini con Wan 2.7 immagine a immagine. Carica riferimenti, controlla la dimensione fino a 4096 e rifinisci il risultato con seed.",
    metaKeywords: "Wan 2.7, immagine a immagine, editing immagini AI, dimensione personalizzata, larghezza, altezza, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Immagine a Immagine",
    heroDescription: "Wan 2.7 funziona bene anche per l'editing immagine a immagine. Carica una o più immagini di riferimento, descrivi cosa deve restare e cosa deve cambiare, poi controlla il risultato con width, height, size e seed.",
    featuresTitle: "Perché usare Wan 2.7 per l'editing immagini?",
    featuresDescription: "Un flusso image-to-image flessibile per guida strutturale, alta risoluzione e modifiche riproducibili.",
    features: [
      { title: "Input di più immagini", description: "Usa fino a 4 immagini di riferimento quando serve una guida più forte su struttura, silhouette o aspetto." },
      { title: "Controllo dimensione personalizzata", description: "Regola width e height direttamente e invia automaticamente il parametro size combinato." },
      { title: "Seed per iterazione stabile", description: "Mantieni una direzione promettente mentre continui a rifinire il prompt." },
      { title: "Ottimo per edit guidati dalla struttura", description: "Utile per redraw di silhouette, raffinamento di sketch, restyling di personaggi e ricostruzione controllata." },
    ],
    tipsTitle: "Suggerimenti di editing",
    tips: [
      { title: "Dì prima cosa conservare", description: "Indica posa, contorno, silhouette, composizione o altre strutture da mantenere." },
      { title: "Poi aggiungi i dettagli visivi", description: "Descrivi con precisione capelli, accessori, abiti, materiali e atmosfera." },
      { title: "Aumenta il size per più dettaglio", description: "Dimensioni più grandi aiutano spesso con volti, piccoli accessori e texture dei tessuti." },
      { title: "Prima -1, poi seed fisso", description: "Esplora con generazione casuale e poi passa a un seed fisso per revisioni controllate." },
    ],
    useCasesTitle: "Casi d'uso",
    useCases: [
      { title: "Redraw guidati dalla silhouette", description: "Trasforma contorni, sketch o riferimenti strutturali in immagini più complete." },
      { title: "Rifinitura del personaggio", description: "Migliora abiti, capelli, accessori ed espressione tramite guida testuale." },
      { title: "Trasferimento di stile", description: "Trasforma un'immagine sorgente in un risultato più commerciale, da poster o fotografico." },
      { title: "Output ad alta risoluzione", description: "Prepara asset più grandi per visual di prodotto, copertine e key art social." },
    ],
    faqTitle: "Domande frequenti",
    faqDescription: "Domande comuni su Wan 2.7 immagine a immagine.",
    faq: [
      { question: "Quali parametri sono supportati?", answer: "Questa pagina supporta images, prompt, width, height e seed. Width e height vengono inviati come un valore size combinato." },
      { question: "Come viene inviato size?", answer: "La pagina combina automaticamente width e height in una stringa come 512*512 o 2048*1024." },
      { question: "Quante immagini posso caricare?", answer: "Il modulo attuale supporta fino a 4 immagini di riferimento." },
      { question: "Cosa significa seed = -1?", answer: "Significa generazione casuale. Usa un seed intero fisso se vuoi modifiche riproducibili." },
    ],
    ctaTitle: "Inizia a modificare con Wan 2.7",
    ctaDescription: "Carica i riferimenti, imposta la dimensione di output e prova Wan 2.7 nei flussi immagine a immagine.",
    ctaButton: "Prova Wan 2.7 immagine a immagine",
    breadcrumbModel: "Wan 2.7",
    howToName: "Come modificare immagini con Wan 2.7",
    howToDescription: "Modifica immagini con Wan 2.7 usando riferimenti e prompt.",
    softwareName: "joymagic Wan 2.7 Immagine a Immagine",
    featureList: ["Editing AI immagine a immagine", "Controllo dimensione personalizzata", "Input multi-immagine e controllo seed"],
  };
  localized["pt-BR"] = {
    metaTitle: "Wan 2.7 Imagem para Imagem - Tamanho personalizado e seed | joymagic",
    metaDescription: "Edite e transforme imagens com Wan 2.7 imagem para imagem. Envie referências, controle o tamanho até 4096 e refine o resultado com seed.",
    metaKeywords: "Wan 2.7, imagem para imagem, edição de imagem IA, tamanho personalizado, largura, altura, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Imagem para Imagem",
    heroDescription: "Wan 2.7 também funciona muito bem para edição imagem para imagem. Envie uma ou mais referências, diga o que deve ser preservado e o que deve mudar e controle o resultado com width, height, size e seed.",
    featuresTitle: "Por que usar Wan 2.7 para editar imagens?",
    featuresDescription: "Um fluxo image-to-image flexível para guia estrutural, alta resolução e edições reproduzíveis.",
    features: [
      { title: "Entrada de múltiplas imagens", description: "Use até 4 imagens de referência quando precisar de mais guia de estrutura, silhueta ou aparência." },
      { title: "Controle de tamanho personalizado", description: "Ajuste width e height diretamente e envie automaticamente o parâmetro size combinado." },
      { title: "Seed para iteração estável", description: "Mantenha uma direção promissora enquanto continua refinando o prompt." },
      { title: "Ótimo para edições guiadas por estrutura", description: "Útil para redesenho por silhueta, refinamento de esboços, restyling de personagens e reconstrução controlada." },
    ],
    tipsTitle: "Dicas de edição",
    tips: [
      { title: "Diga primeiro o que preservar", description: "Mencione pose, contorno, silhueta, composição ou outra estrutura que deve continuar." },
      { title: "Depois adicione os detalhes visuais", description: "Descreva cabelo, acessórios, roupa, materiais e clima com precisão." },
      { title: "Aumente o size para mais detalhe", description: "Tamanhos maiores costumam ajudar com rostos, acessórios pequenos e textura de tecido." },
      { title: "Primeiro -1, depois seed fixa", description: "Explore direções com aleatoriedade e depois mude para uma seed fixa para revisões controladas." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Redesenho guiado por silhueta", description: "Transforme contornos, esboços ou estruturas simples em imagens mais completas." },
      { title: "Refino de personagem", description: "Melhore roupa, cabelo, acessórios e expressão com guia textual." },
      { title: "Transferência de estilo", description: "Transforme uma imagem de origem em um resultado mais comercial, estilo pôster ou fotográfico." },
      { title: "Saída em alta resolução", description: "Prepare assets maiores para visuais de produto, capas e key arts sociais." },
    ],
    faqTitle: "Perguntas frequentes",
    faqDescription: "Perguntas comuns sobre Wan 2.7 imagem para imagem.",
    faq: [
      { question: "Quais parâmetros são suportados?", answer: "Esta página suporta images, prompt, width, height e seed. Width e height são enviados como um valor size combinado." },
      { question: "Como o size é enviado?", answer: "A página combina automaticamente width e height em uma string como 512*512 ou 2048*1024." },
      { question: "Quantas imagens posso enviar?", answer: "O formulário atual suporta até 4 imagens de referência." },
      { question: "O que significa seed = -1?", answer: "Significa geração aleatória. Use uma seed inteira fixa se quiser edições reproduzíveis." },
    ],
    ctaTitle: "Comece a editar com Wan 2.7",
    ctaDescription: "Envie suas referências, defina o tamanho de saída e teste o Wan 2.7 em fluxos imagem para imagem.",
    ctaButton: "Testar Wan 2.7 imagem para imagem",
    breadcrumbModel: "Wan 2.7",
    howToName: "Como editar imagens com Wan 2.7",
    howToDescription: "Edite imagens com Wan 2.7 usando referências e prompts.",
    softwareName: "joymagic Wan 2.7 Imagem para Imagem",
    featureList: ["Edição IA imagem para imagem", "Controle de tamanho personalizado", "Entrada multi-imagem e controle de seed"],
  };
  localized["ru-RU"] = {
    metaTitle: "Wan 2.7 Изображение в изображение - Пользовательский размер и seed | joymagic",
    metaDescription: "Редактируйте и трансформируйте изображения с Wan 2.7 image-to-image. Загружайте референсы, управляйте размером до 4096 и уточняйте результат через seed.",
    metaKeywords: "Wan 2.7, изображение в изображение, ИИ редактирование изображений, пользовательский размер, ширина, высота, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Изображение в изображение",
    heroDescription: "Wan 2.7 хорошо подходит и для image-to-image редактирования. Загрузите одно или несколько референсных изображений, опишите, что нужно сохранить и что изменить, а затем управляйте результатом через width, height, size и seed.",
    featuresTitle: "Почему Wan 2.7 для редактирования изображений?",
    featuresDescription: "Гибкий workflow image-to-image для структурного гида, высокого разрешения и воспроизводимых правок.",
    features: [
      { title: "Несколько входных изображений", description: "Используйте до 4 референсов, когда нужна более сильная подсказка по структуре, силуэту или внешнему виду." },
      { title: "Пользовательский контроль размера", description: "Настраивайте width и height напрямую, а объединенный параметр size отправляется автоматически." },
      { title: "Seed для стабильной итерации", description: "Сохраняйте удачное направление редактирования, продолжая улучшать prompt." },
      { title: "Подходит для структурных правок", description: "Полезно для перерисовки по силуэту, доработки скетчей, рестайлинга персонажей и контролируемой реконструкции." },
    ],
    tipsTitle: "Советы по редактированию",
    tips: [
      { title: "Сначала укажите, что сохранить", description: "Опишите позу, контур, силуэт, композицию или другую структуру, которую нужно оставить." },
      { title: "Потом добавьте детали внешности", description: "Точно опишите волосы, аксессуары, одежду, материалы и настроение." },
      { title: "Увеличивайте size для деталей", description: "Большие размеры обычно лучше показывают лица, мелкие аксессуары и текстуры ткани." },
      { title: "Сначала -1, потом фиксированный seed", description: "Сначала исследуйте случайной генерацией, затем переходите на фиксированный seed для контролируемых правок." },
    ],
    useCasesTitle: "Сценарии использования",
    useCases: [
      { title: "Перерисовка по силуэту", description: "Преобразуйте контуры, скетчи или простые структурные референсы в более законченные изображения." },
      { title: "Доработка персонажей", description: "Улучшайте одежду, прическу, аксессуары и выражение лица с помощью текста." },
      { title: "Перенос стиля", description: "Преобразуйте исходное изображение в более коммерческий, постерный или фотографичный результат." },
      { title: "Высокое разрешение", description: "Подготавливайте крупные ассеты для продуктов, обложек и key art для соцсетей." },
    ],
    faqTitle: "Частые вопросы",
    faqDescription: "Частые вопросы о Wan 2.7 image-to-image.",
    faq: [
      { question: "Какие параметры поддерживаются?", answer: "Эта страница поддерживает images, prompt, width, height и seed. Width и height отправляются как объединенное значение size." },
      { question: "Как отправляется size?", answer: "Страница автоматически объединяет width и height в строку вроде 512*512 или 2048*1024." },
      { question: "Сколько изображений можно загрузить?", answer: "Текущая форма поддерживает до 4 референсных изображений." },
      { question: "Что означает seed = -1?", answer: "Это случайная генерация. Если нужны воспроизводимые правки, используйте фиксированный целый seed." },
    ],
    ctaTitle: "Начните редактировать с Wan 2.7",
    ctaDescription: "Загрузите референсы, задайте размер вывода и протестируйте Wan 2.7 в сценариях image-to-image.",
    ctaButton: "Попробовать Wan 2.7 image-to-image",
    breadcrumbModel: "Wan 2.7",
    howToName: "Как редактировать изображения с Wan 2.7",
    howToDescription: "Редактируйте изображения с Wan 2.7, используя референсы и промпты.",
    softwareName: "joymagic Wan 2.7 Изображение в изображение",
    featureList: ["ИИ редактирование image-to-image", "Пользовательский размер", "Мульти-вход изображений и контроль seed"],
  };
  localized["tr-TR"] = {
    metaTitle: "Wan 2.7 Görselden Görsele - Özel boyut ve seed kontrolü | joymagic",
    metaDescription: "Wan 2.7 görselden görsele ile görselleri düzenleyin ve dönüştürün. Referans görseller yükleyin, boyutu 4096'ya kadar kontrol edin ve sonucu seed ile iyileştirin.",
    metaKeywords: "Wan 2.7, görselden görsele, yapay zeka görsel düzenleme, özel boyut, genişlik, yükseklik, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Görselden Görsele",
    heroDescription: "Wan 2.7 görsel düzenleme için de güçlüdür. Bir veya birden fazla referans görsel yükleyin, neyin korunacağını ve neyin değişeceğini yazın, ardından sonucu width, height, size ve seed ile yönetin.",
    featuresTitle: "Görsel düzenleme için neden Wan 2.7?",
    featuresDescription: "Yapı rehberliği, yüksek çözünürlük ve tekrar üretilebilir düzenlemeler için esnek bir image-to-image akışı.",
    features: [
      { title: "Çoklu görsel girişi", description: "Yapı, silüet veya görünüm rehberliği gerektiğinde en fazla 4 referans görsel kullanın." },
      { title: "Özel boyut kontrolü", description: "Width ve height değerlerini doğrudan ayarlayın; birleşik size parametresi otomatik gönderilir." },
      { title: "Kararlı yineleme için seed", description: "İyi bir düzenleme yönünü korurken prompt'u geliştirmeye devam edin." },
      { title: "Yapı odaklı düzenlemelerde güçlü", description: "Silüet yeniden çizimi, eskiz iyileştirme, karakter restyling ve kontrollü yeniden kurulum için uygundur." },
    ],
    tipsTitle: "Düzenleme ipuçları",
    tips: [
      { title: "Önce neyin korunacağını yazın", description: "Poz, kontur, silüet, kompozisyon veya korunması gereken diğer yapıları belirtin." },
      { title: "Sonra görsel detayları ekleyin", description: "Saç, aksesuar, kıyafet, malzeme ve ruh halini net şekilde tarif edin." },
      { title: "Daha fazla detay için size'i büyütün", description: "Daha büyük boyutlar yüzler, küçük aksesuarlar ve kumaş dokusu için genelde daha iyi sonuç verir." },
      { title: "Önce -1, sonra sabit seed", description: "Önce rastgele sonuçlarla yön bulun, sonra kontrollü revizyon için sabit seed kullanın." },
    ],
    useCasesTitle: "Kullanım alanları",
    useCases: [
      { title: "Silüet rehberli yeniden çizimler", description: "Kontur, eskiz veya basit yapı referanslarını daha tamamlanmış görsellere dönüştürün." },
      { title: "Karakter iyileştirme", description: "Kıyafet, saç, aksesuar ve ifadeyi metin rehberliğiyle güçlendirin." },
      { title: "Stil aktarımı", description: "Bir kaynak görseli daha ticari, poster benzeri veya fotoğrafik bir sonuca dönüştürün." },
      { title: "Yüksek çözünürlüklü çıktı", description: "Ürün görselleri, kapaklar ve sosyal medya ana görselleri için daha büyük çıktılar hazırlayın." },
    ],
    faqTitle: "Sık sorulan sorular",
    faqDescription: "Wan 2.7 görselden görsele hakkında sık sorulan sorular.",
    faq: [
      { question: "Hangi parametreler destekleniyor?", answer: "Bu sayfa images, prompt, width, height ve seed destekler. Width ve height birleşik bir size değeri olarak gönderilir." },
      { question: "size nasıl gönderiliyor?", answer: "Sayfa width ve height değerlerini 512*512 veya 2048*1024 gibi bir size dizesinde otomatik birleştirir." },
      { question: "Kaç görsel yükleyebilirim?", answer: "Geçerli form en fazla 4 referans görsel destekler." },
      { question: "seed = -1 ne anlama gelir?", answer: "Rastgele üretim demektir. Tekrarlanabilir düzenlemeler için sabit bir tam sayı seed kullanın." },
    ],
    ctaTitle: "Wan 2.7 ile düzenlemeye başlayın",
    ctaDescription: "Referanslarınızı yükleyin, çıktı boyutunu ayarlayın ve Wan 2.7'yi image-to-image akışlarında test edin.",
    ctaButton: "Wan 2.7 görselden görsele dene",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 ile görseller nasıl düzenlenir",
    howToDescription: "Referans görseller ve prompt'lar ile Wan 2.7 kullanarak görselleri düzenleyin.",
    softwareName: "joymagic Wan 2.7 Görselden Görsele",
    featureList: ["Yapay zeka image-to-image düzenleme", "Özel boyut kontrolü", "Çoklu görsel girişi ve seed kontrolü"],
  };
  localized["ps-AF"] = {
    metaTitle: "Wan 2.7 له انځور څخه انځور - دودیزه اندازه او seed کنټرول | joymagic",
    metaDescription: "انځورونه د Wan 2.7 image-to-image په وسیله سم او بدل کړئ. مرستندویه انځورونه پورته کړئ، تر 4096 پورې اندازه کنټرول کړئ او پایلې د seed په وسیله نورې هم سمې کړئ.",
    metaKeywords: "Wan 2.7, له انځور څخه انځور, AI انځور سمون, دودیزه اندازه, عرض, لوړوالی, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 له انځور څخه انځور",
    heroDescription: "Wan 2.7 د image-to-image سمون لپاره هم ښه کار کوي. یو یا څو مرستندویه انځورونه پورته کړئ، ولیکئ چې څه باید پاتې شي او څه باید بدل شي، بیا د width، height، size او seed په مرسته پایله کنټرول کړئ.",
    featuresTitle: "ولې د انځور سمون لپاره Wan 2.7؟",
    featuresDescription: "د جوړښت لارښوونې، لوړ ریزولوشن او بیا تولیدېدونکو سمونونو لپاره یو انعطاف منونکی image-to-image بهیر.",
    features: [
      { title: "د څو انځورونو ننوت", description: "کله چې پیاوړې جوړښتي، سیلوېټ یا بڼې لارښوونې ته اړتیا وي، تر 4 پورې مرستندویه انځورونه وکاروئ." },
      { title: "د دودیزې اندازې کنټرول", description: "Width او height مستقیم تنظیم کړئ او ګډ size پارامیټر به په اوتومات ډول واستول شي." },
      { title: "د باثباته تکرار لپاره seed", description: "یو ښه سمونیز لوری ثابت وساتئ او prompt نور هم ښه کړئ." },
      { title: "د جوړښت-لارښوود سمون لپاره مناسب", description: "د سیلوېټ پر بنسټ بیا انځورولو، سکیچ ښه کولو، د کرکټر بیا سټایل کولو او کنټرول شوې بیا جوړونې لپاره ګټور دی." },
    ],
    tipsTitle: "د سمون سپارښتنې",
    tips: [
      { title: "لومړی ولیکئ چې څه وساتل شي", description: "Pose، outline، silhouette، composition یا بل هغه جوړښت یاد کړئ چې باید پاتې شي." },
      { title: "بیا ظاهري جزیات زیات کړئ", description: "وېښتان، لوازم، کالي، مواد او فضا په دقیقه توګه تشریح کړئ." },
      { title: "د ډېر جزیاتو لپاره size لوړه کړئ", description: "لویه اندازه اکثره د مخ، کوچنیو لوازمو او د ټوکر texture لپاره ښه وي." },
      { title: "لومړی -1، بیا ثابت seed", description: "لومړی له تصادفي پایلو لوری پیدا کړئ، بیا د کنټرول شوې بیاکتنې لپاره ثابت seed وکاروئ." },
    ],
    useCasesTitle: "د کارونې بېلګې",
    useCases: [
      { title: "د سیلوېټ پر بنسټ بیا انځورول", description: "Outline، sketch یا ساده جوړښتي انځورونه په لا بشپړو پایلو واړوئ." },
      { title: "د کرکټر ښه کول", description: "د متن لارښوونې په مرسته کالي، وېښتان، لوازم او احساسات پیاوړي کړئ." },
      { title: "سټایل لېږد", description: "یو سرچینه انځور په لا تجارتي، پوستري یا عکاسۍ ته نږدې پایله بدل کړئ." },
      { title: "لوړ ریزولوشن وتۍ", description: "د محصول ویژوالونو، پوښونو او ټولنیزو کلیدي انځورونو لپاره لوی فایلونه چمتو کړئ." },
    ],
    faqTitle: "عامې پوښتنې",
    faqDescription: "د Wan 2.7 image-to-image په اړه عامې پوښتنې.",
    faq: [
      { question: "کوم پارامیټرونه ملاتړ کېږي؟", answer: "دا پاڼه images، prompt، width، height او seed ملاتړ کوي. Width او height د یوه ګډ size ارزښت په توګه لېږل کېږي." },
      { question: "size څنګه لېږل کېږي؟", answer: "پاڼه width او height په اوتومات ډول د 512*512 یا 2048*1024 په شان size متن کې یوځای کوي." },
      { question: "څومره انځورونه پورته کولی شم؟", answer: "اوسنی فورم تر 4 پورې مرستندویه انځورونه ملاتړ کوي." },
      { question: "seed = -1 څه معنی لري؟", answer: "دا تصادفي تولید دی. که بیا تولیدېدونکی سمون غواړئ، ثابت صحیح seed وکاروئ." },
    ],
    ctaTitle: "له Wan 2.7 سره سمون پیل کړئ",
    ctaDescription: "مرستندویه انځورونه پورته کړئ، د وتۍ اندازه وټاکئ او Wan 2.7 د image-to-image بهیرونو کې وازمویئ.",
    ctaButton: "Wan 2.7 image-to-image وازمویه",
    breadcrumbModel: "Wan 2.7",
    howToName: "په Wan 2.7 سره انځورونه څنګه سم کړو",
    howToDescription: "په Wan 2.7 سره د مرستندویه انځورونو او prompt په کارولو انځورونه سم کړئ.",
    softwareName: "joymagic Wan 2.7 له انځور څخه انځور",
    featureList: ["AI image-to-image سمون", "دودیزه اندازه", "څو انځوریز ننوت او seed کنټرول"],
  };

  if (localized[locale]) {
    return localized[locale];
  }

  return {
    ...localized.en,
    metaTitle: `${textCopy.heroTitle} - ${textCopy.metaTitle.split(" - ")[1] || localized.en.metaTitle}`,
    breadcrumbModel: labels.textToImage === "Text to Image" ? localized.en.breadcrumbModel : textCopy.breadcrumbModel,
  };
}

type Wan27TextToVideoPageCopy = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroTitle: string;
  heroDescription: string;
  featuresTitle: string;
  featuresDescription: string;
  features: FeatureItem[];
  tipsTitle: string;
  tips: FeatureItem[];
  useCasesTitle: string;
  useCases: FeatureItem[];
  faqTitle: string;
  faqDescription: string;
  faq: FAQItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  breadcrumbModel: string;
  howToName: string;
  howToDescription: string;
  softwareName: string;
  featureList: string[];
};

const textToVideoCopy: Record<string, Wan27TextToVideoPageCopy> = {
  en: {
    metaTitle: "Wan 2.7 Text to Video - 1080p, 15s, Aspect Ratio Control | joymagic",
    metaDescription:
      "Generate videos from text with Wan 2.7. Control resolution, aspect ratio, duration, prompt expansion, optional audio, and seed in one creator workflow.",
    metaKeywords:
      "Wan 2.7, text to video, AI video generator, 1080p, aspect ratio, prompt expansion, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Text to Video",
    heroDescription:
      "Wan 2.7 text-to-video is built for prompt-led video generation with practical controls. You can write a scene prompt, add optional audio, choose 720p or 1080p, switch between common aspect ratios, set duration up to 15 seconds, and keep seed control when you want a more repeatable direction.",
    featuresTitle: "Why use Wan 2.7 for text-to-video?",
    featuresDescription:
      "A balanced text-to-video workflow for cinematic prompts, flexible framing, and controlled iteration.",
    features: [
      { title: "1080p output", description: "Choose 720p for quick iteration or 1080p when you need cleaner final frames." },
      { title: "Aspect ratio control", description: "Switch between 16:9, 9:16, 1:1, 4:3, and 3:4 to match landscape, portrait, or social formats." },
      { title: "Up to 15 seconds", description: "Use the duration slider to explore short motion loops or longer scene beats in one form." },
      { title: "Prompt expansion and optional audio", description: "Let the model expand short prompts automatically and attach an audio file when your workflow needs it." },
    ],
    tipsTitle: "Prompt tips",
    tips: [
      { title: "Describe camera motion clearly", description: "Mention push-in, pan, handheld feel, slow motion, or lock-off movement explicitly." },
      { title: "Separate subject, environment, and lighting", description: "Clear structure usually gives more stable character identity and scene mood." },
      { title: "Use aspect ratio intentionally", description: "16:9 works well for cinematic scenes, while 9:16 and 1:1 fit short-form social formats." },
      { title: "Lock a seed after finding a good direction", description: "Use random exploration first, then switch to a fixed seed for more controlled prompt revisions." },
    ],
    useCasesTitle: "Best use cases",
    useCases: [
      { title: "Cinematic mood shots", description: "Build rain-soaked, neon, fashion, portrait, and concept-film sequences from pure text." },
      { title: "Social video concepts", description: "Create short vertical or square videos for teasers, promos, and cover motion." },
      { title: "Creative pitch references", description: "Turn written scene ideas into moving references for treatments, ads, and music-video concepts." },
      { title: "Iterative direction finding", description: "Try different framing, pacing, and atmosphere settings before moving to production." },
    ],
    faqTitle: "Frequently asked questions",
    faqDescription: "Common questions about Wan 2.7 text to video.",
    faq: [
      { question: "Which parameters are supported?", answer: "This page supports prompt, negative prompt, optional audio, resolution, aspect ratio, duration, prompt expansion, and seed." },
      { question: "What aspect ratios are available?", answer: "Wan 2.7 text-to-video currently supports 16:9, 9:16, 1:1, 4:3, and 3:4." },
      { question: "How long can the video be?", answer: "The current form supports 5 to 15 seconds, with 15 seconds as the default value." },
      { question: "What does seed = -1 mean?", answer: "A seed of -1 means random generation. Use a fixed integer if you want more reproducible outputs." },
    ],
    ctaTitle: "Start generating videos with Wan 2.7",
    ctaDescription:
      "Open the Wan 2.7 creator form and test how framing, duration, and prompt expansion change your video results.",
    ctaButton: "Try Wan 2.7 now",
    breadcrumbModel: "Wan 2.7",
    howToName: "How to generate videos with Wan 2.7",
    howToDescription: "Generate AI videos from text prompts using Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Text to Video",
    featureList: ["AI text-to-video generation", "1080p and aspect ratio control", "Optional audio and prompt expansion"],
  },
  "en-IN": {} as Wan27TextToVideoPageCopy,
  zh: {
    metaTitle: "Wan 2.7 文本生成视频 - 1080p、15 秒与宽高比控制 | joymagic",
    metaDescription:
      "使用 Wan 2.7 从文本生成视频，支持分辨率、宽高比、时长、提示词扩写、可选音频和 seed 控制。",
    metaKeywords:
      "Wan 2.7, 文本生成视频, AI 视频生成, 1080p, 宽高比, 提示词扩写, seed, 阿里云",
    heroTitle: "Wan 2.7 文本生成视频",
    heroDescription:
      "Wan 2.7 适合以 prompt 为核心的视频生成流程。你可以输入场景描述、上传可选音频、选择 720p 或 1080p、切换常用宽高比、设置最长 15 秒时长，并在需要稳定迭代时继续使用 seed 控制。",
    featuresTitle: "为什么使用 Wan 2.7 生成视频？",
    featuresDescription:
      "兼顾电影感提示词、灵活构图和可控迭代的实用型 text-to-video 工作流。",
    features: [
      { title: "1080p 输出", description: "720p 适合快速探索，1080p 更适合更干净的最终画面。" },
      { title: "宽高比可选", description: "支持 16:9、9:16、1:1、4:3、3:4，适配横版、竖版和社媒格式。" },
      { title: "最长 15 秒", description: "通过时长滑杆在短循环镜头和更完整的场景节奏之间灵活切换。" },
      { title: "提示词扩写与可选音频", description: "可以自动扩写短 prompt，也可以在需要时附加音频文件。" },
    ],
    tipsTitle: "提示词建议",
    tips: [
      { title: "把镜头运动写清楚", description: "明确写出推进、平移、手持感、慢动作或固定机位，结果通常更稳定。" },
      { title: "主体、环境、光线分开描述", description: "结构清晰的提示词更容易稳定角色和整体氛围。" },
      { title: "有意识地选择宽高比", description: "16:9 适合电影感场景，9:16 和 1:1 更适合短视频和社媒分发。" },
      { title: "先随机探索，再固定 seed", description: "先用随机结果找方向，再改用固定 seed 做连续微调。" },
    ],
    useCasesTitle: "适合场景",
    useCases: [
      { title: "电影感氛围镜头", description: "适合雨夜霓虹、人像、时尚、概念短片等纯文本生成视频。" },
      { title: "社媒视频概念", description: "快速制作竖版或方版 teaser、promo 和封面动态素材。" },
      { title: "创意提案参考", description: "把文字场景想法转成会动的参考视频，用于广告、MV 和提案阶段。" },
      { title: "方向迭代", description: "在进入正式制作前先测试构图、节奏和氛围方向。" },
    ],
    faqTitle: "常见问题",
    faqDescription: "关于 Wan 2.7 文本生成视频的常见问题。",
    faq: [
      { question: "支持哪些参数？", answer: "当前页面支持 prompt、negative prompt、可选 audio、resolution、aspect ratio、duration、prompt expansion 和 seed。" },
      { question: "支持哪些宽高比？", answer: "当前支持 16:9、9:16、1:1、4:3 和 3:4。" },
      { question: "最长可以生成多久？", answer: "当前表单支持 5 到 15 秒，默认时长是 15 秒。" },
      { question: "seed = -1 是什么意思？", answer: "表示随机生成。如果想让结果更容易复现，请改成固定整数。" },
    ],
    ctaTitle: "开始用 Wan 2.7 生成视频",
    ctaDescription:
      "打开 Wan 2.7 Creator 表单，直接测试构图、时长和提示词扩写对视频结果的影响。",
    ctaButton: "立即体验 Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 生成视频",
    howToDescription: "使用 Wan 2.7 根据文本提示词生成 AI 视频。",
    softwareName: "joymagic Wan 2.7 文本生成视频",
    featureList: ["AI 文本生成视频", "1080p 与宽高比控制", "可选音频与提示词扩写"],
  },
  "zh-Hant-TW": {
    metaTitle: "Wan 2.7 文字生成影片 - 1080p、15 秒與畫面比例控制 | joymagic",
    metaDescription:
      "使用 Wan 2.7 從文字生成影片，支援解析度、畫面比例、時長、提示詞擴寫、可選音訊與 seed 控制。",
    metaKeywords:
      "Wan 2.7, 文字生成影片, AI 影片生成, 1080p, 畫面比例, 提示詞擴寫, seed, 阿里雲",
    heroTitle: "Wan 2.7 文字生成影片",
    heroDescription:
      "Wan 2.7 適合以 prompt 為核心的影片生成流程。你可以輸入場景描述、上傳可選音訊、選擇 720p 或 1080p、切換常用畫面比例、設定最長 15 秒時長，並在需要穩定迭代時使用 seed 控制。",
    featuresTitle: "為什麼使用 Wan 2.7 生成影片？",
    featuresDescription:
      "兼顧電影感提示詞、靈活構圖與可控迭代的實用型 text-to-video 工作流。",
    features: [
      { title: "1080p 輸出", description: "720p 適合快速探索，1080p 更適合較乾淨的最終畫面。" },
      { title: "畫面比例可選", description: "支援 16:9、9:16、1:1、4:3、3:4，適配橫式、直式與社群格式。" },
      { title: "最長 15 秒", description: "透過時長滑桿在短循環鏡頭與更完整的場景節奏之間切換。" },
      { title: "提示詞擴寫與可選音訊", description: "可自動擴寫短 prompt，也可在需要時附加音訊檔案。" },
    ],
    tipsTitle: "提示詞建議",
    tips: [
      { title: "把鏡頭運動寫清楚", description: "明確寫出推進、平移、手持感、慢動作或固定機位，通常更穩定。" },
      { title: "主體、環境、光線分開描述", description: "結構清楚的提示詞更容易穩定角色與整體氛圍。" },
      { title: "有意識地選擇畫面比例", description: "16:9 適合電影感場景，9:16 與 1:1 更適合短影片與社群分發。" },
      { title: "先隨機探索，再固定 seed", description: "先用隨機結果找方向，再改用固定 seed 做連續微調。" },
    ],
    useCasesTitle: "適合場景",
    useCases: [
      { title: "電影感氛圍鏡頭", description: "適合雨夜霓虹、人像、時尚、概念短片等純文字生成影片。" },
      { title: "社群影片概念", description: "快速製作直式或方形 teaser、promo 與封面動態素材。" },
      { title: "創意提案參考", description: "把文字場景想法轉成動態參考，用於廣告、MV 與提案階段。" },
      { title: "方向迭代", description: "在進入正式製作前先測試構圖、節奏與氛圍方向。" },
    ],
    faqTitle: "常見問題",
    faqDescription: "關於 Wan 2.7 文字生成影片的常見問題。",
    faq: [
      { question: "支援哪些參數？", answer: "目前頁面支援 prompt、negative prompt、可選 audio、resolution、aspect ratio、duration、prompt expansion 與 seed。" },
      { question: "支援哪些畫面比例？", answer: "目前支援 16:9、9:16、1:1、4:3 與 3:4。" },
      { question: "最長可以生成多久？", answer: "目前表單支援 5 到 15 秒，預設時長是 15 秒。" },
      { question: "seed = -1 是什麼意思？", answer: "表示隨機生成。若想讓結果更容易重現，請改成固定整數。" },
    ],
    ctaTitle: "開始用 Wan 2.7 生成影片",
    ctaDescription: "打開 Wan 2.7 Creator 表單，直接測試構圖、時長與提示詞擴寫對影片結果的影響。",
    ctaButton: "立即體驗 Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 生成影片",
    howToDescription: "使用 Wan 2.7 根據文字提示詞生成 AI 影片。",
    softwareName: "joymagic Wan 2.7 文字生成影片",
    featureList: ["AI 文字生成影片", "1080p 與畫面比例控制", "可選音訊與提示詞擴寫"],
  },
  "zh-hk": {} as Wan27TextToVideoPageCopy,
  "de-DE": {
    metaTitle: "Wan 2.7 Text-zu-Video - 1080p, 15 Sekunden und Seitenverhältnis | joymagic",
    metaDescription: "Erstellen Sie Videos aus Text mit Wan 2.7. Unterstützt Auflösung, Seitenverhältnis, Dauer, Prompt-Erweiterung, optionales Audio und Seed-Kontrolle.",
    metaKeywords: "Wan 2.7, Text zu Video, KI Videogenerator, 1080p, Seitenverhältnis, Prompt-Erweiterung, Seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Text-zu-Video",
    heroDescription: "Wan 2.7 eignet sich für promptgesteuerte Videogenerierung mit praktischen Einstellungen. Sie können eine Szenenbeschreibung schreiben, optional Audio hochladen, 720p oder 1080p wählen, gängige Seitenverhältnisse nutzen, bis zu 15 Sekunden festlegen und mit einem Seed konsistent iterieren.",
    featuresTitle: "Warum Wan 2.7 für Text-zu-Video?",
    featuresDescription: "Ein ausgewogener Text-zu-Video-Workflow für cineastische Prompts, flexible Bildformate und kontrollierte Iteration.",
    features: [
      { title: "1080p-Ausgabe", description: "720p ist gut für schnelle Tests, 1080p für sauberere Endergebnisse." },
      { title: "Seitenverhältnis steuern", description: "Wechseln Sie zwischen 16:9, 9:16, 1:1, 4:3 und 3:4 für Kino-, Social- oder Hochformat-Ausgaben." },
      { title: "Bis zu 15 Sekunden", description: "Nutzen Sie den Slider für kurze Bewegungsloops oder längere Szenenmomente im selben Formular." },
      { title: "Prompt-Erweiterung und optionales Audio", description: "Kurze Prompts können automatisch erweitert werden, und bei Bedarf lässt sich eine Audiodatei ergänzen." },
    ],
    tipsTitle: "Prompt-Tipps",
    tips: [
      { title: "Kamerabewegung klar benennen", description: "Beschreiben Sie Push-in, Schwenk, Handheld, Slow Motion oder statische Kamera möglichst direkt." },
      { title: "Subjekt, Umgebung und Licht trennen", description: "Eine klare Struktur stabilisiert meist Identität und Stimmung besser." },
      { title: "Seitenverhältnis bewusst wählen", description: "16:9 eignet sich für cineastische Szenen, 9:16 und 1:1 eher für Short-Form-Formate." },
      { title: "Seed nach guter Richtung fixieren", description: "Erkunden Sie zuerst zufällig und wechseln Sie dann zu einem festen Seed für kontrolliertere Iterationen." },
    ],
    useCasesTitle: "Typische Einsatzfälle",
    useCases: [
      { title: "Cineastische Mood-Shots", description: "Erzeugen Sie Regen-, Neon-, Fashion-, Porträt- oder Konzeptfilm-Sequenzen direkt aus Text." },
      { title: "Social-Video-Konzepte", description: "Erstellen Sie kurze vertikale oder quadratische Videos für Teaser, Promos und bewegte Cover." },
      { title: "Kreative Pitch-Referenzen", description: "Verwandeln Sie geschriebene Szenenideen in bewegte Referenzen für Ads, Treatments und Musikvideos." },
      { title: "Richtungsfindung", description: "Testen Sie Bildausschnitt, Tempo und Atmosphäre, bevor Sie in die Produktion gehen." },
    ],
    faqTitle: "Häufige Fragen",
    faqDescription: "Häufige Fragen zu Wan 2.7 Text-zu-Video.",
    faq: [
      { question: "Welche Parameter werden unterstützt?", answer: "Diese Seite unterstützt prompt, negative prompt, optionales audio, resolution, aspect ratio, duration, prompt expansion und seed." },
      { question: "Welche Seitenverhältnisse gibt es?", answer: "Aktuell unterstützt Wan 2.7 Text-zu-Video 16:9, 9:16, 1:1, 4:3 und 3:4." },
      { question: "Wie lang kann das Video sein?", answer: "Das aktuelle Formular unterstützt 5 bis 15 Sekunden, standardmäßig 15 Sekunden." },
      { question: "Was bedeutet seed = -1?", answer: "Ein Seed von -1 bedeutet zufällige Generierung. Für reproduzierbarere Ergebnisse verwenden Sie einen festen ganzzahligen Seed." },
    ],
    ctaTitle: "Starten Sie die Videogenerierung mit Wan 2.7",
    ctaDescription: "Öffnen Sie das Wan-2.7-Formular und testen Sie, wie Bildformat, Dauer und Prompt-Erweiterung Ihre Ergebnisse verändern.",
    ctaButton: "Wan 2.7 testen",
    breadcrumbModel: "Wan 2.7",
    howToName: "So erzeugen Sie Videos mit Wan 2.7",
    howToDescription: "Erstellen Sie KI-Videos aus Text-Prompts mit Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Text zu Video",
    featureList: ["KI Text-zu-Video", "1080p und Seitenverhältnis", "Optionales Audio und Prompt-Erweiterung"],
  },
  "ko-KR": {
    metaTitle: "Wan 2.7 텍스트 비디오 생성 - 1080p, 15초, 화면비 제어 | joymagic",
    metaDescription: "Wan 2.7로 텍스트에서 영상을 생성하세요. 해상도, 화면비, 길이, 프롬프트 확장, 선택형 오디오, seed 제어를 지원합니다.",
    metaKeywords: "Wan 2.7, 텍스트 비디오 생성, AI 비디오 생성기, 1080p, 화면비, 프롬프트 확장, seed, 알리바바 클라우드",
    heroTitle: "Wan 2.7 텍스트 비디오 생성",
    heroDescription: "Wan 2.7은 프롬프트 중심의 영상 생성에 적합합니다. 장면 설명을 쓰고, 필요하면 오디오를 추가하고, 720p 또는 1080p를 고르고, 일반적인 화면비를 바꾸고, 최대 15초 길이를 설정하며, 같은 방향을 반복하고 싶을 때는 seed도 유지할 수 있습니다.",
    featuresTitle: "왜 Wan 2.7로 영상을 만드나요?",
    featuresDescription: "시네마틱 프롬프트, 유연한 프레이밍, 제어 가능한 반복 작업을 위한 균형 잡힌 text-to-video 워크플로입니다.",
    features: [
      { title: "1080p 출력", description: "720p는 빠른 탐색에 좋고 1080p는 더 깔끔한 최종 프레임에 적합합니다." },
      { title: "화면비 제어", description: "16:9, 9:16, 1:1, 4:3, 3:4를 오가며 가로형, 세로형, 소셜 포맷을 맞출 수 있습니다." },
      { title: "최대 15초", description: "하나의 폼에서 짧은 루프와 더 긴 장면 비트를 모두 테스트할 수 있습니다." },
      { title: "프롬프트 확장과 선택형 오디오", description: "짧은 프롬프트를 자동으로 확장하고 필요하면 오디오 파일도 함께 사용할 수 있습니다." },
    ],
    tipsTitle: "프롬프트 팁",
    tips: [
      { title: "카메라 움직임을 명확히 쓰기", description: "푸시인, 팬, 핸드헬드, 슬로모션, 고정 카메라를 분명히 적어 주세요." },
      { title: "주제, 환경, 조명을 분리해서 쓰기", description: "구조가 명확할수록 캐릭터와 분위기가 더 안정적입니다." },
      { title: "화면비를 의도적으로 선택하기", description: "16:9는 시네마틱 장면에, 9:16과 1:1은 숏폼 소셜 포맷에 잘 맞습니다." },
      { title: "좋은 방향을 찾으면 seed 고정", description: "처음엔 랜덤으로 탐색하고, 이후엔 고정 seed로 더 제어된 수정 작업을 진행하세요." },
    ],
    useCasesTitle: "추천 활용 사례",
    useCases: [
      { title: "시네마틱 무드 샷", description: "비 오는 밤, 네온, 패션, 인물, 콘셉트 필름 시퀀스를 텍스트만으로 생성할 수 있습니다." },
      { title: "소셜 비디오 콘셉트", description: "티저, 프로모, 커버 모션용 짧은 세로형 또는 정사각형 영상을 만들 수 있습니다." },
      { title: "크리에이티브 피치 레퍼런스", description: "글로 쓴 장면 아이디어를 광고, 트리트먼트, 뮤직비디오용 움직이는 참고 영상으로 바꿉니다." },
      { title: "방향 탐색", description: "본 제작 전에 프레이밍, 속도감, 분위기를 미리 테스트할 수 있습니다." },
    ],
    faqTitle: "자주 묻는 질문",
    faqDescription: "Wan 2.7 텍스트 비디오 생성에 대한 자주 묻는 질문입니다.",
    faq: [
      { question: "어떤 파라미터를 지원하나요?", answer: "이 페이지는 prompt, negative prompt, 선택형 audio, resolution, aspect ratio, duration, prompt expansion, seed를 지원합니다." },
      { question: "어떤 화면비를 지원하나요?", answer: "현재 16:9, 9:16, 1:1, 4:3, 3:4를 지원합니다." },
      { question: "영상은 얼마나 길게 만들 수 있나요?", answer: "현재 폼은 5초부터 15초까지 지원하며 기본값은 15초입니다." },
      { question: "seed = -1은 무슨 뜻인가요?", answer: "무작위 생성이라는 뜻입니다. 더 재현 가능한 결과가 필요하면 고정 정수 seed를 사용하세요." },
    ],
    ctaTitle: "Wan 2.7으로 영상 생성 시작하기",
    ctaDescription: "Wan 2.7 폼을 열고 프레이밍, 길이, 프롬프트 확장이 결과를 어떻게 바꾸는지 확인해 보세요.",
    ctaButton: "Wan 2.7 사용하기",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7으로 영상 생성하는 방법",
    howToDescription: "Wan 2.7으로 텍스트 프롬프트에서 AI 영상을 생성합니다.",
    softwareName: "joymagic Wan 2.7 텍스트 비디오 생성",
    featureList: ["AI 텍스트 비디오 생성", "1080p 및 화면비 제어", "선택형 오디오와 프롬프트 확장"],
  },
  "ja-JP": {
    metaTitle: "Wan 2.7 テキストから動画 - 1080p、15秒、アスペクト比制御 | joymagic",
    metaDescription: "Wan 2.7 でテキストから動画を生成。解像度、アスペクト比、長さ、プロンプト拡張、任意の音声、seed 制御に対応しています。",
    metaKeywords: "Wan 2.7, テキストから動画, AI動画生成, 1080p, アスペクト比, プロンプト拡張, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 テキストから動画",
    heroDescription: "Wan 2.7 は prompt 主導の動画生成に向いたモデルです。シーン説明を書き、必要に応じて音声を追加し、720p または 1080p を選び、一般的なアスペクト比を切り替え、最大 15 秒を設定し、seed を使って方向性を保ちながら調整できます。",
    featuresTitle: "Wan 2.7 を使う理由",
    featuresDescription: "シネマティックな prompt、柔軟なフレーミング、制御しやすい反復調整に向いた実用的な text-to-video ワークフローです。",
    features: [
      { title: "1080p 出力", description: "720p は素早い試行に、1080p はよりきれいな最終フレームに向いています。" },
      { title: "アスペクト比制御", description: "16:9、9:16、1:1、4:3、3:4 を切り替えて横長、縦長、SNS 向け形式に対応できます。" },
      { title: "最長 15 秒", description: "短いループから少し長めのシーンまで 1 つのフォームで試せます。" },
      { title: "プロンプト拡張と任意音声", description: "短い prompt を自動拡張し、必要なら音声ファイルも追加できます。" },
    ],
    tipsTitle: "プロンプトのコツ",
    tips: [
      { title: "カメラワークを明確に書く", description: "寄り、パン、手持ち感、スローモーション、固定カメラをはっきり書くと安定しやすいです。" },
      { title: "被写体、環境、光を分けて書く", description: "構造が明確な prompt のほうがキャラクター性と雰囲気が安定しやすいです。" },
      { title: "アスペクト比を意図して選ぶ", description: "16:9 はシネマ風、9:16 や 1:1 はショート動画や SNS 向けに向いています。" },
      { title: "良い方向が見えたら seed を固定", description: "最初はランダムで探索し、その後固定 seed でより制御しやすい調整を行います。" },
    ],
    useCasesTitle: "おすすめ用途",
    useCases: [
      { title: "シネマティックなムードショット", description: "雨夜、ネオン、ファッション、人物、コンセプトフィルム風のシーンをテキストだけで作れます。" },
      { title: "SNS 動画コンセプト", description: "ティーザー、プロモ、カバーモーション向けの短い縦型や正方形動画を作れます。" },
      { title: "企画用の動く参考素材", description: "文章で書いたシーン案を広告、絵コンテ、MV 企画用の動くリファレンスに変換できます。" },
      { title: "方向性の探索", description: "本制作前にフレーミング、テンポ、雰囲気を試すのに向いています。" },
    ],
    faqTitle: "よくある質問",
    faqDescription: "Wan 2.7 テキストから動画に関するよくある質問です。",
    faq: [
      { question: "どのパラメータに対応していますか？", answer: "このページは prompt、negative prompt、任意の audio、resolution、aspect ratio、duration、prompt expansion、seed に対応しています。" },
      { question: "どのアスペクト比が使えますか？", answer: "現在は 16:9、9:16、1:1、4:3、3:4 に対応しています。" },
      { question: "動画の長さはどれくらいですか？", answer: "現在のフォームは 5 秒から 15 秒まで対応し、初期値は 15 秒です。" },
      { question: "seed = -1 は何を意味しますか？", answer: "ランダム生成を意味します。より再現性が必要な場合は固定の整数 seed を使ってください。" },
    ],
    ctaTitle: "Wan 2.7 で動画生成を始める",
    ctaDescription: "Wan 2.7 フォームを開き、フレーミング、長さ、プロンプト拡張が結果にどう影響するか確認してください。",
    ctaButton: "Wan 2.7 を試す",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 で動画を生成する方法",
    howToDescription: "Wan 2.7 を使ってテキスト prompt から AI 動画を生成します。",
    softwareName: "joymagic Wan 2.7 テキストから動画",
    featureList: ["AI テキストから動画", "1080p とアスペクト比制御", "任意音声とプロンプト拡張"],
  },
  "es-ES": {
    metaTitle: "Wan 2.7 Texto a Video - 1080p, 15 segundos y relación de aspecto | joymagic",
    metaDescription: "Genera videos desde texto con Wan 2.7. Controla resolución, relación de aspecto, duración, expansión de prompt, audio opcional y seed.",
    metaKeywords: "Wan 2.7, texto a video, generador de video IA, 1080p, relación de aspecto, expansión de prompt, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Texto a Video",
    heroDescription: "Wan 2.7 está pensado para generación de video guiada por prompt. Puedes escribir la escena, añadir audio opcional, elegir 720p o 1080p, cambiar entre proporciones comunes, fijar hasta 15 segundos y mantener seed cuando quieras una dirección más repetible.",
    featuresTitle: "¿Por qué usar Wan 2.7 para video?",
    featuresDescription: "Un flujo práctico de text-to-video para prompts cinematográficos, encuadre flexible e iteración controlada.",
    features: [
      { title: "Salida en 1080p", description: "720p sirve para iterar rápido y 1080p para cuadros finales más limpios." },
      { title: "Control de relación de aspecto", description: "Usa 16:9, 9:16, 1:1, 4:3 y 3:4 para formatos horizontales, verticales o sociales." },
      { title: "Hasta 15 segundos", description: "El control de duración te deja probar loops cortos o secuencias algo más largas en el mismo formulario." },
      { title: "Expansión de prompt y audio opcional", description: "El modelo puede ampliar prompts cortos y también puedes adjuntar audio cuando lo necesites." },
    ],
    tipsTitle: "Consejos de prompt",
    tips: [
      { title: "Describe bien el movimiento de cámara", description: "Menciona push-in, paneo, cámara en mano, cámara fija o cámara lenta de forma explícita." },
      { title: "Separa sujeto, entorno y luz", description: "Una estructura clara suele dar mejor estabilidad al personaje y al ambiente." },
      { title: "Elige la proporción con intención", description: "16:9 funciona bien para escenas cinematográficas; 9:16 y 1:1 para formatos sociales." },
      { title: "Bloquea la seed cuando encuentres una buena dirección", description: "Explora primero con azar y luego cambia a una seed fija para revisar con más control." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Planos con atmósfera cinematográfica", description: "Crea secuencias de lluvia, neón, moda, retrato o concepto visual solo con texto." },
      { title: "Conceptos para video social", description: "Genera videos cortos verticales o cuadrados para teasers, promos y motion covers." },
      { title: "Referencias para presentaciones creativas", description: "Convierte ideas escritas en referencias en movimiento para ads, tratamientos y videoclips." },
      { title: "Exploración de dirección", description: "Prueba encuadre, ritmo y atmósfera antes de pasar a producción." },
    ],
    faqTitle: "Preguntas frecuentes",
    faqDescription: "Preguntas comunes sobre Wan 2.7 texto a video.",
    faq: [
      { question: "¿Qué parámetros admite?", answer: "Esta página admite prompt, negative prompt, audio opcional, resolution, aspect ratio, duration, prompt expansion y seed." },
      { question: "¿Qué relaciones de aspecto están disponibles?", answer: "Actualmente admite 16:9, 9:16, 1:1, 4:3 y 3:4." },
      { question: "¿Cuánto puede durar el video?", answer: "El formulario actual admite entre 5 y 15 segundos, con 15 segundos por defecto." },
      { question: "¿Qué significa seed = -1?", answer: "Significa generación aleatoria. Usa una seed entera fija si quieres resultados más reproducibles." },
    ],
    ctaTitle: "Empieza a generar videos con Wan 2.7",
    ctaDescription: "Abre el formulario de Wan 2.7 y prueba cómo cambian los resultados al ajustar encuadre, duración y expansión de prompt.",
    ctaButton: "Probar Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Cómo generar videos con Wan 2.7",
    howToDescription: "Genera videos de IA desde prompts de texto con Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Texto a Video",
    featureList: ["IA de texto a video", "1080p y relación de aspecto", "Audio opcional y expansión de prompt"],
  },
  "it-IT": {
    metaTitle: "Wan 2.7 Testo in Video - 1080p, 15 secondi e rapporto d'aspetto | joymagic",
    metaDescription: "Genera video da testo con Wan 2.7. Controlla risoluzione, rapporto d'aspetto, durata, espansione del prompt, audio opzionale e seed.",
    metaKeywords: "Wan 2.7, testo in video, generatore video AI, 1080p, rapporto d'aspetto, espansione prompt, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Testo in Video",
    heroDescription: "Wan 2.7 è pensato per la generazione video guidata da prompt. Puoi scrivere la scena, aggiungere audio opzionale, scegliere 720p o 1080p, cambiare rapporto d'aspetto, impostare fino a 15 secondi e mantenere il seed per un flusso più ripetibile.",
    featuresTitle: "Perché usare Wan 2.7 per i video?",
    featuresDescription: "Un workflow text-to-video pratico per prompt cinematografici, inquadrature flessibili e iterazione controllata.",
    features: [
      { title: "Output 1080p", description: "720p è utile per iterazioni rapide, 1080p per frame finali più puliti." },
      { title: "Controllo del rapporto d'aspetto", description: "Passa tra 16:9, 9:16, 1:1, 4:3 e 3:4 per formati orizzontali, verticali o social." },
      { title: "Fino a 15 secondi", description: "Usa il cursore della durata per provare loop brevi o scene leggermente più lunghe nello stesso form." },
      { title: "Espansione prompt e audio opzionale", description: "Il modello può espandere prompt brevi e puoi allegare audio quando serve." },
    ],
    tipsTitle: "Suggerimenti per il prompt",
    tips: [
      { title: "Descrivi bene il movimento di camera", description: "Specifica push-in, pan, handheld, slow motion o camera fissa in modo esplicito." },
      { title: "Separa soggetto, ambiente e luce", description: "Una struttura chiara rende più stabile identità del personaggio e atmosfera." },
      { title: "Scegli il formato con intenzione", description: "16:9 funziona bene per scene cinematografiche; 9:16 e 1:1 per video social." },
      { title: "Blocca il seed dopo aver trovato una buona direzione", description: "Esplora prima in modo casuale, poi passa a un seed fisso per revisioni più controllate." },
    ],
    useCasesTitle: "Casi d'uso",
    useCases: [
      { title: "Shot cinematici d'atmosfera", description: "Crea scene notturne, neon, moda, ritratto o concept film solo da testo." },
      { title: "Concept per video social", description: "Genera clip brevi verticali o quadrate per teaser, promo e cover animate." },
      { title: "Riferimenti per pitch creativi", description: "Trasforma idee scritte in riferimenti in movimento per ads, treatment e videoclip." },
      { title: "Ricerca della direzione", description: "Prova inquadratura, ritmo e atmosfera prima della produzione." },
    ],
    faqTitle: "Domande frequenti",
    faqDescription: "Domande comuni su Wan 2.7 testo in video.",
    faq: [
      { question: "Quali parametri sono supportati?", answer: "Questa pagina supporta prompt, negative prompt, audio opzionale, resolution, aspect ratio, duration, prompt expansion e seed." },
      { question: "Quali rapporti d'aspetto sono disponibili?", answer: "Attualmente supporta 16:9, 9:16, 1:1, 4:3 e 3:4." },
      { question: "Quanto può durare il video?", answer: "Il form attuale supporta da 5 a 15 secondi, con 15 secondi come valore predefinito." },
      { question: "Cosa significa seed = -1?", answer: "Significa generazione casuale. Usa un seed intero fisso se vuoi risultati più riproducibili." },
    ],
    ctaTitle: "Inizia a generare video con Wan 2.7",
    ctaDescription: "Apri il form di Wan 2.7 e prova come cambiano i risultati regolando formato, durata ed espansione del prompt.",
    ctaButton: "Prova Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Come generare video con Wan 2.7",
    howToDescription: "Genera video AI da prompt di testo con Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Testo in Video",
    featureList: ["AI testo in video", "1080p e rapporto d'aspetto", "Audio opzionale ed espansione prompt"],
  },
  "pt-BR": {
    metaTitle: "Wan 2.7 Texto para Vídeo - 1080p, 15 segundos e proporção | joymagic",
    metaDescription: "Gere vídeos a partir de texto com Wan 2.7. Controle resolução, proporção, duração, expansão de prompt, áudio opcional e seed.",
    metaKeywords: "Wan 2.7, texto para vídeo, gerador de vídeo IA, 1080p, proporção, expansão de prompt, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Texto para Vídeo",
    heroDescription: "Wan 2.7 foi pensado para geração de vídeo guiada por prompt. Você pode escrever a cena, adicionar áudio opcional, escolher 720p ou 1080p, trocar a proporção, definir até 15 segundos e manter uma seed para repetir melhor a direção visual.",
    featuresTitle: "Por que usar Wan 2.7 para vídeo?",
    featuresDescription: "Um fluxo prático de text-to-video para prompts cinematográficos, enquadramento flexível e iteração controlada.",
    features: [
      { title: "Saída em 1080p", description: "720p é ótimo para testar rápido e 1080p para quadros finais mais limpos." },
      { title: "Controle de proporção", description: "Alterne entre 16:9, 9:16, 1:1, 4:3 e 3:4 para formatos horizontais, verticais ou sociais." },
      { title: "Até 15 segundos", description: "Use o controle de duração para testar loops curtos ou cenas um pouco mais longas no mesmo formulário." },
      { title: "Expansão de prompt e áudio opcional", description: "O modelo pode expandir prompts curtos automaticamente e você também pode anexar áudio quando precisar." },
    ],
    tipsTitle: "Dicas de prompt",
    tips: [
      { title: "Descreva bem o movimento de câmera", description: "Mencione push-in, pan, handheld, câmera fixa ou slow motion com clareza." },
      { title: "Separe sujeito, ambiente e luz", description: "Uma estrutura clara costuma estabilizar melhor personagem e atmosfera." },
      { title: "Escolha a proporção com intenção", description: "16:9 funciona bem para cenas cinematográficas; 9:16 e 1:1 para formatos sociais." },
      { title: "Trave a seed quando achar uma boa direção", description: "Explore primeiro com aleatoriedade e depois troque para uma seed fixa para revisar com mais controle." },
    ],
    useCasesTitle: "Casos de uso",
    useCases: [
      { title: "Takes com clima cinematográfico", description: "Crie cenas de chuva, néon, moda, retrato e conceito visual apenas com texto." },
      { title: "Conceitos para vídeo social", description: "Gere vídeos curtos verticais ou quadrados para teasers, promos e capas animadas." },
      { title: "Referências para pitches criativos", description: "Transforme ideias escritas em referências em movimento para ads, tratamentos e clipes." },
      { title: "Exploração de direção", description: "Teste enquadramento, ritmo e atmosfera antes de partir para produção." },
    ],
    faqTitle: "Perguntas frequentes",
    faqDescription: "Perguntas comuns sobre Wan 2.7 texto para vídeo.",
    faq: [
      { question: "Quais parâmetros são suportados?", answer: "Esta página suporta prompt, negative prompt, áudio opcional, resolution, aspect ratio, duration, prompt expansion e seed." },
      { question: "Quais proporções estão disponíveis?", answer: "Atualmente suporta 16:9, 9:16, 1:1, 4:3 e 3:4." },
      { question: "Qual é a duração máxima?", answer: "O formulário atual suporta de 5 a 15 segundos, com 15 segundos como valor padrão." },
      { question: "O que significa seed = -1?", answer: "Significa geração aleatória. Use uma seed inteira fixa se quiser resultados mais reproduzíveis." },
    ],
    ctaTitle: "Comece a gerar vídeos com Wan 2.7",
    ctaDescription: "Abra o formulário do Wan 2.7 e veja como enquadramento, duração e expansão de prompt mudam os resultados.",
    ctaButton: "Testar Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Como gerar vídeos com Wan 2.7",
    howToDescription: "Gere vídeos de IA a partir de prompts de texto com Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Texto para Vídeo",
    featureList: ["IA texto para vídeo", "1080p e controle de proporção", "Áudio opcional e expansão de prompt"],
  },
  "ru-RU": {
    metaTitle: "Wan 2.7 Текст в видео - 1080p, 15 секунд и соотношение сторон | joymagic",
    metaDescription: "Создавайте видео из текста с Wan 2.7. Поддерживаются разрешение, соотношение сторон, длительность, расширение промпта, опциональный звук и seed.",
    metaKeywords: "Wan 2.7, текст в видео, ИИ генератор видео, 1080p, соотношение сторон, расширение промпта, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Текст в видео",
    heroDescription: "Wan 2.7 подходит для генерации видео по prompt. Вы можете описать сцену, добавить звук при необходимости, выбрать 720p или 1080p, изменить формат кадра, задать длительность до 15 секунд и использовать seed для более повторяемых результатов.",
    featuresTitle: "Почему Wan 2.7 для видео?",
    featuresDescription: "Практичный workflow text-to-video для кинематографичных prompt, гибкого кадрирования и контролируемых итераций.",
    features: [
      { title: "Вывод в 1080p", description: "720p подходит для быстрых тестов, а 1080p — для более чистого финального результата." },
      { title: "Контроль соотношения сторон", description: "Переключайтесь между 16:9, 9:16, 1:1, 4:3 и 3:4 для горизонтальных, вертикальных и соцсетевых форматов." },
      { title: "До 15 секунд", description: "Ползунок длительности позволяет пробовать и короткие лупы, и более длинные сценические моменты." },
      { title: "Расширение prompt и опциональный звук", description: "Модель может автоматически расширять короткие prompt, а при необходимости можно добавить аудиофайл." },
    ],
    tipsTitle: "Советы по prompt",
    tips: [
      { title: "Четко описывайте движение камеры", description: "Указывайте push-in, панораму, handheld, slow motion или статичную камеру как можно конкретнее." },
      { title: "Разделяйте объект, окружение и свет", description: "Четкая структура обычно лучше удерживает персонажа и атмосферу." },
      { title: "Осознанно выбирайте формат кадра", description: "16:9 хорошо подходит для киношных сцен, а 9:16 и 1:1 — для коротких соцсетевых видео." },
      { title: "Фиксируйте seed после удачного направления", description: "Сначала исследуйте случайно, затем переключайтесь на фиксированный seed для более контролируемых правок." },
    ],
    useCasesTitle: "Сценарии использования",
    useCases: [
      { title: "Кинематографичные mood shots", description: "Создавайте сцены дождя, неона, fashion, портреты и концепт-видео только из текста." },
      { title: "Концепты для соцсетей", description: "Делайте короткие вертикальные или квадратные видео для тизеров, промо и анимированных обложек." },
      { title: "Референсы для креативных питчей", description: "Преобразуйте текстовые идеи сцен в движущиеся референсы для рекламы, treatment и клипов." },
      { title: "Поиск визуального направления", description: "Тестируйте кадр, ритм и атмосферу до начала полноценного продакшена." },
    ],
    faqTitle: "Частые вопросы",
    faqDescription: "Частые вопросы о Wan 2.7 текст в видео.",
    faq: [
      { question: "Какие параметры поддерживаются?", answer: "Эта страница поддерживает prompt, negative prompt, опциональный audio, resolution, aspect ratio, duration, prompt expansion и seed." },
      { question: "Какие форматы кадра доступны?", answer: "Сейчас поддерживаются 16:9, 9:16, 1:1, 4:3 и 3:4." },
      { question: "Какова максимальная длительность видео?", answer: "Текущая форма поддерживает от 5 до 15 секунд, значение по умолчанию — 15 секунд." },
      { question: "Что означает seed = -1?", answer: "Это случайная генерация. Используйте фиксированный целый seed, если хотите более воспроизводимые результаты." },
    ],
    ctaTitle: "Начните генерировать видео с Wan 2.7",
    ctaDescription: "Откройте форму Wan 2.7 и проверьте, как кадрирование, длительность и расширение prompt меняют результат.",
    ctaButton: "Попробовать Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "Как генерировать видео с Wan 2.7",
    howToDescription: "Создавайте AI-видео из текстовых prompt с помощью Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Текст в видео",
    featureList: ["ИИ текст в видео", "1080p и соотношение сторон", "Опциональный звук и расширение prompt"],
  },
  "tr-TR": {
    metaTitle: "Wan 2.7 Metinden Videoya - 1080p, 15 saniye ve en-boy oranı | joymagic",
    metaDescription: "Wan 2.7 ile metinden video oluşturun. Çözünürlük, en-boy oranı, süre, prompt genişletme, isteğe bağlı ses ve seed kontrolü desteklenir.",
    metaKeywords: "Wan 2.7, metinden videoya, yapay zeka video oluşturucu, 1080p, en-boy oranı, prompt genişletme, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Metinden Videoya",
    heroDescription: "Wan 2.7, prompt odaklı video üretimi için uygundur. Bir sahne açıklaması yazabilir, isteğe bağlı ses ekleyebilir, 720p veya 1080p seçebilir, yaygın en-boy oranlarını değiştirebilir, 15 saniyeye kadar süre belirleyebilir ve daha tekrar edilebilir sonuçlar için seed kullanabilirsiniz.",
    featuresTitle: "Neden Wan 2.7 ile video üretmelisiniz?",
    featuresDescription: "Sinematik promptlar, esnek kadraj ve kontrollü yineleme için dengeli bir text-to-video akışı.",
    features: [
      { title: "1080p çıktı", description: "720p hızlı denemeler için, 1080p ise daha temiz final kareleri için uygundur." },
      { title: "En-boy oranı kontrolü", description: "16:9, 9:16, 1:1, 4:3 ve 3:4 arasında geçiş yaparak yatay, dikey veya sosyal formatları destekleyin." },
      { title: "15 saniyeye kadar", description: "Süre kaydırıcısıyla kısa döngüler veya biraz daha uzun sahneleri aynı formda deneyin." },
      { title: "Prompt genişletme ve isteğe bağlı ses", description: "Kısa promptları otomatik genişletebilir ve gerekirse ses dosyası ekleyebilirsiniz." },
    ],
    tipsTitle: "Prompt ipuçları",
    tips: [
      { title: "Kamera hareketini net yazın", description: "Push-in, pan, elde kamera hissi, ağır çekim veya sabit kamera gibi ayrıntıları açıkça belirtin." },
      { title: "Özne, ortam ve ışığı ayırın", description: "Açık bir yapı karakter kimliğini ve atmosferi daha stabil hale getirir." },
      { title: "En-boy oranını bilinçli seçin", description: "16:9 sinematik sahneler için; 9:16 ve 1:1 ise kısa sosyal video formatları için uygundur." },
      { title: "İyi yönü bulunca seed'i sabitleyin", description: "Önce rastgele keşfedin, sonra daha kontrollü revizyonlar için sabit seed kullanın." },
    ],
    useCasesTitle: "Kullanım alanları",
    useCases: [
      { title: "Sinematik atmosfer çekimleri", description: "Yağmur, neon, moda, portre ve konsept film sekanslarını yalnızca metinden üretin." },
      { title: "Sosyal video konseptleri", description: "Teaser, promo ve hareketli kapaklar için kısa dikey veya kare videolar oluşturun." },
      { title: "Yaratıcı pitch referansları", description: "Yazılı sahne fikirlerini reklam, treatment ve klipler için hareketli referanslara dönüştürün." },
      { title: "Yön keşfi", description: "Üretime geçmeden önce kadraj, tempo ve atmosferi test edin." },
    ],
    faqTitle: "Sık sorulan sorular",
    faqDescription: "Wan 2.7 metinden videoya hakkında sık sorulan sorular.",
    faq: [
      { question: "Hangi parametreler destekleniyor?", answer: "Bu sayfa prompt, negative prompt, isteğe bağlı audio, resolution, aspect ratio, duration, prompt expansion ve seed destekler." },
      { question: "Hangi en-boy oranları mevcut?", answer: "Şu anda 16:9, 9:16, 1:1, 4:3 ve 3:4 destekleniyor." },
      { question: "Video ne kadar uzun olabilir?", answer: "Geçerli form 5 ile 15 saniye arasını destekler ve varsayılan değer 15 saniyedir." },
      { question: "seed = -1 ne anlama gelir?", answer: "Rastgele üretim anlamına gelir. Daha tekrar üretilebilir sonuçlar için sabit bir tam sayı seed kullanın." },
    ],
    ctaTitle: "Wan 2.7 ile video üretmeye başlayın",
    ctaDescription: "Wan 2.7 formunu açın ve kadraj, süre ve prompt genişletmenin sonuçları nasıl değiştirdiğini görün.",
    ctaButton: "Wan 2.7'yi dene",
    breadcrumbModel: "Wan 2.7",
    howToName: "Wan 2.7 ile video nasıl üretilir",
    howToDescription: "Wan 2.7 ile metin promptlarından yapay zeka videoları üretin.",
    softwareName: "joymagic Wan 2.7 Metinden Videoya",
    featureList: ["Yapay zeka metinden videoya", "1080p ve en-boy oranı", "İsteğe bağlı ses ve prompt genişletme"],
  },
  "ps-AF": {
    metaTitle: "Wan 2.7 له متن څخه ویډیو - 1080p، 15 ثانیې او اړخ تناسب | joymagic",
    metaDescription: "د Wan 2.7 په مرسته له متن څخه ویډیو جوړه کړئ. ریزولوشن، اړخ تناسب، موده، prompt پراخول، اختیاري غږ او seed کنټرول ملاتړ کوي.",
    metaKeywords: "Wan 2.7, له متن څخه ویډیو, AI ویډیو جوړوونکی, 1080p, اړخ تناسب, prompt پراخول, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 له متن څخه ویډیو",
    heroDescription: "Wan 2.7 د prompt پر بنسټ د ویډیو جوړولو لپاره مناسب دی. تاسو کولی شئ د صحنې تشریح ولیکئ، اختیاري غږ ور اضافه کړئ، 720p یا 1080p وټاکئ، عام اړخ تناسب بدل کړئ، تر 15 ثانیو موده وټاکئ او د seed په مرسته پایلې لا ثابتې کړئ.",
    featuresTitle: "ولې Wan 2.7 د ویډیو لپاره؟",
    featuresDescription: "د سینمایي prompt، انعطاف منونکې کادر بندۍ او کنټرول شوې بیا تکرار لپاره یو عملي text-to-video بهیر.",
    features: [
      { title: "1080p محصول", description: "720p د چټکو ازموینو لپاره ښه دی او 1080p د پاکو وروستیو فریمونو لپاره مناسب دی." },
      { title: "د اړخ تناسب کنټرول", description: "د 16:9، 9:16، 1:1، 4:3 او 3:4 ترمنځ بدلون وکړئ تر څو افقي، عمودي او ټولنیز formatونه برابر کړئ." },
      { title: "تر 15 ثانیو پورې", description: "د مودې slider په کارولو سره لنډ loop او تر هغه لږ اوږدې صحنې وازمویئ." },
      { title: "Prompt پراخول او اختیاري غږ", description: "لنډ prompt په اوتومات ډول پراخېږي او که اړتیا وي غږ هم ور اضافه کولی شئ." },
    ],
    tipsTitle: "د prompt سپارښتنې",
    tips: [
      { title: "د کمرې حرکت روښانه ولیکئ", description: "Push-in، pan، لاسي کمره، slow motion او ثابت کمره په واضحو ټکو ولیکئ." },
      { title: "موضوع، چاپېریال او رڼا جلا ولیکئ", description: "روښانه جوړښت اکثره د کرکټر هویت او فضا ښه ثابتوي." },
      { title: "اړخ تناسب په قصد وټاکئ", description: "16:9 د سینمایي صحنو لپاره ښه دی، 9:16 او 1:1 د لنډو ټولنیزو ویډیوګانو لپاره." },
      { title: "کله چې ښه لوری ومومئ، seed ثابت کړئ", description: "لومړی تصادفي سپړنه وکړئ، بیا د لا کنټرول شوې بیاکتنې لپاره ثابت seed وکاروئ." },
    ],
    useCasesTitle: "د کارونې بېلګې",
    useCases: [
      { title: "سینمایي فضا لرونکي شاټونه", description: "د باران، نیون، فېشن، پرتره او مفهومي فلم صحنې یوازې له متن څخه جوړې کړئ." },
      { title: "د ټولنیزو ویډیوګانو مفکورې", description: "د teaser، promo او متحرک cover لپاره لنډې عمودي یا مربع ویډیوګانې جوړې کړئ." },
      { title: "د خلاق pitch مرجع", description: "لیکل شوې صحنې په متحرکو مراجعو بدلې کړئ چې د اعلان، treatment او میوزیک ویډیو لپاره ګټور وي." },
      { title: "د لوري سپړنه", description: "له اصلي تولید مخکې کادر، tempo او فضا وازمویئ." },
    ],
    faqTitle: "عامې پوښتنې",
    faqDescription: "د Wan 2.7 له متن څخه ویډیو په اړه عامې پوښتنې.",
    faq: [
      { question: "کوم پارامیټرونه ملاتړ کېږي؟", answer: "دا پاڼه prompt، negative prompt، اختیاري audio، resolution، aspect ratio، duration، prompt expansion او seed ملاتړ کوي." },
      { question: "کوم اړخ تناسبونه شته؟", answer: "اوس مهال 16:9، 9:16، 1:1، 4:3 او 3:4 ملاتړ کېږي." },
      { question: "ویډیو تر څو ثانیو پورې کېدای شي؟", answer: "اوسنی فورم له 5 تر 15 ثانیو پورې ملاتړ کوي او ډیفالټ 15 ثانیې دي." },
      { question: "seed = -1 څه معنی لري؟", answer: "یعنې تصادفي تولید. که لا ډېر بیا تولیدېدونکي نتایج غواړئ، ثابت صحیح seed وکاروئ." },
    ],
    ctaTitle: "له Wan 2.7 سره د ویډیو جوړول پیل کړئ",
    ctaDescription: "د Wan 2.7 فورم پرانیزئ او وګورئ چې کادر، موده او prompt پراخول څنګه پایلې بدلوي.",
    ctaButton: "Wan 2.7 وازمویه",
    breadcrumbModel: "Wan 2.7",
    howToName: "په Wan 2.7 سره ویډیو څنګه جوړه کړو",
    howToDescription: "په Wan 2.7 سره د متن prompt څخه AI ویډیو جوړه کړئ.",
    softwareName: "joymagic Wan 2.7 له متن څخه ویډیو",
    featureList: ["AI له متن څخه ویډیو", "1080p او اړخ تناسب", "اختیاري غږ او prompt پراخول"],
  },
};

textToVideoCopy["en-IN"] = textToVideoCopy.en;
textToVideoCopy["zh-hk"] = textToVideoCopy["zh-Hant-TW"];

export function getWan27TextToVideoPageCopy(locale: string): Wan27TextToVideoPageCopy {
  return textToVideoCopy[locale] || textToVideoCopy.en;
}

export function getWan27TextToVideoHowToSteps(locale: string) {
  const steps: Record<string, Array<{ name: string; text: string }>> = {
    en: [
      { name: "Write the scene prompt", text: "Describe subject, environment, motion, lighting, and camera movement clearly." },
      { name: "Set video controls", text: "Choose resolution, aspect ratio, duration, prompt expansion, and seed. Add audio if needed." },
      { name: "Generate and refine", text: "Run the model, review the motion, and iterate on framing or pacing until it feels right." },
    ],
    "en-IN": [
      { name: "Write the scene prompt", text: "Describe subject, environment, motion, lighting, and camera movement clearly." },
      { name: "Set video controls", text: "Choose resolution, aspect ratio, duration, prompt expansion, and seed. Add audio if needed." },
      { name: "Generate and refine", text: "Run the model, review the motion, and iterate on framing or pacing until it feels right." },
    ],
    zh: [
      { name: "填写场景提示词", text: "清楚描述主体、环境、运动、光线和镜头运动。" },
      { name: "设置视频参数", text: "选择分辨率、宽高比、时长、提示词扩写和 seed，需要时可附加音频。" },
      { name: "生成并继续微调", text: "生成后查看运动效果，再根据构图和节奏继续优化。" },
    ],
    "zh-Hant-TW": [
      { name: "填寫場景提示詞", text: "清楚描述主體、環境、運動、光線與鏡頭運動。" },
      { name: "設定影片參數", text: "選擇解析度、畫面比例、時長、提示詞擴寫與 seed，需要時可附加音訊。" },
      { name: "生成並持續微調", text: "生成後查看運動效果，再依照構圖與節奏持續優化。" },
    ],
    "zh-hk": [
      { name: "填寫場景提示詞", text: "清楚描述主體、環境、運動、光線與鏡頭運動。" },
      { name: "設定影片參數", text: "選擇解析度、畫面比例、時長、提示詞擴寫與 seed，需要時可附加音訊。" },
      { name: "生成並持續微調", text: "生成後查看運動效果，再依照構圖與節奏持續優化。" },
    ],
    "de-DE": [
      { name: "Szenen-Prompt schreiben", text: "Beschreiben Sie Motiv, Umgebung, Bewegung, Licht und Kameraführung möglichst klar." },
      { name: "Videoparameter festlegen", text: "Wählen Sie Auflösung, Seitenverhältnis, Dauer, Prompt-Erweiterung und Seed. Fügen Sie bei Bedarf Audio hinzu." },
      { name: "Generieren und verfeinern", text: "Starten Sie das Modell, prüfen Sie die Bewegung und justieren Sie Bildausschnitt oder Tempo weiter." },
    ],
    "ko-KR": [
      { name: "장면 프롬프트 작성", text: "주제, 환경, 움직임, 조명, 카메라 움직임을 분명하게 적으세요." },
      { name: "영상 파라미터 설정", text: "해상도, 화면비, 길이, 프롬프트 확장, seed를 고르고 필요하면 오디오를 추가하세요." },
      { name: "생성 후 다듬기", text: "모델을 실행하고 움직임을 확인한 뒤 프레이밍과 속도감을 계속 조정하세요." },
    ],
    "ja-JP": [
      { name: "シーンの prompt を書く", text: "被写体、環境、動き、光、カメラワークをできるだけ明確に書きます。" },
      { name: "動画パラメータを設定", text: "解像度、アスペクト比、長さ、プロンプト拡張、seed を選び、必要なら音声を追加します。" },
      { name: "生成して調整", text: "モデルを実行し、動きを確認しながら構図やテンポを整えます。" },
    ],
    "es-ES": [
      { name: "Escribe el prompt de la escena", text: "Describe con claridad sujeto, entorno, movimiento, luz y movimiento de cámara." },
      { name: "Ajusta los controles del video", text: "Elige resolución, relación de aspecto, duración, expansión de prompt y seed. Añade audio si lo necesitas." },
      { name: "Genera y refina", text: "Ejecuta el modelo, revisa el movimiento y ajusta encuadre o ritmo hasta que funcione." },
    ],
    "it-IT": [
      { name: "Scrivi il prompt della scena", text: "Descrivi in modo chiaro soggetto, ambiente, movimento, luce e camera movement." },
      { name: "Imposta i controlli video", text: "Scegli risoluzione, rapporto d'aspetto, durata, espansione del prompt e seed. Aggiungi audio se serve." },
      { name: "Genera e rifinisci", text: "Esegui il modello, controlla il movimento e continua a regolare inquadratura o ritmo." },
    ],
    "pt-BR": [
      { name: "Escreva o prompt da cena", text: "Descreva com clareza assunto, ambiente, movimento, iluminação e movimento de câmera." },
      { name: "Defina os controles do vídeo", text: "Escolha resolução, proporção, duração, expansão de prompt e seed. Adicione áudio se precisar." },
      { name: "Gere e refine", text: "Execute o modelo, revise o movimento e ajuste enquadramento ou ritmo até ficar bom." },
    ],
    "ru-RU": [
      { name: "Напишите prompt сцены", text: "Четко опишите объект, окружение, движение, свет и работу камеры." },
      { name: "Настройте параметры видео", text: "Выберите разрешение, формат кадра, длительность, расширение prompt и seed. При необходимости добавьте звук." },
      { name: "Сгенерируйте и доработайте", text: "Запустите модель, оцените движение и продолжайте настраивать кадр и темп." },
    ],
    "tr-TR": [
      { name: "Sahne promptunu yazın", text: "Özne, ortam, hareket, ışık ve kamera hareketini açıkça tanımlayın." },
      { name: "Video kontrollerini ayarlayın", text: "Çözünürlük, en-boy oranı, süre, prompt genişletme ve seed seçin. Gerekirse ses ekleyin." },
      { name: "Üretin ve iyileştirin", text: "Modeli çalıştırın, hareketi inceleyin ve kadraj ya da ritmi geliştirmeye devam edin." },
    ],
    "ps-AF": [
      { name: "د صحنې prompt ولیکئ", text: "موضوع، چاپېریال، حرکت، رڼا او د کمرې حرکت په روښانه ډول تشریح کړئ." },
      { name: "د ویډیو کنټرولونه وټاکئ", text: "ریزولوشن، اړخ تناسب، موده، prompt پراخول او seed وټاکئ. که اړتیا وي غږ هم اضافه کړئ." },
      { name: "جوړ کړئ او ښه یې کړئ", text: "ماډل وچلوئ، حرکت وګورئ او بیا د کادر یا tempo اصلاح ته دوام ورکړئ." },
    ],
  };

  return steps[locale] || steps.en;
}

type Wan27ImageToVideoPageCopy = {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  heroTitle: string;
  heroDescription: string;
  featuresTitle: string;
  featuresDescription: string;
  features: FeatureItem[];
  tipsTitle: string;
  tips: FeatureItem[];
  useCasesTitle: string;
  useCases: FeatureItem[];
  faqTitle: string;
  faqDescription: string;
  faq: FAQItem[];
  ctaTitle: string;
  ctaDescription: string;
  ctaButton: string;
  breadcrumbModel: string;
  howToName: string;
  howToDescription: string;
  softwareName: string;
  featureList: string[];
};

const imageToVideoCopy: Record<string, Wan27ImageToVideoPageCopy> = {
  en: {
    metaTitle: "Wan 2.7 Image to Video - Start Frame, End Frame, Audio | joymagic",
    metaDescription:
      "Animate images with Wan 2.7 image to video. Upload a start image, optional end frame and audio, then control resolution, duration, prompt expansion, and seed.",
    metaKeywords:
      "Wan 2.7, image to video, AI video generator, last frame, start frame, optional audio, seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Image to Video",
    heroDescription:
      "Wan 2.7 image-to-video helps you turn a still image into a directed short clip. Upload the first image, optionally add a last image to define where the motion should land, attach audio if needed, and control resolution, duration, prompt expansion, and seed from one creator form.",
    featuresTitle: "Why use Wan 2.7 for image-to-video?",
    featuresDescription:
      "A practical image-to-video workflow for guided motion, optional end-frame control, and repeatable iteration.",
    features: [
      { title: "Start frame and optional last frame", description: "Use one image to animate, or add an end frame to guide how the shot should resolve." },
      { title: "Optional audio track", description: "Attach an audio file when you want motion and pacing to be planned around a sound reference." },
      { title: "Resolution and duration control", description: "Choose 720p or 1080p and set clip length from 5 to 15 seconds in the same form." },
      { title: "Prompt expansion and seed", description: "Expand short prompts automatically and keep a seed when you want more stable revisions." },
    ],
    tipsTitle: "Prompt tips",
    tips: [
      { title: "Describe motion, not just appearance", description: "Explain how the subject should move, how the camera should behave, and how the scene should feel over time." },
      { title: "Use last frame when the ending matters", description: "An end frame is especially useful for transitions, reveal shots, and landing on a specific pose or composition." },
      { title: "Keep prompts focused", description: "Clear instructions around subject, background, and camera movement usually lead to cleaner animation." },
      { title: "Lock the seed for revisions", description: "After finding a good direction, keep the seed fixed and refine the motion or atmosphere more predictably." },
    ],
    useCasesTitle: "Best use cases",
    useCases: [
      { title: "Photo animation", description: "Turn a portrait, product image, or scene still into a short motion clip." },
      { title: "First-frame to last-frame transitions", description: "Guide a clip from one composition into a target ending image." },
      { title: "Social and promo loops", description: "Create short, directed image-led videos for reels, covers, and promo teasers." },
      { title: "Creative previsualization", description: "Test motion ideas before investing in a full production workflow." },
    ],
    faqTitle: "Frequently asked questions",
    faqDescription: "Common questions about Wan 2.7 image to video.",
    faq: [
      { question: "Which parameters are supported?", answer: "This page supports image, prompt, optional last image, optional audio, negative prompt, resolution, duration, prompt expansion, and seed." },
      { question: "Is the last image required?", answer: "No. The first image is required, while the last image is optional and only used when you want to guide the ending frame." },
      { question: "What output settings are available?", answer: "The current form supports 720p or 1080p output and durations from 5 to 15 seconds." },
      { question: "What does seed = -1 mean?", answer: "A seed of -1 means random generation. Use a fixed integer if you want more reproducible outputs." },
    ],
    ctaTitle: "Start animating with Wan 2.7",
    ctaDescription:
      "Upload a frame, describe the motion, and test how Wan 2.7 image-to-video behaves with optional end frames and audio.",
    ctaButton: "Try Wan 2.7 now",
    breadcrumbModel: "Wan 2.7",
    howToName: "How to create videos from images with Wan 2.7",
    howToDescription: "Generate AI videos from uploaded images using Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Image to Video",
    featureList: ["AI image-to-video generation", "Optional last-frame guidance", "Optional audio and seed control"],
  },
  "en-IN": {} as Wan27ImageToVideoPageCopy,
  zh: {
    metaTitle: "Wan 2.7 图片生成视频 - 首帧、尾帧与音频控制 | joymagic",
    metaDescription:
      "使用 Wan 2.7 图生视频。上传首帧图，可选尾帧图和音频，并控制分辨率、时长、提示词扩写和 seed。",
    metaKeywords:
      "Wan 2.7, 图片生成视频, AI 视频生成, 尾帧图, 首帧图, 可选音频, seed, 阿里云",
    heroTitle: "Wan 2.7 图片生成视频",
    heroDescription:
      "Wan 2.7 image-to-video 可以把静态图片转成更可控的短视频。你可以上传首帧图，按需添加尾帧图来约束结尾画面，也可以附加音频，然后在同一个 Creator 表单中控制分辨率、时长、提示词扩写和 seed。",
    featuresTitle: "为什么使用 Wan 2.7 图生视频？",
    featuresDescription:
      "面向可控运动、可选尾帧引导和稳定迭代的实用型 image-to-video 工作流。",
    features: [
      { title: "首帧图与可选尾帧图", description: "既可以只上传一张图做动画，也可以额外上传尾帧图来限制镜头最后落点。" },
      { title: "可选音频轨道", description: "需要按声音节奏规划运动时，可以附加一段音频作为参考。" },
      { title: "分辨率与时长控制", description: "支持 720p / 1080p，以及 5 到 15 秒的时长设置。" },
      { title: "提示词扩写与 seed", description: "可自动扩写短 prompt，也可以通过 seed 让多轮修改更稳定。" },
    ],
    tipsTitle: "提示词建议",
    tips: [
      { title: "重点描述运动，不只写内容", description: "除了主体和场景，还要写清楚主体怎么动、镜头怎么动、情绪如何变化。" },
      { title: "需要明确结尾时再加尾帧图", description: "尾帧图特别适合转场、揭示镜头和落到指定姿态或构图的场景。" },
      { title: "提示词保持聚焦", description: "围绕主体、背景和镜头运动写清楚，通常会得到更干净的动画结果。" },
      { title: "需要连续微调时固定 seed", description: "找到满意方向后锁定 seed，再持续微调运动和氛围会更稳定。" },
    ],
    useCasesTitle: "适合场景",
    useCases: [
      { title: "照片动效", description: "把人物照、产品图或场景静帧转成短视频镜头。" },
      { title: "首帧到尾帧转场", description: "让视频从一张构图平滑过渡到目标结尾画面。" },
      { title: "社媒和 promo 短视频", description: "快速制作以图片为核心的 reels、封面动态和 promo teaser。" },
      { title: "创意预演", description: "在进入正式制作前先测试镜头运动和叙事节奏。" },
    ],
    faqTitle: "常见问题",
    faqDescription: "关于 Wan 2.7 图片生成视频的常见问题。",
    faq: [
      { question: "支持哪些参数？", answer: "当前页面支持 image、prompt、可选 last image、可选 audio、negative prompt、resolution、duration、prompt expansion 和 seed。" },
      { question: "尾帧图是必须的吗？", answer: "不是。首帧图必填，尾帧图可选，只在你需要约束结尾画面时使用。" },
      { question: "支持哪些输出设置？", answer: "当前支持 720p 或 1080p 输出，以及 5 到 15 秒时长。" },
      { question: "seed = -1 是什么意思？", answer: "表示随机生成。如果想让结果更容易复现，请改成固定整数。" },
    ],
    ctaTitle: "开始用 Wan 2.7 做图生视频",
    ctaDescription:
      "上传首帧图、描述运动方式，直接测试 Wan 2.7 在可选尾帧和音频引导下的图生视频效果。",
    ctaButton: "立即体验 Wan 2.7",
    breadcrumbModel: "Wan 2.7",
    howToName: "如何使用 Wan 2.7 生成图生视频",
    howToDescription: "使用 Wan 2.7 根据上传图片生成 AI 视频。",
    softwareName: "joymagic Wan 2.7 图片生成视频",
    featureList: ["AI 图片生成视频", "可选尾帧引导", "可选音频与 seed 控制"],
  },
  "zh-Hant-TW": {} as Wan27ImageToVideoPageCopy,
  "zh-hk": {} as Wan27ImageToVideoPageCopy,
  "de-DE": {
    metaTitle: "Wan 2.7 Bild zu Video - Startbild, Endbild und Audio | joymagic",
    metaDescription:
      "Animieren Sie Bilder mit Wan 2.7 Bild-zu-Video. Laden Sie ein Startbild, optional ein Endbild und Audio hoch und steuern Sie Auflösung, Dauer, Prompt-Erweiterung und Seed.",
    metaKeywords:
      "Wan 2.7, Bild zu Video, KI Videogenerator, Endbild, Startbild, optionales Audio, Seed, Alibaba Cloud",
    heroTitle: "Wan 2.7 Bild zu Video",
    heroDescription:
      "Wan 2.7 image-to-video verwandelt ein statisches Bild in einen gezielten kurzen Clip. Laden Sie das Startbild hoch, fügen Sie bei Bedarf ein Endbild zur Steuerung des Abschlusses hinzu, ergänzen Sie optional Audio und kontrollieren Sie Auflösung, Dauer, Prompt-Erweiterung und Seed in einem Formular.",
    featuresTitle: "Warum Wan 2.7 für Bild-zu-Video?",
    featuresDescription:
      "Ein praktischer Workflow für gesteuerte Bewegung, optionale Endbild-Vorgabe und reproduzierbare Iteration.",
    features: [
      { title: "Startbild und optionales Endbild", description: "Animieren Sie ein einzelnes Bild oder definieren Sie mit einem Endbild, wo der Shot landen soll." },
      { title: "Optionales Audio", description: "Fügen Sie Audio hinzu, wenn Bewegung und Timing an einer Tonreferenz ausgerichtet werden sollen." },
      { title: "Auflösung und Dauer", description: "Wählen Sie 720p oder 1080p und setzen Sie die Cliplänge zwischen 5 und 15 Sekunden." },
      { title: "Prompt-Erweiterung und Seed", description: "Erweitern Sie kurze Prompts automatisch und behalten Sie für stabilere Revisionen einen Seed bei." },
    ],
    tipsTitle: "Prompt-Tipps",
    tips: [
      { title: "Bewegung statt nur Inhalt beschreiben", description: "Erklären Sie nicht nur das Motiv, sondern auch Bewegung, Kameraverhalten und Stimmungsverlauf." },
      { title: "Endbild nutzen, wenn das Ende wichtig ist", description: "Ein Endbild hilft besonders bei Übergängen, Reveal-Shots und definierten Endposen." },
      { title: "Prompts fokussiert halten", description: "Klare Anweisungen zu Motiv, Hintergrund und Kamerabewegung führen oft zu saubereren Animationen." },
      { title: "Seed für Revisionen fixieren", description: "Nach einer guten Richtung den Seed beibehalten und Bewegung oder Atmosphäre gezielt verfeinern." },
    ],
    useCasesTitle: "Typische Einsatzfälle",
    useCases: [
      { title: "Fotoanimation", description: "Verwandeln Sie Porträts, Produktbilder oder Szenenstills in kurze Bewegtbild-Clips." },
      { title: "Übergänge vom Start- zum Endbild", description: "Führen Sie einen Clip von einer Ausgangskomposition zu einem gezielten Endbild." },
      { title: "Social- und Promo-Loops", description: "Erstellen Sie kurze, bildgeführte Videos für Reels, Cover und Teaser." },
      { title: "Kreative Previsualisierung", description: "Testen Sie Bewegungsideen, bevor Sie in eine vollständige Produktion investieren." },
    ],
    faqTitle: "Häufige Fragen",
    faqDescription: "Häufige Fragen zu Wan 2.7 Bild-zu-Video.",
    faq: [
      { question: "Welche Parameter werden unterstützt?", answer: "Diese Seite unterstützt image, prompt, optionales last image, optionales audio, negative prompt, resolution, duration, prompt expansion und seed." },
      { question: "Ist das Endbild erforderlich?", answer: "Nein. Das erste Bild ist erforderlich, das Endbild ist optional und wird nur genutzt, wenn Sie das letzte Frame steuern möchten." },
      { question: "Welche Ausgabeoptionen gibt es?", answer: "Aktuell werden 720p oder 1080p sowie Dauern von 5 bis 15 Sekunden unterstützt." },
      { question: "Was bedeutet seed = -1?", answer: "Ein Seed von -1 bedeutet zufällige Generierung. Für reproduzierbarere Ergebnisse verwenden Sie einen festen ganzzahligen Seed." },
    ],
    ctaTitle: "Mit Wan 2.7 Bilder animieren",
    ctaDescription:
      "Laden Sie ein Frame hoch, beschreiben Sie die Bewegung und testen Sie Wan 2.7 mit optionalem Endbild und Audio.",
    ctaButton: "Wan 2.7 testen",
    breadcrumbModel: "Wan 2.7",
    howToName: "So erstellen Sie Videos aus Bildern mit Wan 2.7",
    howToDescription: "Erzeugen Sie KI-Videos aus hochgeladenen Bildern mit Wan 2.7.",
    softwareName: "joymagic Wan 2.7 Bild zu Video",
    featureList: ["KI Bild-zu-Video", "Optionale Endbild-Vorgabe", "Optionales Audio und Seed-Kontrolle"],
  },
};

imageToVideoCopy["en-IN"] = imageToVideoCopy.en;
imageToVideoCopy["zh-Hant-TW"] = {
  ...imageToVideoCopy.zh,
  metaTitle: "Wan 2.7 圖片生成影片 - 首幀、尾幀與音訊控制 | joymagic",
  metaDescription: "使用 Wan 2.7 圖生影片。上傳首幀圖、可選尾幀圖與音訊，並控制解析度、時長、提示詞擴寫與 seed。",
  metaKeywords: "Wan 2.7, 圖片生成影片, AI 影片生成, 尾幀圖, 首幀圖, 可選音訊, seed, 阿里雲",
  heroTitle: "Wan 2.7 圖片生成影片",
  heroDescription: "Wan 2.7 image-to-video 可以把靜態圖片轉成更可控的短影片。你可以上傳首幀圖，按需加入尾幀圖來約束結尾畫面，也可以附加音訊，然後在同一個 Creator 表單中控制解析度、時長、提示詞擴寫與 seed。",
  featuresTitle: "為什麼使用 Wan 2.7 圖生影片？",
  featuresDescription: "面向可控運動、可選尾幀引導與穩定迭代的實用型 image-to-video 工作流。",
  features: [
    { title: "首幀圖與可選尾幀圖", description: "既可以只上傳一張圖做動畫，也可以額外上傳尾幀圖來限制鏡頭最後落點。" },
    { title: "可選音訊軌道", description: "需要依照聲音節奏規劃運動時，可以附加一段音訊作為參考。" },
    { title: "解析度與時長控制", description: "支援 720p / 1080p，以及 5 到 15 秒的時長設定。" },
    { title: "提示詞擴寫與 seed", description: "可自動擴寫短 prompt，也可以透過 seed 讓多輪修改更穩定。" },
  ],
  tipsTitle: "提示詞建議",
  tips: [
    { title: "重點描述運動，不只寫內容", description: "除了主體和場景，也要寫清楚主體怎麼動、鏡頭怎麼動、情緒如何變化。" },
    { title: "需要明確結尾時再加尾幀圖", description: "尾幀圖特別適合轉場、揭示鏡頭和落到指定姿態或構圖的場景。" },
    { title: "提示詞保持聚焦", description: "圍繞主體、背景和鏡頭運動寫清楚，通常會得到更乾淨的動畫結果。" },
    { title: "需要連續微調時固定 seed", description: "找到滿意方向後鎖定 seed，再持續微調運動和氛圍會更穩定。" },
  ],
  useCasesTitle: "適合場景",
  useCases: [
    { title: "照片動效", description: "把人物照、產品圖或場景靜幀轉成短影片鏡頭。" },
    { title: "首幀到尾幀轉場", description: "讓影片從一張構圖平滑過渡到目標結尾畫面。" },
    { title: "社群與宣傳短片", description: "快速製作以圖片為核心的 reels、封面動態和 promo teaser。" },
    { title: "創意預演", description: "在進入正式製作前先測試鏡頭運動和敘事節奏。" },
  ],
  faqTitle: "常見問題",
  faqDescription: "關於 Wan 2.7 圖片生成影片的常見問題。",
  faq: [
    { question: "支援哪些參數？", answer: "目前頁面支援 image、prompt、可選 last image、可選 audio、negative prompt、resolution、duration、prompt expansion 和 seed。" },
    { question: "尾幀圖是必填嗎？", answer: "不是。首幀圖必填，尾幀圖可選，只有在你需要約束結尾畫面時才需要使用。" },
    { question: "支援哪些輸出設定？", answer: "目前支援 720p 或 1080p 輸出，以及 5 到 15 秒的時長。" },
    { question: "seed = -1 是什麼意思？", answer: "表示隨機生成。如果想讓結果更容易重現，請改成固定整數。" },
  ],
  ctaTitle: "開始用 Wan 2.7 做圖生影片",
  ctaDescription: "上傳首幀圖、描述運動方式，直接測試 Wan 2.7 在可選尾幀與音訊引導下的圖生影片效果。",
  ctaButton: "立即體驗 Wan 2.7",
  howToName: "如何使用 Wan 2.7 生成圖生影片",
  howToDescription: "使用 Wan 2.7 根據上傳圖片生成 AI 影片。",
  softwareName: "joymagic Wan 2.7 圖片生成影片",
  featureList: ["AI 圖片生成影片", "可選尾幀引導", "可選音訊與 seed 控制"],
};
imageToVideoCopy["zh-hk"] = imageToVideoCopy["zh-Hant-TW"];
imageToVideoCopy["ko-KR"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 이미지 투 비디오 - 시작 프레임, 마지막 프레임, 오디오 | joymagic",
  metaDescription: "Wan 2.7로 이미지를 영상으로 애니메이션하세요. 시작 이미지와 선택형 마지막 프레임, 오디오를 업로드하고 해상도, 길이, 프롬프트 확장, seed를 제어할 수 있습니다.",
  metaKeywords: "Wan 2.7, 이미지 투 비디오, AI 비디오 생성기, 마지막 프레임, 시작 프레임, 오디오, seed, 알리바바 클라우드",
  heroTitle: "Wan 2.7 이미지 투 비디오",
  heroDescription: "Wan 2.7 image-to-video는 정적인 이미지를 더 정교하게 제어되는 짧은 영상으로 바꿔줍니다. 시작 이미지를 업로드하고, 필요하면 마지막 이미지를 추가해 결말 프레임을 유도하고, 오디오를 붙인 뒤 하나의 Creator 폼에서 해상도, 길이, 프롬프트 확장, seed를 함께 조정할 수 있습니다.",
  featuresTitle: "왜 Wan 2.7 이미지 투 비디오를 사용할까요?",
  featuresDescription: "제어 가능한 움직임, 선택형 마지막 프레임 가이드, 안정적인 반복 수정을 위한 실용적인 image-to-video 워크플로입니다.",
  features: [
    { title: "시작 프레임과 선택형 마지막 프레임", description: "한 장의 이미지만으로 애니메이션할 수도 있고, 마지막 프레임 이미지를 추가해 샷의 끝 구도를 유도할 수도 있습니다." },
    { title: "선택형 오디오 트랙", description: "사운드 기준에 맞춰 움직임과 페이싱을 설계하고 싶을 때 오디오 파일을 첨부할 수 있습니다." },
    { title: "해상도와 길이 제어", description: "같은 폼에서 720p 또는 1080p를 선택하고 5초에서 15초까지 길이를 설정할 수 있습니다." },
    { title: "프롬프트 확장과 seed", description: "짧은 프롬프트를 자동으로 확장하고, 더 안정적인 수정이 필요할 때 seed를 유지할 수 있습니다." },
  ],
  tipsTitle: "프롬프트 팁",
  tips: [
    { title: "외형보다 움직임을 설명하세요", description: "피사체가 어떻게 움직이는지, 카메라가 어떻게 반응하는지, 장면 분위기가 시간에 따라 어떻게 변하는지 적어주세요." },
    { title: "끝 장면이 중요할 때만 마지막 프레임을 사용하세요", description: "마지막 프레임은 전환, 리빌 샷, 특정 포즈나 구도로 마무리해야 하는 장면에 특히 유용합니다." },
    { title: "프롬프트는 집중도 있게 유지하세요", description: "주제, 배경, 카메라 움직임에 대한 명확한 지시가 더 깔끔한 애니메이션으로 이어지는 경우가 많습니다." },
    { title: "수정 단계에서는 seed를 고정하세요", description: "좋은 방향을 찾은 뒤 seed를 고정하면 움직임과 분위기를 더 예측 가능하게 다듬을 수 있습니다." },
  ],
  useCasesTitle: "잘 맞는 활용 사례",
  useCases: [
    { title: "사진 애니메이션", description: "인물 사진, 제품 이미지, 장면 스틸을 짧은 모션 클립으로 바꿉니다." },
    { title: "첫 프레임에서 마지막 프레임으로의 전환", description: "하나의 구도에서 목표 결말 이미지로 이어지는 영상을 유도합니다." },
    { title: "소셜 및 프로모션 루프", description: "릴스, 커버, 프로모 티저용 짧고 지시형의 이미지 중심 영상을 빠르게 제작할 수 있습니다." },
    { title: "크리에이티브 프리비주얼", description: "본격 제작에 들어가기 전에 모션 아이디어를 미리 시험해볼 수 있습니다." },
  ],
  faqTitle: "자주 묻는 질문",
  faqDescription: "Wan 2.7 이미지 투 비디오에 대한 자주 묻는 질문입니다.",
  faq: [
    { question: "어떤 파라미터를 지원하나요?", answer: "이 페이지는 image, prompt, 선택형 last image, 선택형 audio, negative prompt, resolution, duration, prompt expansion, seed를 지원합니다." },
    { question: "마지막 이미지는 필수인가요?", answer: "아닙니다. 시작 이미지는 필수이고, 마지막 이미지는 결말 프레임을 유도하고 싶을 때만 사용하는 선택 항목입니다." },
    { question: "어떤 출력 설정을 사용할 수 있나요?", answer: "현재 720p 또는 1080p 출력과 5초에서 15초까지의 길이를 지원합니다." },
    { question: "seed = -1은 무엇을 뜻하나요?", answer: "seed가 -1이면 무작위 생성입니다. 더 재현 가능한 결과가 필요하면 고정된 정수를 사용하세요." },
  ],
  ctaTitle: "Wan 2.7로 이미지 애니메이션 시작하기",
  ctaDescription: "프레임을 업로드하고 움직임을 설명한 뒤, 선택형 마지막 프레임과 오디오를 포함한 Wan 2.7 image-to-video를 테스트해보세요.",
  ctaButton: "지금 Wan 2.7 사용해보기",
  breadcrumbModel: "Wan 2.7",
  howToName: "Wan 2.7로 이미지에서 영상을 만드는 방법",
  howToDescription: "Wan 2.7으로 업로드한 이미지에서 AI 영상을 생성합니다.",
  softwareName: "joymagic Wan 2.7 이미지 투 비디오",
  featureList: ["AI 이미지 투 비디오 생성", "선택형 마지막 프레임 가이드", "선택형 오디오 및 seed 제어"],
};
imageToVideoCopy["ja-JP"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 画像から動画 - 開始フレーム、終了フレーム、音声 | joymagic",
  metaDescription: "Wan 2.7 で画像を動画化。開始画像、任意の終了画像と音声をアップロードし、解像度、長さ、プロンプト拡張、seed を制御できます。",
  metaKeywords: "Wan 2.7, 画像から動画, AI動画生成, 終了フレーム, 開始フレーム, 音声, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 画像から動画",
  heroDescription: "Wan 2.7 image-to-video は、静止画をよりコントロールしやすい短い動画に変換します。開始画像をアップロードし、必要に応じて終了画像で着地点を指定し、音声も追加したうえで、1つの Creator フォームから解像度、長さ、プロンプト拡張、seed を調整できます。",
  featuresTitle: "Wan 2.7 を画像から動画に使う理由",
  featuresDescription: "動きの制御、任意の終了フレーム指定、安定した反復調整に向いた実用的な image-to-video ワークフローです。",
  features: [
    { title: "開始フレームと任意の終了フレーム", description: "1枚の画像だけで動かすことも、終了画像を追加してショットの着地点を誘導することもできます。" },
    { title: "任意の音声トラック", description: "音のリファレンスに合わせて動きやテンポを設計したいときに音声ファイルを追加できます。" },
    { title: "解像度と尺の調整", description: "同じフォームで 720p または 1080p を選び、尺を 5 秒から 15 秒まで設定できます。" },
    { title: "プロンプト拡張と seed", description: "短いプロンプトを自動で拡張し、より安定した修正のために seed を保持できます。" },
  ],
  tipsTitle: "プロンプトのコツ",
  tips: [
    { title: "見た目だけでなく動きを書く", description: "被写体の動き、カメラの挙動、時間経過での雰囲気の変化まで説明してください。" },
    { title: "終わり方が重要なときだけ終了フレームを使う", description: "終了フレームは、トランジション、リビールショット、特定のポーズや構図で終えたい場面に特に有効です。" },
    { title: "プロンプトは絞って書く", description: "主題、背景、カメラ移動について明確に書くほど、よりクリーンなアニメーションになりやすいです。" },
    { title: "調整時は seed を固定する", description: "良い方向性が見つかったら seed を固定し、動きや空気感を予測しやすく調整しましょう。" },
  ],
  useCasesTitle: "向いている用途",
  useCases: [
    { title: "写真アニメーション", description: "ポートレート、商品画像、シーンの静止画を短い動画クリップに変換します。" },
    { title: "開始フレームから終了フレームへの遷移", description: "1つの構図から狙った終着画像へ向かうクリップを誘導できます。" },
    { title: "SNS やプロモ用ループ", description: "リール、カバー、プロモティーザー向けの短い画像主導動画を素早く作れます。" },
    { title: "クリエイティブのプリビズ", description: "本格制作に入る前にモーションのアイデアを試せます。" },
  ],
  faqTitle: "よくある質問",
  faqDescription: "Wan 2.7 画像から動画に関するよくある質問です。",
  faq: [
    { question: "どのパラメータに対応していますか？", answer: "このページでは image、prompt、任意の last image、任意の audio、negative prompt、resolution、duration、prompt expansion、seed をサポートしています。" },
    { question: "終了画像は必須ですか？", answer: "いいえ。開始画像は必須ですが、終了画像は終着フレームを指定したいときだけ使う任意項目です。" },
    { question: "出力設定は何がありますか？", answer: "現在は 720p または 1080p の出力と、5 秒から 15 秒の長さに対応しています。" },
    { question: "seed = -1 は何を意味しますか？", answer: "seed が -1 の場合はランダム生成です。再現性を高めたい場合は固定の整数を使ってください。" },
  ],
  ctaTitle: "Wan 2.7 で画像を動かし始める",
  ctaDescription: "フレームをアップロードし、動きを説明して、任意の終了フレームや音声を使った Wan 2.7 image-to-video を試しましょう。",
  ctaButton: "今すぐ Wan 2.7 を試す",
  breadcrumbModel: "Wan 2.7",
  howToName: "Wan 2.7 で画像から動画を作る方法",
  howToDescription: "Wan 2.7 を使ってアップロード画像から AI 動画を生成します。",
  softwareName: "joymagic Wan 2.7 画像から動画",
  featureList: ["AI 画像から動画生成", "任意の終了フレーム指定", "任意の音声と seed 制御"],
};
imageToVideoCopy["es-ES"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 Imagen a Video - Fotograma inicial, final y audio | joymagic",
  metaDescription: "Anima imágenes con Wan 2.7 imagen a video. Sube una imagen inicial, un fotograma final opcional y audio, y controla resolución, duración, expansión de prompt y seed.",
  metaKeywords: "Wan 2.7, imagen a video, generador de video IA, fotograma final, fotograma inicial, audio, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 Imagen a Video",
  heroDescription: "Wan 2.7 image-to-video te ayuda a convertir una imagen fija en un clip corto más controlado. Sube la imagen inicial, añade un fotograma final si quieres guiar el cierre, adjunta audio si lo necesitas y controla resolución, duración, expansión del prompt y seed desde un solo formulario.",
  featuresTitle: "¿Por qué usar Wan 2.7 para imagen a video?",
  featuresDescription: "Un flujo práctico de image-to-video para movimiento guiado, control opcional del fotograma final e iteración reproducible.",
  features: [
    { title: "Fotograma inicial y fotograma final opcional", description: "Puedes animar con una sola imagen o añadir una imagen final para guiar cómo debe resolverse la toma." },
    { title: "Pista de audio opcional", description: "Adjunta un archivo de audio cuando quieras que el movimiento y el ritmo se planifiquen alrededor de una referencia sonora." },
    { title: "Control de resolución y duración", description: "Elige 720p o 1080p y define clips de 5 a 15 segundos en el mismo formulario." },
    { title: "Expansión de prompt y seed", description: "Amplía prompts cortos automáticamente y conserva un seed cuando quieras revisiones más estables." },
  ],
  tipsTitle: "Consejos para el prompt",
  tips: [
    { title: "Describe el movimiento, no solo la apariencia", description: "Explica cómo debe moverse el sujeto, cómo debe comportarse la cámara y cómo debe sentirse la escena con el paso del tiempo." },
    { title: "Usa fotograma final cuando el cierre importe", description: "El fotograma final es especialmente útil para transiciones, planos de revelación y cierres en una pose o composición concreta." },
    { title: "Mantén el prompt enfocado", description: "Las instrucciones claras sobre sujeto, fondo y movimiento de cámara suelen dar animaciones más limpias." },
    { title: "Fija el seed para revisar", description: "Cuando encuentres una buena dirección, bloquea el seed y ajusta el movimiento o la atmósfera con mayor previsibilidad." },
  ],
  useCasesTitle: "Casos de uso ideales",
  useCases: [
    { title: "Animación de fotos", description: "Convierte retratos, imágenes de producto o escenas estáticas en clips cortos con movimiento." },
    { title: "Transiciones de primer a último fotograma", description: "Guía un clip desde una composición inicial hasta una imagen final objetivo." },
    { title: "Loops para redes y promoción", description: "Crea videos cortos dirigidos por imagen para reels, portadas y teasers promocionales." },
    { title: "Previsualización creativa", description: "Prueba ideas de movimiento antes de invertir en una producción completa." },
  ],
  faqTitle: "Preguntas frecuentes",
  faqDescription: "Preguntas comunes sobre Wan 2.7 imagen a video.",
  faq: [
    { question: "¿Qué parámetros se admiten?", answer: "Esta página admite image, prompt, last image opcional, audio opcional, negative prompt, resolution, duration, prompt expansion y seed." },
    { question: "¿La imagen final es obligatoria?", answer: "No. La primera imagen es obligatoria y la imagen final es opcional; solo se usa cuando quieres guiar el fotograma de cierre." },
    { question: "¿Qué opciones de salida hay?", answer: "Actualmente se admiten salidas de 720p o 1080p y duraciones de 5 a 15 segundos." },
    { question: "¿Qué significa seed = -1?", answer: "Un seed de -1 significa generación aleatoria. Usa un entero fijo si quieres resultados más reproducibles." },
  ],
  ctaTitle: "Empieza a animar con Wan 2.7",
  ctaDescription: "Sube un fotograma, describe el movimiento y prueba cómo responde Wan 2.7 image-to-video con fotograma final y audio opcionales.",
  ctaButton: "Probar Wan 2.7 ahora",
  breadcrumbModel: "Wan 2.7",
  howToName: "Cómo crear videos desde imágenes con Wan 2.7",
  howToDescription: "Genera videos de IA a partir de imágenes subidas con Wan 2.7.",
  softwareName: "joymagic Wan 2.7 Imagen a Video",
  featureList: ["Generación AI de imagen a video", "Guía opcional con fotograma final", "Audio opcional y control de seed"],
};
imageToVideoCopy["it-IT"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 Immagine in Video - Fotogramma iniziale, finale e audio | joymagic",
  metaDescription: "Anima immagini con Wan 2.7 immagine in video. Carica un'immagine iniziale, un fotogramma finale opzionale e audio, poi controlla risoluzione, durata, espansione prompt e seed.",
  metaKeywords: "Wan 2.7, immagine in video, generatore video AI, fotogramma finale, fotogramma iniziale, audio, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 Immagine in Video",
  heroDescription: "Wan 2.7 image-to-video ti aiuta a trasformare un'immagine statica in una clip breve più controllabile. Carica l'immagine iniziale, aggiungi se serve un fotogramma finale per guidare la chiusura, allega audio se necessario e controlla risoluzione, durata, espansione prompt e seed da un unico form.",
  featuresTitle: "Perché usare Wan 2.7 per immagine in video?",
  featuresDescription: "Un flusso image-to-video pratico per movimento guidato, controllo opzionale del fotogramma finale e iterazioni ripetibili.",
  features: [
    { title: "Fotogramma iniziale e fotogramma finale opzionale", description: "Puoi animare con una sola immagine oppure aggiungere un'immagine finale per guidare il punto di arrivo dell'inquadratura." },
    { title: "Traccia audio opzionale", description: "Allega un file audio quando vuoi che movimento e ritmo vengano progettati attorno a un riferimento sonoro." },
    { title: "Controllo di risoluzione e durata", description: "Scegli 720p o 1080p e imposta clip da 5 a 15 secondi nello stesso form." },
    { title: "Espansione prompt e seed", description: "Espandi automaticamente prompt brevi e mantieni un seed quando vuoi revisioni più stabili." },
  ],
  tipsTitle: "Suggerimenti per il prompt",
  tips: [
    { title: "Descrivi il movimento, non solo l'aspetto", description: "Spiega come deve muoversi il soggetto, come deve comportarsi la camera e quale atmosfera deve emergere nel tempo." },
    { title: "Usa il fotogramma finale quando il finale conta", description: "Il fotogramma finale è particolarmente utile per transizioni, reveal shot e chiusure su una posa o composizione precisa." },
    { title: "Mantieni il prompt focalizzato", description: "Istruzioni chiare su soggetto, sfondo e movimento di camera portano spesso ad animazioni più pulite." },
    { title: "Blocca il seed per le revisioni", description: "Quando trovi una buona direzione, mantieni fisso il seed e rifinisci movimento o atmosfera in modo più prevedibile." },
  ],
  useCasesTitle: "Casi d'uso ideali",
  useCases: [
    { title: "Animazione di foto", description: "Trasforma ritratti, immagini prodotto o scene statiche in brevi clip in movimento." },
    { title: "Transizioni dal primo all'ultimo fotogramma", description: "Guida una clip da una composizione iniziale a un'immagine finale desiderata." },
    { title: "Loop social e promo", description: "Crea rapidamente brevi video guidati da immagini per reels, copertine e teaser promozionali." },
    { title: "Previsualizzazione creativa", description: "Testa idee di movimento prima di investire in una produzione completa." },
  ],
  faqTitle: "Domande frequenti",
  faqDescription: "Domande comuni su Wan 2.7 immagine in video.",
  faq: [
    { question: "Quali parametri sono supportati?", answer: "Questa pagina supporta image, prompt, last image opzionale, audio opzionale, negative prompt, resolution, duration, prompt expansion e seed." },
    { question: "L'immagine finale è obbligatoria?", answer: "No. La prima immagine è obbligatoria, mentre l'immagine finale è facoltativa e serve solo se vuoi guidare il frame conclusivo." },
    { question: "Quali impostazioni di output sono disponibili?", answer: "Attualmente sono supportati output a 720p o 1080p e durate da 5 a 15 secondi." },
    { question: "Cosa significa seed = -1?", answer: "Un seed di -1 significa generazione casuale. Usa un intero fisso se vuoi risultati più riproducibili." },
  ],
  ctaTitle: "Inizia ad animare con Wan 2.7",
  ctaDescription: "Carica un frame, descrivi il movimento e prova Wan 2.7 image-to-video con fotogramma finale e audio opzionali.",
  ctaButton: "Prova Wan 2.7 ora",
  breadcrumbModel: "Wan 2.7",
  howToName: "Come creare video da immagini con Wan 2.7",
  howToDescription: "Genera video AI da immagini caricate usando Wan 2.7.",
  softwareName: "joymagic Wan 2.7 Immagine in Video",
  featureList: ["Generazione AI da immagine a video", "Guida opzionale con fotogramma finale", "Audio opzionale e controllo seed"],
};
imageToVideoCopy["pt-BR"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 Imagem para Vídeo - Quadro inicial, final e áudio | joymagic",
  metaDescription: "Anime imagens com Wan 2.7 imagem para vídeo. Envie uma imagem inicial, um quadro final opcional e áudio, e controle resolução, duração, expansão de prompt e seed.",
  metaKeywords: "Wan 2.7, imagem para vídeo, gerador de vídeo com IA, quadro final, quadro inicial, áudio, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 Imagem para Vídeo",
  heroDescription: "Wan 2.7 image-to-video ajuda você a transformar uma imagem estática em um clipe curto mais controlado. Envie a imagem inicial, adicione um quadro final se quiser orientar o desfecho, anexe áudio se precisar e controle resolução, duração, expansão de prompt e seed em um único formulário.",
  featuresTitle: "Por que usar Wan 2.7 para imagem para vídeo?",
  featuresDescription: "Um fluxo prático de image-to-video para movimento guiado, controle opcional do quadro final e iteração reproduzível.",
  features: [
    { title: "Quadro inicial e quadro final opcional", description: "Você pode animar com uma única imagem ou adicionar uma imagem final para orientar como a cena deve terminar." },
    { title: "Faixa de áudio opcional", description: "Anexe um arquivo de áudio quando quiser que o movimento e o ritmo sejam planejados em torno de uma referência sonora." },
    { title: "Controle de resolução e duração", description: "Escolha 720p ou 1080p e defina clipes de 5 a 15 segundos no mesmo formulário." },
    { title: "Expansão de prompt e seed", description: "Expanda prompts curtos automaticamente e mantenha um seed quando quiser revisões mais estáveis." },
  ],
  tipsTitle: "Dicas de prompt",
  tips: [
    { title: "Descreva o movimento, não apenas a aparência", description: "Explique como o sujeito deve se mover, como a câmera deve agir e como a cena deve evoluir ao longo do tempo." },
    { title: "Use o quadro final quando o encerramento importar", description: "O quadro final é especialmente útil para transições, reveal shots e fechamentos em uma pose ou composição específica." },
    { title: "Mantenha o prompt focado", description: "Instruções claras sobre sujeito, fundo e movimento de câmera geralmente produzem animações mais limpas." },
    { title: "Fixe o seed para revisar", description: "Depois de encontrar uma boa direção, mantenha o seed travado e refine movimento ou atmosfera com mais previsibilidade." },
  ],
  useCasesTitle: "Melhores casos de uso",
  useCases: [
    { title: "Animação de fotos", description: "Transforme retratos, imagens de produto ou cenas estáticas em clipes curtos com movimento." },
    { title: "Transições do primeiro para o último quadro", description: "Guie um clipe de uma composição inicial até uma imagem final desejada." },
    { title: "Loops para social e promo", description: "Crie rapidamente vídeos curtos guiados por imagem para reels, capas e teasers promocionais." },
    { title: "Previsualização criativa", description: "Teste ideias de movimento antes de investir em uma produção completa." },
  ],
  faqTitle: "Perguntas frequentes",
  faqDescription: "Perguntas comuns sobre Wan 2.7 imagem para vídeo.",
  faq: [
    { question: "Quais parâmetros são suportados?", answer: "Esta página suporta image, prompt, last image opcional, audio opcional, negative prompt, resolution, duration, prompt expansion e seed." },
    { question: "A imagem final é obrigatória?", answer: "Não. A primeira imagem é obrigatória, enquanto a imagem final é opcional e usada apenas quando você quer orientar o quadro de encerramento." },
    { question: "Quais configurações de saída estão disponíveis?", answer: "Atualmente há suporte para saída em 720p ou 1080p e durações de 5 a 15 segundos." },
    { question: "O que significa seed = -1?", answer: "Um seed de -1 significa geração aleatória. Use um número inteiro fixo se quiser resultados mais reproduzíveis." },
  ],
  ctaTitle: "Comece a animar com Wan 2.7",
  ctaDescription: "Envie um quadro, descreva o movimento e teste como o Wan 2.7 image-to-video responde com quadro final e áudio opcionais.",
  ctaButton: "Testar Wan 2.7 agora",
  breadcrumbModel: "Wan 2.7",
  howToName: "Como criar vídeos a partir de imagens com Wan 2.7",
  howToDescription: "Gere vídeos de IA a partir de imagens enviadas com Wan 2.7.",
  softwareName: "joymagic Wan 2.7 Imagem para Vídeo",
  featureList: ["Geração AI de imagem para vídeo", "Guia opcional com quadro final", "Áudio opcional e controle de seed"],
};
imageToVideoCopy["ru-RU"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 Изображение в видео - стартовый кадр, финальный кадр и звук | joymagic",
  metaDescription: "Анимируйте изображения с Wan 2.7 изображение в видео. Загрузите стартовое изображение, опциональный финальный кадр и звук, затем управляйте разрешением, длительностью, расширением промпта и seed.",
  metaKeywords: "Wan 2.7, изображение в видео, AI генератор видео, финальный кадр, стартовый кадр, аудио, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 Изображение в видео",
  heroDescription: "Wan 2.7 image-to-video помогает превратить статичное изображение в более управляемый короткий ролик. Загрузите стартовое изображение, при необходимости добавьте финальный кадр, чтобы задать завершение сцены, прикрепите аудио и управляйте разрешением, длительностью, расширением промпта и seed из одной формы.",
  featuresTitle: "Почему стоит использовать Wan 2.7 для image-to-video?",
  featuresDescription: "Практичный workflow image-to-video для управляемого движения, опционального контроля финального кадра и воспроизводимых итераций.",
  features: [
    { title: "Стартовый кадр и опциональный финальный кадр", description: "Можно анимировать одно изображение или добавить финальный кадр, чтобы направить, к чему должен прийти ролик." },
    { title: "Опциональная аудиодорожка", description: "Прикрепите аудиофайл, если хотите выстраивать движение и ритм с опорой на звук." },
    { title: "Управление разрешением и длительностью", description: "Выбирайте 720p или 1080p и задавайте длину ролика от 5 до 15 секунд в той же форме." },
    { title: "Расширение промпта и seed", description: "Короткие промпты можно автоматически расширять, а seed помогает делать правки более стабильными." },
  ],
  tipsTitle: "Советы по промптам",
  tips: [
    { title: "Описывайте движение, а не только внешний вид", description: "Поясняйте, как должен двигаться объект, как должна вести себя камера и как должна меняться атмосфера сцены со временем." },
    { title: "Используйте финальный кадр, когда важен финал", description: "Финальный кадр особенно полезен для переходов, reveal-сцен и завершения на конкретной позе или композиции." },
    { title: "Держите промпт сфокусированным", description: "Четкие инструкции по объекту, фону и движению камеры обычно дают более чистую анимацию." },
    { title: "Фиксируйте seed для итераций", description: "Когда направление уже найдено, зафиксируйте seed и дорабатывайте движение или атмосферу более предсказуемо." },
  ],
  useCasesTitle: "Лучшие сценарии использования",
  useCases: [
    { title: "Анимация фотографий", description: "Преобразуйте портреты, продуктовые изображения или статичные сцены в короткие видеофрагменты." },
    { title: "Переходы от первого к последнему кадру", description: "Проведите ролик от одной композиции к целевому финальному изображению." },
    { title: "Социальные и промо-лупы", description: "Создавайте короткие image-led ролики для reels, обложек и промо-тизеров." },
    { title: "Креативная превизуализация", description: "Проверяйте идеи движения до запуска полноценного production-процесса." },
  ],
  faqTitle: "Частые вопросы",
  faqDescription: "Частые вопросы о Wan 2.7 изображение в видео.",
  faq: [
    { question: "Какие параметры поддерживаются?", answer: "Эта страница поддерживает image, prompt, опциональный last image, опциональный audio, negative prompt, resolution, duration, prompt expansion и seed." },
    { question: "Финальное изображение обязательно?", answer: "Нет. Первое изображение обязательно, а финальное изображение опционально и используется только когда вы хотите задать финальный кадр." },
    { question: "Какие настройки вывода доступны?", answer: "Сейчас поддерживаются 720p или 1080p и длительность от 5 до 15 секунд." },
    { question: "Что означает seed = -1?", answer: "Seed со значением -1 означает случайную генерацию. Используйте фиксированное целое число, если нужна большая воспроизводимость." },
  ],
  ctaTitle: "Начните анимировать с Wan 2.7",
  ctaDescription: "Загрузите кадр, опишите движение и протестируйте Wan 2.7 image-to-video с опциональными финальным кадром и аудио.",
  ctaButton: "Попробовать Wan 2.7",
  breadcrumbModel: "Wan 2.7",
  howToName: "Как создавать видео из изображений с Wan 2.7",
  howToDescription: "Создавайте AI-видео из загруженных изображений с помощью Wan 2.7.",
  softwareName: "joymagic Wan 2.7 Изображение в видео",
  featureList: ["AI генерация видео из изображения", "Опциональное управление финальным кадром", "Опциональное аудио и контроль seed"],
};
imageToVideoCopy["tr-TR"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 Görselden Videoya - Başlangıç karesi, son kare ve ses | joymagic",
  metaDescription: "Wan 2.7 görselden videoya ile görselleri canlandırın. Başlangıç görseli, isteğe bağlı son kare ve sesi yükleyin; çözünürlük, süre, prompt genişletme ve seed'i kontrol edin.",
  metaKeywords: "Wan 2.7, görselden videoya, AI video oluşturucu, son kare, başlangıç karesi, ses, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 Görselden Videoya",
  heroDescription: "Wan 2.7 image-to-video, durağan bir görseli daha kontrollü kısa bir klibe dönüştürmenize yardımcı olur. Başlangıç görselini yükleyin, bitiş karesini yönlendirmek için isterseniz son kare görseli ekleyin, gerekirse ses ekleyin ve tüm bunları tek bir Creator formunda çözünürlük, süre, prompt genişletme ve seed ile birlikte yönetin.",
  featuresTitle: "Görselden videoya için neden Wan 2.7?",
  featuresDescription: "Yönlendirilmiş hareket, isteğe bağlı son kare kontrolü ve tekrarlanabilir iterasyon için pratik bir image-to-video iş akışı.",
  features: [
    { title: "Başlangıç karesi ve isteğe bağlı son kare", description: "Tek bir görselle animasyon üretebilir veya çekimin nereye oturacağını yönlendirmek için bir son kare ekleyebilirsiniz." },
    { title: "İsteğe bağlı ses parçası", description: "Hareket ve tempoyu bir ses referansına göre planlamak istediğinizde bir ses dosyası ekleyin." },
    { title: "Çözünürlük ve süre kontrolü", description: "Aynı form içinde 720p veya 1080p seçin ve klip süresini 5 ile 15 saniye arasında belirleyin." },
    { title: "Prompt genişletme ve seed", description: "Kısa prompt'ları otomatik genişletin ve daha kararlı revizyonlar için seed'i koruyun." },
  ],
  tipsTitle: "Prompt ipuçları",
  tips: [
    { title: "Sadece görünümü değil hareketi de anlatın", description: "Öznenin nasıl hareket etmesi gerektiğini, kameranın nasıl davranacağını ve sahnenin zaman içinde nasıl hissettirmesi gerektiğini açıklayın." },
    { title: "Bitiş önemliyse son kare kullanın", description: "Son kare özellikle geçişler, reveal çekimleri ve belirli bir poz veya kompozisyona iniş için faydalıdır." },
    { title: "Prompt'u odaklı tutun", description: "Özne, arka plan ve kamera hareketi hakkında net talimatlar genellikle daha temiz animasyonlar üretir." },
    { title: "Revizyonlar için seed'i kilitleyin", description: "İyi bir yön bulduktan sonra seed'i sabitleyin ve hareketi ya da atmosferi daha öngörülebilir şekilde rafine edin." },
  ],
  useCasesTitle: "En iyi kullanım alanları",
  useCases: [
    { title: "Fotoğraf animasyonu", description: "Portreleri, ürün görsellerini veya sahne fotoğraflarını kısa hareketli kliplere dönüştürün." },
    { title: "İlk kareden son kareye geçişler", description: "Bir klibi başlangıç kompozisyonundan hedef son görüntüye yönlendirin." },
    { title: "Sosyal medya ve promosyon döngüleri", description: "Reels, kapaklar ve tanıtım teaser'ları için kısa, görsel odaklı videolar üretin." },
    { title: "Yaratıcı previz", description: "Tam prodüksiyona yatırım yapmadan önce hareket fikirlerini test edin." },
  ],
  faqTitle: "Sık sorulan sorular",
  faqDescription: "Wan 2.7 görselden videoya hakkında yaygın sorular.",
  faq: [
    { question: "Hangi parametreler destekleniyor?", answer: "Bu sayfa image, prompt, isteğe bağlı last image, isteğe bağlı audio, negative prompt, resolution, duration, prompt expansion ve seed destekler." },
    { question: "Son görsel zorunlu mu?", answer: "Hayır. İlk görsel zorunludur; son görsel ise yalnızca bitiş karesini yönlendirmek istediğinizde kullanılan isteğe bağlı bir alandır." },
    { question: "Hangi çıktı ayarları mevcut?", answer: "Şu anda 720p veya 1080p çıktı ve 5 ile 15 saniye arası süreler destekleniyor." },
    { question: "seed = -1 ne anlama gelir?", answer: "seed'in -1 olması rastgele üretim anlamına gelir. Daha tekrarlanabilir sonuçlar için sabit bir tam sayı kullanın." },
  ],
  ctaTitle: "Wan 2.7 ile animasyona başlayın",
  ctaDescription: "Bir kare yükleyin, hareketi tarif edin ve isteğe bağlı son kare ile ses desteğiyle Wan 2.7 image-to-video'yu test edin.",
  ctaButton: "Wan 2.7'yi şimdi deneyin",
  breadcrumbModel: "Wan 2.7",
  howToName: "Wan 2.7 ile görsellerden video nasıl yapılır",
  howToDescription: "Wan 2.7 kullanarak yüklenen görsellerden yapay zeka videoları üretin.",
  softwareName: "joymagic Wan 2.7 Görselden Videoya",
  featureList: ["AI görselden videoya üretim", "İsteğe bağlı son kare yönlendirmesi", "İsteğe bağlı ses ve seed kontrolü"],
};
imageToVideoCopy["ps-AF"] = {
  ...imageToVideoCopy.en,
  metaTitle: "Wan 2.7 له انځور څخه ویډیو - پیل فریم، وروستی فریم او غږ | joymagic",
  metaDescription: "انځورونه د Wan 2.7 له انځور څخه ویډیو په مرسته متحرک کړئ. پیل انځور، اختیاري وروستی فریم او غږ پورته کړئ، بیا ریزولوشن، موده، prompt پراخول او seed کنټرول کړئ.",
  metaKeywords: "Wan 2.7, له انځور څخه ویډیو, AI ویډیو جوړوونکی, وروستی فریم, پیل فریم, غږ, seed, Alibaba Cloud",
  heroTitle: "Wan 2.7 له انځور څخه ویډیو",
  heroDescription: "Wan 2.7 image-to-video له یوې ولاړې انځورې څخه یو ډېر کنټرولېدونکی لنډ ویډیويي کلیپ جوړوي. د پیل انځور پورته کړئ، که اړتیا وي وروستی انځور هم ورزیات کړئ څو د پای صحنه لارښوونه کړي، غږ هم ورسره ونښلوئ، او دا ټول د یوه Creator فارم له لارې د ریزولوشن، مودې، prompt پراخولو او seed سره یوځای کنټرول کړئ.",
  featuresTitle: "ولې د image-to-video لپاره Wan 2.7 وکاروئ؟",
  featuresDescription: "د هدایت شوي حرکت، اختیاري وروستي فریم کنټرول او باثباته تکراري اصلاح لپاره یو عملي image-to-video کاري بهیر.",
  features: [
    { title: "د پیل فریم او اختیاري وروستی فریم", description: "یوه انځور هم متحرکولای شئ، یا وروستی انځور ورزیات کړئ څو وښيي شاټ باید په کوم ځای پای ته ورسېږي." },
    { title: "اختیاري غږیز ټریک", description: "کله چې غواړئ حرکت او ریتم د غږ له مخې جوړ شي، یو غږیز فایل ورزیات کړئ." },
    { title: "د ریزولوشن او مودې کنټرول", description: "په هماغه فارم کې 720p یا 1080p وټاکئ او د کلیپ موده له 5 تر 15 ثانیو پورې تنظیم کړئ." },
    { title: "د prompt پراخول او seed", description: "لنډ promptونه په اوتومات ډول پراخ کړئ او که ثابتې بیاکتنې غواړئ seed وساتئ." },
  ],
  tipsTitle: "د prompt لارښوونې",
  tips: [
    { title: "یوازې بڼه نه، حرکت هم تشریح کړئ", description: "دا هم ولیکئ چې موضوع څنګه وخوځي، کمره څنګه عمل وکړي، او صحنه د وخت په تېرېدو څنګه احساس ورکړي." },
    { title: "کله چې پای مهم وي وروستی فریم وکاروئ", description: "وروستی فریم په ځانګړي ډول د انتقالونو، reveal شاټونو او ټاکلې پوز یا کمپوزېشن ته د رسېدو لپاره ګټور دی." },
    { title: "prompt متمرکز وساتئ", description: "د موضوع، شالید او د کمرې د حرکت په اړه روښانه لارښوونې عموماً پاکه انیمېشن برابروي." },
    { title: "د بیاکتنې لپاره seed ثابت کړئ", description: "کله چې ښه لوری ومومئ، seed ثابت وساتئ او حرکت یا فضا په لا ډېر اټکل کېدونکي ډول اصلاح کړئ." },
  ],
  useCasesTitle: "غوره کارونې",
  useCases: [
    { title: "د عکس انیمېشن", description: "پورټرېټونه، د محصول انځورونه یا د صحنې ولاړې انځورې لنډو متحرکو کلیپونو ته واړوئ." },
    { title: "له لومړي فریم څخه تر وروستي فریم پورې انتقال", description: "کلیپ له یوې پیل شوې جوړښت څخه تر هدف وروستي انځور پورې هدایت کړئ." },
    { title: "د ټولنیزو رسنیو او پرومو لوپونه", description: "د reels، cover او پروموشن teaser لپاره لنډ، د انځور پر بنسټ ویډیوګانې جوړې کړئ." },
    { title: "خلاقه مخکېنۍ کتنه", description: "د بشپړ تولید له پیل مخکې د حرکت نظریې وازمویئ." },
  ],
  faqTitle: "عامې پوښتنې",
  faqDescription: "د Wan 2.7 له انځور څخه ویډیو په اړه عامې پوښتنې.",
  faq: [
    { question: "کوم پارامیټرونه پکې شته؟", answer: "دا پاڼه image، prompt، اختیاري last image، اختیاري audio، negative prompt، resolution، duration، prompt expansion او seed ملاتړ کوي." },
    { question: "ایا وروستی انځور حتمي دی؟", answer: "نه. لومړی انځور حتمي دی، خو وروستی انځور اختیاري دی او یوازې هغه وخت کارول کېږي چې تاسو غواړئ د پای فریم لارښوونه وکړئ." },
    { question: "کوم output تنظیمات شته؟", answer: "اوس مهال 720p یا 1080p output او له 5 تر 15 ثانیو پورې مودې ملاتړ کېږي." },
    { question: "seed = -1 څه مانا لري؟", answer: "کله چې seed -1 وي، تولید تصادفي وي. که تکرارېدونکې پایلې غواړئ، یو ثابت بشپړ عدد وکاروئ." },
  ],
  ctaTitle: "له Wan 2.7 سره انیمېشن پیل کړئ",
  ctaDescription: "یو فریم پورته کړئ، حرکت تشریح کړئ، او د اختیاري وروستي فریم او غږ سره د Wan 2.7 image-to-video ازموینه وکړئ.",
  ctaButton: "همدا اوس Wan 2.7 وازمویئ",
  breadcrumbModel: "Wan 2.7",
  howToName: "په Wan 2.7 سره له انځورونو ویډیو څنګه جوړه کړو",
  howToDescription: "په Wan 2.7 سره له پورته شوو انځورونو AI ویډیو جوړه کړئ.",
  softwareName: "joymagic Wan 2.7 له انځور څخه ویډیو",
  featureList: ["AI له انځور څخه ویډیو تولید", "اختیاري وروستی فریم لارښوونه", "اختیاري غږ او seed کنټرول"],
};

export function getWan27ImageToVideoPageCopy(locale: string): Wan27ImageToVideoPageCopy {
  return imageToVideoCopy[locale] || imageToVideoCopy.en;
}

export function getWan27ImageToVideoHowToSteps(locale: string) {
  const steps: Record<string, Array<{ name: string; text: string }>> = {
    en: [
      { name: "Upload the start frame", text: "Upload the first image you want to animate, and optionally add a last image to guide the ending frame." },
      { name: "Describe the motion", text: "Write how the subject, camera, and scene should move over time. Add audio if needed." },
      { name: "Set output controls", text: "Choose resolution, duration, prompt expansion, and seed, then generate and refine the clip." },
    ],
    zh: [
      { name: "上传首帧图", text: "上传要做动画的首张图片，也可以按需附加尾帧图来引导结尾画面。" },
      { name: "描述运动方式", text: "写清楚主体、镜头和场景如何随时间运动，需要时附加音频。" },
      { name: "设置输出参数", text: "选择分辨率、时长、提示词扩写和 seed，然后生成并继续微调。" },
    ],
    "zh-Hant-TW": [
      { name: "上傳首幀圖", text: "上傳要做動畫的首張圖片，也可以按需附加尾幀圖來引導結尾畫面。" },
      { name: "描述運動方式", text: "寫清楚主體、鏡頭和場景如何隨時間運動，需要時附加音訊。" },
      { name: "設定輸出參數", text: "選擇解析度、時長、提示詞擴寫和 seed，然後生成並繼續微調。" },
    ],
    "zh-hk": [
      { name: "上傳首幀圖", text: "上傳要做動畫的首張圖片，也可以按需要加入尾幀圖來引導結尾畫面。" },
      { name: "描述運動方式", text: "寫清楚主體、鏡頭和場景如何隨時間移動，需要時附加音訊。" },
      { name: "設定輸出參數", text: "選擇解析度、時長、提示詞擴寫和 seed，然後生成並繼續微調。" },
    ],
    "de-DE": [
      { name: "Startbild hochladen", text: "Laden Sie das erste Bild hoch, das animiert werden soll, und fügen Sie optional ein Endbild hinzu, um den letzten Frame zu steuern." },
      { name: "Bewegung beschreiben", text: "Beschreiben Sie, wie sich Motiv, Kamera und Szene im Zeitverlauf bewegen sollen. Fügen Sie bei Bedarf Audio hinzu." },
      { name: "Ausgabe festlegen", text: "Wählen Sie Auflösung, Dauer, Prompt-Erweiterung und Seed, generieren Sie den Clip und verfeinern Sie ihn." },
    ],
    "ko-KR": [
      { name: "시작 프레임 업로드", text: "애니메이션할 첫 이미지를 업로드하고, 필요하면 마지막 이미지를 추가해 결말 프레임을 유도하세요." },
      { name: "움직임 설명하기", text: "주제, 카메라, 장면이 시간에 따라 어떻게 움직여야 하는지 적고, 필요하면 오디오를 추가하세요." },
      { name: "출력 설정하기", text: "해상도, 길이, 프롬프트 확장, seed를 선택한 뒤 생성하고 계속 다듬으세요." },
    ],
    "ja-JP": [
      { name: "開始フレームをアップロード", text: "アニメーションさせたい最初の画像をアップロードし、必要なら終了画像を追加して最後のフレームを誘導します。" },
      { name: "動きを記述する", text: "被写体、カメラ、シーンが時間とともにどう動くべきかを書き、必要なら音声も追加します。" },
      { name: "出力設定を決める", text: "解像度、尺、プロンプト拡張、seed を選び、生成してからさらに調整します。" },
    ],
    "es-ES": [
      { name: "Sube el fotograma inicial", text: "Sube la primera imagen que quieres animar y añade un fotograma final si necesitas guiar la escena de cierre." },
      { name: "Describe el movimiento", text: "Escribe cómo deben moverse el sujeto, la cámara y la escena con el tiempo. Añade audio si hace falta." },
      { name: "Define la salida", text: "Elige resolución, duración, expansión de prompt y seed, luego genera y refina el clip." },
    ],
    "it-IT": [
      { name: "Carica il fotogramma iniziale", text: "Carica la prima immagine da animare e, se serve, aggiungi un fotogramma finale per guidare la scena di chiusura." },
      { name: "Descrivi il movimento", text: "Scrivi come soggetto, camera e scena devono muoversi nel tempo. Aggiungi audio se necessario." },
      { name: "Imposta l'output", text: "Scegli risoluzione, durata, espansione prompt e seed, poi genera e rifinisci il clip." },
    ],
    "pt-BR": [
      { name: "Envie o quadro inicial", text: "Envie a primeira imagem que você quer animar e, se precisar, adicione um quadro final para orientar a cena de encerramento." },
      { name: "Descreva o movimento", text: "Escreva como o sujeito, a câmera e a cena devem se mover ao longo do tempo. Adicione áudio se necessário." },
      { name: "Defina a saída", text: "Escolha resolução, duração, expansão de prompt e seed, depois gere e refine o clipe." },
    ],
    "ru-RU": [
      { name: "Загрузите стартовый кадр", text: "Загрузите первое изображение для анимации и при необходимости добавьте финальный кадр, чтобы направить завершающую сцену." },
      { name: "Опишите движение", text: "Напишите, как должны двигаться объект, камера и сцена со временем. При необходимости добавьте аудио." },
      { name: "Настройте вывод", text: "Выберите разрешение, длительность, расширение промпта и seed, затем сгенерируйте и доработайте ролик." },
    ],
    "tr-TR": [
      { name: "Başlangıç karesini yükleyin", text: "Canlandırmak istediğiniz ilk görseli yükleyin ve gerekirse kapanış sahnesini yönlendirmek için bir son kare ekleyin." },
      { name: "Hareketi tanımlayın", text: "Öznenin, kameranın ve sahnenin zaman içinde nasıl hareket etmesi gerektiğini yazın. Gerekirse ses ekleyin." },
      { name: "Çıktıyı ayarlayın", text: "Çözünürlük, süre, prompt genişletme ve seed'i seçin; ardından klibi üretip rafine edin." },
    ],
    "ps-AF": [
      { name: "د پیل فریم پورته کړئ", text: "هغه لومړی انځور پورته کړئ چې غواړئ متحرک یې کړئ، او که اړتیا وي وروستی انځور هم ورزیات کړئ څو د پای صحنه لارښوونه کړي." },
      { name: "حرکت تشریح کړئ", text: "ولیکئ چې موضوع، کمره او صحنه باید د وخت په تېرېدو څنګه وخوځي. که اړتیا وي غږ هم ورزیات کړئ." },
      { name: "output تنظیم کړئ", text: "ریزولوشن، موده، د prompt پراخول او seed وټاکئ، بیا کلیپ جوړ او اصلاح کړئ." },
    ],
  };
  return steps[locale] || steps.en;
}
