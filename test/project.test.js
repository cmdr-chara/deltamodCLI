const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { validateProject, isSafeRelativePath } = require('../lib/project');
const { createProject, removeProject } = require('./helpers');

test('validates a modern project and counts its files', t => {
    const root = createProject();
    t.after(() => removeProject(root));
    const result = validateProject(root);
    assert.equal(result.metadata.packageID, 'tests.mod.author');
    assert.equal(result.patches.length, 1);
    assert.equal(result.files.length, 3);
});

test('rejects traversal, absolute Windows paths, UNC paths, and NULs', () => {
    assert.equal(isSafeRelativePath('./patches/change.bin'), true);
    assert.equal(isSafeRelativePath('../outside.bin'), false);
    assert.equal(isSafeRelativePath('C:\\outside.bin'), false);
    assert.equal(isSafeRelativePath('\\\\server\\share\\outside.bin'), false);
    assert.equal(isSafeRelativePath(`safe\0unsafe`), false);
});

test('rejects an unsafe patch destination', t => {
    const root = createProject({
        xml: '<patch type="override" patch="./patches/change.bin" to="../../outside.win"/>'
    });
    t.after(() => removeProject(root));
    assert.throws(() => validateProject(root), /safe relative path/);
});

test('rejects linked package files', t => {
    const root = createProject();
    t.after(() => removeProject(root));
    const original = path.join(root, 'patches', 'change.bin');
    const linked = path.join(root, 'linked.bin');
    fs.linkSync(original, linked);
    assert.throws(() => validateProject(root), /non-linked file|regular, non-linked/);
});

test('rejects malformed XML and unsupported patch types', t => {
    const malformed = createProject({ xml: '<patch' });
    const unsupported = createProject({
        xml: '<patch type="shell" patch="./patches/change.bin" to="./data.win"/>'
    });
    t.after(() => {
        removeProject(malformed);
        removeProject(unsupported);
    });
    assert.throws(() => validateProject(malformed), /modding\.xml is invalid/);
    assert.throws(() => validateProject(unsupported), /unsupported patch type/);
});
