import type {
  ModelLandingNarrativeConfig,
  ModelNarrativeCta,
  ModelNarrativePromise,
  ModelNarrativeProof,
  ModelNarrativeStage,
} from "@/shared/lib/model-landing-narrative-config";

type LandingHowItWorksStep = {
  step: string;
  title: string;
  copy: string;
};

export type ModelLandingTemplateCopy = {
  whyModelTitle: string;
  whyModelDescription: string;
  howItWorksTitle: string;
  howItWorksDescription: string;
  howItWorksSteps: LandingHowItWorksStep[];
  workflowsTitle: string;
  workflowsDescription: string;
  bestForTitle: string;
  bestForDescription: string;
  galleryTitle: string;
  galleryDescription: string;
  galleryLead: string;
  faqTitle: string;
  faqDescription: string;
  openWithPrompt: string;
  openInCreator: string;
  sampleLabel: string;
  fallbackSampleTitle: string;
  fallbackSampleCaption: string;
  controls: {
    promptWorkflow: string;
    creatorSync: string;
    uploadUpToRefs: string;
    referenceUploads: string;
    aspectRatios: string;
    resolutionPresets: string;
  };
};

type TemplateCopyContext = {
  locale: string;
  modelName: string;
  provider: string;
  modeLabels: string[];
  narrative: ModelLandingNarrativeConfig;
};

function uniqueModeLabels(modeLabels: string[]) {
  return Array.from(new Set(modeLabels.filter(Boolean)));
}

function joinModes(locale: string, modeLabels: string[]) {
  const modes = uniqueModeLabels(modeLabels);

  switch (locale) {
    case "zh":
    case "zh-Hant-TW":
    case "zh-hk":
    case "ja-JP":
      return modes.join("、");
    case "ko-KR":
      return modes.join(", ");
    default:
      return modes.join(", ");
  }
}

