import { getTranslations, setRequestLocale } from "next-intl/server";

import { envConfigs } from "@/config";
import { locales } from "@/config/locale";
import { AiMediaPageLayout } from "@/shared/blocks/common/ai-media-page-layout";
import { wan27ImageEditProConfig } from "@/shared/blocks/desktop-playground/configs/image-to-image-configs";
import { JsonLd } from "@/shared/components/jsonld";
import { ScrollAnimation } from "@/shared/components/ui/scroll-animation";
import {
  generateBreadcrumbSchema,
  generateFAQSchema,
  generateHowToSchema,
  generateSoftwareApplicationSchema,
} from "@/shared/lib/jsonld";
import {
  getWan27CommonLabels,
  getWan27ImageToImagePageCopy,
} from "@/shared/lib/wan-2-7-page-copy";
import type {
  CTA as CTAType,
  FAQ as FAQType,
  Features as FeaturesType,
  Hero as HeroType,
} from "@/shared/types/blocks/landing";
import { CTA } from "@/themes/default/blocks/cta";
import { FAQ } from "@/themes/default/blocks/faq";
import { Features } from "@/themes/default/blocks/features";
import {
  CheckCircle2,
  Layers,
  Lightbulb,
  Maximize,
  Palette,
  Sparkles,
  Target,
} from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

