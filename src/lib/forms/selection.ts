interface SelectionDescription { value: string; description: string; }

// Keep native select labels short while exposing the full, wrapping explanation.
export function describeSelection(select: HTMLSelectElement, output: HTMLElement, options: readonly SelectionDescription[]): () => void {
  const update = () => { output.textContent = options.find((option) => option.value === select.value)?.description ?? ''; };
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  // Native button activation can run a microtask checkpoint before the reset's
  // default action restores select values. Read them in the next task instead.
  const reset = () => {
    if (resetTimer !== undefined) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { resetTimer = undefined; update(); }, 0);
  };
  select.addEventListener('change', update);
  select.form?.addEventListener('reset', reset);
  update();
  return () => {
    if (resetTimer !== undefined) clearTimeout(resetTimer);
    select.removeEventListener('change', update);
    select.form?.removeEventListener('reset', reset);
  };
}