function getPromisePhrase(locale: string, promise: ModelNarrativePromise) {
  const phrases: Record<ModelNarrativePromise, string> =
    locale === "zh"
      ? {
          "fast-generalist": "快速通用创作",
          "commercial-stills": "商业级静态视觉",
          "prompt-ideation": "提示词驱动的概念探索",
          "typography-concepts": "擅长文字与版式的概念生成",
          "multi-ref-editing": "多参考图高控制编辑",
          "precision-editing": "高精度图像编辑",
          "cinematic-image": "电影感图像创作",
          "cinematic-video": "电影感视频叙事",
          "social-video": "社媒短视频生成",
          "camera-control": "可控镜头运动",
          cleanup: "图像清理",
          cutout: "主体抠图",
          upscale: "高清放大",
          "avatar-video": "头像驱动视频",
          "face-swap": "视频换脸",
          "layered-edit": "分层局部编辑",
          "character-restyle": "角色风格重塑",
        }
      : locale === "zh-Hant-TW" || locale === "zh-hk"
        ? {
            "fast-generalist": "快速通用創作",
            "commercial-stills": "商業級靜態視覺",
            "prompt-ideation": "提示詞驅動的概念探索",
            "typography-concepts": "擅長文字與版式的概念生成",
            "multi-ref-editing": "多參考圖高控制編輯",
            "precision-editing": "高精度圖像編輯",
            "cinematic-image": "電影感圖像創作",
            "cinematic-video": "電影感影片敘事",
            "social-video": "社群短影片生成",
            "camera-control": "可控鏡頭運動",
            cleanup: "圖像清理",
            cutout: "主體去背",
            upscale: "高清放大",
            "avatar-video": "頭像驅動影片",
            "face-swap": "影片換臉",
            "layered-edit": "分層局部編輯",
            "character-restyle": "角色風格重塑",
          }
        : locale === "de-DE"
          ? {
              "fast-generalist": "schnelle Allround-Erstellung",
              "commercial-stills": "kommerzielle Standbilder",
              "prompt-ideation": "prompt-getriebene Ideenfindung",
              "typography-concepts": "typografieorientierte Konzepte",
              "multi-ref-editing": "High-Control-Editing mit mehreren Referenzen",
              "precision-editing": "praezises Bild-Editing",
              "cinematic-image": "cineastische Bildgestaltung",
              "cinematic-video": "cineastisches Storytelling in Videoform",
              "social-video": "Social-Video-Erstellung",
              "camera-control": "steuerbare Kamerafuehrung",
              cleanup: "Bildbereinigung",
              cutout: "Freistellung",
              upscale: "Hochskalierung",
              "avatar-video": "avatargetriebenes Video",
              "face-swap": "Face-Swap fuer Video",
              "layered-edit": "lokales Layer-Editing",
              "character-restyle": "Character-Restyling",
            }
          : locale === "ko-KR"
            ? {
                "fast-generalist": "빠른 범용 제작",
                "commercial-stills": "상업용 정지 비주얼",
                "prompt-ideation": "프롬프트 중심 아이디어 탐색",
                "typography-concepts": "텍스트와 레이아웃에 강한 콘셉트 생성",
                "multi-ref-editing": "멀티 레퍼런스 고제어 편집",
                "precision-editing": "정밀 이미지 편집",
                "cinematic-image": "시네마틱 이미지 제작",
                "cinematic-video": "시네마틱 영상 서사",
                "social-video": "소셜 쇼트폼 영상 제작",
                "camera-control": "제어 가능한 카메라 무브",
                cleanup: "이미지 정리",
                cutout: "피사체 분리",
                upscale: "고해상도 업스케일",
                "avatar-video": "아바타 기반 영상",
                "face-swap": "영상 얼굴 교체",
                "layered-edit": "레이어 기반 국소 편집",
                "character-restyle": "캐릭터 스타일 재구성",
              }
            : locale === "ja-JP"
              ? {
                  "fast-generalist": "高速な汎用制作",
                  "commercial-stills": "商用向け静止ビジュアル",
                  "prompt-ideation": "プロンプト主導のコンセプト探索",
                  "typography-concepts": "文字とレイアウトに強いコンセプト生成",
                  "multi-ref-editing": "複数参照による高制御編集",
                  "precision-editing": "高精度な画像編集",
                  "cinematic-image": "シネマティックな画像制作",
                  "cinematic-video": "シネマティックな動画ストーリーテリング",
                  "social-video": "ソーシャル向け短尺動画生成",
                  "camera-control": "制御しやすいカメラ演出",
                  cleanup: "画像クリーンアップ",
                  cutout: "被写体切り抜き",
                  upscale: "高解像度アップスケール",
                  "avatar-video": "アバター駆動動画",
                  "face-swap": "動画フェイススワップ",
                  "layered-edit": "レイヤー単位の局所編集",
                  "character-restyle": "キャラクタースタイル再構成",
                }
              : locale === "es-ES"
                ? {
                    "fast-generalist": "creacion generalista rapida",
                    "commercial-stills": "visuales fijos comerciales",
                    "prompt-ideation": "exploracion conceptual guiada por prompt",
                    "typography-concepts": "conceptos fuertes en texto y composicion",
                    "multi-ref-editing": "edicion de alto control con multiples referencias",
                    "precision-editing": "edicion de imagen de alta precision",
                    "cinematic-image": "creacion de imagen cinematografica",
                    "cinematic-video": "narrativa de video cinematografica",
                    "social-video": "generacion de video social",
                    "camera-control": "movimiento de camara controlable",
                    cleanup: "limpieza de imagen",
                    cutout: "recorte de sujeto",
                    upscale: "ampliacion en alta resolucion",
                    "avatar-video": "video impulsado por avatar",
                    "face-swap": "face swap en video",
                    "layered-edit": "edicion local por capas",
                    "character-restyle": "restyling de personaje",
                  }
                : locale === "it-IT"
                  ? {
                      "fast-generalist": "creazione generalista rapida",
                      "commercial-stills": "visual statici commerciali",
                      "prompt-ideation": "esplorazione concettuale guidata da prompt",
                      "typography-concepts": "concept forti su testo e layout",
                      "multi-ref-editing": "editing ad alto controllo con piu riferimenti",
                      "precision-editing": "editing immagini ad alta precisione",
                      "cinematic-image": "creazione di immagini cinematografiche",
                      "cinematic-video": "narrazione video cinematografica",
                      "social-video": "generazione video per social",
                      "camera-control": "movimento camera controllabile",
                      cleanup: "pulizia immagine",
                      cutout: "scontorno del soggetto",
                      upscale: "upscale ad alta risoluzione",
                      "avatar-video": "video guidato da avatar",
                      "face-swap": "face swap video",
                      "layered-edit": "editing locale a livelli",
                      "character-restyle": "restyling del personaggio",
                    }
                  : locale === "pt-BR"
                    ? {
                        "fast-generalist": "criacao generalista rapida",
                        "commercial-stills": "visuais estaticos comerciais",
                        "prompt-ideation": "exploracao conceitual guiada por prompt",
                        "typography-concepts": "conceitos fortes em texto e layout",
                        "multi-ref-editing": "edicao de alto controle com multiplas referencias",
                        "precision-editing": "edicao de imagem de alta precisao",
                        "cinematic-image": "criacao de imagem cinematografica",
                        "cinematic-video": "narrativa de video cinematografica",
                        "social-video": "geracao de video social",
                        "camera-control": "movimento de camera controlavel",
                        cleanup: "limpeza de imagem",
                        cutout: "recorte de sujeito",
                        upscale: "upscale em alta resolucao",
                        "avatar-video": "video guiado por avatar",
                        "face-swap": "troca de rosto em video",
                        "layered-edit": "edicao local em camadas",
                        "character-restyle": "restyle de personagem",
                      }
                    : locale === "ru-RU"
                      ? {
                          "fast-generalist": "быстрое универсальное создание",
                          "commercial-stills": "коммерческие статичные визуалы",
                          "prompt-ideation": "поиск концепций через промпт",
                          "typography-concepts": "концепты с сильным текстом и композицией",
                          "multi-ref-editing": "высококонтрольное редактирование по нескольким референсам",
                          "precision-editing": "точное редактирование изображений",
                          "cinematic-image": "кинематографичная работа с изображением",
                          "cinematic-video": "кинематографичное видеоповествование",
                          "social-video": "создание коротких социальных видео",
                          "camera-control": "управляемая работа камеры",
                          cleanup: "очистка изображения",
                          cutout: "вырезание объекта",
                          upscale: "апскейл в высоком разрешении",
                          "avatar-video": "видео на основе аватара",
                          "face-swap": "замена лица в видео",
                          "layered-edit": "локальное послойное редактирование",
                          "character-restyle": "перестройка стиля персонажа",
                        }
                      : locale === "tr-TR"
                        ? {
                            "fast-generalist": "hizli genel amacli uretim",
                            "commercial-stills": "ticari sabit gorseller",
                            "prompt-ideation": "prompt odakli fikir kesfi",
                            "typography-concepts": "metin ve yerlesimde guclu konsept uretimi",
                            "multi-ref-editing": "coklu referansla yuksek kontrollu duzenleme",
                            "precision-editing": "yuksek hassasiyetli gorsel duzenleme",
                            "cinematic-image": "sinematik goruntu uretimi",
                            "cinematic-video": "sinematik video anlatisi",
                            "social-video": "sosyal video uretimi",
                            "camera-control": "kontrol edilebilir kamera hareketi",
                            cleanup: "gorsel temizleme",
                            cutout: "ozne ayirma",
                            upscale: "yuksek cozunurlukte buyutme",
                            "avatar-video": "avatar odakli video",
                            "face-swap": "video yuz degistirme",
                            "layered-edit": "katmanli yerel duzenleme",
                            "character-restyle": "karakter stilini yeniden kurma",
                          }
                        : locale === "ps-AF"
                          ? {
                              "fast-generalist": "چټکه عمومي توليد",
                              "commercial-stills": "سوداګريز ثابت بصري مواد",
                              "prompt-ideation": "د prompt پر بنسټ مفکوره سپړنه",
                              "typography-concepts": "د متن او layout پياوړي conceptونه",
                              "multi-ref-editing": "د څو referenceونو له لارې لوړ کنټرول edit",
                              "precision-editing": "لوړ دقت لرونکی image edit",
                              "cinematic-image": "سینمايي image جوړونه",
                              "cinematic-video": "سینمايي video narrative",
                              "social-video": "د social video توليد",
                              "camera-control": "کنټرولېدونکی camera حرکت",
                              cleanup: "image پاکول",
                              cutout: "د subject جلا کول",
                              upscale: "لوړ resolution upscale",
                              "avatar-video": "avatar-محور video",
                              "face-swap": "د video face swap",
                              "layered-edit": "layered local edit",
                              "character-restyle": "د character style بياجوړونه",
                            }
                          : {
                              "fast-generalist": "fast generalist creation",
                              "commercial-stills": "commercial still generation",
                              "prompt-ideation": "prompt-led concept exploration",
                              "typography-concepts":
                                "text- and layout-friendly concept generation",
                              "multi-ref-editing":
                                "high-control multi-reference editing",
                              "precision-editing": "precision image editing",
                              "cinematic-image": "cinematic image creation",
                              "cinematic-video": "cinematic video storytelling",
                              "social-video": "social-first video generation",
                              "camera-control": "controllable camera movement",
                              cleanup: "image cleanup",
                              cutout: "subject cutout",
                              upscale: "high-resolution upscaling",
                              "avatar-video": "avatar-driven video",
                              "face-swap": "video face swap",
                              "layered-edit": "layered local editing",
                              "character-restyle": "character restyling",
                            };

  return phrases[promise];
}

