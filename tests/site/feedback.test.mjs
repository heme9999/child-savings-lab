import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { formFeedback } from '../../src/lib/forms/feedback';

let dom, form, summary, feedback, fee;
beforeEach(() => {
  dom = new JSDOM(`<form id="test-form"><div id="errors"></div><details><summary>Advanced</summary><div class="field"><label for="fee">Fund fee</label><input id="fee" name="fundExpenseRate" aria-describedby="fee-help"><small id="fee-help">Fee help</small></div></details><div class="field"><label for="amount">Amount</label><input id="amount" name="initialAmount"></div></form>`);
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('HTMLElement', dom.window.HTMLElement);
  form = document.querySelector('form'); summary = document.querySelector('#errors'); fee = document.querySelector('#fee');
  feedback = formFeedback(form, summary);
});
afterEach(() => { dom.window.close(); vi.unstubAllGlobals(); });

describe('accessible form feedback', () => {
  it('does not mark untouched inputs as invalid', () => {
    expect(fee.hasAttribute('aria-invalid')).toBe(false);
    expect(summary.children.length).toBe(0);
    expect(document.querySelector('details').open).toBe(false);
  });
  it('opens advanced fields and adds inline errors without replacing help', () => {
    feedback.show([{ field: 'fundExpenseRate', message: 'Enter a rate from 0 to 0.10%.' }]);
    expect(document.querySelector('details').open).toBe(true);
    expect(fee.getAttribute('aria-invalid')).toBe('true');
    const ids = fee.getAttribute('aria-describedby').split(' ');
    expect(ids[0]).toBe('fee-help');
    expect(document.getElementById(ids[1]).textContent).toBe('Enter a rate from 0 to 0.10%.');
    expect(document.activeElement).toBe(summary.querySelector('h3'));
    expect(summary.querySelector('[role="alert"]')).not.toBeNull();
  });
  it('error links reopen collapsed fields and move focus to the control', () => {
    feedback.show([{ field: 'fundExpenseRate', message: 'Check fee.' }]);
    document.querySelector('details').open = false;
    summary.querySelector('a').click();
    expect(document.querySelector('details').open).toBe(true);
    expect(document.activeElement).toBe(fee);
    expect(summary.querySelector('a').textContent).toContain('Fund fee');
  });
  it('clears only validation feedback while preserving existing help', () => {
    feedback.show([{ field: 'fundExpenseRate', message: 'Check fee.' }, { field: 'initialAmount', message: 'Check amount.' }]);
    feedback.clear(); feedback.clear();
    expect(fee.getAttribute('aria-describedby')).toBe('fee-help');
    expect(fee.hasAttribute('aria-invalid')).toBe(false);
    expect(document.querySelector('#amount').hasAttribute('aria-describedby')).toBe(false);
    expect(document.querySelectorAll('.field-error').length).toBe(0);
    expect(summary.children.length).toBe(0);
  });
  it('repeated submissions replace errors rather than accumulating them', () => {
    feedback.show([{ field: 'fundExpenseRate', message: 'Old error.' }]);
    feedback.show([{ field: 'fundExpenseRate', message: 'New error.' }], false);
    expect(document.querySelectorAll('.field-error').length).toBe(1);
    expect(summary.textContent).not.toContain('Old error.');
    expect(fee.getAttribute('aria-describedby').split(' ')).toHaveLength(2);
  });
  it('renders untrusted message text without interpreting markup', () => {
    feedback.show([{ field: 'fundExpenseRate', message: '<img src=x onerror=alert(1)>' }, { message: 'Calculation failed.' }]);
    expect(summary.querySelector('img')).toBeNull();
    expect(summary.textContent).toContain('<img src=x onerror=alert(1)>');
    expect(summary.querySelectorAll('li').length).toBe(2);
  });
  it('keeps generic failures visible and does not invent a field link', () => {
    feedback.show([{ field: 'missing', message: 'Unable to calculate.' }], false);
    expect(summary.textContent).toContain('Unable to calculate.');
    expect(summary.querySelector('a')).toBeNull();
    expect(document.activeElement).toBe(document.body);
  });
});
