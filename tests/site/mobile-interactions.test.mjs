import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { revealResult } from '../../src/lib/forms/focus';
import { enhanceMobileNavigation } from '../../src/lib/mobile-navigation';

let dom;
beforeEach(() => {
  dom = new JSDOM('<details><summary>Menu</summary><nav><a href="/tools/">Tools</a></nav></details><button id="outside">Outside</button><section class="result-panel"><h2 tabindex="-1">Result</h2></section>');
  vi.stubGlobal('document', dom.window.document);
  vi.stubGlobal('Node', dom.window.Node);
});
afterEach(() => { dom.window.close(); vi.unstubAllGlobals(); });

describe('result positioning', () => {
  it('focuses without implicit scrolling, then instantly aligns the whole result panel', () => {
    const heading = document.querySelector('h2');
    const panel = document.querySelector('.result-panel');
    panel.scrollIntoView = vi.fn();
    const focus = vi.spyOn(heading, 'focus');
    revealResult(heading);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(heading);
    expect(panel.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
    expect(focus.mock.invocationCallOrder[0]).toBeLessThan(panel.scrollIntoView.mock.invocationCallOrder[0]);
  });
  it('uses the heading as a fallback outside a result panel', () => {
    const heading = document.querySelector('h2');
    document.body.append(heading); heading.scrollIntoView = vi.fn();
    revealResult(heading);
    expect(heading.scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'instant' });
  });
  it('safely ignores an absent result', () => { expect(() => revealResult(null)).not.toThrow(); });
});

describe('native mobile disclosure enhancements', () => {
  it('opens with native summary behavior without any JavaScript enhancement', () => {
    document.querySelector('summary').click();
    expect(document.querySelector('details').open).toBe(true);
  });
  it('Escape closes the menu and returns focus to its trigger', () => {
    const details = document.querySelector('details'); enhanceMobileNavigation(details); details.open = true;
    const key = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    details.querySelector('a').dispatchEvent(key);
    expect(details.open).toBe(false);
    expect(document.activeElement).toBe(details.querySelector('summary'));
    expect(key.defaultPrevented).toBe(true);
  });
  it('does not intercept unrelated keys or Escape while closed', () => {
    const details = document.querySelector('details'); enhanceMobileNavigation(details);
    const key = new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    details.dispatchEvent(key); expect(key.defaultPrevented).toBe(false);
    details.open = true;
    details.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(details.open).toBe(true);
  });
  it('closes on an outside pointer press but keeps internal link interaction intact', () => {
    const details = document.querySelector('details'); enhanceMobileNavigation(details); details.open = true;
    details.querySelector('a').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
    expect(details.open).toBe(true);
    document.querySelector('#outside').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
    expect(details.open).toBe(false);
  });
  it('removes optional enhancement listeners cleanly', () => {
    const details = document.querySelector('details'); const cleanup = enhanceMobileNavigation(details); cleanup(); details.open = true;
    document.querySelector('#outside').dispatchEvent(new dom.window.Event('pointerdown', { bubbles: true }));
    expect(details.open).toBe(true);
  });
});
