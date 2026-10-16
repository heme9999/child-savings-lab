export function enhanceMobileNavigation(details: HTMLDetailsElement): () => void {
  const summary = details.querySelector<HTMLElement>('summary');
  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !details.open) return;
    event.preventDefault(); details.open = false; summary?.focus({ preventScroll: true });
  };
  const closeOutside = (event: PointerEvent) => {
    if (details.open && event.target instanceof Node && !details.contains(event.target)) details.open = false;
  };
  details.addEventListener('keydown', closeOnEscape);
  document.addEventListener('pointerdown', closeOutside);
  return () => {
    details.removeEventListener('keydown', closeOnEscape);
    document.removeEventListener('pointerdown', closeOutside);
  };
}
