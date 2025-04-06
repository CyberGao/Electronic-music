// 记录已经触发的键，避免长按重复播放
const pressedKeys = new Set();

let currentOctave = "mid"; // 默认中音

// 获取所有琴键
const keys = document.querySelectorAll('.key');

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let destination = audioContext.createMediaStreamDestination();
let maxDuration = 3 * 60 * 1000; // 3 分钟
let recordStartTime = null;
let recordTimer = null;

// 录制按钮
document.getElementById('record-btn').addEventListener('click', toggleRecording);

function toggleRecording() {
    if (!isRecording) {
        startRecording();
    } else {
        stopRecording();
    }
}

function startRecording() {
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(destination.stream);
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        saveRecording();
    };

    mediaRecorder.start();
    isRecording = true;
    document.getElementById('record-btn').textContent = "⏹️ 停止";
    
    // 记录开始时间
    recordStartTime = Date.now();
    updateRecordTime();

    // 启动定时器
    recordTimer = setInterval(updateRecordTime, 1000);

    // 3 分钟后自动停止
    setTimeout(() => {
        if (isRecording) stopRecording();
    }, maxDuration);
}

function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
    }
    isRecording = false;
    document.getElementById('record-btn').textContent = "🎤 录制";
    
    // 清除计时器
    clearInterval(recordTimer);
    document.getElementById('record-time').textContent = "00:00";
}

function saveRecording() {
    let blob = new Blob(recordedChunks, { type: 'audio/mp3' });
    let url = URL.createObjectURL(blob);
    
    let downloadLink = document.getElementById('download-link');
    downloadLink.href = url;
    downloadLink.download = "recording.mp3";
    downloadLink.style.display = "block";
    downloadLink.textContent = "⬇️ 下载录音";
}

// 更新时间显示
function updateRecordTime() {
    let elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
    let minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
    let seconds = String(elapsed % 60).padStart(2, '0');
    document.getElementById('record-time').textContent = `${minutes}:${seconds}`;
}


// 点击事件（鼠标点击琴键）
keys.forEach(key => {
    key.addEventListener('click', () => play(key.dataset.key));
});

// 监听键盘按键事件
document.addEventListener('keydown', (event) => {
    if(event.key=='Shift'){
        if(currentOctave=="mid"){
            currentOctave="high";
            document.querySelector('.xylophone').style.setProperty('--key-height-scale', 1.2);
        }
        else if(currentOctave=="low"){
            currentOctave="mid";
            document.querySelector('.xylophone').style.setProperty('--key-height-scale', 1.0);
        }
    }
    if(event.key=='Control'){
        if(currentOctave=="mid"){
            currentOctave="low";
            document.querySelector('.xylophone').style.setProperty('--key-height-scale', 0.8);
        }
        else if(currentOctave=="high"){
            currentOctave="mid";
            document.querySelector('.xylophone').style.setProperty('--key-height-scale', 1.0);
        }
    }
    const keyMap = {
        'a': 'C', 's': 'D', 'd': 'E', 'j': 'F',
        'k': 'G', 'l': 'A', ';': 'B'
    };
    const note = keyMap[event.key.toLowerCase()];
    // 避免重复触发
    if (note && !pressedKeys.has(note)) {
        pressedKeys.add(note); // 记录该键已按下
        play(note);}
    });

// 监听键盘松开（keyup），允许再次触发
document.addEventListener('keyup', (event) => {
    const keyMap = {
        'a': 'C', 's': 'D', 'd': 'E', 'j': 'F',
        'k': 'G', 'l': 'A', ';': 'B'
    };
    const note = keyMap[event.key.toLowerCase()];
    
    if (note) {
        pressedKeys.delete(note); // 释放该键
    }
});

// 播放音符 + 录制 + 添加动画效果
function play(note) {
    var audio = new Audio(`NotesXylo/${currentOctave}/${note}.wav`);

    // 连接到音频上下文以支持录音
    let track = audioContext.createMediaElementSource(audio);
    track.connect(audioContext.destination);
    
    if (isRecording) {
        track.connect(destination); // 录音时将音频连接到 MediaRecorder
    }

    // 确保音频能播放
    audio.oncanplaythrough = () => audio.play();
    
    // 获取琴键并添加动画效果
    let key = document.getElementById(note);
    key.classList.add('playing');

    // 200ms 后恢复原样
    setTimeout(() => key.classList.remove('playing'), 200);
}

