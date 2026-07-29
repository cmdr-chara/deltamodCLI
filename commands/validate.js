const path = require('path');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { log, warn } = require('../lib/output');
const { validateProject } = require('../lib/project');

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community validate [project]');
        return;
    }
    const parsed = parseArgs(args);
    rejectUnknownOptions(parsed);
    if (parsed.positionals.length > 1) throw new Error('The validate command accepts at most one project path.');

    const project = validateProject(path.resolve(parsed.positionals[0] || process.cwd()));
    log(`Project is valid: ${project.metadata.name} ${project.metadata.version}`);
    console.log(`${project.patches.length} patch(es), ${project.files.length} file(s), ${project.totalBytes} byte(s).`);
    if (project.manifest.format === 'json') {
        warn('Legacy meta.json will be converted by Deltamod Community during import.');
    }
    return project;
}

module.exports = run;