function getProOverrides(locale: string) {
  const overrides: Record<
    string,
    {
      metaTitle: string;
      metaDescription: string;
      heroTitle: string;
      heroDescription: string;
      firstFeatureDescription: string;
      faqMaxImagesAnswer: string;
      ctaTitle: string;
      ctaDescription: string;
      ctaButton: string;
      howToName: string;
      howToDescription: string;
      howToSteps: Array<{ name: string; text: string }>;
    }
  > = {
    en: {
      metaTitle: "Wan 2.7 Image Edit Pro - Up to 9 Images and Custom Size | joymagic",
      metaDescription:
        "Edit and transform images with Wan 2.7 Image Edit Pro. Upload up to 9 images, control size up to 4096, and refine results with seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro is built for heavier multi-image editing workflows. Upload up to 9 reference images, describe what should stay and what should change, and control the final result with width, height, size, and seed.",
      firstFeatureDescription:
        "Use up to 9 reference images when you need stronger structure, silhouette, color, or appearance guidance.",
      faqMaxImagesAnswer:
        "The current form supports up to 9 reference images, which is helpful for multi-image guidance, color matching, and richer visual control.",
      ctaTitle: "Start editing with Wan 2.7 Image Edit Pro",
      ctaDescription:
        "Upload up to 9 references, set the output size, and test Wan 2.7 Image Edit Pro in advanced image-to-image workflows.",
      ctaButton: "Try Wan 2.7 Image Edit Pro",
      howToName: "How to edit images with Wan 2.7 Image Edit Pro",
      howToDescription:
        "Edit images with Wan 2.7 Image Edit Pro using multiple reference images and prompts.",
      howToSteps: [
        { name: "Upload references", text: "Upload up to 9 source images for structure, silhouette, color, or composition guidance." },
        { name: "Set the size", text: "Use width and height sliders to control output size; the page will generate the size parameter automatically." },
        { name: "Write the prompt and generate", text: "Be explicit about what to preserve and what to change, then run the edit and iterate." },
      ],
    },
    "en-IN": {} as any,
    zh: {
      metaTitle: "Wan 2.7 Image Edit Pro 图生图 - 最多 9 图与自定义 Size | joymagic",
      metaDescription:
        "使用 Wan 2.7 Image Edit Pro 编辑和转换图片，支持最多 9 张参考图、自定义 size、宽高控制和 seed 复现。",
      heroTitle: "Wan 2.7 Image Edit Pro 图生图",
      heroDescription:
        "Wan 2.7 Image Edit Pro 更适合多图协同编辑工作流。你可以上传最多 9 张参考图，描述要保留什么、要改变什么，再通过 width、height、size 和 seed 控制最终结果。",
      firstFeatureDescription:
        "最多上传 9 张参考图，适合做结构、轮廓、配色和外观的多图联合引导。",
      faqMaxImagesAnswer:
        "当前表单支持最多 9 张参考图，适合多图引导、配色参考和更复杂的图像编辑控制。",
      ctaTitle: "开始用 Wan 2.7 Image Edit Pro 编辑图片",
      ctaDescription:
        "上传最多 9 张参考图，设置输出尺寸，直接测试 Wan 2.7 Image Edit Pro 在高级图生图场景里的表现。",
      ctaButton: "立即体验 Wan 2.7 Image Edit Pro",
      howToName: "如何使用 Wan 2.7 Image Edit Pro 编辑图片",
      howToDescription:
        "使用 Wan 2.7 Image Edit Pro 结合多张参考图和提示词编辑图片。",
      howToSteps: [
        { name: "上传参考图", text: "上传最多 9 张参考图片作为结构、轮廓、配色或构图输入。" },
        { name: "设置 size", text: "通过宽高滑杆设置输出尺寸，系统会自动生成 size 参数。" },
        { name: "填写 prompt 并生成", text: "写清楚要保留和要改变的内容，然后生成并继续迭代。" },
      ],
    },
    "zh-Hant-TW": {
      metaTitle: "Wan 2.7 Image Edit Pro 圖生圖 - 最多 9 圖與自訂 Size | joymagic",
      metaDescription:
        "使用 Wan 2.7 Image Edit Pro 編輯與轉換圖片，支援最多 9 張參考圖、自訂 size、寬高控制與 seed 重現。",
      heroTitle: "Wan 2.7 Image Edit Pro 圖生圖",
      heroDescription:
        "Wan 2.7 Image Edit Pro 更適合多圖協同編輯工作流。你可以上傳最多 9 張參考圖，描述要保留什麼、要改變什麼，再透過 width、height、size 與 seed 控制最終結果。",
      firstFeatureDescription:
        "最多可上傳 9 張參考圖，適合做結構、輪廓、配色與外觀的多圖聯合引導。",
      faqMaxImagesAnswer:
        "目前表單支援最多 9 張參考圖，適合多圖引導、配色參考與更複雜的影像編輯控制。",
      ctaTitle: "開始用 Wan 2.7 Image Edit Pro 編輯圖片",
      ctaDescription:
        "上傳最多 9 張參考圖，設定輸出尺寸，直接測試 Wan 2.7 Image Edit Pro 在進階圖生圖場景中的表現。",
      ctaButton: "立即體驗 Wan 2.7 Image Edit Pro",
      howToName: "如何使用 Wan 2.7 Image Edit Pro 編輯圖片",
      howToDescription:
        "使用 Wan 2.7 Image Edit Pro 結合多張參考圖與提示詞編輯圖片。",
      howToSteps: [
        { name: "上傳參考圖", text: "上傳最多 9 張參考圖片作為結構、輪廓、配色或構圖輸入。" },
        { name: "設定 size", text: "透過寬高滑桿設定輸出尺寸，系統會自動生成 size 參數。" },
        { name: "填寫 prompt 並生成", text: "寫清楚要保留與要改變的內容，然後生成並持續迭代。" },
      ],
    },
    "zh-hk": {} as any,
    "de-DE": {
      metaTitle: "Wan 2.7 Image Edit Pro - Bis zu 9 Bilder und benutzerdefinierte Größe | joymagic",
      metaDescription:
        "Bearbeiten und transformieren Sie Bilder mit Wan 2.7 Image Edit Pro. Laden Sie bis zu 9 Bilder hoch, steuern Sie die Größe bis 4096 und verfeinern Sie Ergebnisse mit Seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro eignet sich für anspruchsvollere Multi-Bild-Workflows. Laden Sie bis zu 9 Referenzbilder hoch, beschreiben Sie, was erhalten und was geändert werden soll, und steuern Sie das Ergebnis mit width, height, size und seed.",
      firstFeatureDescription:
        "Nutzen Sie bis zu 9 Referenzbilder für stärkere Struktur-, Silhouetten-, Farb- oder Erscheinungsführung.",
      faqMaxImagesAnswer:
        "Das aktuelle Formular unterstützt bis zu 9 Referenzbilder. Das ist hilfreich für Multi-Bild-Guidance, Farbabgleich und komplexere Bildbearbeitung.",
      ctaTitle: "Mit Wan 2.7 Image Edit Pro bearbeiten",
      ctaDescription:
        "Laden Sie bis zu 9 Referenzen hoch, setzen Sie die Zielgröße und testen Sie Wan 2.7 Image Edit Pro in erweiterten Bild-zu-Bild-Workflows.",
      ctaButton: "Wan 2.7 Image Edit Pro testen",
      howToName: "So bearbeiten Sie Bilder mit Wan 2.7 Image Edit Pro",
      howToDescription:
        "Bearbeiten Sie Bilder mit Wan 2.7 Image Edit Pro anhand mehrerer Referenzbilder und Prompts.",
      howToSteps: [
        { name: "Referenzen hochladen", text: "Laden Sie bis zu 9 Quellbilder für Struktur-, Silhouetten-, Farb- oder Kompositionshilfe hoch." },
        { name: "Größe festlegen", text: "Steuern Sie die Ausgabegröße über width und height; die Seite erzeugt den size-Parameter automatisch." },
        { name: "Prompt schreiben und generieren", text: "Schreiben Sie klar, was erhalten und was verändert werden soll, und starten Sie dann die Bearbeitung." },
      ],
    },
    "ko-KR": {
      metaTitle: "Wan 2.7 Image Edit Pro - 최대 9장과 사용자 지정 크기 | joymagic",
      metaDescription:
        "Wan 2.7 Image Edit Pro로 이미지를 편집하고 변환하세요. 최대 9장의 참조 이미지를 업로드하고 4096 크기와 seed로 결과를 제어할 수 있습니다.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro는 더 무거운 멀티 이미지 편집 워크플로에 적합합니다. 최대 9장의 참조 이미지를 업로드하고 무엇을 유지하고 무엇을 바꿀지 설명한 뒤 width, height, size, seed로 결과를 제어할 수 있습니다.",
      firstFeatureDescription:
        "구조, 실루엣, 색상, 외형 가이드를 강화하고 싶을 때 최대 9장의 참조 이미지를 사용할 수 있습니다.",
      faqMaxImagesAnswer:
        "현재 폼은 최대 9장의 참조 이미지를 지원하며, 멀티 이미지 가이드, 색상 매칭, 더 복잡한 이미지 편집에 유용합니다.",
      ctaTitle: "Wan 2.7 Image Edit Pro로 편집 시작",
      ctaDescription:
        "최대 9장의 참조 이미지를 업로드하고 출력 크기를 설정한 뒤 Wan 2.7 Image Edit Pro를 테스트해 보세요.",
      ctaButton: "Wan 2.7 Image Edit Pro 사용하기",
      howToName: "Wan 2.7 Image Edit Pro로 이미지 편집하는 방법",
      howToDescription:
        "여러 참조 이미지와 프롬프트를 사용해 Wan 2.7 Image Edit Pro로 이미지를 편집합니다.",
      howToSteps: [
        { name: "참조 이미지 업로드", text: "구조, 실루엣, 색상, 구도 가이드를 위해 최대 9장의 이미지를 업로드하세요." },
        { name: "크기 설정", text: "width와 height 슬라이더로 출력 크기를 정하면 페이지가 size 값을 자동 생성합니다." },
        { name: "프롬프트 작성 후 생성", text: "무엇을 유지하고 무엇을 바꿀지 명확히 쓴 뒤 편집을 실행하고 반복 수정하세요." },
      ],
    },
    "ja-JP": {
      metaTitle: "Wan 2.7 Image Edit Pro - 最大 9 枚とカスタム size | joymagic",
      metaDescription:
        "Wan 2.7 Image Edit Pro で画像を編集・変換。最大 9 枚の参照画像、4096 までの size、seed 制御に対応しています。",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro は、より本格的な複数画像編集ワークフロー向けです。最大 9 枚の参照画像をアップロードし、何を残して何を変えるかを説明したうえで、width、height、size、seed で結果をコントロールできます。",
      firstFeatureDescription:
        "構造、シルエット、色、見た目のガイドを強めたいときに最大 9 枚の参照画像を使えます。",
      faqMaxImagesAnswer:
        "現在のフォームでは最大 9 枚の参照画像をアップロードできます。複数画像ガイド、色合わせ、より複雑な編集に役立ちます。",
      ctaTitle: "Wan 2.7 Image Edit Pro で編集を始める",
      ctaDescription:
        "最大 9 枚の参照画像をアップロードし、出力サイズを設定して、Wan 2.7 Image Edit Pro を試してください。",
      ctaButton: "Wan 2.7 Image Edit Pro を試す",
      howToName: "Wan 2.7 Image Edit Pro で画像を編集する方法",
      howToDescription:
        "複数の参照画像とプロンプトを使って Wan 2.7 Image Edit Pro で画像を編集します。",
      howToSteps: [
        { name: "参照画像をアップロード", text: "構造、シルエット、色、構図のガイドとして最大 9 枚の画像をアップロードします。" },
        { name: "サイズを設定", text: "width と height のスライダーで出力サイズを決めると、ページが size パラメータを自動生成します。" },
        { name: "プロンプトを書いて生成", text: "残したい要素と変えたい要素を明確にしてから編集を実行し、必要に応じて調整します。" },
      ],
    },
    "es-ES": {
      metaTitle: "Wan 2.7 Image Edit Pro - Hasta 9 imágenes y tamaño personalizado | joymagic",
      metaDescription:
        "Edita y transforma imágenes con Wan 2.7 Image Edit Pro. Sube hasta 9 imágenes, controla el tamaño hasta 4096 y ajusta el resultado con seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro está pensado para flujos de edición multiimagen más avanzados. Sube hasta 9 referencias, explica qué debe mantenerse y qué debe cambiar, y controla el resultado con width, height, size y seed.",
      firstFeatureDescription:
        "Usa hasta 9 imágenes de referencia cuando necesites más guía de estructura, silueta, color o apariencia.",
      faqMaxImagesAnswer:
        "El formulario actual admite hasta 9 imágenes de referencia, algo útil para guía multiimagen, igualación de color y ediciones más complejas.",
      ctaTitle: "Empieza a editar con Wan 2.7 Image Edit Pro",
      ctaDescription:
        "Sube hasta 9 referencias, define el tamaño de salida y prueba Wan 2.7 Image Edit Pro en flujos avanzados de imagen a imagen.",
      ctaButton: "Probar Wan 2.7 Image Edit Pro",
      howToName: "Cómo editar imágenes con Wan 2.7 Image Edit Pro",
      howToDescription:
        "Edita imágenes con Wan 2.7 Image Edit Pro usando múltiples referencias y prompts.",
      howToSteps: [
        { name: "Sube referencias", text: "Sube hasta 9 imágenes como guía de estructura, silueta, color o composición." },
        { name: "Define el tamaño", text: "Usa los controles de width y height para fijar el tamaño; la página generará el parámetro size automáticamente." },
        { name: "Escribe el prompt y genera", text: "Aclara qué debe mantenerse y qué debe cambiar, luego ejecuta la edición e itera." },
      ],
    },
    "it-IT": {
      metaTitle: "Wan 2.7 Image Edit Pro - Fino a 9 immagini e dimensione personalizzata | joymagic",
      metaDescription:
        "Modifica e trasforma immagini con Wan 2.7 Image Edit Pro. Carica fino a 9 immagini, controlla la dimensione fino a 4096 e rifinisci il risultato con seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro è pensato per workflow multi-immagine più avanzati. Carica fino a 9 riferimenti, descrivi cosa deve restare e cosa deve cambiare, poi controlla il risultato con width, height, size e seed.",
      firstFeatureDescription:
        "Usa fino a 9 immagini di riferimento quando ti serve più guida su struttura, silhouette, colore o aspetto.",
      faqMaxImagesAnswer:
        "Il modulo attuale supporta fino a 9 immagini di riferimento, utile per guida multi-immagine, abbinamento colore e modifiche più complesse.",
      ctaTitle: "Inizia a modificare con Wan 2.7 Image Edit Pro",
      ctaDescription:
        "Carica fino a 9 riferimenti, imposta la dimensione di output e prova Wan 2.7 Image Edit Pro nei workflow avanzati immagine a immagine.",
      ctaButton: "Prova Wan 2.7 Image Edit Pro",
      howToName: "Come modificare immagini con Wan 2.7 Image Edit Pro",
      howToDescription:
        "Modifica immagini con Wan 2.7 Image Edit Pro usando più riferimenti e prompt.",
      howToSteps: [
        { name: "Carica i riferimenti", text: "Carica fino a 9 immagini come guida per struttura, silhouette, colore o composizione." },
        { name: "Imposta la dimensione", text: "Usa i controlli di width e height per definire la dimensione; la pagina genererà automaticamente il parametro size." },
        { name: "Scrivi il prompt e genera", text: "Specifica cosa conservare e cosa modificare, poi avvia l'editing e continua a iterare." },
      ],
    },
    "pt-BR": {
      metaTitle: "Wan 2.7 Image Edit Pro - Até 9 imagens e tamanho personalizado | joymagic",
      metaDescription:
        "Edite e transforme imagens com Wan 2.7 Image Edit Pro. Envie até 9 imagens, controle o tamanho até 4096 e refine o resultado com seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro foi pensado para fluxos multi-imagem mais avançados. Envie até 9 referências, diga o que deve ser preservado e o que deve mudar e controle o resultado com width, height, size e seed.",
      firstFeatureDescription:
        "Use até 9 imagens de referência quando precisar de mais guia de estrutura, silhueta, cor ou aparência.",
      faqMaxImagesAnswer:
        "O formulário atual suporta até 9 imagens de referência, útil para guia multi-imagem, correspondência de cor e edições mais complexas.",
      ctaTitle: "Comece a editar com Wan 2.7 Image Edit Pro",
      ctaDescription:
        "Envie até 9 referências, defina o tamanho de saída e teste o Wan 2.7 Image Edit Pro em fluxos avançados de imagem para imagem.",
      ctaButton: "Testar Wan 2.7 Image Edit Pro",
      howToName: "Como editar imagens com Wan 2.7 Image Edit Pro",
      howToDescription:
        "Edite imagens com Wan 2.7 Image Edit Pro usando várias referências e prompts.",
      howToSteps: [
        { name: "Envie referências", text: "Envie até 9 imagens como guia de estrutura, silhueta, cor ou composição." },
        { name: "Defina o tamanho", text: "Use os controles de width e height para definir o tamanho; a página gerará o parâmetro size automaticamente." },
        { name: "Escreva o prompt e gere", text: "Explique o que deve ser preservado e o que deve mudar, depois execute a edição e continue iterando." },
      ],
    },
    "ru-RU": {
      metaTitle: "Wan 2.7 Image Edit Pro - До 9 изображений и пользовательский размер | joymagic",
      metaDescription:
        "Редактируйте и трансформируйте изображения с Wan 2.7 Image Edit Pro. Загружайте до 9 изображений, управляйте размером до 4096 и уточняйте результат через seed.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro подходит для более сложных multi-image workflow. Загрузите до 9 референсов, опишите, что нужно сохранить и что изменить, а затем управляйте результатом через width, height, size и seed.",
      firstFeatureDescription:
        "Используйте до 9 референсных изображений, когда нужна более сильная подсказка по структуре, силуэту, цвету или внешнему виду.",
      faqMaxImagesAnswer:
        "Текущая форма поддерживает до 9 референсных изображений, что полезно для multi-image guidance, color matching и более сложных правок.",
      ctaTitle: "Начните редактировать с Wan 2.7 Image Edit Pro",
      ctaDescription:
        "Загрузите до 9 референсов, задайте размер вывода и протестируйте Wan 2.7 Image Edit Pro в продвинутых сценариях image-to-image.",
      ctaButton: "Попробовать Wan 2.7 Image Edit Pro",
      howToName: "Как редактировать изображения с Wan 2.7 Image Edit Pro",
      howToDescription:
        "Редактируйте изображения с Wan 2.7 Image Edit Pro, используя несколько референсов и промпты.",
      howToSteps: [
        { name: "Загрузите референсы", text: "Загрузите до 9 изображений как подсказку по структуре, силуэту, цвету или композиции." },
        { name: "Задайте размер", text: "Используйте контролы width и height для размера вывода; страница автоматически сформирует параметр size." },
        { name: "Напишите промпт и запустите", text: "Четко укажите, что сохранить и что изменить, затем запустите редактирование и продолжайте дорабатывать." },
      ],
    },
    "tr-TR": {
      metaTitle: "Wan 2.7 Image Edit Pro - 9 görsele kadar ve özel boyut | joymagic",
      metaDescription:
        "Wan 2.7 Image Edit Pro ile görselleri düzenleyin ve dönüştürün. 9 adede kadar görsel yükleyin, boyutu 4096'ya kadar kontrol edin ve sonucu seed ile iyileştirin.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro daha gelişmiş çoklu görsel düzenleme akışları için tasarlandı. 9 adede kadar referans yükleyin, neyin korunacağını ve neyin değişeceğini yazın, ardından sonucu width, height, size ve seed ile yönetin.",
      firstFeatureDescription:
        "Yapı, silüet, renk veya görünüm rehberliği gerektiğinde 9 adede kadar referans görsel kullanın.",
      faqMaxImagesAnswer:
        "Geçerli form 9 adede kadar referans görsel destekler; bu da çoklu görsel rehberliği, renk eşleme ve daha karmaşık düzenlemeler için faydalıdır.",
      ctaTitle: "Wan 2.7 Image Edit Pro ile düzenlemeye başlayın",
      ctaDescription:
        "9 adede kadar referans yükleyin, çıktı boyutunu ayarlayın ve Wan 2.7 Image Edit Pro'yu gelişmiş image-to-image akışlarında test edin.",
      ctaButton: "Wan 2.7 Image Edit Pro'yu dene",
      howToName: "Wan 2.7 Image Edit Pro ile görseller nasıl düzenlenir",
      howToDescription:
        "Birden fazla referans görsel ve prompt ile Wan 2.7 Image Edit Pro kullanarak görselleri düzenleyin.",
      howToSteps: [
        { name: "Referans yükleyin", text: "Yapı, silüet, renk veya kompozisyon rehberi olarak 9 adede kadar görsel yükleyin." },
        { name: "Boyutu ayarlayın", text: "Width ve height kontrolleriyle çıktı boyutunu belirleyin; sayfa size parametresini otomatik oluşturur." },
        { name: "Prompt yazın ve üretin", text: "Neyin korunacağını ve neyin değişeceğini açıkça yazın, ardından düzenlemeyi başlatıp yineleyin." },
      ],
    },
    "ps-AF": {
      metaTitle: "Wan 2.7 Image Edit Pro - تر 9 انځورونو او دودیزې اندازې پورې | joymagic",
      metaDescription:
        "انځورونه د Wan 2.7 Image Edit Pro په مرسته سم او بدل کړئ. تر 9 پورې انځورونه پورته کړئ، اندازه تر 4096 پورې کنټرول کړئ او پایلې د seed په وسیله اصلاح کړئ.",
      heroTitle: "Wan 2.7 Image Edit Pro",
      heroDescription:
        "Wan 2.7 Image Edit Pro د څو انځوریزو پرمختللو سمونیزو بهیرونو لپاره مناسب دی. تر 9 پورې مرستندویه انځورونه پورته کړئ، ولیکئ چې څه باید پاتې شي او څه باید بدل شي، بیا د width، height، size او seed په مرسته پایله کنټرول کړئ.",
      firstFeatureDescription:
        "کله چې د جوړښت، سیلوېټ، رنګ یا بڼې پیاوړې لارښوونې ته اړتیا وي، تر 9 پورې مرستندویه انځورونه وکاروئ.",
      faqMaxImagesAnswer:
        "اوسنی فورم تر 9 پورې مرستندویه انځورونه ملاتړ کوي، چې د څو انځوریزې لارښوونې، د رنګ سمون او لا پېچلو سمونونو لپاره ګټور دی.",
      ctaTitle: "له Wan 2.7 Image Edit Pro سره سمون پیل کړئ",
      ctaDescription:
        "تر 9 پورې مرستندویه انځورونه پورته کړئ، د وتۍ اندازه وټاکئ او Wan 2.7 Image Edit Pro په پرمختللو image-to-image بهیرونو کې وازمویئ.",
      ctaButton: "Wan 2.7 Image Edit Pro وازمویه",
      howToName: "په Wan 2.7 Image Edit Pro سره انځورونه څنګه سم کړو",
      howToDescription:
        "په Wan 2.7 Image Edit Pro سره د څو مرستندویه انځورونو او prompt په کارولو انځورونه سم کړئ.",
      howToSteps: [
        { name: "مرستندویه انځورونه پورته کړئ", text: "تر 9 پورې انځورونه د جوړښت، سیلوېټ، رنګ یا composition د لارښوونې لپاره پورته کړئ." },
        { name: "اندازه وټاکئ", text: "د width او height کنټرولونه وکاروئ؛ پاڼه به size پارامیټر په اوتومات ډول جوړ کړي." },
        { name: "Prompt ولیکئ او تولید یې کړئ", text: "روښانه کړئ چې څه باید پاتې شي او څه باید بدل شي، بیا سمون پیل کړئ او بیا یې تکرار کړئ." },
      ],
    },
  };

  overrides["en-IN"] = overrides.en;
  overrides["zh-hk"] = overrides["zh-Hant-TW"];

  return overrides[locale] || overrides.en;
}

