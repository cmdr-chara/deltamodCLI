const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { createLaunchMarker } = require('../lib/handoff');
const { buildAppUrl, openExternal, openPath, resolveTarget } = require('../lib/launcher');
const { log } = require('../lib/output');

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community app [--target community|official] [--dry-run]');
        return;
    }
    const parsed = parseArgs(args, ['target']);
    rejectUnknownOptions(parsed, ['dry-run'], ['target']);
    if (parsed.positionals.length) throw new Error('The app command does not accept a path.');

    const target = resolveTarget(parsed.values.target);
    if (target.key === 'community') {
        const dryRun = parsed.flags.has('dry-run');
        const marker = await createLaunchMarker({ dryRun });
        openPath(marker, { dryRun });
        log(`${target.label} launch requested through the native file association.`);
        return { handoffPath: marker };
    }

    openExternal(buildAppUrl(target.key), { dryRun: parsed.flags.has('dry-run') });
    log(`${target.label} launch requested.`);
}

module.exports = run;