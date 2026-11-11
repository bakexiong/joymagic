export interface PromptItem {
  text: string;
  thumbnail?: string;
}

export interface PromptCategory {
  id: string;
  name: string;
  nameEn: string;
  prompts: PromptItem[];
}

// Text-to-Image 模板数据（包含所有分类，hot 分类只有通用模板）
export const textToImagePrompts: PromptCategory[] = [
  {
    id: 'hot',
    name: '🔥 HOT 推荐',
    nameEn: '🔥 HOT',
    prompts: [
      { text: 'Fashion model in haute couture dress, dramatic pose, high-fashion photography, studio setting' },
      { text: 'Northern lights dancing over snowy landscape, vibrant aurora borealis, starry night sky' },
      { text: 'Futuristic city skyline at night, neon lights, flying vehicles, cyberpunk aesthetic' },
      { text: 'Surreal dreamscape, floating islands, impossible physics, Salvador Dali style, imaginative' },
      { text: 'Majestic lion portrait, golden mane flowing, intense gaze, wildlife photography, African savanna' },
      { text: 'Chocolate lava cake, molten center flowing out, vanilla ice cream, dessert photography' },
      { text: 'Cyberpunk street at night, neon signs, rain-soaked pavement, flying cars, dystopian city' },
      { text: 'Vintage travel posters, art deco style, exotic destinations, old-fashioned advertising' }
    ]
  },
  {
    id: 'portrait',
    name: '人物肖像',
    nameEn: 'Portrait',
    prompts: [
      {
        text: 'A professional headshot of a confident business woman, studio lighting, crisp focus, corporate attire'
      },
      { text: 'Elderly man with weathered face, deep wrinkles telling stories, warm natural light, close-up portrait' },
      { text: 'Young Asian woman with flowing black hair, cherry blossom background, soft dreamy atmosphere' },
      { text: 'Street portrait of a musician playing saxophone, urban background, golden hour lighting' },
      { text: 'Fashion model in haute couture dress, dramatic pose, high-fashion photography, studio setting' },
      { text: 'Child laughing joyfully, candid moment, natural outdoor lighting, blurred garden background' },
      { text: 'Athlete in action, determined expression, sweat droplets, dynamic sports photography' },
      { text: 'Artist in their studio, paint-splattered clothes, surrounded by colorful artwork, creative atmosphere' },
      { text: 'Bride in elegant wedding dress, soft romantic lighting, flower bouquet, emotional moment' },
      { text: 'Chef in professional kitchen, white uniform, plating exquisite dish, focused concentration' },
      { text: 'Dancer mid-leap, graceful pose, flowing fabric, stage lighting, artistic expression' },
      { text: 'Elder indigenous woman, traditional clothing, wise eyes, cultural portrait, respect and dignity' },
      { text: 'Teenage skateboarder, casual streetwear, urban setting, youthful energy, sunset light' }
    ]
  },
  {
    id: 'landscape',
    name: '风景自然',
    nameEn: 'Landscape',
    prompts: [
      { text: 'Majestic mountain range at sunrise, golden light hitting snow-capped peaks, misty valleys below' },
      { text: 'Serene lake reflecting perfect mirror image of surrounding forest, autumn colors, calm water' },
      { text: 'Ocean waves crashing on rocky coastline, dramatic seascape, stormy sky, powerful nature' },
      { text: 'Rolling green hills of Tuscany, cypress trees lining winding road, golden afternoon light' },
      { text: 'Northern lights dancing over snowy landscape, vibrant aurora borealis, starry night sky' },
      { text: 'Japanese zen garden, carefully raked gravel, moss-covered stones, peaceful atmosphere' },
      { text: 'Tropical beach paradise, crystal clear turquoise water, white sand, palm trees swaying' },
      { text: 'Desert sand dunes at sunset, warm orange and purple sky, shadows creating patterns' },
      { text: 'Misty morning in bamboo forest, rays of sunlight filtering through tall green stalks' },
      { text: 'Waterfall cascading into emerald pool, lush rainforest, long exposure smooth water' },
      { text: 'Lavender fields in Provence, endless purple rows, rustic farmhouse in distance, summer day' },
      { text: 'Arctic glacier landscape, blue ice formations, pristine wilderness, cold beauty' },
      { text: 'Canyon vista at golden hour, layered rock formations, vast scale, American Southwest' }
    ]
  },
  {
    id: 'architecture',
    name: '建筑城市',
    nameEn: 'Architecture',
    prompts: [
      { text: 'Modern skyscraper with glass facade, reflecting clouds and sky, contemporary architecture' },
      { text: 'Ancient Roman Colosseum ruins, historical landmark, golden hour sunlight, architectural detail' },
      { text: 'Futuristic city skyline at night, neon lights, flying vehicles, cyberpunk aesthetic' },
      { text: 'Traditional Japanese temple with red torii gate, cherry blossoms, peaceful garden setting' },
      { text: 'Gothic cathedral interior, soaring arches, stained glass windows, divine light beams' },
      { text: 'Minimalist concrete house, clean lines, large windows, modern residential architecture' },
      { text: 'Narrow alleyway in Venice, colorful buildings, canal with gondola, Italian charm' },
      { text: 'Art Deco building facade, geometric patterns, 1920s style, ornate details, vintage elegance' },
      { text: 'Dubai skyline at dusk, Burj Khalifa prominent, luxury cityscape, golden hour glow' },
      { text: 'Ancient Greek Parthenon, marble columns, Athens Acropolis, classical architecture' },
      { text: 'Modern library interior, spiral staircase, floor-to-ceiling bookshelves, architectural photography' },
      { text: 'Traditional Chinese pagoda, curved roofs, red and gold details, cultural heritage' },
      { text: 'Brutalist concrete structure, geometric forms, architectural statement, urban landscape' }
    ]
  },
  {
    id: 'art',
    name: '艺术创意',
    nameEn: 'Creative Art',
    prompts: [
      { text: 'Abstract watercolor painting, flowing colors blending together, artistic expression, soft textures' },
      { text: 'Surreal dreamscape, floating islands, impossible physics, Salvador Dali style, imaginative' },
      { text: 'Pop art portrait in Warhol style, bold colors, high contrast, screen print aesthetic' },
      { text: 'Minimalist geometric composition, simple shapes, limited color palette, modern art' },
      { text: 'Impressionist garden scene, Monet style, loose brushstrokes, vibrant flower colors' },
      { text: 'Digital glitch art, corrupted data aesthetics, neon colors, cyberpunk vibes' },
      { text: 'Renaissance still life, fruits and flowers, classical painting technique, rich colors' },
      { text: 'Street art mural, vibrant graffiti, urban wall, contemporary artistic expression' },
      { text: 'Japanese ink painting, minimalist bamboo, traditional sumi-e style, black and white' },
      { text: 'Psychedelic mandala pattern, intricate details, rainbow colors, symmetrical design' },
      { text: 'Cubist portrait, geometric fragmentation, Picasso influence, abstract faces' },
      { text: 'Art Nouveau poster, flowing organic lines, decorative elements, vintage advertisement style' },
      { text: 'Pointillism landscape, dots of pure color, Seurat technique, optical color mixing' }
    ]
  },
  {
    id: 'animals',
    name: '动物宠物',
    nameEn: 'Animals',
    prompts: [
      { text: 'Majestic lion portrait, golden mane flowing, intense gaze, wildlife photography, African savanna' },
      { text: 'Cute golden retriever puppy, playful expression, soft fur, warm lighting, pet photography' },
      { text: 'Hummingbird hovering near flower, wings frozen mid-flight, vibrant colors, macro detail' },
      { text: 'Giant panda eating bamboo, black and white fur, peaceful demeanor, natural habitat' },
      { text: 'Colorful tropical parrot, bright plumage, rainforest setting, exotic bird photography' },
      { text: 'Elephant family walking at sunset, silhouettes, African landscape, emotional scene' },
      { text: 'Curious cat peeking around corner, bright eyes, whiskers detailed, indoor setting' },
      { text: 'Dolphin jumping out of ocean water, splash, blue sea, playful marine life' },
      { text: 'Butterfly on flower, detailed wing patterns, macro photography, natural light' },
      { text: 'Horse running free in meadow, mane flowing, powerful movement, outdoor freedom' },
      { text: 'Owl perched on branch, piercing eyes, nocturnal bird, forest environment' },
      { text: 'Red fox in winter snow, fluffy tail, orange fur contrast, wildlife in nature' },
      { text: 'Fish swimming in coral reef, underwater photography, tropical colors, marine ecosystem' }
    ]
  },
  {
    id: 'food',
    name: '美食料理',
    nameEn: 'Food',
    prompts: [
      { text: 'Gourmet burger with multiple layers, melted cheese, sesame bun, food photography, appetizing' },
      { text: 'Traditional Japanese ramen bowl, perfectly cooked noodles, soft-boiled egg, steaming hot' },
      { text: 'Colorful fruit smoothie bowl, fresh berries, granola, mint leaves, healthy breakfast' },
      { text: 'Artisan pizza with fresh ingredients, wood-fired crust, melted mozzarella, Italian cuisine' },
      { text: 'Chocolate lava cake, molten center flowing out, vanilla ice cream, dessert photography' },
      { text: 'Fresh sushi platter, variety of rolls, wasabi, ginger, elegant presentation' },
      { text: 'Croissant and coffee breakfast, French pastry, cappuccino art, morning light' },
      { text: 'Grilled steak with vegetables, juicy meat, perfect grill marks, fine dining presentation' },
      { text: 'Colorful macarons arranged neatly, pastel colors, French pastries, delicate sweets' },
      { text: 'Fresh salad bowl, mixed greens, cherry tomatoes, healthy eating, vibrant colors' },
      { text: 'Homemade bread loaf, crusty exterior, rustic presentation, artisan baking' },
      { text: 'Ice cream sundae, multiple scoops, chocolate sauce, whipped cream, cherry on top' },
      { text: 'Dim sum basket, steamed dumplings, bamboo steamer, Chinese cuisine, tea ceremony' }
    ]
  },
  {
    id: 'scifi',
    name: '科幻未来',
    nameEn: 'Sci-Fi',
    prompts: [
      { text: 'Futuristic space station orbiting Earth, detailed technology, stars background, sci-fi architecture' },
      { text: 'Cyberpunk street at night, neon signs, rain-soaked pavement, flying cars, dystopian city' },
      { text: 'Robot with human-like features, advanced AI, metallic surface, futuristic laboratory' },
      { text: 'Alien planet landscape, multiple moons, strange vegetation, otherworldly environment' },
      { text: 'Holographic interface, floating digital displays, user interacting, advanced technology' },
      { text: 'Space explorer in high-tech suit, alien terrain background, science fiction adventure' },
      { text: 'Futuristic vehicle design, sleek aerodynamic shape, advanced transportation concept' },
      { text: 'Cityscape 100 years in future, vertical gardens, clean energy, sustainable architecture' },
      { text: 'Time portal swirling with energy, dimensional gateway, sci-fi phenomenon, mysterious' },
      { text: 'Advanced mech warrior, detailed mechanical parts, action pose, anime-inspired design' },
      { text: 'Underwater research facility, large viewing windows, marine life, futuristic submarine base' },
      { text: 'Virtual reality world, digital landscape, person wearing VR headset, immersive experience' },
      { text: 'Space battle scene, starships firing weapons, explosions, epic science fiction warfare' }
    ]
  },
  {
    id: 'vintage',
    name: '复古怀旧',
    nameEn: 'Vintage',
    prompts: [
      { text: 'Old film camera on wooden table, vintage photography equipment, nostalgic atmosphere' },
      { text: '1950s diner interior, checkered floor, red leather booths, retro American style' },
      { text: 'Vintage typewriter with paper, antique desk, warm lamp light, writer\'s workspace' },
      { text: 'Classic vinyl record player, spinning disc, retro audio equipment, warm nostalgic feel' },
      { text: 'Old library with leather-bound books, wooden shelves, vintage reading room, quiet atmosphere' },
      { text: 'Antique pocket watch on chain, detailed metalwork, sepia tone, timeless elegance' },
      { text: 'Retro gas station, classic cars, 1960s Americana, roadside nostalgia' },
      { text: 'Vintage travel posters, art deco style, exotic destinations, old-fashioned advertising' },
      { text: 'Classic rotary telephone, aged patina, retro communication device, nostalgic object' },
      { text: 'Old bookstore interior, stacked books, cozy atmosphere, vintage charm, literary haven' },
      { text: 'Antique compass on aged map, navigation tools, explorer\'s desk, vintage adventure' },
      { text: 'Classic jukebox, colorful lights, 1950s music machine, retro entertainment' },
      { text: 'Vintage bicycle leaning against brick wall, rustic charm, old-fashioned transportation' }
    ]
  }
];

