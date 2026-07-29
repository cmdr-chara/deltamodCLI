const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { buildCommunityImportUrl, buildAppUrl, openExternal, resolveTarget } = require('../lib/launcher');
const { log, warn } = require('../lib/output');
const { createPackage } = require('../lib/pack');

const TEMPORARY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

async function cleanOldTemporaryPackages(directory) {
    let entries = [];
    try {
        entries = await fs.promises.readdir(directory, { withFileTypes: true });
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
    }
    const cutoff = Date.now() - TEMPORARY_RETENTION_MS;
    await Promise.all(entries.map(async entry => {
        if (!entry.isFile() || !entry.name.endsWith('.modarchive')) return;
        const filePath = path.join(directory, entry.name);
        try {
            const stat = await fs.promises.lstat(filePath);
            if (stat.mtimeMs < cutoff) await fs.promises.rm(filePath, { force: true });
        } catch {}
    }));
}

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community import [project] [--target community|official] [--dry-run]');
        return;
    }
    const parsed = parseArgs(args, ['target']);
    rejectUnknownOptions(parsed, ['dry-run'], ['target']);
    if (parsed.positionals.length > 1) throw new Error('The import command accepts at most one project path.');

    const root = path.resolve(parsed.positionals[0] || process.cwd());
    const target = resolveTarget(parsed.values.target);

    if (target.key === 'official') {
        const result = await createPackage(root);
        warn('Official Deltamod has no safe local-import protocol.');
        log(`Package created at ${result.destination}`);
        openExternal(buildAppUrl('official'), { dryRun: parsed.flags.has('dry-run') });
        log('Official Deltamod launch requested. Import the package manually.');
        return result;
    }

    const temporaryRoot = path.join(os.tmpdir(), 'Deltamod Community CLI');
    await fs.promises.mkdir(temporaryRoot, { recursive: true });
    await cleanOldTemporaryPackages(temporaryRoot);
    const temporaryArchive = path.join(temporaryRoot, `${crypto.randomUUID()}.modarchive`);
    const result = await createPackage(root, temporaryArchive);
    const importUrl = buildCommunityImportUrl(result.destination);
    openExternal(importUrl, { dryRun: parsed.flags.has('dry-run') });
    log(`Validated ${result.project.files.length} files (${result.project.totalBytes} bytes).`);
    log('Deltamod Community import confirmation requested.');
    return { ...result, importUrl };
}

module.exports = run;
module.exports.cleanOldTemporaryPackages = cleanOldTemporaryPackages;
