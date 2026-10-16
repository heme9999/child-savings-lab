import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

const css = ['src/styles/global.css', 'src/styles/home.css'].map((file) => readFileSync(file, 'utf8')).join('\n');
const dom = new JSDOM(`<style>${css}</style>`);
const rules = [];
function walk(list, media = []) {
  for (const rule of list) {
    if (rule.selectorText) rules.push({ selector: rule.selectorText, style: rule.style, media: media.join(' and ') });
    if (rule.cssRules?.length) walk(rule.cssRules, rule.conditionText ? [...media, rule.conditionText] : media);
  }
}
walk(dom.window.document.styleSheets[0].cssRules);

describe('mobile and motion style contracts', () => {
  it('gates every hover rule by pointer capabilities', () => {
    const hoverRules = rules.filter((rule) => rule.selector.includes(':hover'));
    expect(hoverRules.length).toBeGreaterThan(5);
    for (const rule of hoverRules) {
      expect(rule.media).toContain('(hover: hover)');
      expect(rule.media).toContain('(pointer: fine)');
    }
  });
  it('never applies interactive scaling or hover movement with reduced motion', () => {
    const moving = rules.filter((rule) => rule.style.getPropertyValue('transform') && /:active|:hover/.test(rule.selector));
    expect(moving.length).toBeGreaterThan(0);
    for (const rule of moving) expect(rule.media).toContain('(prefers-reduced-motion: no-preference)');
  });
  it('keeps the preview rate at a readable input size and touch height', () => {
    const rate = rules.find((rule) => rule.selector === '.preview-rate-row select');
    expect(rate.style.getPropertyValue('font-size')).toBe('1rem');
    expect(rate.style.getPropertyValue('min-height')).toBe('44px');
  });
  it('gives primary navigation links a 44px hit area', () => {
    const nav = rules.find((rule) => rule.selector === '.primary-navigation a');
    expect(nav.style.getPropertyValue('min-height')).toBe('44px');
  });
  it('aligns tool card actions without fixing the card height', () => {
    const card = rules.find((rule) => rule.selector === '.tool-card');
    const action = rules.find((rule) => rule.selector === '.tool-card .button');
    expect(card.style.getPropertyValue('display')).toBe('flex');
    expect(card.style.getPropertyValue('flex-direction')).toBe('column');
    expect(action.style.getPropertyValue('margin-top')).toBe('auto');
    expect(card.style.getPropertyValue('height')).toBe('');
  });
  it('preserves content selection, scrolling, and zoom', () => {
    expect(css).not.toMatch(/touch-action:\s*none|overscroll-behavior:\s*none/);
    const bodyRules = rules.filter((rule) => rule.selector.split(',').some((part) => part.trim() === 'body'));
    expect(bodyRules.every((rule) => !rule.style.getPropertyValue('user-select'))).toBe(true);
    const layout = readFileSync('src/layouts/BaseLayout.astro', 'utf8');
    expect(layout).not.toMatch(/user-scalable=no|maximum-scale=1/);
  });
});
dom.window.close();
