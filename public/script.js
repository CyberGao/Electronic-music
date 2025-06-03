
class MusicPlayer {
    constructor() {
        this.currentAudio = null;
        this.currentButton = null;
        this.isPlaying = false;
        this.initializePlayers();
    }

    initializePlayers() {
        const buttons = document.querySelectorAll('.play-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePlayClick(button);
            });

            const songId = button.getAttribute('data-song');
            const audio = new Audio(`music/${songId}.mp3`);
            button.audio = audio;

            const progressBar = button.parentElement.querySelector('.progress');
            const timeDisplay = button.parentElement.querySelector('.time');

            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
                timeDisplay.textContent = this.formatTime(audio.currentTime);
            });

            audio.addEventListener('ended', () => {
                this.resetPlayButton(button);
                progressBar.style.width = '0%';
                timeDisplay.textContent = '0:00';
            });
        });

        document.querySelectorAll('.progress-bar').forEach(bar => {
            bar.addEventListener('click', (e) => {
                const button = bar.parentElement.querySelector('.play-btn');
                if (button.audio) {
                    const rect = bar.getBoundingClientRect();
                    const clickPosition = (e.clientX - rect.left) / rect.width;
                    button.audio.currentTime = button.audio.duration * clickPosition;
                }
            });
        });
    }

    handlePlayClick(button) {
        if (this.currentButton === button) {
            if (this.isPlaying) {
                this.pauseMusic();
            } else {
                this.playMusic(button);
            }
        } else {
            if (this.currentButton) {
                this.resetPlayButton(this.currentButton);
                this.currentButton.audio.pause();
                this.currentButton.audio.currentTime = 0;
            }
            this.playMusic(button);
        }
    }

    playMusic(button) {
        button.classList.add('playing');
        button.audio.play();
        this.currentButton = button;
        this.isPlaying = true;
    }

    pauseMusic() {
        if (this.currentButton) {
            this.currentButton.classList.remove('playing');
            this.currentButton.audio.pause();
            this.isPlaying = false;
        }
    }

    resetPlayButton(button) {
        button.classList.remove('playing');
        const progressBar = button.parentElement.querySelector('.progress');
        const timeDisplay = button.parentElement.querySelector('.time');
        progressBar.style.width = '0%';
        timeDisplay.textContent = '0:00';
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    new MusicPlayer();

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    window.addEventListener('scroll', function () {
        const navbar = document.querySelector('.navbar');
        navbar.style.background = window.scrollY > 50 ? 'rgba(0, 0, 0, 0.95)' : 'rgba(0, 0, 0, 0.9)';
    });

    const modal = document.getElementById('auth-modal');
    const authButton = document.getElementById('auth-trigger');
    const closeBtn = document.querySelector('.close-btn');
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    authButton.addEventListener('click', function (e) {
        e.preventDefault();
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', function () {
        modal.style.display = 'none';
    });

    window.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            toggleBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const formToShow = this.getAttribute('data-form');
            if (formToShow === 'login-form') {
                loginForm.classList.remove('hidden');
                registerForm.classList.add('hidden');
            } else {
                loginForm.classList.add('hidden');
                registerForm.classList.remove('hidden');
            }
        });
    });

    loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = this.querySelector('input[type="text"]').value;
    const password = this.querySelector('input[type="password"]').value;

    const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    if (response.ok) {
        modal.style.display = 'none';
        document.getElementById('auth-trigger').outerHTML =
            `<span id="user-name">${username}</span>`;
    } else {
        alert(result.message);
    }
});


    registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const username = this.querySelector('input[type="text"]').value;
    const passwords = this.querySelectorAll('input[type="password"]');

    if (passwords[0].value !== passwords[1].value) {
        alert('两次输入的密码不一致！');
        return;
    }

    const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: passwords[0].value })
    });

    const result = await response.json();
    if (response.ok) {
        alert('注册成功！请登录');
        // 自动切换到登录页
        toggleBtns[0].click();
    } else {
        alert(result.message);
    }
});


    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
            }
        });
    });

    sections.forEach(section => {
        section.style.opacity = 0;
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});

