/**
 * Borderline / suggestive content filter for the Explore & Homepage showcase grids.
 *
 * Background:
 *   The homepage (`PcHomepage` / `MobileHomepage`) and the `/explore` page both
 *   render media items sourced from the `explore_page_config` database config,
 *   which is managed by admins. Because that data lives outside of git, we
 *   cannot clean it up with a code edit alone — instead we apply a conservative
 *   blocklist filter server-side at every public consumer, so borderline items
 *   never reach the browser.
 *
 * Policy:
 *   Per product direction, we strictly exclude any item whose `prompt` or
 *   `alt` contains a term from BORDERLINE_TERMS. False positives are
 *   preferred over leaks — removing a few wholesome items is acceptable; a
 *   borderline item slipping through is not.
 *
 *   Admin pages (`/admin/explore`) intentionally do NOT apply this filter,
 *   so admins can still see and clean up flagged items.
 */

import type { MediaItem } from '@/shared/blocks/explore/media-card';
import type { ExploreConfig } from '@/shared/models/explore-config';

/**
 * Case-insensitive substring blocklist. Any MediaItem whose `prompt` or `alt`
 * contains any of these terms is filtered out.
 *
 * Terms are grouped by category for maintenance. Keep the list strict.
 */
const BORDERLINE_TERMS: readonly string[] = [
  // Stable-Diffusion booru tags (strong NSFW association)
  '1girl',
  '2girls',
  '3girls',
  'masterpiece,8k',
  'masterpiece, 8k',
  'masterpiece 8k',

  // Explicit swim / intimate attire
  'bikini',
  'beachwear',
  'beach wear',
  'swimsuit',
  'swim suit',
  'swimwear',
  'tanga',
  'thong',
  'g-string',
  'lingerie',
  'nightgown',
  'nighty',
  'negligee',
  'hot pants',
  'booty shorts',
  'lingerie set',
  'black lingerie',
  'black lingerie set',

  // Transparency / sheer fabric
  'see-through',
  'seethrough',
  'see through',
  'semi-transparent',
  'semi transparent',
  'semitransparent',
  'half-transparent',
  'half transparent',
  'sheer dress',
  'sheer top',
  'sheer blouse',
  'sheer skirt',
  'sheer fabric',
  'sheer lace',
  'sheer lingerie',
  'transparent dress',
  'transparent lace',
  'transparent top',
  'transparent blouse',

  // Lace attire (commonly used for suggestive framing)
  'lace dress',
  'lace skirt',
  'lace top',
  'lace bra',
  'lace lingerie',
  'lace bodysuit',

  // Undressed states / disrobing
  'topless',
  'naked',
  'undressed',
  'stripping',
  'strip tease',
  'nude photo',
  'nude portrait',
  'nude woman',
  'nude model',
  'unbutton',
  'unzipped',
  'wide open',
  'open robe',
  'open shirt',
  'open blouse',
  'dress falling off',

  // Explicit descriptors
  'sexy',
  'seductive',
  'provocative',
  'suggestive',
  'erotic',
  'sensual',
  'sensuais',
  'sultry',
  'nsfw',
  'horny',
  'boudoir',
  'boudoir portrait',
  'pin-up',
  'pin up',
  'retro pin-up',
  'retro pin up',
  'hot girl',
  'hot woman',
  'hot model',
  'hot babe',

  // Body parts / exposure
  'cleavage',
  'nipple',
  'boobs',
  'busty',
  'voluptuous',
  'curvaceous',
  'bare legs',
  'legs are bare',
  'bare thigh',
  'bare chest',
  'bare back',
  'bare midriff',
  'bare shoulders',
  'midriff',
  'thigh-high',
  'thigh high',
  'thigh highs',
  'garter',
  'pantyhose',
  'fishnet',

  // Wet-clothes / wet-body tropes
  'wet shirt',
  'wet t-shirt',
  'wet tshirt',
  'wet dress',
  'wet blouse',
  'wet body',
  'wet hair',

  // User-flagged noun phrases (solo-female photo prompts)
  'beautiful girl model',
  'beautiful woman model',
  'beautiful girl,',
  'dark-haired woman',
  'dark haired woman',
  'long dark hair,',
  'tanned young woman',
  'tanned woman',
  'captivating woman',
  'young female model',
  'female model',
  'praia/piscina',
  'poses diferentes, naturais e sensuais',

  // User-flagged single tokens
  'lifeguard',
  'barefoot',
  'off-the-shoulder',
  'off the shoulder',
  'off-shoulder',

  // Noir glamour framing (the qwen-202512 placeholder + rendered examples)
  'shadow patterns across her face',
  'kodak portra 800',
  'kodak portra 400, her face',
];

// Pre-lowercase the list once at module load.
const LOWERCASE_TERMS: readonly string[] = BORDERLINE_TERMS.map((term) =>
  term.toLowerCase()
);

function containsBorderlineTerm(text: string | undefined | null): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  for (const term of LOWERCASE_TERMS) {
    if (lower.includes(term)) return true;
  }
  return false;
}

/**
 * Returns true if a media item should be hidden from public surfaces.
 */
export function isMediaItemBorderline(item: MediaItem): boolean {
  if (containsBorderlineTerm(item.prompt)) return true;
  if (containsBorderlineTerm(item.alt)) return true;
  return false;
}

/**
 * Drops borderline items from an array.
 */
export function filterBorderlineMediaItems(items: MediaItem[]): MediaItem[] {
  return items.filter((item) => !isMediaItemBorderline(item));
}

/**
 * Sanitizes an entire ExploreConfig: filters items in every section and
 * drops sections that end up empty.
 */
export function filterBorderlineExploreConfig(
  config: ExploreConfig
): ExploreConfig {
  const filteredSections = (config.sections ?? [])
    .map((section) => ({
      ...section,
      items: filterBorderlineMediaItems(section.items ?? []),
    }))
    .filter((section) => section.items.length > 0);

  return { ...config, sections: filteredSections };
}
