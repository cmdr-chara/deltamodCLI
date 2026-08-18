const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    LAUNCH_MARKER,
    cleanOldHandoffs,
    createLaunchMarker,
    handoffRoot
} = require('../lib/handoff');

test('creates the exact trusted Community launch marker', async t => {
    const marker = await createLaunchMarker();
    t.after(() => fs.rmSync(marker, { force: true }));
    assert.equal(path.dirname(marker), handoffRoot());
    assert.equal(path.extname(marker), '.deltamod-open');
    assert.deepEqual(fs.readFileSync(marker), LAUNCH_MARKER);
});

test('dry-run launch marker does not create a file', async () => {
    const marker = await createLaunchMarker({ dryRun: true });
    assert.equal(path.dirname(marker), handoffRoot());
    assert.equal(fs.existsSync(marker), false);
});

test('cleanup ignores unrelated files', async t => {
    const directory = handoffRoot();
    await fs.promises.mkdir(directory, { recursive: true });
    const unrelated = path.join(directory, `keep-${process.pid}.txt`);
    fs.writeFileSync(unrelated, 'keep');
    t.after(() => fs.rmSync(unrelated, { force: true }));
    await cleanOldHandoffs(directory);
    assert.equal(fs.existsSync(unrelated), true);
});