function getStagePhrase(locale: string, stage: ModelNarrativeStage) {
  const phrases: Record<ModelNarrativeStage, string> =
    locale === "zh"
      ? {
          exploration: "前期探索",
          "art-direction": "视觉定向",
          "asset-polish": "素材精修",
          "motion-previs": "动态预演",
          "delivery-prep": "交付准备",
          utility: "效率型处理",
        }
      : locale === "zh-Hant-TW" || locale === "zh-hk"
        ? {
            exploration: "前期探索",
            "art-direction": "視覺定向",
            "asset-polish": "素材精修",
            "motion-previs": "動態預演",
            "delivery-prep": "交付準備",
            utility: "效率型處理",
          }
        : locale === "de-DE"
          ? {
              exploration: "fruehen Explorationsphasen",
              "art-direction": "Art-Direction-Phase",
              "asset-polish": "Polish- und Veredelungsphase",
              "motion-previs": "Motion-Previs-Phase",
              "delivery-prep": "Vorbereitung fuer Auslieferung",
              utility: "utility-orientierten Aufgaben",
            }
          : locale === "ko-KR"
            ? {
                exploration: "초기 탐색 단계",
                "art-direction": "아트 디렉션 단계",
                "asset-polish": "에셋 폴리시 단계",
                "motion-previs": "모션 프리비즈 단계",
                "delivery-prep": "최종 산출 준비 단계",
                utility: "실무형 처리 단계",
              }
            : locale === "ja-JP"
              ? {
                  exploration: "初期探索段階",
                  "art-direction": "アートディレクション段階",
                  "asset-polish": "アセット磨き込み段階",
                  "motion-previs": "モーション・プリビズ段階",
                  "delivery-prep": "納品準備段階",
                  utility: "効率重視の処理段階",
                }
              : locale === "es-ES"
                ? {
                    exploration: "fase de exploracion",
                    "art-direction": "fase de direccion de arte",
                    "asset-polish": "fase de pulido de assets",
                    "motion-previs": "fase de previs de movimiento",
                    "delivery-prep": "fase de preparacion de entrega",
                    utility: "tareas utilitarias",
                  }
                : locale === "it-IT"
                  ? {
                      exploration: "fase di esplorazione",
                      "art-direction": "fase di art direction",
                      "asset-polish": "fase di rifinitura degli asset",
                      "motion-previs": "fase di previs motion",
                      "delivery-prep": "fase di preparazione alla consegna",
                      utility: "attivita operative di utilita",
                    }
                  : locale === "pt-BR"
                    ? {
                        exploration: "fase de exploracao",
                        "art-direction": "fase de direcao de arte",
                        "asset-polish": "fase de refinamento de assets",
                        "motion-previs": "fase de previs de movimento",
                        "delivery-prep": "fase de preparacao para entrega",
                        utility: "tarefas utilitarias",
                      }
                    : locale === "ru-RU"
                      ? {
                          exploration: "этапе раннего поиска",
                          "art-direction": "этапе арт-дирекшна",
                          "asset-polish": "этапе полировки материалов",
                          "motion-previs": "этапе превиза движения",
                          "delivery-prep": "этапе подготовки к выдаче",
                          utility: "утилитарных задачах",
                        }
                      : locale === "tr-TR"
                        ? {
                            exploration: "kesif asamasi",
                            "art-direction": "art direction asamasi",
                            "asset-polish": "asset cilalama asamasi",
                            "motion-previs": "hareket previs asamasi",
                            "delivery-prep": "teslimat hazirligi asamasi",
                            utility: "yardimci islerde",
                          }
                        : locale === "ps-AF"
                          ? {
                              exploration: "د لومړنۍ سپړنې پړاو",
                              "art-direction": "د art direction پړاو",
                              "asset-polish": "د asset polish پړاو",
                              "motion-previs": "د motion previs پړاو",
                              "delivery-prep": "د سپارلو چمتووالي پړاو",
                              utility: "د utilitarian دندو",
                            }
                          : {
                              exploration: "early exploration",
                              "art-direction": "art-direction",
                              "asset-polish": "asset-polish",
                              "motion-previs": "motion previs",
                              "delivery-prep": "delivery prep",
                              utility: "utility-oriented work",
                            };
  return phrases[stage];
}

