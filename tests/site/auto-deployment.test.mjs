import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const workflow = parse(readFileSync('.github/workflows/ci.yml', 'utf8'), { uniqueKeys: true });
const { verify, deploy } = workflow.jobs;
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const named = name => deploy.steps.find(step => step.name === name);

// This deliberately small GitHub condition uses JS-compatible boolean comparisons.
// Exercise the actual parsed gate, including negative event/branch/repository cases.
const evaluateGate = new Function('github', 'vars', `"use strict"; return (${deploy.if});`);
function allowed({ repository = 'heme9999/child-savings-lab', ref = 'refs/heads/main', event = 'push', enabled = 'true' } = {}) {
  return evaluateGate({ repository, ref, event_name: event }, { CLOUDFLARE_DEPLOY_ENABLED: enabled });
}

describe('GitHub production deployment authorization gates', () => {
  it('uses valid YAML and only main pushes, pull requests, or manual runs', () => {
    expect(Object.keys(workflow.on).sort()).toEqual(['pull_request', 'push', 'workflow_dispatch']);
    expect(workflow.on.push.branches).toEqual(['main']);
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(workflow.env.WRANGLER_SEND_METRICS).toBe('false');
  });

  it('allows an enabled main push and an enabled main manual run', () => {
    expect(allowed()).toBe(true);
    expect(allowed({ event: 'workflow_dispatch' })).toBe(true);
  });

  it.each([
    { event: 'pull_request' }, { event: 'pull_request_target' }, { event: 'schedule' },
    { ref: 'refs/heads/feature' }, { ref: 'refs/tags/v1' }, { ref: 'refs/pull/1/merge' },
    { repository: 'another-owner/child-savings-lab' },
    { enabled: undefined }, { enabled: '' }, { enabled: 'false' }, { enabled: 'TRUE' }
  ])('rejects an unauthorized deployment context: %j', context => {
    const vars = { CLOUDFLARE_DEPLOY_ENABLED: context.enabled };
    if (Object.hasOwn(context, 'enabled') && context.enabled === undefined) {
      expect(evaluateGate({ repository: 'heme9999/child-savings-lab', ref: 'refs/heads/main', event_name: 'push' }, vars)).toBe(false);
    } else expect(allowed(context)).toBe(false);
  });

  it('requires successful verification and serializes publication without interrupting an upload', () => {
    expect(deploy.needs).toBe('verify');
    expect(verify.steps.some(step => step.run === 'npm run verify')).toBe(true);
    expect(deploy.concurrency).toEqual({ group: 'child-savings-lab-production', 'cancel-in-progress': false });
    expect(deploy['timeout-minutes']).toBeLessThanOrEqual(20);
    expect(deploy.env.CLOUDFLARE_ACCOUNT_ID).toBe('dcb7b7a33a34b85d7bdf6ba4c01af700');
  });

  it('keeps the Cloudflare credential out of PR verification and job-wide environment variables', () => {
    expect(JSON.stringify(verify)).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(JSON.stringify(workflow.env)).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(JSON.stringify(deploy.env)).not.toContain('CLOUDFLARE_API_TOKEN');
    const credentialSteps = deploy.steps.filter(step => step.env?.CLOUDFLARE_API_TOKEN);
    expect(credentialSteps).toHaveLength(2);
    for (const step of credentialSteps) {
      expect(step.if).toBe("steps.latest.outputs.publish == 'true'");
      expect(step.env.CLOUDFLARE_API_TOKEN).toBe('${{ secrets.CLOUDFLARE_API_TOKEN }}');
      expect(step.run).not.toMatch(/echo[^\n]*\$CLOUDFLARE_API_TOKEN|printenv|set -x/);
    }
  });

  it('checks remote main immediately before accessing deployment credentials', () => {
    const latest = named('Check that this is still the latest main commit');
    expect(latest.id).toBe('latest');
    expect(latest.run).toContain('git/ref/heads/main');
    expect(latest.run).toContain('"$remote_sha" == "$GITHUB_SHA"');
    expect(latest.run).toContain('publish=false');
    expect(named('Check deployment credential').run).toContain('exit 1');
    expect(deploy.steps.indexOf(latest)).toBeLessThan(deploy.steps.indexOf(named('Check deployment credential')));
  });

  it('publishes only the existing Pages project with the GitHub source revision', () => {
    const publication = named('Publish existing Cloudflare Pages project');
    expect(pkg.devDependencies.wrangler).toMatch(/^\d+\.\d+\.\d+$/);
    expect(publication.run).toContain('npx --no-install wrangler pages deploy dist');
    expect(publication.run).toContain('--project-name child-savings-lab-mvp');
    expect(publication.run).toContain('--branch main');
    expect(publication.run).toContain('--commit-hash "$GITHUB_SHA"');
    expect(publication.run).toContain('--commit-dirty=false');
  });

  it('validates the build before publication and checks production HTTP behavior afterward', () => {
    const publication = named('Publish existing Cloudflare Pages project');
    for (const command of ['npm run build', 'npm run validate:site', 'npm run validate:a11y']) {
      const step = deploy.steps.find(item => item.run === command);
      expect(step).toBeDefined();
      expect(deploy.steps.indexOf(step)).toBeLessThan(deploy.steps.indexOf(publication));
    }
    const check = named('Verify the published website');
    expect(check.if).toBe("steps.latest.outputs.publish == 'true'");
    expect(check.run).toBe('npm run validate:deployment -- --wait-for-deployment');
    expect(deploy.steps.indexOf(check)).toBeGreaterThan(deploy.steps.indexOf(publication));
    expect(named('Record production release').if).toBe("steps.latest.outputs.publish == 'true'");
  });
});
