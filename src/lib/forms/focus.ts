// Explicit submissions reveal the result, not just a heading at the bottom of
// the viewport. Instant positioning also respects keyboard/reduced-motion use.
export function revealResult(heading: HTMLElement | null): void {
  if (!heading) return;
  heading.focus({ preventScroll: true });
  (heading.closest<HTMLElement>('.result-panel') ?? heading).scrollIntoView({ block: 'start', behavior: 'instant' });
}
