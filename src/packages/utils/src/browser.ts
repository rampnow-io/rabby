export function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /^(?:(?!chrome|android).)*safari/i.test(ua);
}
