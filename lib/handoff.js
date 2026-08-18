const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');

const TEMPORARY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const LAUNCH_MARKER = Buffer.from('deltamod-community-open-v1\n', 'utf8');

function handoffRoot() {
    return path.join(os.tmpdir(), 'Deltamod Community CLI');
}

async function cleanOldHandoffs(directory = handoffRoot()) {
    let entries = [];
    try {
        entries = await fs.promises.readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const cutoff = Date.now() - TEMPORARY_RETENTION_MS;
    await Promise.all(entries.map(async entry => {
        if (!entry.isFile() || (!entry.name.endsWith('.modarchive') && !entry.name.endsWith('.deltamod-open'))) return;
        const filePath = path.join(directory, entry.name);
        try {
            const stat = await fs.promises.lstat(filePath);
            if (!stat.isSymbolicLink() && stat.mtimeMs < cutoff) {
                await fs.promises.rm(filePath, { force: true });
            }
        } catch {}
    }));
}

async function prepareHandoffRoot() {
    const directory = handoffRoot();
    await fs.promises.mkdir(directory, { recursive: true });
    await cleanOldHandoffs(directory);
    return directory;
}

async function createLaunchMarker(options = {}) {
    const directory = options.dryRun ? handoffRoot() : await prepareHandoffRoot();
    const marker = path.join(directory, `${crypto.randomUUID()}.deltamod-open`);
    if (!options.dryRun) {
        await fs.promises.writeFile(marker, LAUNCH_MARKER, { flag: 'wx' });
    }
    return marker;
}

async function createArchivePath() {
    const directory = await prepareHandoffRoot();
    return path.join(directory, `${crypto.randomUUID()}.modarchive`);
}

module.exports = {
    LAUNCH_MARKER,
    TEMPORARY_RETENTION_MS,
    cleanOldHandoffs,
    createArchivePath,
    createLaunchMarker,
    handoffRoot,
    prepareHandoffRoot
};