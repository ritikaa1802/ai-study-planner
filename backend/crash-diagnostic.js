const { spawn } = require('child_process');
const fs = require('fs');

const logFile = fs.createWriteStream('crash-diagnostic.log', { flags: 'a' });

function startServer() {
    console.log("Starting server diagnostics...");
    const server = spawn('npx', ['ts-node', 'src/index.ts'], {
        env: { ...process.env, NODE_ENV: 'development' },
        shell: true
    });

    server.stdout.on('data', (data) => {
        const msg = data.toString();
        console.log(`[STDOUT]: ${msg}`);
        logFile.write(`[STDOUT]: ${msg}\n`);
    });

    server.stderr.on('data', (data) => {
        const msg = data.toString();
        console.error(`[STDERR]: ${msg}`);
        logFile.write(`[STDERR]: ${msg}\n`);
    });

    server.on('close', (code) => {
        console.log(`Server process exited with code ${code}`);
        logFile.write(`Server process exited with code ${code}\n`);
        if (code !== 0) {
            console.log("SERVER CRASH DETECTED. Restarting in 5s...");
            setTimeout(startServer, 5000);
        }
    });
}

startServer();
