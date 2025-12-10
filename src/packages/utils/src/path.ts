/**
 * Matches a dynamic path pattern like '/path/[uid]' against an actual URL path
 * like '/path/iefbwkajd' and extracts the dynamic parameters as key-value pairs.
 *
 * @param pattern - The dynamic route pattern with parameters in brackets, e.g. '/path/[uid]'
 * @param actualPath - The actual URL path to match against, e.g. '/path/iefbwkajd'
 * @returns An object mapping parameter names to their values, or null if no match
 *
 * @example
 * matchDynamicPath('/path/[uid]', '/path/12345');
 * // Returns: \{ uid: '12345' \}
 */
export function matchDynamicPath(
  pattern: string,
  actualPath: string
): Record<string, string> | null {
  // Escape slashes and replace [param] with a capture group
  const regexPattern = pattern
    .replace(/\//g, '\\/') // escape forward slashes
    .replace(/\[(?:[^\]]+)\]/g, '([^/]+)'); // match anything that's not a slash

  const regex = new RegExp(`^${regexPattern}$`);
  const match = actualPath.match(regex);

  if (!match) {
    return null;
  }

  const paramNames = getPathParamNames(pattern);

  // Build params object
  const params: Record<string, string> = {};
  paramNames.forEach((name, index) => {
    params[name] = match[index + 1]; // first capture group is index 1
  });

  return params;
}

export function getPathParamNames(pattern: string): string[] {
  const paramNames: string[] = [];
  // eslint-disable-next-line prefer-named-capture-group -- Capture group needed to extract parameter names
  const regex = /\[([^\]]+)\]/g;

  let match: RegExpExecArray | null;
  while ((match = regex.exec(pattern)) !== null) {
    paramNames.push(match[1]);
  }

  return paramNames;
}

export function isPathMatch(pattern: string, path: string): boolean {
  return pattern === path || matchDynamicPath(pattern, path) !== null;
}
