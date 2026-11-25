import { afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { enhanceDateFields } from '../../src/lib/forms/date-fields';
import { formFeedback } from '../../src/lib/forms/feedback';
import { checkEligibility } from '../../src/lib/eligibility/checkEligibility';

let dom;
let cleanup;
afterEach(() => { cleanup?.(); dom?.window.close(); vi.unstubAllGlobals(); });

function fixture(initial = '') {
  const [year = '', month = '', day = ''] = initial.split('-');
  const options = (values, selected) => '<option value="">Choose</option>' + values.map(value => `<option value="${value}"${value === selected ? ' selected' : ''}>${value}</option>`).join('');
  dom = new JSDOM(`<form id="date-form"><div id="errors"></div><details><summary>Dates</summary><fieldset class="field" data-date-fields><legend>Child’s date of birth</legend><input type="hidden" id="birth-date" name="birthDate" value="${initial}" data-date-value data-field-label="Child’s date of birth"><label for="month">Month</label><select id="month" data-date-part="month" aria-describedby="date-help">${options(Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')), month)}</select><label for="day">Day</label><select id="day" data-date-part="day" aria-describedby="date-help">${options(Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0')), day)}</select><label for="year">Year</label><select id="year" data-date-part="year" aria-describedby="date-help">${options(['1900', '2000', '2005', '2020', '2024', '2025', '2026', '2028', '2029', '2100'], year)}</select><small id="date-help">Choose all three parts.</small></fieldset></details></form>`);
  vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
  vi.stubGlobal('document', dom.window.document);
  const form = dom.window.document.querySelector('form');
  cleanup = enhanceDateFields(form);
  const select = (part, value) => {
    const control = form.querySelector(`[data-date-part="${part}"]`);
    control.value = value; control.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    return control;
  };
  const read = () => new dom.window.FormData(form).get('birthDate');
  const choose = (year, month, day) => { select('year', year); select('month', month); select('day', day); };
  return { form, select, read, choose, document: dom.window.document };
}

describe('separate month, day and year controls', () => {
  it('keeps an unanswered date empty and exposes only one canonical value in FormData', () => {
    const { form, read } = fixture();
    expect(read()).toBe('');
    expect([...new dom.window.FormData(form).keys()]).toEqual(['birthDate']);
  });
  it('updates the ISO value before a parent form input listener reads it', () => {
    const { form, select, read } = fixture();
    const observed = [];
    form.addEventListener('input', () => observed.push(read()));
    select('year', '2026'); select('month', '06'); select('day', '15');
    expect(observed).toEqual(['', '', '2026-06-15']);
  });
  it.each(['0005', '202006', '2020-06-15', '2020/06/15', '20200615'])('cannot interpret a full typed date or truncated year as an available year: %s', value => {
    const { choose, select, read } = fixture();
    choose('2026', '06', '15'); select('year', value);
    expect(read()).toBe('');
  });
  it.each(['1900', '2005', '2029', '2100'])('preserves supported dates outside the pilot window: %s', year => {
    const { choose, read } = fixture(); choose(year, '06', '15');
    expect(read()).toBe(`${year}-06-15`);
  });
  it('clears a now-invalid leap day instead of silently changing the date', () => {
    const { choose, select, read, form } = fixture();
    choose('2024', '02', '29'); expect(read()).toBe('2024-02-29');
    select('year', '2025'); expect(read()).toBe('');
    expect(form.querySelector('#day option[value="29"]').disabled).toBe(true);
    select('day', '28'); expect(read()).toBe('2025-02-28');
  });
  it.each(['1900', '2100'])('handles Gregorian century leap-year rules for %s', year => {
    const { choose, read } = fixture(); choose(year, '02', '29'); expect(read()).toBe('');
  });
  it('keeps February 29 available until a year is selected, without producing a complete date', () => {
    const { select, read } = fixture(); select('month', '02'); select('day', '29'); expect(read()).toBe('');
    select('year', '2000'); expect(read()).toBe('2000-02-29');
  });
  it('clears April 31 and immediately removes the previous ISO value', () => {
    const { choose, select, read } = fixture(); choose('2026', '03', '31');
    select('month', '04'); expect(read()).toBe('');
    select('day', '30'); expect(read()).toBe('2026-04-30');
  });
  it.each(['', '2026-01-15'])('restores the actual initial date after native reset: %s', async initial => {
    const { choose, read, form } = fixture(initial); choose('2024', '02', '29');
    form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(read()).toBe(initial);
  });
  it('links date errors to the missing visible part and reveals its disclosure', () => {
    const { form, select, document } = fixture(); select('month', '06'); select('day', '15');
    const feedback = formFeedback(form, document.querySelector('#errors'));
    feedback.show([{ field: 'birthDate', message: 'Enter a complete, valid date of birth.' }]);
    const link = document.querySelector('#errors a');
    expect(link.textContent).toContain('Child’s date of birth'); expect(link.hash).toBe('#year');
    link.click(); expect(document.activeElement).toBe(document.querySelector('#year'));
    expect(document.querySelector('details').open).toBe(true);
    feedback.clear(); expect(document.querySelector('#year').getAttribute('aria-describedby')).toBe('date-help');
  });
  it('does not turn a partial date into an eligibility assessment', () => {
    const { select, read } = fixture(); select('year', '2026'); select('month', '06');
    const result = checkEligibility({ checkYear: 2026, birthDate: String(read()), hasEmploymentValidSsn: true, isUsCitizen: true, accountStatus: 'unknown', claimAuthority: 'not-sure', pilotElectionStatus: 'unknown', qualifyingChildExpected: null });
    expect(result.validationIssues.some(issue => issue.field === 'birthDate')).toBe(true);
    expect(result.baselineEligible).toBeNull();
  });
});