function getProofPhrase(locale: string, proof: ModelNarrativeProof) {
  const phrases: Record<ModelNarrativeProof, string> =
    locale === "zh"
      ? {
          speed: "更快的出稿速度",
          control: "更强的参数和结果控制",
          consistency: "更稳定的一致性",
          cinematic: "更强的电影感与氛围",
          typography: "更可读的文字与版式表现",
          cleanup: "更省时的清理效率",
          resolution: "更稳定的清晰度提升",
          character: "更可靠的人物与角色表现",
          camera: "更明确的镜头语言控制",
        }
      : locale === "zh-Hant-TW" || locale === "zh-hk"
        ? {
            speed: "更快的出稿速度",
            control: "更強的參數與結果控制",
            consistency: "更穩定的一致性",
            cinematic: "更強的電影感與氛圍",
            typography: "更可讀的文字與版式表現",
            cleanup: "更省時的清理效率",
            resolution: "更穩定的清晰度提升",
            character: "更可靠的人物與角色表現",
            camera: "更明確的鏡頭語言控制",
          }
        : locale === "de-DE"
          ? {
              speed: "hohes Tempo",
              control: "engere Kontrolle",
              consistency: "konstantere Ergebnisse",
              cinematic: "staerkere cineastische Wirkung",
              typography: "bessere Lesbarkeit von Text und Layout",
              cleanup: "schnellere Bereinigung",
              resolution: "zuverlaessigere Aufloesungssteigerung",
              character: "stabilere Personen- und Charakterdarstellung",
              camera: "klarere Kamerafuehrung",
            }
          : locale === "ko-KR"
            ? {
                speed: "더 빠른 산출 속도",
                control: "더 강한 제어력",
                consistency: "더 안정적인 일관성",
                cinematic: "더 강한 시네마틱 분위기",
                typography: "더 읽기 쉬운 텍스트와 레이아웃",
                cleanup: "더 빠른 정리 효율",
                resolution: "더 안정적인 해상도 향상",
                character: "더 믿을 수 있는 인물과 캐릭터 표현",
                camera: "더 분명한 카메라 연출 제어",
              }
            : locale === "ja-JP"
              ? {
                  speed: "より速い初稿スピード",
                  control: "より強い制御性",
                  consistency: "より安定した一貫性",
                  cinematic: "より強いシネマティックな雰囲気",
                  typography: "より読みやすい文字とレイアウト",
                  cleanup: "より省力なクリーンアップ",
                  resolution: "より安定した解像感の向上",
                  character: "より信頼できる人物・キャラクター表現",
                  camera: "より明確なカメラ演出の制御",
                }
              : locale === "es-ES"
                ? {
                    speed: "mas velocidad",
                    control: "mas control",
                    consistency: "mas consistencia",
                    cinematic: "una atmosfera mas cinematografica",
                    typography: "texto y layout mas legibles",
                    cleanup: "limpieza mas eficiente",
                    resolution: "mejor mejora de resolucion",
                    character: "mejor tratamiento de personaje",
                    camera: "un control de camara mas claro",
                  }
                : locale === "it-IT"
                  ? {
                      speed: "piu velocita",
                      control: "piu controllo",
                      consistency: "piu coerenza",
                      cinematic: "un'atmosfera piu cinematografica",
                      typography: "testo e layout piu leggibili",
                      cleanup: "pulizia piu efficiente",
                      resolution: "migliore incremento di risoluzione",
                      character: "migliore resa di personaggi",
                      camera: "controllo camera piu chiaro",
                    }
                  : locale === "pt-BR"
                    ? {
                        speed: "mais velocidade",
                        control: "mais controle",
                        consistency: "mais consistencia",
                        cinematic: "uma atmosfera mais cinematografica",
                        typography: "texto e layout mais legiveis",
                        cleanup: "limpeza mais eficiente",
                        resolution: "ganho de resolucao mais confiavel",
                        character: "melhor tratamento de personagem",
                        camera: "controle de camera mais claro",
                      }
                    : locale === "ru-RU"
                      ? {
                          speed: "большую скорость",
                          control: "больший контроль",
                          consistency: "более стабильную согласованность",
                          cinematic: "более кинематографичную атмосферу",
                          typography: "более читаемый текст и композицию",
                          cleanup: "более быструю очистку",
                          resolution: "более надежное повышение четкости",
                          character: "более надежную работу с персонажами",
                          camera: "более ясный контроль камеры",
                        }
                      : locale === "tr-TR"
                        ? {
                            speed: "daha fazla hiz",
                            control: "daha fazla kontrol",
                            consistency: "daha guvenilir tutarlilik",
                            cinematic: "daha sinematik bir atmosfer",
                            typography: "daha okunabilir metin ve yerlesim",
                            cleanup: "daha hizli temizleme",
                            resolution: "daha guvenilir cozunurluk artisi",
                            character: "daha guvenilir karakter sunumu",
                            camera: "daha net kamera kontrolu",
                          }
                        : locale === "ps-AF"
                          ? {
                              speed: "چټک سرعت",
                              control: "لوړ کنټرول",
                              consistency: "لا باثباته consistency",
                              cinematic: "لا پياوړی سینمايي فضا",
                              typography: "لا لوستونکې متن او layout",
                              cleanup: "لا چټک پاکول",
                              resolution: "لا باوري resolution لوړونه",
                              character: "لا باوري character څرګندونه",
                              camera: "لا روښانه camera control",
                            }
                          : {
                              speed: "more speed",
                              control: "stronger control",
                              consistency: "better consistency",
                              cinematic: "a more cinematic look",
                              typography:
                                "more readable typography and layout",
                              cleanup: "faster cleanup",
                              resolution: "more reliable resolution gains",
                              character: "more reliable character rendering",
                              camera: "clearer camera direction",
                            };
  return phrases[proof];
}

