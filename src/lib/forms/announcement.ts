// A small, persistent status node announces updates, not every result paragraph.
export function announceResult(region: HTMLElement | null, message: string): void {
  region?.replaceChildren(message);
}
