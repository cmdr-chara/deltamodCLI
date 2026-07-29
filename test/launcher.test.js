const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { buildCommunityImportUrl, openExternal, resolveTarget } = require('../lib/launcher');

test('encodes an absolute archive path in the Community import URL', () => {
    const archive = path.resolve('folder with spaces', 'test.modarchive');
    const result = new URL(buildCommunityImportUrl(archive));
    assert.equal(result.protocol, 'deltamod-community:');
    assert.equal(result.hostname, 'import');
    assert.equal(result.searchParams.get('path'), archive);
});

test('only accepts known application targets', () => {
    assert.equal(resolveTarget().key, 'community');
    assert.equal(resolveTarget('official').scheme, 'deltamod');
    assert.throws(() => resolveTarget('something-else'), /Unknown target/);
});

test('dry-run opening returns the URL without starting another process', () => {
    assert.equal(openExternal('deltamod-community://', { dryRun: true }), 'deltamod-community://');
});
