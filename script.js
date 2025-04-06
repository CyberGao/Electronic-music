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

            // 为每个按钮创建对应的音频元素
            const songId = button.getAttribute('data-song');
            const audio = new Audio(`music/${songId}.mp3`);
            
            // 保存音频元素引用
            button.audio = audio;
            
            // 进度条更新
            const progressBar = button.parentElement.querySelector('.progress');
            const timeDisplay = button.parentElement.querySelector('.time');
            
            audio.addEventListener('timeupdate', () => {
                const progress = (audio.currentTime / audio.duration) * 100;
                progressBar.style.width = `${progress}%`;
                timeDisplay.textContent = this.formatTime(audio.currentTime);
            });
            
            // 播放结束时重置
            audio.addEventListener('ended', () => {
                this.resetPlayButton(button);
                progressBar.style.width = '0%';
                timeDisplay.textContent = '0:00';
            });
        });

        // 为进度条添加点击事件
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
            // 点击同一首歌
            if (this.isPlaying) {
                this.pauseMusic();
            } else {
                this.playMusic(button);
            }
        } else {
            // 切换到新的歌
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

// 初始化播放器
document.addEventListener('DOMContentLoaded', () => {
    new MusicPlayer();
});

// 平滑滚动效果
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// 导航栏滚动效果
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// 游戏按钮点击事件
document.getElementById('startGame').addEventListener('click', function() {
    // 这里替换为你的游戏URL
    window.location.href = '/Electronic-music/game.html';
});

// 添加页面加载动画效果
document.addEventListener('DOMContentLoaded', function() {
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

// 音乐播放功能
document.querySelectorAll('.play-btn').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const songId = this.getAttribute('data-song');
        // 这里添加音乐播放逻辑
        // 例如：
        console.log(`Playing song: ${songId}`);
        // 可以通过 Audio API 来实现音乐播放
        // const audio = new Audio(`./music/${songId}.mp3`);
        // audio.play();
    });
});
