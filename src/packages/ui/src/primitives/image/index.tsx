"use client"

import {
  type ImageLoaderProps,
  type ImageProps,
  default as NextImage,
} from "next/image"

export const CDN_URL = "https://cdn.rampnow.io"

const dummyImageLoader = ({ src }: ImageLoaderProps) => {
  return src
}

const imageLoader = ({ src, width, quality }: ImageLoaderProps) => {
  let url = `${CDN_URL}${src}?format=auto&width=${width}`
  if (quality) {
    url += `&quality=${quality}`
  }
  return url
}

const originalImageLoader = (props: ImageLoaderProps) => {
  return `${CDN_URL}${props.src}`
}

export function Image(
  props: Omit<ImageProps, "loader"> & { original?: boolean },
) {
  let loader = dummyImageLoader
  if (typeof props.src === "string" && !props.src.startsWith("https://")) {
    loader = props.original ? originalImageLoader : imageLoader
  }

  let filteredProps = { ...props }
  delete filteredProps.original

  return <NextImage loader={loader} {...filteredProps} />
}

export default Image
