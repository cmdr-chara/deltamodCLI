const fs = require('fs');
const os = require('os');
const path = require('path');
const TOML = require('js-toml');

function createProject(options = {}) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deltamod-cli-test-'));
    fs.mkdirSync(path.join(root, 'patches'), { recursive: true });
    fs.writeFileSync(path.join(root, 'patches', 'change.bin'), 'patch-data');
    const manifest = {
        metadata: {
            name: 'Test Mod',
            version: '1.2.3',
            description: 'A test mod',
            author: ['Test Author'],
            packageID: 'tests.mod.author',
            game: 'toby.deltarune',
            mergeSupport: false,
            tags: ['test']
        },
        exporter: {
            tool: 'deltamod-community-cli'
        }
    };
    fs.writeFileSync(path.join(root, 'meta.toml'), TOML.dump(manifest));
    fs.writeFileSync(
        path.join(root, 'modding.xml'),
        options.xml || '<patch type="override" patch="./patches/change.bin" to="./chapter1_windows/data.win"/>\n'
    );
    return root;
}

function removeProject(root) {
    fs.rmSync(root, { recursive: true, force: true });
}

module.exports = {
    createProject,
    removeProject
};
