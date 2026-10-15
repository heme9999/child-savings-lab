export interface FieldIssue<Field extends string = string> {
  field?: Field;
  message: string;
}

// Feedback is only displayed after submission. Existing help associations stay
// intact, and error links open any collapsed advanced section before focusing.
export function formFeedback(form: HTMLFormElement, summary: HTMLElement) {
  const marked: { control: HTMLElement; error: HTMLElement; id: string }[] = [];
  function clear() {
    summary.replaceChildren();
    for (const { control, error, id } of marked) {
      control.removeAttribute('aria-invalid');
      const descriptions = (control.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((value) => value && value !== id);
      if (descriptions.length) control.setAttribute('aria-describedby', descriptions.join(' '));
      else control.removeAttribute('aria-describedby');
      error.remove();
    }
    marked.length = 0;
  }
  function show(issues: FieldIssue[], focus = true) {
    clear();
    if (!issues.length) return;
    const alert = document.createElement('div'); alert.className = 'form-error-summary'; alert.setAttribute('role', 'alert');
    const heading = document.createElement('h3'); heading.textContent = 'Check these inputs'; heading.tabIndex = -1;
    const list = document.createElement('ul');
    for (const issue of issues) {
      const item = document.createElement('li');
      const control = issue.field ? form.elements.namedItem(issue.field) : null;
      if (control instanceof HTMLElement && control.id) {
        const label = (control as HTMLInputElement).labels?.[0]?.textContent?.trim();
        const message = label && !issue.message.startsWith(label) ? `${label}: ${issue.message}` : issue.message;
        const error = document.createElement('span');
        const id = `${form.id}-${control.id}-error-${marked.length}`;
        error.id = id; error.className = 'field-error'; error.textContent = issue.message;
        (control.closest('.field') ?? control.parentElement)?.append(error);
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', [control.getAttribute('aria-describedby'), id].filter(Boolean).join(' '));
        marked.push({ control, error, id });
        const reveal = () => {
          let details = control.closest('details');
          while (details) { details.open = true; details = details.parentElement?.closest('details') ?? null; }
        };
        reveal();
        const link = document.createElement('a'); link.href = `#${control.id}`; link.textContent = message;
        link.addEventListener('click', (event) => { event.preventDefault(); reveal(); control.focus(); });
        item.append(link);
      } else item.textContent = issue.message;
      list.append(item);
    }
    alert.append(heading, list); summary.append(alert);
    if (focus) heading.focus();
  }
  return { clear, show };
}
