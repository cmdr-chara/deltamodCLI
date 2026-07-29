const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { isSafeRelativePath, resolveProjectPath } = require('../lib/project');
const { openExternal } = require('../lib/launcher');
const { log } = require('../lib/output');

const MAXIMUM_BODY_BYTES = 1024 * 1024;
const MAXIMUM_PATCHES = 1000;
const PATCH_TYPES = new Set(['override', 'copy', 'xdelta', 'g3mpatch']);

function escapeXmlAttribute(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function validateSubmittedPatches(value, root) {
    if (!Array.isArray(value) || value.length === 0 || value.length > MAXIMUM_PATCHES) {
        throw new Error(`Provide between 1 and ${MAXIMUM_PATCHES} patches.`);
    }
    return value.map((entry, index) => {
        const type = String(entry?.type || '').toLowerCase();
        const patch = String(entry?.patch || '').trim();
        const to = String(entry?.to || '').trim();
        if (!PATCH_TYPES.has(type)) throw new Error(`Patch ${index + 1} has an unsupported type.`);
        if (!isSafeRelativePath(patch) || !isSafeRelativePath(to)) {
            throw new Error(`Patch ${index + 1} must use safe relative paths.`);
        }
        const source = resolveProjectPath(root, patch, true);
        const stat = fs.lstatSync(source);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink > 1) {
            throw new Error(`Patch source "${patch}" must be a regular, non-linked file.`);
        }
        return { type, patch, to };
    });
}

function serializePatches(patches) {
    return `${patches.map(entry => (
        `<patch type="${escapeXmlAttribute(entry.type)}" patch="${escapeXmlAttribute(entry.patch)}" to="${escapeXmlAttribute(entry.to)}"/>`
    )).join('\n')}\n`;
}

function editorHtml(token, nonce) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Deltamod Community patch editor</title>
<style>
:root { color-scheme: dark; font-family: system-ui, sans-serif; background: #120d12; color: #f7edf4; }
body { margin: 0; padding: 2rem; }
main { max-width: 1100px; margin: auto; }
h1 { margin-bottom: .25rem; }
p { color: #cbbec8; }
table { width: 100%; border-collapse: collapse; background: #211721; }
th, td { padding: .75rem; border-bottom: 1px solid #493246; text-align: left; }
input, select, button { box-sizing: border-box; min-height: 2.5rem; border: 1px solid #79516f; border-radius: .35rem; }
input, select { width: 100%; padding: .5rem; background: #120d12; color: inherit; }
button { padding: .55rem .9rem; background: #ad3c5b; color: white; font-weight: 700; cursor: pointer; }
.actions { display: flex; gap: .75rem; margin-top: 1rem; }
.remove { background: #4b2d3a; }
#status { min-height: 1.5rem; }
</style>
</head>
<body>
<main>
<h1>modding.xml editor</h1>
<p>All paths are validated as project-relative before the file is written.</p>
<table>
<thead><tr><th>Type</th><th>Source file</th><th>Game destination</th><th>Action</th></tr></thead>
<tbody id="patches"></tbody>
</table>
<div class="actions">
<button id="add" type="button">Add patch</button>
<button id="save" type="button">Validate and save</button>
</div>
<p id="status" role="status"></p>
</main>
<script nonce="${nonce}">
const token = ${JSON.stringify(token)};
const body = document.querySelector('#patches');
const status = document.querySelector('#status');
function addPatch() {
  const row = document.createElement('tr');
  row.innerHTML = '<td><select data-field="type"><option value="xdelta">XDelta</option><option value="g3mpatch">G3M patch</option><option value="override">Override</option><option value="copy">Copy</option></select></td><td><input data-field="patch" placeholder="./patches/change.xdelta"></td><td><input data-field="to" placeholder="./chapter1_windows/data.win"></td><td><button type="button" class="remove">Remove</button></td>';
  row.querySelector('.remove').addEventListener('click', () => row.remove());
  body.append(row);
}
document.querySelector('#add').addEventListener('click', addPatch);
document.querySelector('#save').addEventListener('click', async () => {
  status.textContent = 'Validating...';
  const patches = [...body.querySelectorAll('tr')].map(row => ({
    type: row.querySelector('[data-field="type"]').value,
    patch: row.querySelector('[data-field="patch"]').value,
    to: row.querySelector('[data-field="to"]').value
  }));
  try {
    const response = await fetch('/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-deltamod-token': token },
      body: JSON.stringify({ patches })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Save failed.');
    status.textContent = 'Saved. You may close this tab.';
  } catch (error) {
    status.textContent = error.message;
  }
});
addPatch();
</script>
</body>
</html>`;
}

async function readJsonBody(request) {
    const chunks = [];
    let size = 0;
    for await (const chunk of request) {
        size += chunk.length;
        if (size > MAXIMUM_BODY_BYTES) throw new Error('Request body is too large.');
        chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function run(args = []) {
    if (args.includes('--help')) {
        console.log('Usage: deltamod-community xml [project] [--no-open]');
        return;
    }
    const noOpen = args.includes('--no-open');
    const positionals = args.filter(value => !value.startsWith('--'));
    const unknown = args.filter(value => value.startsWith('--') && value !== '--no-open');
    if (unknown.length) throw new Error(`Unknown option ${unknown[0]}.`);
    if (positionals.length > 1) throw new Error('The xml command accepts at most one project path.');

    const root = path.resolve(positionals[0] || process.cwd());
    const token = crypto.randomBytes(32).toString('base64url');
    const nonce = crypto.randomBytes(18).toString('base64');
    const html = editorHtml(token, nonce);

    await new Promise((resolve, reject) => {
        const server = http.createServer(async (request, response) => {
            response.setHeader('Cache-Control', 'no-store');
            response.setHeader('X-Content-Type-Options', 'nosniff');
            try {
                if (request.method === 'GET' && request.url === '/') {
                    response.writeHead(200, {
                        'Content-Type': 'text/html; charset=utf-8',
                        'Content-Security-Policy': `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}'; connect-src 'self'; base-uri 'none'; form-action 'none'`
                    });
                    response.end(html);
                    return;
                }
                if (request.method === 'POST' && request.url === '/save') {
                    if (request.headers['x-deltamod-token'] !== token) {
                        response.writeHead(403, { 'Content-Type': 'application/json' });
                        response.end(JSON.stringify({ error: 'Forbidden.' }));
                        return;
                    }
                    const body = await readJsonBody(request);
                    const patches = validateSubmittedPatches(body.patches, root);
                    const outputPath = path.join(root, 'modding.xml');
                    const temporary = `${outputPath}.${process.pid}.tmp`;
                    await fs.promises.writeFile(temporary, serializePatches(patches), { encoding: 'utf8', flag: 'wx' });
                    await fs.promises.rename(temporary, outputPath);
                    response.writeHead(200, { 'Content-Type': 'application/json' });
                    response.end(JSON.stringify({ success: true }));
                    log(`Saved ${outputPath}`);
                    setImmediate(() => server.close(resolve));
                    return;
                }
                response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                response.end('Not found.');
            } catch (error) {
                response.writeHead(400, { 'Content-Type': 'application/json' });
                response.end(JSON.stringify({ error: error.message }));
            }
        });
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const address = server.address();
            const url = `http://127.0.0.1:${address.port}/`;
            log(`Patch editor available at ${url}`);
            if (!noOpen) openExternal(url);
        });
    });
}

module.exports = run;
module.exports.serializePatches = serializePatches;
module.exports.validateSubmittedPatches = validateSubmittedPatches;
