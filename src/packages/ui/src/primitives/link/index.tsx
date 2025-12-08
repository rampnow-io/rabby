import React from "react"

export * from "./link"

/**
 * Substitute placeholders in text with anchor tags as React elements using a map.
 * @param text The input text containing placeholders like {Privacy Policy}
 * @param linkMap An object mapping placeholders (without braces) to links
 * @returns An array of strings and anchor elements
 * Example usage:
 *  const input = "Visit {Privacy Policy} and {Support}";
 *  const links = { 'Privacy Policy': "https://rampnow.io", 'Support': 'https://rampnow.io' };
 *  const output = substituteLinks(input, links);
 *  // Output: ["Visit ", <a href="https://rampnow.io">Privacy Policy</a>, " and ", <a href="https://rampnow.io">Support</a>]
 */

export function substituteLinks(
  text: string,
  linkMap: Record<string, string>,
): (string | React.JSX.Element)[] {
  const parts: (string | React.JSX.Element)[] = []
  const regex = /\{([^}]+)\}/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(text)) !== null) {
    const [placeholder, key] = match
    const url = linkMap[key]

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    if (url) {
      parts.push(
        <a
          href={url}
          key={key}
          target='_blank'
          rel='noopener noreferrer'
          className='underline'
        >
          {key}
        </a>,
      )
    } else {
      parts.push(placeholder)
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}
