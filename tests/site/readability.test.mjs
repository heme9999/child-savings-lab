import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { describeSelection } from '../../src/lib/forms/selection';
import { announceResult } from '../../src/lib/forms/announcement';
import { accountStatusOptions, claimAuthorityOptions } from '../../src/data/eligibility-options';

let dom;
beforeEach(() => {
  dom = new JSDOM('<form><select id="status" aria-describedby="detail help"></select><p id="detail"></p><small id="help">Existing help</small></form><p id="announcement" role="status" aria-atomic="true"></p>');
});
afterEach(() => { dom.window.close(); vi.restoreAllMocks(); });

function fixture(options = accountStatusOptions) {
  const select = dom.window.document.querySelector('select');
  for (const option of options) select.add(new dom.window.Option(option.label, option.value));
  const output = dom.window.document.querySelector('#detail');
  return { select, output, cleanup: describeSelection(select, output, options) };
}

describe('short select labels and complete explanations', () => {
  it('preserves all account-status values and keeps display labels short', () => {
    expect(accountStatusOptions.map(x => x.value)).toEqual(['unknown', 'auto-account', 'claim-started', 'manual-election-only', 'active-account', 'no-account-confirmed']);
    for (const option of [...accountStatusOptions, ...claimAuthorityOptions]) {
      expect(option.label.length).toBeLessThanOrEqual(24);
      expect(option.description.length).toBeGreaterThan(option.label.length);
    }
  });
  it('retains legally meaningful qualifiers in the descriptions', () => {
    expect(claimAuthorityOptions.map(x => x.description)).toEqual([
      'Guardian or legal custodian with property-management authority',
      'Beneficiary with legal capacity under state law',
      'Not sure / relationship alone has not been legally confirmed'
    ]);
    expect(accountStatusOptions.find(x => x.value === 'manual-election-only').description).toContain('not activated');
    expect(accountStatusOptions.find(x => x.value === 'no-account-confirmed').description).toBe('IRS confirms no account or prior election');
  });
  it('synchronizes the initial description without changing values or help associations', () => {
    const { select, output } = fixture();
    expect(output.textContent).toBe(accountStatusOptions[0].description);
    expect(select.value).toBe('unknown');
    expect(select.getAttribute('aria-describedby')).toBe('detail help');
  });
  it('shows the complete explanation for every changed option', () => {
    const { select, output } = fixture();
    for (const option of accountStatusOptions) {
      select.value = option.value;
      select.dispatchEvent(new dom.window.Event('change'));
      expect(output.textContent).toBe(option.description);
    }
  });
  it('resets the explanation after the browser restores the default selection', async () => {
    const { select, output } = fixture();
    select.value = 'active-account'; select.dispatchEvent(new dom.window.Event('change'));
    select.form.reset();
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(select.value).toBe('unknown');
    expect(output.textContent).toBe(accountStatusOptions[0].description);
  });
  it('does not retain a misleading description for an unrecognized value', () => {
    const { select, output } = fixture();
    select.value = 'unsupported'; select.dispatchEvent(new dom.window.Event('change'));
    expect(output.textContent).toBe('');
  });
  it('removes change and reset enhancements cleanly', async () => {
    const { select, output, cleanup } = fixture(); cleanup();
    select.value = 'active-account'; select.dispatchEvent(new dom.window.Event('change'));
    output.textContent = 'Not updated'; select.form.reset(); await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.textContent).toBe('Not updated');
  });
  it('waits beyond an event microtask checkpoint for a native reset default action', async () => {
    const { select, output } = fixture();
    select.value = 'active-account'; select.dispatchEvent(new dom.window.Event('change'));
    select.form.dispatchEvent(new dom.window.Event('reset'));
    await Promise.resolve();
    select.value = 'unknown';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.textContent).toBe(accountStatusOptions[0].description);
  });
  it('cancels a pending reset update on cleanup', async () => {
    const { select, output, cleanup } = fixture();
    select.form.reset(); cleanup(); output.textContent = 'Disposed';
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(output.textContent).toBe('Disposed');
  });
});

describe('concise result announcements', () => {
  it('updates a persistent region as text, not interpreted HTML', () => {
    const region = dom.window.document.querySelector('#announcement');
    announceResult(region, '<strong>Projection updated.</strong>');
    expect(region.textContent).toBe('<strong>Projection updated.</strong>');
    expect(region.querySelector('strong')).toBeNull();
    expect(region.getAttribute('role')).toBe('status');
  });
  it('can replace the same message and clear it without replacing the region', () => {
    const region = dom.window.document.querySelector('#announcement');
    const replacement = vi.spyOn(region, 'replaceChildren');
    announceResult(region, 'Updated.'); announceResult(region, 'Updated.'); announceResult(region, '');
    expect(replacement).toHaveBeenCalledTimes(3);
    expect(region.textContent).toBe('');
    expect(region.isConnected).toBe(true);
  });
  it('safely ignores an absent region', () => { expect(() => announceResult(null, 'Updated.')).not.toThrow(); });
});
