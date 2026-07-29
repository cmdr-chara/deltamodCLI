const fs = require('fs');
const path = require('path');
const readline = require('readline');
const TOML = require('js-toml');
const { parseArgs, rejectUnknownOptions } = require('../lib/args');
const { style } = require('../lib/output');

function createQuestioner(input = process.stdin, output = process.stdout) {
    const prompt = readline.createInterface({ input, output });

    async function ask(question, options = {}) {
        while (true) {
            const answer = await new Promise(resolve => prompt.question(question, resolve));
            const trimmed = answer.trim();
            if (!trimmed && options.allowEmpty) return '';
            if (!trimmed) {
                console.log(style('Input cannot be empty.', '#ff7d7d'));
                continue;
            }
            if (options.pattern && !options.pattern.test(trimmed)) {
                console.log(style('Input does not match the required format.', '#ff7d7d'));
                continue;
            }
            return trimmed;
        }
    }

    return { ask, close: () => prompt.close() };
}

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community init [project]');
        return;
    }
    const parsed = parseArgs(args);
    rejectUnknownOptions(parsed);
    if (parsed.positionals.length > 1) throw new Error('The init command accepts at most one project path.');

    const root = path.resolve(parsed.positionals[0] || process.cwd());
    await fs.promises.mkdir(root, { recursive: true });
    const outPath = path.join(root, 'meta.toml');
    if (fs.existsSync(outPath) || fs.existsSync(path.join(root, 'meta.json'))) {
        throw new Error('This directory already contains a mod manifest.');
    }

    const questioner = createQuestioner();
    try {
        console.log(style('Create a Deltamod Community mod manifest.\n', '#a9ddff'));
        const name = await questioner.ask(style('Name: ', '#6ec8ff'), {
            pattern: /^[a-zA-Z0-9][a-zA-Z0-9\s_'".()&-]{0,119}$/
        });
        const version = await questioner.ask(style('Version: ', '#6ec8ff'), {
            pattern: /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/
        });
        const description = await questioner.ask(style('Description: ', '#6ec8ff'));
        const authorsInput = await questioner.ask(style('Authors (comma-separated): ', '#6ec8ff'), {
            allowEmpty: true
        });
        const author = authorsInput
            .split(',')
            .map(value => value.trim())
            .filter(Boolean);
        if (!author.length) author.push(process.env.USERNAME || process.env.USER || 'Mod Developer');

        const packageID = await questioner.ask(style('Package ID (example.mod.author): ', '#6ec8ff'), {
            pattern: /^[a-z0-9][a-z0-9_-]{0,62}(?:\.[a-z0-9][a-z0-9_-]{0,62}){2}$/i
        });
        const game = await questioner.ask(style('Game code: ', '#6ec8ff'), {
            pattern: /^[a-z0-9][a-z0-9_-]*(?:\.[a-z0-9][a-z0-9_-]*)+$/i
        });
        const url = await questioner.ask(style('Project URL (optional): ', '#6ec8ff'), {
            allowEmpty: true,
            pattern: /^https:\/\/\S+$/
        });
        const mergeSupportAnswer = await questioner.ask(style('Merge support? (yes/no): ', '#6ec8ff'), {
            pattern: /^(yes|no)$/i
        });
        const tagsInput = await questioner.ask(style('Tags (comma-separated, optional): ', '#6ec8ff'), {
            allowEmpty: true
        });

        const metadata = {
            name,
            version,
            description,
            author,
            packageID,
            game,
            mergeSupport: mergeSupportAnswer.toLowerCase() === 'yes',
            tags: tagsInput.split(',').map(value => value.trim()).filter(Boolean)
        };
        if (url) metadata.url = url;

        const data = {
            metadata,
            exporter: {
                tool: 'deltamod-community-cli'
            }
        };
        if (game === 'toby.deltarune') {
            data.deltaruneTargetVersion = await questioner.ask(style('Deltarune target version: ', '#6ec8ff'), {
                pattern: /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
            });
        }

        await fs.promises.writeFile(outPath, `${TOML.dump(data)}\n`, { encoding: 'utf8', flag: 'wx' });
        console.log(style(`Created ${outPath}`, '#8ce9ac'));
        return data;
    } finally {
        questioner.close();
    }
}

module.exports = run;
module.exports.createQuestioner = createQuestioner;
