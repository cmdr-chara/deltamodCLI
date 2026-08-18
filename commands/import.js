const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { createArchivePath, cleanOldHandoffs } = require('../lib/handoff');
const { buildAppUrl, openExternal, openPath, resolveTarget } = require('../lib/launcher');
const { log, warn } = require('../lib/output');
const { createPackage } = require('../lib/pack');

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community import [project] [--target community|official] [--dry-run]');
        return;
    }
    const parsed = parseArgs(args, ['target']);
    rejectUnknownOptions(parsed, ['dry-run'], ['target']);
    if (parsed.positionals.length > 1) throw new Error('The import command accepts at most one project path.');

    const root = require('path').resolve(parsed.positionals[0] || process.cwd());
    const target = resolveTarget(parsed.values.target);

    if (target.key === 'official') {
        const result = await createPackage(root);
        warn('Official Deltamod has no safe local-import protocol.');
        log(`Package created at ${result.destination}`);
        openExternal(buildAppUrl('official'), { dryRun: parsed.flags.has('dry-run') });
        log('Official Deltamod launch requested. Import the package manually.');
        return result;
    }

    const temporaryArchive = await createArchivePath();
    const result = await createPackage(root, temporaryArchive);
    const handoffPath = openPath(result.destination, { dryRun: parsed.flags.has('dry-run') });
    log(`Validated ${result.project.files.length} files (${result.project.totalBytes} bytes).`);
    log('Deltamod Community import confirmation requested through the native file association.');
    return { ...result, handoffPath };
}

module.exports = run;
// Preserve the previous test/helper export while sharing cleanup with launch markers.
module.exports.cleanOldTemporaryPackages = cleanOldHandoffs;