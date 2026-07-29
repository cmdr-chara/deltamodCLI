const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');

test('parses positionals, values, and flags without evaluating shell text', () => {
    const parsed = parseArgs(['project', '--target', 'community', '--dry-run'], ['target']);
    assert.deepEqual(parsed.positionals, ['project']);
    assert.equal(parsed.values.target, 'community');
    assert.equal(parsed.flags.has('dry-run'), true);
});

test('rejects a missing option value', () => {
    assert.throws(() => parseArgs(['--target'], ['target']), /requires a value/);
});

test('rejects unknown options', () => {
    const parsed = parseArgs(['--surprise']);
    assert.throws(() => rejectUnknownOptions(parsed), /Unknown option/);
});
