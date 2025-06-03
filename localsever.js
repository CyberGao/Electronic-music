
const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ message: '用户名已存在' });
    }
    users.push({ username, password });
    writeUsers(users);
    res.json({ message: '注册成功' });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: '用户名或密码错误' });
    }
    res.json({ message: '登录成功', username, user_id: username });

});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});