function getCtaCopy(
  locale: string,
  cta: ModelNarrativeCta,
  modelName: string,
) {
  if (locale === "zh") {
    if (cta === "animate") {
      return { open: `用 ${modelName} 开始动效`, creator: `在 Creator 中继续动画化` };
    }
    if (cta === "polish") {
      return { open: `用 ${modelName} 开始精修`, creator: `在 Creator 中继续精修` };
    }
    if (cta === "clean") {
      return { open: `用 ${modelName} 开始处理`, creator: `在 Creator 中继续处理` };
    }
    if (cta === "direct") {
      return { open: `用 ${modelName} 设定镜头`, creator: `在 Creator 中继续控镜` };
    }
    return { open: `用 ${modelName} 开始创建`, creator: `在 Creator 中继续创建` };
  }

  if (locale === "zh-Hant-TW" || locale === "zh-hk") {
    if (cta === "animate") {
      return { open: `用 ${modelName} 開始動效`, creator: `在 Creator 中繼續動畫化` };
    }
    if (cta === "polish") {
      return { open: `用 ${modelName} 開始精修`, creator: `在 Creator 中繼續精修` };
    }
    if (cta === "clean") {
      return { open: `用 ${modelName} 開始處理`, creator: `在 Creator 中繼續處理` };
    }
    if (cta === "direct") {
      return { open: `用 ${modelName} 設定鏡頭`, creator: `在 Creator 中繼續控鏡` };
    }
    return { open: `用 ${modelName} 開始創作`, creator: `在 Creator 中繼續創作` };
  }

  if (cta === "animate") {
    return {
      open: locale === "ja-JP" ? `${modelName} で動画化を始める` : `Start animating with ${modelName}`,
      creator:
        locale === "ja-JP"
          ? `Creator でアニメーションを続ける`
          : `Continue animating in Creator`,
    };
  }
  if (cta === "polish") {
    return {
      open: locale === "ja-JP" ? `${modelName} で仕上げを始める` : `Start polishing with ${modelName}`,
      creator:
        locale === "ja-JP"
          ? `Creator で仕上げを続ける`
          : `Continue polishing in Creator`,
    };
  }
  if (cta === "clean") {
    return {
      open: locale === "ja-JP" ? `${modelName} で処理を始める` : `Start processing with ${modelName}`,
      creator:
        locale === "ja-JP"
          ? `Creator で処理を続ける`
          : `Continue processing in Creator`,
    };
  }
  if (cta === "direct") {
    return {
      open: locale === "ja-JP" ? `${modelName} でカメラ設計を始める` : `Start directing with ${modelName}`,
      creator:
        locale === "ja-JP"
          ? `Creator で演出を続ける`
          : `Continue directing in Creator`,
    };
  }
  return {
    open: locale === "ja-JP" ? `${modelName} で作成を始める` : `Start creating with ${modelName}`,
    creator:
      locale === "ja-JP"
        ? `Creator で作成を続ける`
        : `Continue in Creator`,
  };
}

