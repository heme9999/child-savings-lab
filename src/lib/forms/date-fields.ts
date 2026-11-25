import { isValidIsoDate } from '../dates';

// Selects keep the browser's localized date editor from interpreting a pasted
// full date as a single year segment. Calculations still receive one ISO value.
export function enhanceDateFields(form: HTMLFormElement): () => void {
  const groups = [...form.querySelectorAll<HTMLElement>('[data-date-fields]')].map(root => {
    const value = root.querySelector<HTMLInputElement>('[data-date-value]');
    const year = root.querySelector<HTMLSelectElement>('[data-date-part="year"]');
    const month = root.querySelector<HTMLSelectElement>('[data-date-part="month"]');
    const day = root.querySelector<HTMLSelectElement>('[data-date-part="day"]');
    if (!value || !year || !month || !day) throw new Error('Date field is incomplete.');
    const sync = () => {
      // Leave February at 29 days until a year is supplied; the date stays
      // incomplete, and changing a leap year never silently chooses another day.
      const maximum = month.value ? new Date(Date.UTC(Number(year.value || 2000), Number(month.value), 0)).getUTCDate() : 31;
      for (const option of day.options) option.disabled = !!option.value && Number(option.value) > maximum;
      if (Number(day.value) > maximum) day.value = '';
      const candidate = `${year.value}-${month.value}-${day.value}`;
      value.value = year.value && month.value && day.value && isValidIsoDate(candidate) ? candidate : '';
      value.dataset.feedbackTarget = [month, day, year].find(control => !control.value)?.id ?? year.id;
    };
    root.addEventListener('input', sync);
    root.addEventListener('change', sync);
    sync();
    return { root, sync };
  });
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const reset = () => {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => { groups.forEach(group => group.sync()); resetTimer = undefined; }, 0);
  };
  form.addEventListener('reset', reset);
  return () => {
    clearTimeout(resetTimer);
    form.removeEventListener('reset', reset);
    groups.forEach(({ root, sync }) => { root.removeEventListener('input', sync); root.removeEventListener('change', sync); });
  };
}
