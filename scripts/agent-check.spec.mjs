import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { needsWebBuild, selectVitestCommands } from './agent-output.mjs';

describe('web planner', () => {
  it('runs related tests for a source file and not the architecture suite', () => {
    const file = 'src/features/cart/cart.ts';
    const plan = selectVitestCommands([file], [file], 'web');
    const labels = plan.commands.map(([label]) => label);
    assert.equal(labels.includes('vitest related'), true);
    assert.equal(labels.includes('test:arch'), false);
    assert.equal(labels.includes('format'), false);
  });

  it('names a production build only for route and config files', () => {
    assert.equal(needsWebBuild(['src/app/(shop)/cart/page.tsx']), true);
    assert.equal(needsWebBuild(['next.config.ts']), true);
    assert.equal(needsWebBuild(['src/features/cart/cart.ts']), false);
  });
});
