const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const outputName = process.platform === 'win32'
    ? 'deltamod-community-cli.exe'
    : 'deltamod-community-cli';
const outputPath = path.join(root, outputName);
const blobPath = path.join(root, 'dist', 'sea-prep.blob');
const fuse = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: root,
        encoding: 'utf8',
        stdio: 'inherit',
        windowsHide: true
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
        throw new Error(`${path.basename(command)} exited with code ${result.status}.`);
    }
}

fs.mkdirSync(path.dirname(blobPath), { recursive: true });
fs.rmSync(blobPath, { force: true });
run(process.execPath, ['--experimental-sea-config', 'sea_config.json']);

fs.rmSync(outputPath, { force: true });
fs.copyFileSync(process.execPath, outputPath);

if (process.platform === 'darwin') {
    run('codesign', ['--remove-signature', outputPath]);
}

const postjectCli = require.resolve('postject/dist/cli.js');
const postjectArgs = [
    postjectCli,
    outputPath,
    'NODE_SEA_BLOB',
    blobPath,
    '--sentinel-fuse',
    fuse
];
if (process.platform === 'darwin') {
    postjectArgs.push('--macho-segment-name', 'NODE_SEA');
}
run(process.execPath, postjectArgs);

console.log(`Built ${outputPath}`);
