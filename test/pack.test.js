const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const { createPackage } = require('../lib/pack');
const importCommand = require('../commands/import');
const { createProject, removeProject } = require('./helpers');

test('creates a ZIP-compatible modarchive atomically', async t => {
    const root = createProject();
    t.after(() => removeProject(root));
    const result = await createPackage(root);
    const signature = fs.readFileSync(result.destination).subarray(0, 4);
    assert.deepEqual([...signature], [0x50, 0x4b, 0x03, 0x04]);
    assert.equal(result.destination.endsWith('.modarchive'), true);
    assert.equal(fs.readdirSync(path.dirname(result.destination)).some(name => name.endsWith('.tmp')), false);
});

test('Community import creates a temporary package and an encoded request', async t => {
    const root = createProject();
    t.after(() => removeProject(root));
    const result = await importCommand([root, '--dry-run']);
    t.after(() => fs.rmSync(result.destination, { force: true }));
    const url = new URL(result.importUrl);
    assert.equal(url.hostname, 'import');
    assert.equal(path.resolve(url.searchParams.get('path')), result.destination);
    assert.equal(fs.existsSync(result.destination), true);
});
