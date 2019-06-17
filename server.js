const net = require('net');
const server = net.createServer();

let allUsers = {};
let currentUser = null;
let totalNum = 0;
const timerSet = 3000;
const port = 1996;
const host = '10.2.131.6';
const dealFunParams = {
    'login': login,
    'chat': chat,
    'quit': quit,
    'exit': quit,
}

server.on('connection', socket => {
    // 心跳检测
    let online = true;
    let keepLive = socket.timer = setInterval(() => {
        if (!online) {
            currentUser = socket;
            quit(socket.user);
            return
        }
        if (socket.writable) {
            online = false;
            socket.write('...');
        } else {
            currentUser = socket;
            quit(socket.user);
        }
    }, timerSet);
    // 数据接收
    socket.on('data', (data) => {
        currentUser = socket;
        let info = JSON.parse(data.toString());
        if (info.state === 'keep') {
            online = true;
            return;
        }
        dealFun(info);
    });
    // 连接结束
    socket.on('end', () => {
        console.log(`client disconnected.\n\r`);
        socket.destroy();
    });
    // 错误处理
    socket.on('error', err => {
        console.log(err);
    });
});

server.on('error', err => {
    console.log(err);
});

server.on('listening', () => {
    console.log(`the server is listening on ${server.address().address}:${server.address().port}`);
});

server.on('close', () => {
    console.log(`the server is closed`);
});

server.listen({
    host: host,
    port: port,
});

/** 初次登录 */
function login(data) {
    let id = getRandomStr(8) + (++totalNum);
    currentUser.write(`您好，${data.user}：这里总共有${Object.keys(allUsers).length}个盆友在聊天！`);
    currentUser.user = data.user;
    currentUser.id = id;
    allUsers[id] = currentUser;
    spread(`系统：${data.user}进入了聊天室。`);
}

/** 聊天 */
function chat(data) {
    if (data.msg.toLowerCase() == 'quit' || data.msg.toLowerCase() === 'exit') {
        quit(data.user);
        return
    }
    let mes = `${data.user}说：${data.msg}`;
    spread(mes);
}

/** 广播消息 */
function spread(data) {
    Object.keys(allUsers).map(id => {
        if (allUsers[id] !== currentUser && allUsers[id].writable) {
            allUsers[id].write(data);
        }
    })
}

/** 退出聊天室 */
function quit(data) {
    let message = `${data}退出了聊天室。`
    spread(message);
    free(currentUser);
}

/** 释放资源 */
function free(data) {
    data.end();
    delete allUsers[data.id];
    data.timer && clearInterval(data.timer);
}

/** 函数处理 */
function dealFun(data) {
    const state = data.state;
    if (typeof dealFunParams[state] !== 'function') {
        return;
    }
    dealFunParams[state](data);
}

/** 生成随机数 */
function getRandomStr(len = 1) {
    let randomStr = Math.random().toString(36).substr(2);
    return randomStr.substr(0, len);
}