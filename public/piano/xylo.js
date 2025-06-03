// ========= 音符播放与录音 ==========
const pressedKeys = new Set();
let currentOctave = "mid";
const keys = document.querySelectorAll('.key');

let mediaRecorder;
let recordedChunks = [];
let isRecording = false;
let audioContext;
let destination;
let maxDuration = 3 * 60 * 1000; // 3分钟最大录制时间
let recordStartTime = null;
let recordTimer = null;

// 初始化音频上下文和调试信息
function initAudioContext() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    destination = audioContext.createMediaStreamDestination();
    console.log('音频上下文初始化成功');
    return true;
  } catch (err) {
    console.error('音频上下文初始化失败:', err);
    alert('音频系统初始化失败，请使用现代浏览器访问');
    return false;
  }
}

// 浏览器兼容性检查
function checkBrowserSupport() {
  if (!navigator.mediaDevices || !window.MediaRecorder) {
    alert('您的浏览器不支持录音功能，请使用最新版本的Chrome或Firefox');
    return false;
  }
  return true;
}

// 调试信息记录
function logDebugInfo() {
  console.log('音频上下文状态:', audioContext.state);
  console.log('录音状态:', isRecording);
  console.log('目标流轨道数:', destination.stream.getTracks().length);
  console.log('已收集的数据片段:', recordedChunks.length);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  if (!checkBrowserSupport() || !initAudioContext()) {
    document.getElementById('record-btn').disabled = true;
    return;
  }
  
  document.getElementById('record-btn').addEventListener('click', toggleRecording);
});

function toggleRecording() {
  if (!isRecording) startRecording();
  else stopRecording();
}

async function startRecording() {
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  recordedChunks = [];
  
  try {
    const options = {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 128000
    };
    
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.warn('指定的MIME类型不支持，使用默认配置');
      mediaRecorder = new MediaRecorder(destination.stream);
    } else {
      mediaRecorder = new MediaRecorder(destination.stream, options);
    }
  } catch (err) {
    console.error('创建MediaRecorder失败:', err);
    alert('录音初始化失败，请检查浏览器权限和兼容性');
    return;
  }

  mediaRecorder.ondataavailable = (e) => {
    console.log('收到数据片段，大小:', e.data.size);
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };
  
  mediaRecorder.onstop = () => saveRecording();

  mediaRecorder.start(500); // 每500ms触发一次数据收集
  isRecording = true;
  document.getElementById('record-btn').textContent = "⏹️ 停止";

  recordStartTime = Date.now();
  updateRecordTime();
  recordTimer = setInterval(updateRecordTime, 1000);

  setTimeout(() => { 
    if (isRecording) stopRecording(); 
  }, maxDuration);
  
  logDebugInfo();
}

function stopRecording() {
  if (mediaRecorder && isRecording) {
    mediaRecorder.stop();
  }
  isRecording = false;
  document.getElementById('record-btn').textContent = "🎤 录制";
  clearInterval(recordTimer);
  document.getElementById('record-time').textContent = "00:00";
}

function saveRecording() {
  if (!recordedChunks.length) {
    alert('没有录制到任何数据！');
    return;
  }

  console.log('录制片段数量:', recordedChunks.length);
  console.log('总数据大小:', recordedChunks.reduce((size, chunk) => size + chunk.size, 0));

  const blob = new Blob(recordedChunks, {
    type: 'audio/webm;codecs=opus'
  });

  if (blob.size === 0) {
    alert('录音文件为空，请检查麦克风权限和浏览器兼容性');
    return;
  }

  window.latestRecordingBlob = blob;
  document.getElementById('upload-btn').disabled = false;

  // 创建测试播放器
  const audioURL = URL.createObjectURL(blob);
  const audio = document.createElement('audio');
  audio.controls = true;
  audio.src = audioURL;
  const testPlayer = document.getElementById('test-player');
  if (testPlayer) {
    testPlayer.innerHTML = '';
    testPlayer.appendChild(audio);
  } else {
    const div = document.createElement('div');
    div.id = 'test-player';
    div.appendChild(audio);
    document.body.appendChild(div);
  }
}

function updateRecordTime() {
  let elapsed = Math.floor((Date.now() - recordStartTime) / 1000);
  let minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
  let seconds = String(elapsed % 60).padStart(2, '0');
  document.getElementById('record-time').textContent = `${minutes}:${seconds}`;
}

// 音符播放相关
keys.forEach(key => {
  key.addEventListener('click', () => play(key.dataset.key));
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Shift') {
    currentOctave = currentOctave === "mid" ? "high" : "mid";
    document.querySelector('.xylophone').style.setProperty('--key-height-scale', 
      currentOctave === "high" ? 1.2 : 1.0);
  }
  if (event.key === 'Control') {
    currentOctave = currentOctave === "mid" ? "low" : "mid";
    document.querySelector('.xylophone').style.setProperty('--key-height-scale', 
      currentOctave === "low" ? 0.8 : 1.0);
  }
  const keyMap = { 'a': 'C', 's': 'D', 'd': 'E', 'j': 'F', 'k': 'G', 'l': 'A', ';': 'B' };
  const note = keyMap[event.key.toLowerCase()];
  if (note && !pressedKeys.has(note)) {
    pressedKeys.add(note);
    play(note);
  }
});

