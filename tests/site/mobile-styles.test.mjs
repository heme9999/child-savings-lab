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
  it('keeps the non-sticky mobile header above positioned page content', () => {
    const header = rules.find(rule => rule.selector === '.site-header' && !rule.media);
    const mobileHeader = rules.find(rule => rule.selector === '.site-header' && rule.media === '(max-width: 820px)');
    // A static header ignores this z-index and can trap its dropdown below the hero.
    expect(mobileHeader.style.getPropertyValue('position')).toBe('relative');
    expect(Number(header.style.getPropertyValue('z-index'))).toBeGreaterThan(0);
    expect(header.style.getPropertyValue('position')).toBe('sticky');
  });
  it('keeps the expanded dropdown opaque and outside the header bounds', () => {
    const menu = rules.find(rule => rule.selector === '.mobile-navigation .primary-navigation' && rule.media === '(max-width: 820px)');
    expect(menu.style.getPropertyValue('position')).toBe('absolute');
    expect(menu.style.getPropertyValue('background')).toBe('var(--white)');
    expect(Number(menu.style.getPropertyValue('z-index'))).toBeGreaterThan(0);
    for (const rule of rules.filter(rule => ['.site-header', '.header-inner', '.mobile-navigation'].includes(rule.selector))) {
      for (const property of ['overflow', 'overflow-x', 'overflow-y']) {
        expect(['hidden', 'clip']).not.toContain(rule.style.getPropertyValue(property));
      }
    }
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
  it('keeps keyboard and error navigation immediate by default', () => {
    const html = rules.find(rule => rule.selector === 'html');
    expect(html.style.getPropertyValue('scroll-behavior')).toBe('auto');
    expect(css).not.toMatch(/scroll-behavior:\s*smooth/);
  });
  it('uses contrasting focus tokens on light and dark surfaces', () => {
    const root = rules.find(rule => rule.selector === ':root');
    const ring = root.style.getPropertyValue('--focus-ring').trim();
    const gold = root.style.getPropertyValue('--gold').trim();
    const luminance = hex => {
      const rgb = hex.slice(1).match(/../g).map(value => {
        const x = parseInt(value, 16) / 255;
        return x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4;
      });
      return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
    };
    const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + .05) / (Math.min(luminance(a), luminance(b)) + .05);
    for (const bg of ['#f7f3e8', '#fffefa', '#ffffff']) expect(contrast(ring, bg)).toBeGreaterThanOrEqual(3);
    for (const bg of ['#123a3a', '#0e2d2d', '#245848']) expect(contrast(gold, bg)).toBeGreaterThanOrEqual(3);
    for (const selector of ['.result-panel', '.site-footer', '.topic-panel', '.preview-full-link']) {
      expect(rules.find(rule => rule.selector === selector).style.getPropertyValue('--focus-ring')).toBe('var(--gold)');
    }
    expect(rules.find(rule => rule.selector === ':focus-visible').style.getPropertyValue('outline')).toContain('var(--focus-ring)');
  });
  it('gives the primary balance more emphasis than secondary metrics', () => {
    expect(rules.find(rule => rule.selector === '.metric-primary').style.getPropertyValue('grid-column')).toBe('1 / -1');
    expect(rules.find(rule => rule.selector === '.metric-primary strong').style.getPropertyValue('font-size')).toContain('clamp(2.2rem');
    expect(rules.find(rule => rule.selector === '.metric strong').style.getPropertyValue('font-size')).toBe('1.2rem');
  });
  it('keeps preview explanations and chart text at least 14px at the default root size', () => {
    for (const selector of ['.preview-presets button span', '.preview-result > span', '.preview-result p', '.preview-axis', '.preview-chart figcaption', '.preview-rate-row label', '.preview-assumptions', '.preview-disclaimer']) {
      for (const rule of rules.filter(rule => rule.selector === selector && rule.style.getPropertyValue('font-size'))) {
        expect(parseFloat(rule.style.getPropertyValue('font-size'))).toBeGreaterThanOrEqual(.875);
      }
    }
  });
});
dom.window.close();