function buildHowItWorksSteps(
  locale: string,
  modelName: string,
): LandingHowItWorksStep[] {
  switch (locale) {
    case "zh":
      return [
        {
          step: "01",
          title: `选择 ${modelName} 模式`,
          copy: `先在 ${modelName} 支持的核心模式之间切换，直接进入最符合当前目标的工作流。`,
        },
        {
          step: "02",
          title: "添加提示词或参考素材",
          copy: `根据 ${modelName} 当前模式的输入要求，从文本、参考图或现有素材开始组织一次更清晰的生成任务。`,
        },
        {
          step: "03",
          title: `生成并比较 ${modelName} 结果`,
          copy: `在工作台里快速迭代 ${modelName} 的输出，比较不同方向，再把更强的结果继续往下推进。`,
        },
        {
          step: "04",
          title: `继续进入 ${modelName} Creator 流程`,
          copy: `一旦找到合适方向，就直接带着上下文进入 Creator，不需要重新搭建另一套表单或参数。`,
        },
      ];
    case "zh-Hant-TW":
    case "zh-hk":
      return [
        {
          step: "01",
          title: `選擇 ${modelName} 模式`,
          copy: `先在 ${modelName} 支援的核心模式之間切換，直接進入最符合當前目標的工作流程。`,
        },
        {
          step: "02",
          title: "加入提示詞或參考素材",
          copy: `根據 ${modelName} 目前模式的輸入要求，從文字、參考圖或既有素材開始組織一次更清晰的生成任務。`,
        },
        {
          step: "03",
          title: `生成並比較 ${modelName} 結果`,
          copy: `在工作台裡快速迭代 ${modelName} 的輸出，比較不同方向，再把更強的結果繼續往下推進。`,
        },
        {
          step: "04",
          title: `繼續進入 ${modelName} Creator 流程`,
          copy: `一旦找到合適方向，就直接帶著上下文進入 Creator，不需要重新搭建另一套表單或參數。`,
        },
      ];
    case "de-DE":
      return [
        {
          step: "01",
          title: `${modelName}-Modus waehlen`,
          copy: `Wechsle zuerst zwischen den zentralen ${modelName}-Modi, um direkt im passendsten Workflow zu landen.`,
        },
        {
          step: "02",
          title: "Prompt oder Referenzen hinzufuegen",
          copy: `Nutze Text, Referenzbilder oder vorhandene Assets passend zu dem, was der aktuelle ${modelName}-Modus erwartet.`,
        },
        {
          step: "03",
          title: `${modelName}-Ergebnisse erzeugen und vergleichen`,
          copy: `Iteriere die ${modelName}-Outputs direkt im Workbench, vergleiche Richtungen und fuehre die staerksten Ergebnisse weiter.`,
        },
        {
          step: "04",
          title: `Im ${modelName}-Creator weiterarbeiten`,
          copy: `Sobald die Richtung stimmt, wechselst du mit demselben Kontext in Creator, ohne den Workflow neu aufzubauen.`,
        },
      ];
    case "ko-KR":
      return [
        {
          step: "01",
          title: `${modelName} 모드 선택`,
          copy: `${modelName}가 지원하는 핵심 모드 사이를 먼저 전환해 현재 목적에 가장 잘 맞는 워크플로로 바로 들어갑니다.`,
        },
        {
          step: "02",
          title: "프롬프트 또는 참고 자료 추가",
          copy: `현재 ${modelName} 모드가 요구하는 입력에 맞춰 텍스트, 참고 이미지, 기존 소재를 조합해 더 명확한 생성 작업을 시작합니다.`,
        },
        {
          step: "03",
          title: `${modelName} 결과 생성 및 비교`,
          copy: `워크벤치에서 ${modelName} 결과를 빠르게 반복 생성하고 여러 방향을 비교한 뒤 더 강한 결과를 다음 단계로 이어갑니다.`,
        },
        {
          step: "04",
          title: `${modelName} Creator 흐름으로 계속`,
          copy: `방향이 잡히면 같은 컨텍스트를 유지한 채 Creator로 들어가므로 다른 양식이나 파라미터를 다시 만들 필요가 없습니다.`,
        },
      ];
    case "ja-JP":
      return [
        {
          step: "01",
          title: `${modelName} のモードを選択`,
          copy: `${modelName} が対応する主要モードを切り替えながら、今の目的に合うワークフローへすぐに入れます。`,
        },
        {
          step: "02",
          title: "プロンプトまたは参照素材を追加",
          copy: `現在の ${modelName} モードに必要な入力に合わせて、テキスト、参照画像、既存素材を組み合わせて生成を始めます。`,
        },
        {
          step: "03",
          title: `${modelName} の結果を生成して比較`,
          copy: `Workbench 上で ${modelName} の出力を素早く反復し、方向性を比較しながら、より強い結果を次の工程へ進めます。`,
        },
        {
          step: "04",
          title: `${modelName} Creator フローへ進む`,
          copy: `方向性が固まったら、同じコンテキストのまま Creator に移り、別のフォームや設定を作り直さずに続行できます。`,
        },
      ];
    case "es-ES":
      return [
        {
          step: "01",
          title: `Elegir un modo de ${modelName}`,
          copy: `Cambia primero entre los modos principales de ${modelName} para entrar directamente en el flujo que mejor encaja con tu objetivo.`,
        },
        {
          step: "02",
          title: "Anadir prompt o referencias",
          copy: `Usa texto, imagenes de referencia o assets existentes segun lo que pida el modo actual de ${modelName}.`,
        },
        {
          step: "03",
          title: `Generar y comparar salidas de ${modelName}`,
          copy: `Itera los resultados de ${modelName} dentro del workbench, compara direcciones y deja avanzar solo las opciones mas fuertes.`,
        },
        {
          step: "04",
          title: `Continuar en el flujo Creator de ${modelName}`,
          copy: `Cuando la direccion este clara, pasa a Creator con el mismo contexto sin reconstruir el flujo desde cero.`,
        },
      ];
    case "it-IT":
      return [
        {
          step: "01",
          title: `Scegli una modalita di ${modelName}`,
          copy: `Passa tra le modalita principali di ${modelName} per entrare subito nel workflow piu adatto al tuo obiettivo.`,
        },
        {
          step: "02",
          title: "Aggiungi prompt o riferimenti",
          copy: `Usa testo, immagini di riferimento o asset esistenti in base a cio che richiede la modalita corrente di ${modelName}.`,
        },
        {
          step: "03",
          title: `Genera e confronta output di ${modelName}`,
          copy: `Itera rapidamente gli output di ${modelName} nel workbench, confronta direzioni diverse e porta avanti solo i risultati migliori.`,
        },
        {
          step: "04",
          title: `Continua nel flusso Creator di ${modelName}`,
          copy: `Quando la direzione e chiara, entra in Creator con lo stesso contesto senza ricostruire un nuovo workflow.`,
        },
      ];
    case "pt-BR":
      return [
        {
          step: "01",
          title: `Escolha um modo do ${modelName}`,
          copy: `Alterne primeiro entre os modos principais do ${modelName} para entrar direto no fluxo que melhor combina com seu objetivo.`,
        },
        {
          step: "02",
          title: "Adicione prompt ou referencias",
          copy: `Use texto, imagens de referencia ou assets existentes de acordo com o que o modo atual do ${modelName} espera.`,
        },
        {
          step: "03",
          title: `Gere e compare resultados do ${modelName}`,
          copy: `Itere rapidamente as saidas do ${modelName} no workbench, compare direcoes e leve adiante apenas os resultados mais fortes.`,
        },
        {
          step: "04",
          title: `Continue no fluxo Creator do ${modelName}`,
          copy: `Quando a direcao estiver clara, entre no Creator com o mesmo contexto sem reconstruir o fluxo do zero.`,
        },
      ];
    case "ru-RU":
      return [
        {
          step: "01",
          title: `Выберите режим ${modelName}`,
          copy: `Сначала переключитесь между основными режимами ${modelName}, чтобы сразу попасть в сценарий, который лучше всего подходит вашей задаче.`,
        },
        {
          step: "02",
          title: "Добавьте промпт или референсы",
          copy: `Используйте текст, референсные изображения или готовые материалы в зависимости от того, что ожидает текущий режим ${modelName}.`,
        },
        {
          step: "03",
          title: `Сгенерируйте и сравните результаты ${modelName}`,
          copy: `Быстро итерируйте результаты ${modelName} в workbench, сравнивайте направления и продвигайте дальше только самые сильные варианты.`,
        },
        {
          step: "04",
          title: `Продолжайте в Creator для ${modelName}`,
          copy: `Когда направление станет ясным, переходите в Creator с тем же контекстом и не собирайте рабочий процесс заново.`,
        },
      ];
    case "tr-TR":
      return [
        {
          step: "01",
          title: `${modelName} modunu sec`,
          copy: `Once ${modelName} icindeki temel modlar arasinda gecis yaparak amacina en uygun is akisina dogrudan gir.`,
        },
        {
          step: "02",
          title: "Prompt veya referans ekle",
          copy: `Mevcut ${modelName} modunun bekledigi girdiye gore metin, referans gorseller veya mevcut asset'leri kullan.`,
        },
        {
          step: "03",
          title: `${modelName} ciktilarini uret ve karsilastir`,
          copy: `Workbench icinde ${modelName} sonuclarini hizlica yinele, farkli yonleri karsilastir ve en guclu sonucu ileri tası.`,
        },
        {
          step: "04",
          title: `${modelName} Creator akisinda devam et`,
          copy: `Yon netlestiginde ayni baglamla Creator'a gec ve akisi bastan kurmadan calismayi surdur.`,
        },
      ];
    case "ps-AF":
      return [
        {
          step: "01",
          title: `د ${modelName} حالت وټاکئ`,
          copy: `لومړی د ${modelName} اصلي حالتونو ترمنځ بدلول وکړئ، څو سمدستي هغه workflow ته ولاړ شئ چې ستاسو اوسنۍ موخې سره برابر وي.`,
        },
        {
          step: "02",
          title: "prompt يا reference مواد ور اضافه کړئ",
          copy: `د ${modelName} د اوسنۍ بڼې د input غوښتنو له مخې متن، reference انځورونه يا موجود assets وکاروئ.`,
        },
        {
          step: "03",
          title: `د ${modelName} پايلې جوړې او پرتله کړئ`,
          copy: `په workbench کې د ${modelName} پايلې په چټکۍ تکرار کړئ، بېلابېل لوري سره پرتله کړئ، او قوي نتيجې بل پړاو ته يوسئ.`,
        },
        {
          step: "04",
          title: `د ${modelName} Creator بهير ته دوام ورکړئ`,
          copy: `کله چې لوری روښانه شي، هماغه context له ځان سره Creator ته لاړ شئ او workflow له سره مه جوړوئ.`,
        },
      ];
    case "en-IN":
    case "en":
    default:
      return [
        {
          step: "01",
          title: `Choose a ${modelName} mode`,
          copy: `Start by switching between the core ${modelName} workflows so the page lands on the mode that matches your current intent.`,
        },
        {
          step: "02",
          title: "Add prompt or source inputs",
          copy: `Use the right mix of prompt, references, or existing assets based on what the current ${modelName} mode expects.`,
        },
        {
          step: "03",
          title: `Generate and compare ${modelName} outputs`,
          copy: `Iterate inside the workbench, compare competing ${modelName} directions, and keep the strongest output moving forward.`,
        },
        {
          step: "04",
          title: `Continue in the ${modelName} Creator flow`,
          copy: `Once you find a strong direction, move into Creator with the same context instead of rebuilding the workflow from scratch.`,
        },
      ];
  }
}

