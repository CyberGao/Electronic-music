const express = require('express');
const axios = require('axios'); // ✅ 改成 axios
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const HOST = '127.0.0.1';
const PORT = 5000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// 调用对方 Flask API 注册
app.post('/api/register', async (req, res) => {
    try {
        //const response = await axios.post('http://172.20.10.4:5000/user/register', req.body);
        const response = await axios.post('http://192.168.43.146:5000/user/register', req.body);
        res.json(response.data);
    } catch (err) {
        console.error('注册请求失败:', err.message);
        res.status(err.response?.status || 500).json({ message: err.response?.data?.message || '无法连接注册服务' });
    }
});

// 登录
app.post('/api/login', async (req, res) => {
    try {
        //const response = await axios.post('http://172.20.10.4:5000/user/login', req.body);
        const response = await axios.post('http://192.168.43.146:5000/user/login', req.body);
        res.json(response.data);
    } catch (err) {
        console.error('登录请求失败:', err.message);
        res.status(err.response?.status || 500).json({ message: err.response?.data?.message || '无法连接登录服务' });
    }
});

app.listen(PORT, HOST, () => {
    console.log(`服务器运行在 http://${HOST}:${PORT}`);
});
