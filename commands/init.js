const readline = require('readline');
const interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

function style(text, hex) {
    return chalk.hex(hex)(text);
}

function ask(question, regex = null, allowEmpty = false) {
    return new Promise(async resolve => {
        interface.question(question, async (answer) => {
            if (!answer.trim()) {
                if (allowEmpty) {
                    resolve(answer);
                    return;
                }
                console.log(style('Input cannot be empty. Please try again.', '#ff6464'));
                await new Promise(r => setTimeout(r, 1000));
                // cancel the current question and ask again
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 0);
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 0);

                return resolve(ask(question, regex));
            }
            if (regex && !regex.test(answer)) {
                console.log(style('Input does not match the required format. Please try again.', '#ff6464'));
                await new Promise(r => setTimeout(r, 1000));
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 0);
                readline.moveCursor(process.stdout, 0, -1);
                readline.clearLine(process.stdout, 0);
                return resolve(ask(question, regex));
            }
            resolve(answer);
        });
    });
}

async function run() {
    if (fs.existsSync(path.join(process.cwd(), 'meta.json'))) {
        console.log(style('This directory already is initialized. Remove meta.json to reinitialize.', '#ff6464'));
        interface.close();
        return;
    }
    console.log(style('Welcome! We will now init your mod\'s configuration. Please answer the following questions:\n', '#9fc4ff'));
    
    const name = (await ask(style('Name: ', '#468dff'), /^[a-zA-Z0-9\s\-_]+$/)).trim();
    const version = (await ask(style('Version: ', '#468dff'), /^\d+\.\d+\.\d+$/)).trim();
    const description = (await ask(style('Description: ', '#468dff'))).trim();

    const authorsInput = (await ask(style('Authors (comma-separated): ', '#468dff'), true)).trim();
    let author = authorsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    if (author.length == 0) {
        author = [process.env.USER || process.env.USERNAME || 'Mod Developer'];
    }

    const packageID = (await ask(style('Package ID (e.g. website.mod.author): ', '#468dff'), /^[a-zA-Z0-9]+(\.[a-zA-Z0-9]+){2}$/)).trim();
    const game = (await ask(style('Game code: ', '#468dff'), /^.+\..+$/)).trim();
    const url = (await ask(style('URL: ', '#468dff'), /^https?:\/\/.+/, true)).trim();

    const mergeSupportInput = (await ask(style('Merge support? (yes/no): ', '#468dff'), /^(yes|no)$/)).trim().toLowerCase();
    const mergeSupport = mergeSupportInput == 'yes';

    const tagsInput = (await ask(style('Tags (comma-separated): ', '#468dff'), /^[a-zA-Z0-9\s\-_]+$/, true)).trim();
    const tags = tagsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const deltaruneTargetVersion = (
        packageID.startsWith('toby.deltarune') ? 
        (await ask(style('Deltarune target version: ', '#468dff'), /^\d+\.\d+\.\d+$/)).trim() : ""
    );

    const data = {
        metadata: {
            name: name || 'example',
            version: version || '1.0.0',
            description: description || 'Lorem ipsum',
            author: author.length ? author : ['Mod Developer 1', 'Mod Developer 2'],
            packageID: packageID || 'website.mod.author',
            game: game || 'toby.deltarune',
            url: url || 'https://example.com',
            mergeSupport,
            tags: tags.length ? tags : ['other', 'customization']
        },
        deltaruneTargetVersion: deltaruneTargetVersion || '',
        exporter: {
            tool: 'deltamodCLI'
        }
    };

    const outPath = path.join(process.cwd(), 'meta.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 4), 'utf8');

    console.log(style(`\n\nWrote meta.json to ${outPath}\n`, '#84ff9f') + JSON.stringify(data, null, 4));
    interface.close();

    return;
}

module.exports = run;