export function getGeneratedModelLandingTemplateCopy({
  locale,
  modelName,
  provider,
  modeLabels,
  narrative,
}: TemplateCopyContext): ModelLandingTemplateCopy {
  const joinedModes = joinModes(locale, modeLabels);
  const howItWorksSteps = buildHowItWorksSteps(locale, modelName);
  const promisePhrase = getPromisePhrase(locale, narrative.promise);
  const stagePhrase = getStagePhrase(locale, narrative.stage);
  const proofPhrase = getProofPhrase(locale, narrative.proof);
  const ctaCopy = getCtaCopy(locale, narrative.cta, modelName);

  switch (locale) {
    case "zh":
      return {
        whyModelTitle: `为什么用 ${modelName} 做 ${promisePhrase}`,
        whyModelDescription: `${modelName} 在 ${provider} 生态里更偏向 ${promisePhrase}。它更适合放在 ${stagePhrase} 阶段，尤其适合需要 ${proofPhrase} 的团队。`,
        howItWorksTitle: `如何开始使用 ${modelName}`,
        howItWorksDescription: `整页围绕 ${modelName} 的 ${promisePhrase} 定位展开，让用户理解它为什么适合当前任务，再直接进入创作。`,
        howItWorksSteps,
        workflowsTitle: `${modelName} 在 ${stagePhrase} 的工作流`,
        workflowsDescription: `${modelName} 当前支持 ${joinedModes} 等路径，这些工作流会围绕 ${promisePhrase} 和 ${proofPhrase} 来展开。`,
        bestForTitle: `${modelName} 更适合的工作`,
        bestForDescription: `这部分帮助用户判断 ${modelName} 更像是拿来做 ${promisePhrase}，还是拿来承接后续的 ${stagePhrase} 工作。`,
        galleryTitle: `${modelName} 的结果要证明 ${proofPhrase}`,
        galleryDescription: `样片区会优先展示 ${modelName} 如何把 ${promisePhrase} 落到真实输出上，而不只是停留在功能描述里。`,
        galleryLead: `真正能建立信任的，是 ${modelName} 把 ${promisePhrase} 做出来后的实际效果。`,
        faqTitle: `关于 ${modelName} 的常见问题`,
        faqDescription: `FAQ 会继续回答 ${modelName} 在 ${provider} 体系里适合做什么、为什么适合 ${stagePhrase}，以及它与 Creator 的关系。`,
        openWithPrompt: ctaCopy.open,
        openInCreator: ctaCopy.creator,
        sampleLabel: `${modelName} 样片`,
        fallbackSampleTitle: `${modelName} 样片`,
        fallbackSampleCaption: `这是从 ${modelName} 当前真实结果中选取的一条示例输出，用来证明它在 ${promisePhrase} 上的表现。`,
        controls: {
          promptWorkflow: `${modelName} ${promisePhrase}工作流`,
          creatorSync: `与 ${modelName} Creator 同步`,
          uploadUpToRefs: `${modelName} 最多上传 {count} 张参考图以加强${proofPhrase}`,
          referenceUploads: `${modelName} 支持参考图上传来提升${proofPhrase}`,
          aspectRatios: `${modelName} 提供 {count}+ 种画幅比例`,
          resolutionPresets: `${modelName} 提供 {count} 种分辨率预设`,
        },
      };
    case "zh-Hant-TW":
    case "zh-hk":
      return {
        whyModelTitle: `為什麼用 ${modelName} 做 ${promisePhrase}`,
        whyModelDescription: `${modelName} 在 ${provider} 生態裡更偏向 ${promisePhrase}。它更適合放在 ${stagePhrase} 階段，特別適合需要 ${proofPhrase} 的團隊。`,
        howItWorksTitle: `如何開始使用 ${modelName}`,
        howItWorksDescription: `整頁圍繞 ${modelName} 的 ${promisePhrase} 定位展開，讓使用者理解它為什麼適合當前任務，再直接進入創作。`,
        howItWorksSteps,
        workflowsTitle: `${modelName} 在 ${stagePhrase} 的工作流程`,
        workflowsDescription: `${modelName} 目前支援 ${joinedModes} 等路徑，這些工作流程會圍繞 ${promisePhrase} 與 ${proofPhrase} 來展開。`,
        bestForTitle: `${modelName} 更適合的工作`,
        bestForDescription: `這部分幫助使用者判斷 ${modelName} 更像是拿來做 ${promisePhrase}，還是拿來承接後續的 ${stagePhrase} 工作。`,
        galleryTitle: `${modelName} 的結果要證明 ${proofPhrase}`,
        galleryDescription: `樣片區會優先展示 ${modelName} 如何把 ${promisePhrase} 落到真實輸出上，而不只是停留在功能描述裡。`,
        galleryLead: `真正能建立信任的，是 ${modelName} 把 ${promisePhrase} 做出來後的實際效果。`,
        faqTitle: `關於 ${modelName} 的常見問題`,
        faqDescription: `FAQ 會繼續回答 ${modelName} 在 ${provider} 體系裡適合做什麼、為什麼適合 ${stagePhrase}，以及它與 Creator 的關係。`,
        openWithPrompt: ctaCopy.open,
        openInCreator: ctaCopy.creator,
        sampleLabel: `${modelName} 樣片`,
        fallbackSampleTitle: `${modelName} 樣片`,
        fallbackSampleCaption: `這是從 ${modelName} 目前真實結果中選取的一條示例輸出，用來證明它在 ${promisePhrase} 上的表現。`,
        controls: {
          promptWorkflow: `${modelName} ${promisePhrase}工作流程`,
          creatorSync: `與 ${modelName} Creator 同步`,
          uploadUpToRefs: `${modelName} 最多上傳 {count} 張參考圖以加強${proofPhrase}`,
          referenceUploads: `${modelName} 支援參考圖上傳來提升${proofPhrase}`,
          aspectRatios: `${modelName} 提供 {count}+ 種畫幅比例`,
          resolutionPresets: `${modelName} 提供 {count} 種解析度預設`,
        },
      };
    case "de-DE":
    case "ko-KR":
    case "ja-JP":
    case "es-ES":
    case "it-IT":
    case "pt-BR":
    case "ru-RU":
    case "tr-TR":
    case "ps-AF":
    case "en-IN":
    case "en":
    default:
      return {
        whyModelTitle: `Why ${modelName} for ${promisePhrase}`,
        whyModelDescription: `${modelName} is positioned for ${promisePhrase} inside the ${provider} stack. It fits best in ${stagePhrase} work, especially when teams care about ${proofPhrase}.`,
        howItWorksTitle: `How to start with ${modelName}`,
        howItWorksDescription: `This page is organised around ${modelName}'s role in ${promisePhrase}, so users can understand where it fits before moving straight into creation.`,
        howItWorksSteps,
        workflowsTitle: `${modelName} workflows for ${stagePhrase}`,
        workflowsDescription: `${modelName} supports workflows like ${joinedModes}, but the page frames them around ${promisePhrase} and the need for ${proofPhrase}.`,
        bestForTitle: `Where ${modelName} fits best`,
        bestForDescription: `This section helps users judge whether ${modelName} should lead the ${promisePhrase} work or support a later ${stagePhrase} step in production.`,
        galleryTitle: `${modelName} outputs should prove ${proofPhrase}`,
        galleryDescription: `The gallery is there to show how ${modelName} turns ${promisePhrase} into real outputs instead of leaving the claim at the feature level.`,
        galleryLead: `The strongest proof comes from seeing ${modelName} deliver ${promisePhrase} in practice.`,
        faqTitle: `${modelName} FAQ`,
        faqDescription: `The FAQ stays specific to what ${modelName} is meant to do inside ${provider}, why it suits ${stagePhrase}, and how it connects to the shared Creator workbench.`,
        openWithPrompt: ctaCopy.open,
        openInCreator: ctaCopy.creator,
        sampleLabel: `${modelName} Sample`,
        fallbackSampleTitle: `${modelName} Sample`,
        fallbackSampleCaption: `A real output sample selected from ${modelName}'s own generation set to demonstrate its ${promisePhrase} positioning.`,
        controls: {
          promptWorkflow: `${modelName} ${promisePhrase} workflow`,
          creatorSync: `${modelName} Creator sync`,
          uploadUpToRefs: `${modelName}: upload up to {count} refs for stronger ${proofPhrase}`,
          referenceUploads: `${modelName} reference uploads for ${proofPhrase}`,
          aspectRatios: `${modelName}: {count}+ aspect ratios`,
          resolutionPresets: `${modelName}: {count} resolution presets`,
        },
      };
  }
}