// AI对话相关功能
document.addEventListener('DOMContentLoaded', function() {
    const floatBall = document.getElementById('ai-float-ball');
    const chatModal = document.getElementById('ai-chat-modal');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-message');
    const closeButton = document.querySelector('.chat-close-btn');

    // 拖动相关变量
    let isDragging = false;
    let startX, startY;
    let ballRect;

    // 拖动功能
    floatBall.addEventListener('mousedown', function(e) {
        isDragging = true;
        ballRect = floatBall.getBoundingClientRect();
        startX = e.clientX - ballRect.left;
        startY = e.clientY - ballRect.top;
        
        // 添加鼠标移动和松开的事件监听
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    // 鼠标移动处理
    function onMouseMove(e) {
        if (!isDragging) return;

        e.preventDefault();

        // 计算新位置
        let left = e.clientX - startX;
        let top = e.clientY - startY;

        // 限制在窗口范围内
        const maxX = window.innerWidth - ballRect.width;
        const maxY = window.innerHeight - ballRect.height;

        left = Math.max(0, Math.min(left, maxX));
        top = Math.max(0, Math.min(top, maxY));

        // 更新位置
        floatBall.style.left = `${left}px`;
        floatBall.style.top = `${top}px`;
    }

    // 鼠标松开处理
    function onMouseUp(e) {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // 检查是否是点击事件（移动距离很小）
        const endX = e.clientX - startX;
        const endY = e.clientY - startY;
        const moveDistance = Math.sqrt(
            Math.pow(endX - ballRect.left, 2) + 
            Math.pow(endY - ballRect.top, 2)
        );

        // 如果移动距离小于5px，认为是点击事件
        if (moveDistance < 5) {
            toggleChat();
        }
    }

    // 切换聊天窗口显示状态
    function toggleChat() {
        chatModal.style.display = 
            chatModal.style.display === 'none' || 
            chatModal.style.display === '' ? 'block' : 'none';
    }

    closeButton.addEventListener('click', () => {
        chatModal.style.display = 'none';
    });

    // 发送消息功能
 async function sendMessage() {
    const message = document.getElementById('chat-input').value.trim();
    if (!message) return;

    // 获取存储的token
    const token = localStorage.getItem('jwt_token');
    if (!token) {
        // 如果没有token，提示用户登录
        alert('请先登录后再发送消息');
        return;
    }

    // 添加用户消息到对话框
    addMessage(message, 'user');
    document.getElementById('chat-input').value = '';

    try {
        const response = await fetch('http://192.168.43.146:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // 在请求头中添加token
            },
            body: JSON.stringify({
                message: message
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // token无效或过期
                alert('登录已过期，请重新登录');
                localStorage.removeItem('jwt_token'); // 清除无效token
                return;
            }
            throw new Error('网络请求失败');
        }

        const data = await response.json();
        // 添加AI回复到对话框
        addMessage(data.response, 'ai');

    } catch (error) {
        console.error('发送消息失败:', error);
        addMessage('抱歉，发送消息失败，请稍后重试。', 'ai');
    }
}

// 在登录成功后保存token
async function handleLogin(username, password) {
    try {
        const response = await fetch('http://192.168.43.146:5000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.token) {
            // 保存token到localStorage
            localStorage.setItem('jwt_token', data.token);
            // 可以关闭登录模态框
            document.getElementById('auth-modal').style.display = 'none';
            return true;
        } else {
            alert('登录失败：' + (data.message || '未知错误'));
            return false;
        }
    } catch (error) {
        console.error('登录错误:', error);
        alert('登录失败，请稍后重试');
        return false;
    }
}

// 检查登录状态
function checkLoginStatus() {
    return localStorage.getItem('jwt_token') !== null;
}

// 当打开AI聊天窗口时检查登录状态
document.getElementById('ai-float-ball').addEventListener('click', function() {
    if (!checkLoginStatus()) {
        alert('请先登录后再使用AI聊天功能');
        // 可以在这里触发显示登录模态框
        document.getElementById('auth-modal').style.display = 'block';
        return;
    }
    // 显示聊天窗口
    document.getElementById('ai-chat-modal').style.display = 'block';
    this.style.display = 'none';
});
});