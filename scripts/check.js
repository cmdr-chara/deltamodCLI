const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const directories = ['commands', 'lib', 'scripts', 'test'];
const files = [path.join(root, 'index.js')];

for (const directory of directories) {
    const fullDirectory = path.join(root, directory);
    if (!fs.existsSync(fullDirectory)) continue;
    const stack = [fullDirectory];
    while (stack.length) {
        const current = stack.pop();
        for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) stack.push(fullPath);
            else if (entry.isFile() && entry.name.endsWith('.js')) files.push(fullPath);
        }
    }
}

for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status || 1);
}

console.log(`Checked ${files.length} JavaScript files.`);
