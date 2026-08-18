const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { buildAppUrl, openExternal, openPath, resolveTarget } = require('../lib/launcher');

test('only accepts known application targets', () => {
    assert.equal(resolveTarget().key, 'community');
    assert.equal(resolveTarget('official').scheme, 'deltamod');
    assert.throws(() => resolveTarget('something-else'), /Unknown target/);
});

test('Community launch does not emit an unsupported custom URL', () => {
    assert.throws(() => buildAppUrl('community'), /native file handoff/);
    assert.equal(buildAppUrl('official'), 'deltamod://');
});

test('dry-run URL opening returns the URL without starting another process', () => {
    assert.equal(openExternal('deltamod://', { dryRun: true }), 'deltamod://');
});

test('dry-run path opening resolves the handoff without requiring a file', () => {
    const handoff = path.join('folder with spaces', 'package.modarchive');
    assert.equal(openPath(handoff, { dryRun: true }), path.resolve(handoff));
});