function getPageCopy(locale: string) {
  const base = getWan27ImageToImagePageCopy(locale);
  const pro = getProOverrides(locale);

  return {
    ...base,
    metaTitle: pro.metaTitle,
    metaDescription: pro.metaDescription,
    heroTitle: pro.heroTitle,
    heroDescription: pro.heroDescription,
    features: base.features.map((item, index) =>
      index === 0
        ? {
            ...item,
            description: pro.firstFeatureDescription,
          }
        : item,
    ),
    faq: base.faq.map((item, index) =>
      index === 2
        ? {
            ...item,
            answer: pro.faqMaxImagesAnswer,
          }
        : item,
    ),
    ctaTitle: pro.ctaTitle,
    ctaDescription: pro.ctaDescription,
    ctaButton: pro.ctaButton,
    breadcrumbModel: pro.heroTitle,
    howToName: pro.howToName,
    howToDescription: pro.howToDescription,
    softwareName: `joymagic ${pro.heroTitle}`,
    featureList: [
      base.featureList[0] || "AI image-to-image editing",
      "Up to 9 input images",
      base.featureList[1] || "Custom size control",
      base.featureList[2] || "Seed control",
    ],
    howToSteps: pro.howToSteps,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const copy = getPageCopy(locale);
  const canonicalUrl =
    locale !== envConfigs.locale
      ? `${envConfigs.app_url}/${locale}/image-to-image/wan-2-7-image-edit-pro`
      : `${envConfigs.app_url}/image-to-image/wan-2-7-image-edit-pro`;

  return {
    title: copy.metaTitle,
    description: copy.metaDescription,
    keywords: copy.metaKeywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: copy.metaTitle,
      description: copy.metaDescription,
      url: canonicalUrl,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: copy.metaTitle,
      description: copy.metaDescription,
    },
  };
}

