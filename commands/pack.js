const path = require('path');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { createPackage } = require('../lib/pack');
const { log } = require('../lib/output');

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community pack [project] [--output file.modarchive]');
        return;
    }
    const parsed = parseArgs(args, ['output']);
    rejectUnknownOptions(parsed, [], ['output']);
    if (parsed.positionals.length > 1) throw new Error('The pack command accepts at most one project path.');

    const root = path.resolve(parsed.positionals[0] || process.cwd());
    const output = parsed.values.output ? path.resolve(parsed.values.output) : null;
    const result = await createPackage(root, output);
    log(`Package created: ${result.destination}`);
    console.log(`${result.project.files.length} file(s), ${result.project.totalBytes} uncompressed byte(s).`);
    return result;
}

module.exports = run;
