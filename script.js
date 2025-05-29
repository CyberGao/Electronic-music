
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

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value;
        const password = this.querySelector('input[type="password"]').value;
        console.log('登录:', { username, password });
    });

    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = this.querySelector('input[type="text"]').value;
        const passwords = this.querySelectorAll('input[type="password"]');
        if (passwords[0].value !== passwords[1].value) {
            alert('两次密码不一致！');
            return;
        }
        console.log('注册:', { username, password: passwords[0].value });
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
