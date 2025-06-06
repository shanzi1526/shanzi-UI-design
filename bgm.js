// bgm.js - 简洁稳定的BGM播放系统（含调试输出）
(function() {
    // 配置
    const AUDIO_SRC = 'assets/bgm/bgm.mp3'; // 可替换为你的BGM路径
    const STORAGE_KEY_STATE = 'bgmState'; // 'playing' | 'paused'
    const STORAGE_KEY_TIME = 'bgmTime';

    // 创建audio标签
    let audio = document.getElementById('global-bgm-audio');
    if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'global-bgm-audio';
        audio.src = AUDIO_SRC;
        audio.preload = 'auto';
        audio.loop = true;
        audio.style.display = 'none';
        document.body.appendChild(audio);
    }

    // 创建右上角控制按钮
    let btn = document.getElementById('bgm-toggle-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.id = 'bgm-toggle-btn';
        btn.setAttribute('aria-label', '背景音乐开关');
        btn.style.position = 'fixed';
        btn.style.top = '24px';
        btn.style.right = '24px';
        btn.style.zIndex = '9999';
        btn.style.background = 'rgba(30,30,40,0.85)';
        btn.style.border = 'none';
        btn.style.borderRadius = '50%';
        btn.style.width = '44px';
        btn.style.height = '44px';
        btn.style.display = 'flex';
        btn.style.alignItems = 'center';
        btn.style.justifyContent = 'center';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        btn.style.transition = 'background 0.2s';
        btn.innerHTML = getIcon('paused');
        document.body.appendChild(btn);
    }

    // 状态管理
    let isPlaying = false;
    let hasUserInteracted = false;

    // 恢复状态
    const savedState = sessionStorage.getItem(STORAGE_KEY_STATE);
    const savedTime = sessionStorage.getItem(STORAGE_KEY_TIME);
    if (savedTime) {
        audio.currentTime = parseFloat(savedTime);
    }
    if (savedState === 'playing') {
        isPlaying = false; // 需用户交互后才能播放
        updateBtn('paused');
    } else {
        isPlaying = false;
        updateBtn('paused');
    }

    // 按钮点击事件
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        hasUserInteracted = true;
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            sessionStorage.setItem(STORAGE_KEY_STATE, 'paused');
            updateBtn('paused');
            console.log('[BGM] 用户点击暂停，已暂停');
        } else {
            audio.volume = 1;
            audio.play().then(() => {
                isPlaying = true;
                sessionStorage.setItem(STORAGE_KEY_STATE, 'playing');
                updateBtn('playing');
                console.log('[BGM] 用户点击播放，已播放');
            }).catch((err) => {
                isPlaying = false;
                updateBtn('paused');
                console.warn('[BGM] play() 被浏览器拦截或失败', err);
                alert('音乐无法播放，可能是浏览器限制或音频文件缺失。');
            });
        }
    });

    // 自动保存播放进度
    audio.addEventListener('timeupdate', function() {
        sessionStorage.setItem(STORAGE_KEY_TIME, audio.currentTime);
    });

    // 页面可见性变化时自动恢复播放
    document.addEventListener('visibilitychange', function() {
        if (!hasUserInteracted) return;
        if (document.visibilityState === 'visible') {
            const state = sessionStorage.getItem(STORAGE_KEY_STATE);
            if (state === 'playing') {
                audio.play().then(() => {
                    isPlaying = true;
                    updateBtn('playing');
                }).catch((err) => {
                    isPlaying = false;
                    updateBtn('paused');
                    console.warn('[BGM] visibilitychange play() 失败', err);
                });
            }
        }
    });

    // 离开页面时保存状态
    window.addEventListener('beforeunload', function() {
        sessionStorage.setItem(STORAGE_KEY_TIME, audio.currentTime);
        sessionStorage.setItem(STORAGE_KEY_STATE, isPlaying ? 'playing' : 'paused');
    });

    // 用户首次交互后允许播放
    function onFirstUserGesture() {
        if (hasUserInteracted) return;
        hasUserInteracted = true;
        const state = sessionStorage.getItem(STORAGE_KEY_STATE);
        if (state === 'playing') {
            audio.volume = 1;
            audio.play().then(() => {
                isPlaying = true;
                updateBtn('playing');
                console.log('[BGM] 首次交互后自动播放');
            }).catch((err) => {
                isPlaying = false;
                updateBtn('paused');
                console.warn('[BGM] 首次交互 play() 失败', err);
            });
        }
        window.removeEventListener('pointerdown', onFirstUserGesture, true);
        window.removeEventListener('keydown', onFirstUserGesture, true);
    }
    window.addEventListener('pointerdown', onFirstUserGesture, true);
    window.addEventListener('keydown', onFirstUserGesture, true);

    // 图标切换（SVG）
    function getIcon(state) {
        if (state === 'playing') {
            return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4V18" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/><path d="M10 7V15" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/><path d="M16 10V12" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/></svg>`;
        } else {
            return `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 4V18" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/><path d="M10 7V15" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/><path d="M16 10V12" stroke="#FFD700" stroke-width="2" stroke-linecap="round"/><line x1="3" y1="3" x2="19" y2="19" stroke="#FFD700" stroke-width="2"/></svg>`;
        }
    }
    function updateBtn(state) {
        btn.innerHTML = getIcon(state);
    }

    document.addEventListener('DOMContentLoaded', function() {
        var tip = document.createElement('div');
        tip.id = 'music-tip';
        tip.textContent = '请点击右上角按钮开启音乐';
        tip.style.cssText = 'position:fixed;top:24px;right:80px;background:rgba(30,30,40,0.92);color:#ffd700;padding:10px 18px;border-radius:20px;z-index:9999;font-size:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.15);display:none;';
        document.body.appendChild(tip);

        function tryPlay() {
            if (audio) {
                audio.play().catch(() => {
                    tip.style.display = 'block';
                });
            }
        }
        tryPlay();
    });
})(); 