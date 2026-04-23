const express = require("express");
const chalk = require('chalk');
function style(text, hex) {
    return chalk.hex(hex)(text);
}
function log(...args) {
    console.log(style('deltamodCLI:','#639fff'), ...args);
}

async function run() {
    return new Promise(async resolve => {
        let rand = Math.random().toString(36).substring(2, 15);

        const app = express();
        const PORT = 3000;

        const html = `
        <!-- Generated at compile-time by MiscTools Builder on 2026-04-11T19:11:58.913Z -->
        <!-- Modified for DeltamodCLI -->
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Create Deltamod XML file</title>
        </head>
        <body>
            <div class="header">
                <h1 id="h1title">Create Deltamod XML file</h1>
                <p style="margin-bottom: 0;" id="h1desc">Create a modding.xml file for use in Deltamod</p>
            </div>
            <div class="main" style="height: calc(100% - 80px); overflow-y: scroll;">
                <b>Generate a <code>modding.xml</code> file</b>
        <br><br>
        <i>Before proceeding with making a modding.xml, we ask you to read the Deltamod Modding Standard</i>
        <br>
        <hr>
        <table>
            <colgroup>
                <col style="width: 15%;">
                <col style="width: 40%;">
                <col style="width: 40%;">
                <col style="width: 5%;">
            </colgroup>
            <thead>
                <tr>
                    <th>Patch type (XDelta, Override..)</th>
                    <th>Patch file (ex. <code>./myModpackPatch.xdelta</code>)</th>
                    <th>Patch destination (ex. <code>./chapter1_windows/data.win</code>)</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody id="patchBody">
                <!-- Rows will be added here dynamically -->
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4"><button style="width: 100%; padding: 10px; font-size: 1em; cursor: pointer;" onclick="addPatch()">Add</button></td>
                </tr>
            </tfoot>
            </table>
        <hr>
        <button onclick="generateXML()">Write <code>modding.xml</code> file</button>
        <p>When the file is generated, this editor will close.</p>
            </div>
        </body>
        <!-- service worker -->
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker
                        .register('/worker.js')
                        .then((registration) => {
                            console.log('Service Worker registered with scope: ', registration.scope);
                        })
                        .catch((error) => {
                            console.log('Service Worker registration failed: ', error);
                        });
                });
            }

        </script>
        <script>
            var cachedpatches = [];

        function addPatch() {
            var uid = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

            var tbody = document.getElementById('patchBody');
            var newRow = document.createElement('tr');
            
            var td0 = document.createElement('td');
            var select0 = document.createElement('select');
            select0.name = 'patchtype';
            select0.innerHTML = '<option value="xdelta">XDelta (or other supported patching file)</option><option value="override">Copy file to</option>';
            td0.appendChild(select0);

            var td1 = document.createElement('td');
            var input1 = document.createElement('input');
            input1.type = 'text';
            input1.name = 'patchfrom';
            input1.placeholder = './path/to/patch.xdelta';
            td1.appendChild(input1);

            var td2 = document.createElement('td');
            var input2 = document.createElement('input');
            input2.type = 'text';
            input2.name = 'patchto';
            input2.placeholder = './path/to/dest.win';
            td2.appendChild(input2);

            var td3 = document.createElement('td');
            var removeButton = document.createElement('button');
            removeButton.type = 'button';
            removeButton.style.width = '100%';
            removeButton.style.padding = '5px';
            removeButton.innerText = 'Remove';
            removeButton.onclick = function() {
                tbody.removeChild(newRow);
                cachedpatches = cachedpatches.filter(item => item.uid !== uid);
            };
            td3.appendChild(removeButton);

            cachedpatches.push({from: input1, to: input2, uid: uid});

            newRow.appendChild(td0);
            newRow.appendChild(td1);
            newRow.appendChild(td2);
            newRow.appendChild(td3);
            tbody.appendChild(newRow);
        }

        function generateXML() {
            function i(id) {
                return document.getElementById(id).value;
            }

            var str = "";

            var doc = document.implementation.createDocument("", "", null);

            cachedpatches.forEach(function (entry) {
                var fromInput = entry.from;
                var toInput = entry.to;
                if (!fromInput || !toInput) return;

                var row = fromInput.closest('tr');
                var typeSelect = row ? row.querySelector('select[name="patchtype"]') : null;
                var typeVal = typeSelect ? typeSelect.value : 'xdelta';

                var fromVal = fromInput.value.trim();
                var toVal = toInput.value.trim();
                if (!fromVal || !toVal) return;

                var patchEl = doc.createElement('patch');
                patchEl.setAttribute('type', typeVal);
                patchEl.setAttribute('patch', fromVal);
                patchEl.setAttribute('to', toVal);
                
                var patchString = new XMLSerializer().serializeToString(patchEl);
                str += patchString + "\\n";
            });

            fetch('/load', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Token': '${rand}'
                },  
                body: JSON.stringify({ xml: str })
            }).then(res => res.json()).then(data => {
                if (data.success) {
                    window.close();
                }
            });
        }
        </script>
        <style>
        .header {
            margin: 10px;
            width: calc(50% - 100px);
            height: fit-content;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            text-align: center;
            background-color: rgb(43, 43, 43);
            position: fixed;
            top: 10px;
            left: 10px;

            color: white;
            animation: fadeIn 0.5s ease-in-out;
        }

        .header > * {
            color: white;
        }

        @keyframes fadeIn {
            from { transform: translateX(-10px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        deltahub-icon {
            width: 15px;
            height: 15px;
            vertical-align: middle;
            background-image: url('deltahubn.png');
            background-size: contain;
            background-repeat: no-repeat;
            display: inline-block;
        }

        deltamod-icon {
            width: 15px;
            height: 15px;
            vertical-align: middle;
            background-image: url('deltamod.png');
            background-size: contain;
            background-repeat: no-repeat;
            display: inline-block;
        }

        input:not([type="checkbox"]), textarea, select {
            display: block;
            margin-top: 5px;
            margin-bottom: 5px;
            padding: 8px;
            width: calc(100% - 20px);
        }
        .sidebar, .main {
            min-height: 300px;
        }
        .content {
            display: flex;
            justify-content: left;
            align-items: baseline;
            padding: 20px;
            width: 100%;
            
            gap: 20px;
        }

        .main {
            background-color: #efefef;
            padding: 20px;
            margin: 10px;
            position: fixed;
            top: 10px;
            right: 10px;
            border-radius: 10px;
            overflow-y: scroll;
            width: calc(50% - 60px);
            height: fit-content;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            animation: fadeIn 0.5s ease-in-out;
        }

        .sidebar {
            background-color: #62626237;
            padding: 10px;
            border-radius: 5px;
        }

        .sidebar > button {
            display: block;
            width: 100%;
            font-size: 0.7em;
            margin-bottom: 5px;
            cursor: pointer;
        }

        body {
            margin: 0;
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            padding: 0;
            position: absolute;
            top: 0;
            height: 100%;
            overflow-y: scroll;
            overflow-x: hidden;
            left: 0;
            width: 100%;
        }

        h1,h2,h3,h4,h5,h6 {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            margin: 0;
        }
        h1 {
            margin: 0;
            font-size: 2.5em;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background-color: #ffffff;
        }

        table th, table td {
            padding: 10px;
            text-align: left;
            border: 1px solid #000000;
        }

        table th {
            background-color: #000000;
            color: #ffffff;
            font-weight: bold;
        }

        table tr:nth-child(even) {
            background-color: #f0f0f0;
        }

        table tr:hover {
            background-color: #e0e0e0;
        }
        </style>
        </html>
        `;

        app.get("/", (req, res) => {
            res.status(200).type("html").send(html);
        });

        app.post("/load", express.json(), (req, res) => {
            if (req.headers['x-token'] !== rand) {
                res.status(403).json({ success: false, message: 'Forbidden' });
                return;
            }
            const xmlContent = req.body.xml;

            const fs = require('fs');
            const path = require('path');
            fs.writeFileSync(path.join(process.cwd(), 'modding.xml'), xmlContent, 'utf-8');
            res.json({ success: true });

            log('xml editor closed');
            resolve();
        });

        app.listen(PORT, () => {
            log('opening xml editor in browser...');
            require('child_process').exec(`start http://localhost:${PORT}`);
        });
    });    
}

module.exports = run;