document.addEventListener('keyup', (event) => {
  const keyMap = { 'a': 'C', 's': 'D', 'd': 'E', 'j': 'F', 'k': 'G', 'l': 'A', ';': 'B' };
  const note = keyMap[event.key.toLowerCase()];
  if (note) pressedKeys.delete(note);
});

function play(note) {
  const audio = new Audio(`NotesXylo/${currentOctave}/${note}.wav`);
  
  let track;
  try {
    track = audioContext.createMediaElementSource(audio);
  } catch (err) {
    console.error('创建音频节点失败:', err);
    return;
  }
  
  // 创建增益节点控制音量
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0.8; // 防止音量过大导致失真
  
  // 正确的连接顺序
  track.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  if (isRecording) {
    gainNode.connect(destination);
  }

  audio.play().catch(err => {
    console.error('播放失败:', err);
  });

  const key = document.getElementById(note);
  key.classList.add('playing');
  setTimeout(() => key.classList.remove('playing'), 200);
}

// ========= 登录注册与上传 ==========
document.addEventListener('DOMContentLoaded', function () {
  const modal = document.getElementById('auth-modal');
  const authButton = document.getElementById('auth-trigger');
  const closeBtn = document.querySelector('.close-btn');
  const toggleBtns = document.querySelectorAll('.toggle-btn');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  authButton.addEventListener('click', e => {
    e.preventDefault();
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => modal.style.display = 'none');
  window.addEventListener('click', e => { 
    if (e.target === modal) modal.style.display = 'none'; 
  });

  toggleBtns.forEach(btn => {
    btn.addEventListener('click', function () {
      toggleBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loginForm.classList.toggle('hidden', this.dataset.form !== 'login-form');
      registerForm.classList.toggle('hidden', this.dataset.form !== 'register-form');
    });
  });

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = loginForm.querySelector('input[placeholder="用户名"]').value;
    const password = loginForm.querySelector('input[placeholder="密码"]').value;

    try {
      const res = await fetch('http://192.168.43.146:5000/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const result = await res.json();
      if (res.ok) {
        modal.style.display = 'none';
        document.getElementById('auth-trigger').outerHTML = 
          `<span id="user-name">${username}</span>`;
        window.currentUserId = username;
        window.authToken = result.token;
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('登录请求失败:', err);
      alert('登录失败，请检查网络连接');
    }
  });

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = this.querySelector('input[type="text"]').value;
    const pwFields = this.querySelectorAll('input[type="password"]');
    
    if (pwFields[0].value !== pwFields[1].value) {
      alert('两次输入的密码不一致！');
      return;
    }

    try {
      const res = await fetch('http://192.168.43.146:5000/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pwFields[0].value })
      });
      
      const result = await res.json();
      if (res.ok) {
        alert('注册成功，请登录！');
        toggleBtns[0].click();
      } else {
        alert(result.message);
      }
    } catch (err) {
      console.error('注册请求失败:', err);
      alert('注册失败，请检查网络连接');
    }
  });

  window.uploadRecording = async function () {
    if (!window.authToken) {
      alert("请先登录！");
      return;
    }
    
    if (!window.latestRecordingBlob) {
      alert("请先录音！");
      return;
    }
    
    if (window.latestRecordingBlob.size === 0) {
      alert("录音文件为空，请重新录制！");
      return;
    }

    const formData = new FormData();
    const filename = `recording_${Date.now()}.webm`;
    formData.append('file', window.latestRecordingBlob, filename);

    try {
      const res = await fetch('http://192.168.43.146:5000/user/upload', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + window.authToken
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();
      document.getElementById('status-area').textContent = result.message || "上传成功 ✅";
      setTimeout(() => { 
        document.getElementById('status-area').textContent = ""; 
      }, 2000);
      document.getElementById('download-all-btn').disabled = false;
    } catch (err) {
      console.error('上传错误:', err);
      alert("上传失败: " + err.message);
    }
  };

  document.getElementById('download-all-btn').addEventListener('click', async () => {
    if (!window.authToken) {
      alert("请先登录！");
      return;
    }

    try {
      const res = await fetch('http://192.168.43.146:5000/user/download', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + window.authToken
        }
      });

      if (!res.ok) {
        const error = await res.json();
        alert(error.message || "下载失败");
        return;
      }

      const blob = await res.blob();
      if (blob.size === 0) {
        alert("下载的文件为空，可能没有保存的录音");
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '我的音频合集.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('下载错误:', err);
      alert("下载失败：" + err.message);
    }
  });

});

