/**
 * Z Image Turbo image-to-image 支持的输出尺寸（宽*高）
 * 比例: 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3
 * 宽高范围: 256-1536
 */
export const Z_IMAGE_TURBO_SIZE_OPTIONS = [
    { value: '1024*1024', label: '1:1' },
    { value: '1024*576', label: '16:9' },
    { value: '576*1024', label: '9:16' },
    { value: '1024*768', label: '4:3' },
    { value: '768*1024', label: '3:4' },
    { value: '1536*1024', label: '3:2' },
    { value: '1024*1536', label: '2:3' },
] as const;

export const Z_IMAGE_TURBO_DEFAULT_SIZE = '1024*1024' as const;
export const Z_IMAGE_TURBO_DEFAULT_STRENGTH = 0.8;

/**
 * 与现有 image-to-image 页面一致的输出格式
 */
export const Z_IMAGE_TURBO_OUTPUT_FORMAT_OPTIONS = ['jpeg', 'png', 'webp'] as const;
export const Z_IMAGE_TURBO_DEFAULT_OUTPUT_FORMAT = 'jpeg' as const;
