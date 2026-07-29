const fs = require('fs');
const path = require('path');
const { ZipArchive } = require('archiver');
const { validateProject } = require('./project');

function safeFileName(value) {
    return String(value)
        .trim()
        .replace(/[^a-z0-9._-]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120) || 'deltamod-package';
}

function defaultOutputPath(project) {
    const fileName = `${safeFileName(project.metadata.packageID)}-${safeFileName(project.metadata.version)}.modarchive`;
    return path.join(project.root, '.deltamod-build', fileName);
}

async function createPackage(root = process.cwd(), outputPath = null) {
    const preliminary = validateProject(root);
    const destination = path.resolve(outputPath || defaultOutputPath(preliminary));
    const project = validateProject(root, { excludedAbsolutePaths: [destination] });

    if (destination === project.root) throw new Error('The package output cannot replace the project directory.');
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });

    const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
    const output = fs.createWriteStream(temporary, { flags: 'wx' });
    const archive = new ZipArchive({ zlib: { level: 9 } });
    const closed = new Promise((resolve, reject) => {
        output.once('close', resolve);
        output.once('error', reject);
        archive.once('error', reject);
        archive.on('warning', warning => {
            if (warning.code !== 'ENOENT') reject(warning);
        });
    });

    archive.pipe(output);
    for (const file of project.files) {
        archive.file(file.absolute, { name: file.relative });
    }

    try {
        await archive.finalize();
        await closed;
        await fs.promises.rename(temporary, destination);
        return { destination, project };
    } catch (error) {
        archive.abort();
        output.destroy();
        await fs.promises.rm(temporary, { force: true });
        throw error;
    }
}

module.exports = {
    createPackage,
    defaultOutputPath,
    safeFileName
};
