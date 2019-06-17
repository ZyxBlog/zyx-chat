const net = require('net');
const cout = process.stdout;
const cin = process.stdin;

let client = null;
let user = '';

cout.write('请输入用户名：');

cin.on('data', data => {
    let msg = ''
    if (data.toString() !== '\r\n') {
        if (client === null) {
            user = data.toString().replace(/[\r\n]/ig, '');
            createClient();
        } else {
            msg = data.toString().replace(/[\r\n]/ig, '');
            client.write(JSON.stringify({
                state: 'chat',
                msg: msg,
                user: user,
            }));
            if (msg.toLowerCase() == 'exit' || msg.toLowerCase() == 'quit') {
                client.end();
                cin.end();
                return
            }
            cout.write(`你说：${msg}\n\r`);
        }
    } else {
        cout.write(`请输入用户名称：`)
    }
})

function createClient() {
    cout.write(`输入 'EXIT OR QUIT'退出聊天。\r\n`)
    client = new net.Socket();
    client.connect({port: 1996, host: '10.2.131.6'});
    addListener(client);
}

function addListener(client) {
    client.on('connect', () => {
        cout.write(`已连接到服务器\n\r`);
        client.write(JSON.stringify({
            state: 'login',
            msg: 'connect server success',
            user: user,
        }));
    });
    client.on('end', () => {
        cout.write(`与服务器已断开连接\n\r`);
    });
    client.on('data', data => {
        if (data.toString() == '...') {
            client.write(JSON.stringify({
                state: 'keep',
                msg: '',
                user: user,
            }));
            return
        }
        cout.write(`${data}\n\r`);
    });
    client.on('error', err => {
        cout.write(`error has occured: ${err}`)
    });
}