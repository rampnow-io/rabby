'use client';

import React from 'react';
import type { ImgHTMLAttributes } from 'react';

export const CDN_URL = 'https://cdn.rampnow.io';

const dummyImageLoader = (src: string) => {
  return src;
};

const imageLoader = (src: string, width?: number, quality?: number) => {
  let url = `${CDN_URL}${src}?format=auto`;
  if (width) url += `&width=${width}`;
  if (quality) url += `&quality=${quality}`;
  return url;
};

const originalImageLoader = (src: string) => {
  return `${CDN_URL}${src}`;
};

export interface HTMLImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  original?: boolean;
  width?: number;
  quality?: number;
}

/**
 * HTML <img> wrapper that mimics previous Next.js Image loader logic
 */
export function Image(props: HTMLImageProps) {
  const { src, original, width, quality, ...rest } = props;

  if (typeof src !== 'string') return null;

  let loader = dummyImageLoader;

  if (!src.startsWith('https://')) {
    loader = original
      ? originalImageLoader
      : (s) => imageLoader(s, width, quality);
  }

  const finalSrc = loader(src);

  return <img src={finalSrc} {...rest} />;
}

export default Image;
