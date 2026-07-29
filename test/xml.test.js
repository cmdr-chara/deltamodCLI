const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { serializePatches, validateSubmittedPatches } = require('../commands/xml');
const { createProject, removeProject } = require('./helpers');

test('validates editor submissions and escapes XML attributes', t => {
    const root = createProject();
    t.after(() => removeProject(root));
    const patches = validateSubmittedPatches([{
        type: 'override',
        patch: './patches/change.bin',
        to: './folder/a&b".win'
    }], root);
    const xml = serializePatches(patches);
    assert.match(xml, /a&amp;b&quot;\.win/);
});

test('rejects editor paths that escape the project or game root', t => {
    const root = createProject();
    t.after(() => removeProject(root));
    assert.throws(() => validateSubmittedPatches([{
        type: 'override',
        patch: '../outside.bin',
        to: './data.win'
    }], root), /safe relative paths/);
    assert.throws(() => validateSubmittedPatches([{
        type: 'override',
        patch: './patches/change.bin',
        to: 'C:\\game\\data.win'
    }], root), /safe relative paths/);
});
