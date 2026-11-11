'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { getBlurDataURL } from '@/shared/lib/blur-placeholder';

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  placeholderSrc,
  title,
  effect = 'blur',
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover',
  blurDataURL,
  placeholderType,
}: {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholderSrc?: string;
  title?: string;
  effect?: 'blur' | 'opacity' | 'none';
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  blurDataURL?: string;
  placeholderType?: 'avatar' | 'banner' | 'thumbnail' | 'default';
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px',
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const imageStyle = {
    transition: 'filter 0.3s, transform 0.3s',
    ...(effect === 'blur' && !isLoaded
      ? { filter: 'blur(10px)', transform: 'scale(1.05)' }
      : {}),
    ...(effect === 'opacity' && !isLoaded
      ? { opacity: 0.5 }
      : {}),
  };

  // 获取 blur placeholder
  const placeholder = blurDataURL || getBlurDataURL(placeholderType);

  // 如果使用 fill 模式
  if (fill) {
    return (
      <div ref={containerRef} className={className} style={{ position: 'relative', overflow: 'hidden' }}>
        {isInView && (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes || '100vw'}
            title={title}
            onLoad={handleLoad}
            priority={priority}
            placeholder="blur"
            blurDataURL={placeholder}
            style={{
              objectFit,
              ...imageStyle,
            }}
          />
        )}
      </div>
    );
  }

  // 固定尺寸模式
  return (
    <div ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
      {isInView && (
        <Image
          src={src}
          alt={alt}
          width={width || 800}
          height={height || 600}
          title={title}
          className={className}
          onLoad={handleLoad}
          priority={priority}
          sizes={sizes}
          placeholder="blur"
          blurDataURL={placeholder}
          style={imageStyle}
        />
      )}
    </div>
  );
}
