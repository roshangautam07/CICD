const http = require('http');
const WebSocket = require('ws');
const simpleGit = require('simple-git');
const { exec } = require('child_process');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        const { repoUrl, destination,source, action, username, password,serverIp,onSuccessCommand} = JSON.parse(message);
        console.log(action)
        // SimpleGit instance with output handler
        // const git = simpleGit(destination).outputHandler((command, stdout, stderr) => {
        //     stdout.on('data', (data) => ws.send(`stdout: ${data}`));
        //     stderr.on('data', (data) => ws.send(`stderr: ${data}`));
        // });

        if (action === 'clone') {
            // Clone the repository
            git.clone('https://github.com/steveukx/git-js.git', destination, ['--progress'])
                .then(() => {
                    ws.send('Cloning completed')
                    ws.close()
                })
                .catch(err => ws.send(`Error: ${err.message}`));
        } else if (action === 'pull') {
            // Pull the latest changes
            git.pull()
                .then(() => {
                    ws.send('Pull completed');
                    ws.close();
                }
                )
                .catch(err => ws.send(`Error: ${err.message}`));
        } else if (action == 'copy') {
            console.log('HREE')
            // Using rsync to copy files over SSH
            const remotePath = serverIp;
            const localPath = '/home/roh/Documents/delivery\ app/DeliveryAPI/dist/';
            const rsyncCommand = `rsync -avzhe ssh "${localPath}" ${username}@${remotePath}:${destination}`;
console.log(rsyncCommand)
            const rsync = exec(rsyncCommand);

            rsync.stdout.on('data', (data) => ws.send(`stdout: ${data}`));
            rsync.stderr.on('data', (data) => ws.send(`stderr: ${data}`));

            rsync.on('close', (code) => {
                ws.send(`Copy operation completed with exit code ${code}`);
                const def = onSuccessCommand || "pm2 reload node-demon";
                const pm = exec(`ssh root@143.110.254.245 ${def}`);
                pm.stdout.on('data', (data) => ws.send(`stdout: ${data}`));
                pm.stderr.on('data', (data) => ws.send(`stderr: ${data}`));
                 pm.on('close', (code) => {
                                     ws.close()

                });
            });
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(9990, () => {
    console.log('Server is listening on port 9990');
});