export default async function Wan27ImageEditProPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const copy = getPageCopy(locale);
  const labels = getWan27CommonLabels(locale);
  const tHeader = await getTranslations("landing.header");
  const headerNav = tHeader.raw("nav") as any;
  const headerNavItems = headerNav?.items || [];

  const heroData: HeroType = {
    id: "hero",
    title: copy.heroTitle,
    description: copy.heroDescription,
    buttons: [
      {
        title: labels.tryNow,
        url: "#playground",
        variant: "default",
      },
      {
        title: labels.viewPricing,
        url: "/pricing",
        variant: "outline",
      },
    ],
  };

  const keyFeatures: FeaturesType = {
    id: "key-features",
    title: copy.featuresTitle,
    description: copy.featuresDescription,
    items: copy.features,
  };

  const faqData: FAQType = {
    id: "faq",
    title: copy.faqTitle,
    description: copy.faqDescription,
    items: copy.faq,
  };

  const finalCTA: CTAType = {
    id: "final-cta",
    title: copy.ctaTitle,
    description: copy.ctaDescription,
    buttons: [
      {
        title: copy.ctaButton,
        url: "#playground",
        variant: "default",
      },
    ],
  };

  const softwareSchema = generateSoftwareApplicationSchema({
    name: copy.softwareName,
    description: copy.metaDescription,
    url: "/image-to-image/wan-2-7-image-edit-pro",
    locale,
    category: "MultimediaApplication",
    features: copy.featureList,
  });

  const howToSchema = generateHowToSchema({
    name: copy.howToName,
    description: copy.howToDescription,
    steps: copy.howToSteps,
    totalTime: "PT1M",
  });

  const faqSchema = generateFAQSchema(
    faqData.items?.map((item) => ({
      question: item.question || "",
      answer: typeof item.answer === "string" ? item.answer : "",
    })) || [],
  );

  const breadcrumbSchema = generateBreadcrumbSchema(
    [
      { name: labels.home, url: "/" },
      {
        name: labels.imageToImage,
        url: "/image-to-image",
      },
      { name: copy.breadcrumbModel, url: "/image-to-image/wan-2-7-image-edit-pro" },
    ],
    locale,
  );

  const tipIcons = [Lightbulb, Palette, Maximize, Target];
  const useCaseIcons = [Layers, Sparkles, CheckCircle2, Maximize];

  return (
    <>
      <JsonLd data={[softwareSchema, howToSchema, faqSchema, breadcrumbSchema]} />
      <AiMediaPageLayout
        hero={heroData}
        headerNavItems={headerNavItems}
        playgroundConfig={wan27ImageEditProConfig}
      >
        <Features features={keyFeatures} className="py-16 md:py-24" />

        <section className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                  {copy.tipsTitle}
                </h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {copy.tips.map((tip, index) => {
                    const Icon = tipIcons[index] || Sparkles;
                    return (
                      <div key={tip.title} className="rounded-lg border bg-card p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className="size-5 text-primary" />
                          <h3 className="font-semibold">{tip.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tip.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <ScrollAnimation>
                <h2 className="mb-6 text-center text-3xl font-semibold tracking-tight">
                  {copy.useCasesTitle}
                </h2>
                <div className="mt-8 grid gap-6 md:grid-cols-2">
                  {copy.useCases.map((item, index) => {
                    const Icon = useCaseIcons[index] || Sparkles;
                    return (
                      <div key={item.title} className="rounded-lg border bg-card p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <Icon className="size-5 text-primary" />
                          <h3 className="font-semibold">{item.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </ScrollAnimation>
            </div>
          </div>
        </section>

        <FAQ faq={faqData} className="py-16 md:py-24" />
        <CTA cta={finalCTA} className="py-16 md:py-24" />
      </AiMediaPageLayout>
    </>
  );
}
