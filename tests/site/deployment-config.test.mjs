import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const config = readFileSync('wrangler.toml', 'utf8');
const command = JSON.parse(readFileSync('package.json', 'utf8')).scripts['deploy:cloudflare'];
describe('existing Pages deployment target', () => {
  it('does not put the unsupported account_id field into Pages configuration', () => {
    expect(config).toContain('name = "child-savings-lab-mvp"');
    expect(config).toContain('pages_build_output_dir = "./dist"');
    expect(config).not.toMatch(/^\s*account_id\s*=/m);
  });
  it('scopes the verified account to the existing project deployment command', () => {
    expect(command).toMatch(/CLOUDFLARE_ACCOUNT_ID=dcb7b7a33a34b85d7bdf6ba4c01af700 npx --no-install wrangler pages deploy dist --project-name child-savings-lab-mvp --branch main/);
  });
  it('keeps full local verification before publication and HTTP regression after it', () => {
    expect(command.indexOf('npm run verify')).toBeLessThan(command.indexOf('wrangler pages deploy'));
    expect(command.indexOf('npm run validate:deployment')).toBeGreaterThan(command.indexOf('wrangler pages deploy'));
  });
});