// Image-to-Image 模板数据（只包含 hot 分类，且只有圣诞主题模板）
export const imageToImagePrompts: PromptCategory[] = [
  {
    id: 'hot',
    name: '🔥 HOT 推荐',
    nameEn: '🔥 HOT',
    prompts: [
      {
        text: 'A photorealistic portrait of a young woman wearing a red Santa Claus outfit, white fur trim, reindeer antlers headband, warm golden Christmas lights, snowy street, cozy festive atmosphere, cinematic lighting, high detail, 4K.',
        thumbnail: 'https://cdn.10b.ai/image.png'
      },
      {
        text: 'A 20-year-old young woman with long, wavy brown hair featuring rich layers and a glossy sheen; fair skin adorned with a sweet Christmas makeup look (pink blush, eye makeup with red-brown glitter, and decorative patterns like red bows and hearts on her face), exuding a sweet and lively demeanor. Outfit & Accessories: - A large red velvet bow hair accessory atop her head; - A red velvet bow necklace around her neck (featuring a small gold bell at its center); Wears a red-and-white Christmas-themed sleeveless outfit (red plush fabric with a large white bow adorned by a silver rhinestone centerpiece); accessorized with pearl drop earrings and delicate silver chain earrings, creating an overall glamorous and whimsical Christmas fantasy aesthetic. Setting: A light-toned, minimalist background highlights the subject\'s Christmas attire, creating a sweet festive atmosphere. Style & Details: Sweet Christmas aesthetic with high-definition rendering (8K quality), rich colors, and layered depth; 32K ultra-detailed real-person skin textures, aspect ratio 3:4.',
        thumbnail: 'https://cdn.10b.ai/Christmas%202.webp'
      },
      {
        text: 'Ultra realistic vertical Christmas photo of a closed clear glass mason jar snow globe on a rustic wooden table. Warm golden bokeh Christmas lights in the blurred background, soft shallow depth of field. Inside the jar, on a thick layer of fluffy white artificial snow with a few sparkling silver beads and bright red berries, there are two tiny subjects: one snowy green bottle-brush Christmas tree and, next to it, a tiny highly detailed realistic woman that looks exactly like the person in the input image. The tiny person is standing on the snow, same scale as the tree, wearing festive Christmas clothes (cozy knitted Christmas sweater, winter pants, small boots, and a red Santa hat with white fur trim). The person\'s face, hair, skin tone, and unique features clearly match the input photo, with a gentle happy smile, looking slightly toward the camera. Frosted snowflakes are painted on the glass of the jar. Warm white fairy lights wrap loosely around the jar on the wooden table, creating glowing reflections on the glass. Hyper realistic, 8K, crisp details, natural lighting, cinematic look, no distortion of the person\'s face.',
        thumbnail: 'https://cdn.10b.ai/Christmas%203.webp'
      },
      {
        text: 'Create an ultra-realistic 8K Christmas portrait using a 55mm lens with bright, playful holiday lighting. The woman is in a whimsical candy-cane themed photoshoot, surrounded by pink giant peppermint decorations, snowy ground, festive trees, and oversized ornaments. Use her real facial features exactly as they are — do NOT change or alter her face in any way. Her makeup is festive glam — winged liner, warm eyeshadow, rosy cheeks, and a bold holiday soft pink lips. She wears a sparkly white long-sleeve pants jumpsuit , fitted and shimmering with sequins. The back of the jumpsuit has a scoop-back cut, adding keeping the holiday sparkle. She is sitting on a white cube block, posing with one leg lifted and crossed, similar to the reference image. Her expression is playful and confident, smiling warmly toward the camera. In her hand, she holds a giant pink-and-white peppermint lollipop prop, resting it over her shoulder in a fun, candy-land pose. Around her is a fully decorated Christmas set: • Snowy ground with fluffy artificial snow • Christmas trees dusted with frost, decorated with pink ornaments and string lights • Oversized and canes framing whimsical beside her • A large shiny red Christmas ornament near her feet Lighting should be bright, clean, and festive, capturing the glimmer of the sequins and the pink candy-themed props. The colors are vibrant reds, whites, and silvers, giving a magical North Pole holiday studio vibe.',
        thumbnail: 'https://cdn.10b.ai/Chrismas_5.png'
      },
      {
        text: 'Create a glamorous solo Christmas portrait: woman wearing a red velvet dress and beret holding a small glowing ornament, indoor setting with decorated tree and warm bokeh lights, soft makeup, cinematic lighting, high-detail 8K.',
        thumbnail: 'https://cdn.10b.ai/Christmas%205.webp'
      },
      {
        text: 'Create a heartwarming Christmas portrait of a person warmly hugging their dog in front of a decorated Christmas tree. Preserve all exact facial features, skin tone, hair color and style of the owner from the uploaded photo, AND maintain all distinctive features of the dog including breed characteristics, facial structure, coat color and pattern, ensuring both subjects are completely recognizable. Position them sitting on a cozy plaid blanket on the floor with the person\'s arms wrapped around the dog in a genuine embrace, both looking at the camera with joyful expressions. Background: a magnificent Christmas tree decorated with gold and red ornaments, ribbon garlands, and twinkling lights creating beautiful bokeh circles. Lighting: soft natural window light from the side (Rembrandt lighting) supplemented by the warm glow from tree lights and fireplace, creating a cozy golden hour feel. Both subjects should wear coordinating Christmas sweaters (red or green with festive patterns). Add details: wrapped presents scattered around, stockings hung on nearby mantle, pine garland. Shot from slightly above at 35-degree angle, 50mm lens, f/2.2 for both subjects in focus, warm color grading, photorealistic rendering, captured candid emotion, 4K quality, perfect for holiday cards and social sharing.',
        thumbnail: 'https://cdn.10b.ai/Chrismas_6.png'
      },
      {
        text: 'A realistic candid shot of a man reaching up to place a star or ornament on a tall Christmas tree. He wears a dark red sweater with a winter animal design and has a cheerful expression. The setting is a spacious hall with large evening windows. Request DSLR quality, vibrant colors, and sharp focus on the man\'s face and the ornament, while the glowing tree fills the scene.',
        thumbnail: 'https://cdn.10b.ai/Christmas%207.webp'
      },
      {
        text: 'A natural overhead photo of a man wrapping a bright holiday gift. He sits on a white fluffy rug surrounded by ribbons, paper, and festive ornaments. He wears a simple green Christmas sweatshirt. The background shows a softly blurred classic living room with an ornate mantle. Use photorealistic textures for shiny wrapping paper and gentle rim lighting along his hair and shoulders to suggest quiet late-night preparations.',
        thumbnail: 'https://cdn.10b.ai/Christmas%208.webp'
      },
      {
        text: 'Generate precious Polaroid of baby meeting Santa Claus for first time. Shot with Polaroid flash in gentle baby-friendly Santa photo setting, showing [upload baby\'s photo] held by parent while sitting with Santa, or baby alone carefully supported on Santa\'s lap. Santa wears traditional red suit with soft expression, looking kind and gentle. Baby might be wide-eyed with wonder, crying, sleeping peacefully, or reaching toward Santa\'s beard with tiny hands. Parent\'s hands visible supporting baby gently. Background: softly decorated Santa set appropriate for infant photos. Polaroid features: white border, film grain, soft warm lighting with careful flash exposure suitable for babies, capturing this milestone moment tenderly. Add baby\'s first Santa details: baby wears special Christmas outfit - festive onesie, tiny Santa hat, holiday dress, or \'1st Christmas\' bib. Parent leans close showing protective care, maybe soothing baby gently. Santa holds baby carefully with experienced grandpa-like manner. Props include soft plush gift boxes rather than hard decorations, gentle pastel holiday colors mixed with traditional red and green. Sign or chalkboard reading \'Baby\'s First Christmas\' or similar milestone marker. Baby\'s expression genuine - whether peaceful, curious, or upset - showing authentic infant reaction to new experience. Background soft and less overwhelming than typical Santa sets. Nostalgic instant photography aesthetic. 1:1 apsect ratio polaroid',
        thumbnail: 'https://cdn.10b.ai/Chrismas_9.png'
      },
      {
        text: 'Create a warm, photorealistic Christmas family portrait by the fireplace: family of four wearing coordinated red and green knit sweaters, soft golden bokeh lights on the tree in the background, wreath and stockings visible, warm candlelit glow, shallow depth of field, high-resolution 8K, natural skin tones, slight film grain.',
        thumbnail: 'https://cdn.10b.ai/Christmas%2010.webp'
      }
    ]
  }
];

// 向后兼容：默认导出 text-to-image 的模板（保持现有代码正常工作）
export const promptCategories = textToImagePrompts;
