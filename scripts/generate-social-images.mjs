import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

// Code-native artwork, not a stock photo or a claimed investment performance chart.
// Run npm run generate:social after editing this template. PNGs are committed so
// deploys and social crawlers receive the same assets without a runtime service.
const cards = [
  { file: 'child-savings-lab', label: 'FREE TOOLS · SOURCE-LINKED GUIDES', lines: ['Child savings.', 'A clearer first step.'], description: 'Explore account choices, contribution ideas, and next steps.', detail: 'Trump Accounts · 529 guides · Account comparisons' },
  { file: 'trump-account-growth', label: 'FREE · NO SIGN-UP', lines: ['Trump Account', 'growth calculator'], description: 'Explore contributions, assumed returns, and fee impact.', detail: 'Annual table · Visible assumptions · Printable report' },
  { file: 'trump-account-checker', label: 'NO SIGN-UP · LOCAL ANSWERS', lines: ['Trump Account', 'status checker'], description: 'Account next steps and the separate $1,000 pilot election.', detail: 'Educational guidance—not an IRS determination' }
];

function escape(value) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

await mkdir('public/social', { recursive: true });
for (const card of cards) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#f7f3e8"/>
    <rect x="40" y="36" width="1120" height="558" rx="28" fill="#fffefa" stroke="#cad8d0" stroke-width="2"/>
    <g font-family="Arial, sans-serif">
      <rect x="76" y="66" width="56" height="56" rx="17" fill="#123a3a"/>
      <text x="104" y="103" text-anchor="middle" font-size="22" font-weight="700" fill="#f3c969">CS</text>
      <text x="150" y="105" font-size="32" font-weight="700" fill="#123a3a">Child Savings Lab</text>
      <text x="76" y="185" font-size="18" letter-spacing="2" font-weight="700" fill="#467267">${escape(card.label)}</text>
      ${card.lines.map((line, index) => `<text x="72" y="${277 + index * 82}" font-size="68" font-weight="700" letter-spacing="-2" fill="#123a3a">${escape(line)}</text>`).join('')}
      <text x="76" y="420" font-size="23" fill="#496260">${escape(card.description)}</text>
      <text x="76" y="461" font-size="20" fill="#496260">${escape(card.detail)}</text>
      <path d="M76 511H1124" stroke="#cad8d0"/>
      <text x="76" y="550" font-size="18" fill="#496260">Browser-local inputs</text>
      <text x="1124" y="550" text-anchor="end" font-size="18" fill="#496260">Independent education · Not a government site</text>
    </g>
    <circle cx="1018" cy="286" r="87" fill="#e6ecd9"/>
    <path d="M1018 344V264" fill="none" stroke="#245848" stroke-width="7" stroke-linecap="round"/>
    <path d="M1018 289C977 288 958 262 970 240C1001 241 1023 259 1018 289Z" fill="#8cc5a7" stroke="#245848" stroke-width="3"/>
    <path d="M1019 265C1015 232 1031 211 1060 212C1066 240 1045 263 1019 265Z" fill="#f3c969" stroke="#245848" stroke-width="3"/>
    <path d="M989 344H1047L1038 369H998Z" fill="#eadfca" stroke="#245848" stroke-width="3"/>
  </svg>`;
  const output = `public/social/${card.file}.png`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(output);
  console.log(`Generated ${output} (1200 × 630)`);
}
