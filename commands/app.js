function run(detached = false) {
    const { log } = require('../index.js');
    const { spawn } = require('child_process');

    if (process.argv[4] == '--debug' && !detached) {
        require('child_process').execSync('start deltamod:');
    }
    else {
        const child = spawn('cmd.exe', ['/c', 'start', '""', 'deltamod:'], {
            detached: true,
            stdio: 'ignore'
        });
        child.unref();
    }

    log('Deltamod main app launched');

    return;
}

module.exports = run;