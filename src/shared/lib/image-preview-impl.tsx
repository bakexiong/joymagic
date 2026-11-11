'use client';

import { Download } from 'lucide-react';
import { type MouseEvent, type ReactNode, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import { Dialog, DialogContent } from '@/shared/components/ui/dialog';

const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_QUALITY = 0.82;
const DIRECT_PREVIEW_MAX_BYTES = 1.5 * 1024 * 1024;

type PreviewOptions = {
  maxDimension?: number;
  quality?: number;
};

type ImagePreviewProps = {
  src?: string | null;
  alt: string;
  placeholder: ReactNode;
  downloadTitle?: string;
  onDownload?: (() => void) | null;
  overlay?: ReactNode;
  onImageError?: React.ReactEventHandler<HTMLImageElement>;
  className?: string;
  imageClassName?: string;
  containerClassName?: string;
  dialogAlt?: string;
};

const createRandomNumberName = () => {
  const randomValue = window.crypto.getRandomValues(new Uint32Array(3));
  const digits = Array.from(randomValue, (value) => value.toString().padStart(10, '0')).join('');
  return digits.slice(0, 18);
};

const loadImageElement = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image'));
    image.src = url;
  });

export const revokeObjectUrl = (url?: string | null) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export const createRandomDownloadName = (extension?: string) => {
  const normalizedExtension = extension?.replace(/^\./, '');
  const base = createRandomNumberName();
  return normalizedExtension ? `${base}.${normalizedExtension}` : base;
};

const triggerBrowserDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.rel = 'noopener';
  link.target = '_self';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob'));
    reader.readAsDataURL(blob);
  });

const triggerBlobDownload = async (blob: Blob, filename: string) => {
  const dataUrl = await readBlobAsDataUrl(blob);
  triggerBrowserDownload(dataUrl, filename);
};

export const downloadOriginalFile = (file: File, fallbackName?: string) => {
  const extension =
    file.name?.split('.').pop() ||
    fallbackName?.split('.').pop() ||
    file.type.split('/')[1] ||
    'png';
  const filename = createRandomDownloadName(extension);
  void triggerBlobDownload(file, filename);
};

export const downloadFileFromUrl = async (
  url: string,
  extension = 'png'
) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const filename = createRandomDownloadName(extension);
  await triggerBlobDownload(blob, filename);
};

export function ImagePreview({
  src,
  alt,
  placeholder,
  downloadTitle = 'Download image',
  onDownload = null,
  overlay,
  onImageError,
  className = '',
  imageClassName = '',
  containerClassName = '',
  dialogAlt,
}: ImagePreviewProps) {
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

  return (
    <>
      <div className={className}>
        {src ? (
          <div className="space-y-4">
            <div
              className={`relative flex-1 overflow-hidden rounded-lg md:rounded-xl flex-shrink-0 bg-black/20 min-h-[300px] md:min-h-[400px] flex items-center justify-center cursor-pointer group ${containerClassName}`.trim()}
              onClick={() => setEnlargedImage(src)}
            >
              <img
                src={src}
                alt={alt}
                onError={onImageError}
                className={`w-full h-auto max-h-[400px] md:max-h-[600px] object-contain transition-opacity group-hover:opacity-90 ${imageClassName}`.trim()}
              />
              {overlay}
            </div>
            {onDownload ? (
              <Button
                size="lg"
                className="w-full gap-2 rounded-2xl bg-[#7d89f0] py-6 text-base font-semibold text-slate-950 shadow-none transition hover:bg-[#6f7be5]"
                onClick={(event: MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if ('nativeEvent' in event && 'stopImmediatePropagation' in event.nativeEvent) {
                    event.nativeEvent.stopImmediatePropagation();
                  }
                  onDownload();
                }}
                title={downloadTitle}
              >
                <Download className="h-5 w-5" />
                <span>{downloadTitle}</span>
              </Button>
            ) : null}
          </div>
        ) : (
          placeholder
        )}
      </div>

      <Dialog open={Boolean(enlargedImage)} onOpenChange={(open) => !open && setEnlargedImage(null)}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto overflow-hidden border-white/20 bg-black/90 p-0">
          {enlargedImage ? (
            <div className="relative mx-auto flex max-h-[92vh] max-w-[96vw] items-center justify-center overflow-auto rounded-2xl border border-white/10 bg-gradient-to-b from-zinc-900 via-zinc-950 to-black p-2 sm:p-4">
              <img
                src={enlargedImage}
                alt={dialogAlt || alt}
                className="block h-auto w-auto max-w-full max-h-[88vh] object-contain"
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export async function createOptimizedPreviewUrl(
  file: File,
  options: PreviewOptions = {}
): Promise<string> {
  if (
    typeof window === 'undefined' ||
    !file.type.startsWith('image/') ||
    file.type === 'image/svg+xml' ||
    file.size <= DIRECT_PREVIEW_MAX_BYTES
  ) {
    return URL.createObjectURL(file);
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const fallbackUrl = URL.createObjectURL(file);

  try {
    let source: CanvasImageSource;
    let width: number;
    let height: number;
    let cleanup: (() => void) | undefined;

    if ('createImageBitmap' in window) {
      const bitmap = await createImageBitmap(file);
      source = bitmap;
      width = bitmap.width;
      height = bitmap.height;
      cleanup = () => bitmap.close();
    } else {
      const image = await loadImageElement(fallbackUrl);
      source = image;
      width = image.naturalWidth;
      height = image.naturalHeight;
    }

    const longestSide = Math.max(width, height);
    if (!Number.isFinite(longestSide) || longestSide <= 0) {
      cleanup?.();
      return fallbackUrl;
    }

    if (longestSide <= maxDimension) {
      cleanup?.();
      return fallbackUrl;
    }

    const scale = maxDimension / longestSide;
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d', { alpha: true });
    if (!context) {
      cleanup?.();
      return fallbackUrl;
    }

    context.drawImage(source, 0, 0, targetWidth, targetHeight);
    cleanup?.();

    const previewBlob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });

    if (!previewBlob) {
      return fallbackUrl;
    }

    const optimizedUrl = URL.createObjectURL(previewBlob);
    URL.revokeObjectURL(fallbackUrl);
    return optimizedUrl;
  } catch {
    return fallbackUrl;
  }
}
