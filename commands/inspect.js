const path = require('path');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { log, warn } = require('../lib/output');
const { validateProject } = require('../lib/project');

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community inspect [project]');
        return;
    }
    const parsed = parseArgs(args);
    rejectUnknownOptions(parsed);
    if (parsed.positionals.length > 1) throw new Error('The inspect command accepts at most one project path.');

    const project = validateProject(path.resolve(parsed.positionals[0] || process.cwd()));
    log(`${project.metadata.name} ${project.metadata.version}`);
    console.log(`Package ID: ${project.metadata.packageID}`);
    console.log(`Game:       ${project.metadata.game}`);
    console.log(`Manifest:   ${project.manifest.format}`);
    console.log(`Patches:    ${project.patches.length}`);
    console.log(`Files:      ${project.files.length}`);
    console.log(`Size:       ${project.totalBytes} bytes`);
    if (project.manifest.format === 'json') {
        warn('Legacy meta.json is supported, but meta.toml is recommended.');
    }
    return project;
}

module.exports = run;
