// 获取DOM元素
// const video = document.getElementById('video'); // 由 GestureControl 注入
const magicCircleContainer = document.querySelector('.magic-circle-container');
const cardsContainer = document.querySelector('.cards-container');
const instructionText = document.querySelector('.instruction-text');
// const starCursor = document.getElementById('star-cursor'); // 由 GestureControl 注入

let magicStarted = false;

// MediaPipe Hands 配置 - 移除，现在由 GestureControl 处理
// let hands, camera;

// 星星SVG - 移除，由 GestureControl 注入
// starCursor.innerHTML = `<svg viewBox="0 0 36 36"><polygon points="18,2 22,14 35,14 24,22 28,34 18,27 8,34 12,22 1,14 14,14" fill="gold" stroke="#fff59d" stroke-width="2"/></svg>`;

let lastCursor = {x: null, y: null}; // 保持，用于本地拖尾计算
let selectedCards = [];
let hoveredCard = null;
let canSelect = true;
const cardActions = document.querySelector('.card-actions');
const resetBtn = document.getElementById('reset-cards');
const confirmBtn = document.getElementById('confirm-cards');
// let lastFist = false; // 移除，由 GestureControl 处理
// let hoveredBtn = null; // 移除，由 GestureControl 处理

let autoConfirmTimer = null;
let autoConfirmStart = null;
const autoConfirmIndicator = document.getElementById('auto-confirm-indicator');
const autoConfirmProgress = document.getElementById('auto-confirm-progress');

// Add new elements for instruction text
const confirmInstruction = document.createElement('div');
confirmInstruction.className = 'instruction-text';
confirmInstruction.style.display = 'none'; // Initially hidden
document.body.appendChild(confirmInstruction);

// 播放音效的辅助函数
function playAudio(filename) {
    const audio = new Audio(`./assets/bgm/${filename}.mp3`);
    audio.play().catch(e => console.error("Error playing audio:", e));
}

// 握拳判定 - 移除，由 GestureControl 暴露
// function isRightHandFist(landmarks) {
//     // 除拇指外，其余四指指尖都低于对应掌指关节才算握拳
//     return [8, 12, 16, 20].every(i => landmarks[i].y > landmarks[i-2].y);
// }

// 获取手掌中心坐标，并处理翻转 - 移除，由 GestureControl 暴露
// function getHandCenter(landmarks) {
//     let x = 0, y = 0;
//     for (const pt of landmarks) { x += pt.x; y += pt.y; }
//     x /= landmarks.length; y /= landmarks.length;
//     return { x: (1 - x) * window.innerWidth, y: y * window.innerHeight };
// }

// 获取食指指尖坐标（已废弃，统一使用手掌中心） - 移除
// function getHandCursor(landmarks) {
//     const pt = landmarks[8];
//     return {
//         x: (1 - pt.x) * window.innerWidth,
//         y: pt.y * window.innerHeight
//     };
// }

// 显示星星光标 - 移除，由 GestureControl 暴露
// function showStarCursor(x, y) {
//     starCursor.style.opacity = 1;
//     starCursor.style.left = x + 'px';
//     starCursor.style.top = y + 'px';
//     if (lastCursor.x !== null && lastCursor.y !== null) {
//         const trail = document.createElement('div');
//         trail.className = 'star-trail'; // 注意：这里的 class 需要和 gesture-control.js 保持一致或者移除
//         trail.style.left = lastCursor.x + 'px';
//         trail.style.top = lastCursor.y + 'px';
//         document.body.appendChild(trail);
//         setTimeout(() => trail.remove(), 700);
//     }
//     lastCursor = {x, y};
// }

// 隐藏星星光标 - 移除，由 GestureControl 暴露
// function hideStarCursor() {
//     starCursor.style.opacity = 0;
// }

// 获取光标所在按钮 - 移除，由 GestureControl 暴露
// function getCursorButton(x, y) {
//     const btns = Array.from(document.querySelectorAll('.card-actions button'));
//     for (const btn of btns) {
//         const rect = btn.getBoundingClientRect();
//         if (
//             x >= rect.left && x <= rect.right &&
//             y >= rect.top && y <= rect.bottom
//         ) {
//             return btn;
//         }
//     }
//     return null;
// }

// 更新按钮悬停状态 - 移除，由 GestureControl 暴露
// function updateButtonHover(x, y) {
//     const btn = getCursorButton(x, y);
//     if (hoveredBtn && hoveredBtn !== btn) {
//         hoveredBtn.classList.remove('hovered-by-cursor');
//     }
//     if (btn) {
//         btn.classList.add('hovered-by-cursor');
//         hoveredBtn = btn;
//     } else {
//         hoveredBtn = null;
//     }
// }

function isRightHandOpen(landmarks) {
    if (!landmarks) return false;
    // 只要三根手指张开即可（食指、中指、无名指）
    const open = [8, 12, 16].filter(i => landmarks[i].y < landmarks[i-2].y).length >= 2;
    // 拇指不强制要求完全张开
    return open;
}

// 查找卡牌
function getCursorCard(x, y) {
    const cards = Array.from(document.querySelectorAll('.card'));
    for (const card of cards) {
        const rect = card.getBoundingClientRect();
        if (
            x >= rect.left && x <= rect.right &&
            y >= rect.top && y <= rect.bottom
        ) {
            return card;
        }
    }
    return null;
}

function updateCardHover(x, y) {
    if (!canSelect) return;
    const card = getCursorCard(x, y);
    if (hoveredCard && hoveredCard !== card) {
        hoveredCard.classList.remove('hovered');
    }
    if (card && !card.classList.contains('selected')) {
        card.classList.add('hovered');
        hoveredCard = card;
    } else {
        hoveredCard = null;
    }
}

function selectCard(card) {
    if (!card || card.classList.contains('selected') || selectedCards.length >= 3) return;
    card.classList.remove('hovered');
    playAudio('Select'); // 播放卡牌选中音效
    // 记录原位置
    const rect = card.getBoundingClientRect();
    // 克隆卡牌
    const clone = card.cloneNode(true);
    clone.classList.add('selected-clone');
    clone.classList.remove('hovered');
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    document.body.appendChild(clone);
    // 计算目标点，三张卡牌分散
    const idx = selectedCards.length;
    const offsets = [-80, 0, 80]; // 三张卡牌左右分散
    setTimeout(() => {
        const centerX = window.innerWidth / 2 - 50 + offsets[idx]; // 卡牌宽度一半
        const centerY = window.innerHeight / 2 - 250;
        clone.style.left = centerX + 'px';
        clone.style.top = centerY + 'px';
    }, 10);
    card.classList.add('selected');
    selectedCards.push(card);
    if (selectedCards.length === 3) {
        canSelect = false;
        cardActions.style.display = '';
        // Show instruction to confirm selection
        instructionText.style.display = 'none'; // Hide initial instruction
        confirmInstruction.textContent = '张开右手悬停确认，或点击确认按钮';
        confirmInstruction.style.display = 'block'; // Show new instruction
    }
}

function resetCardSelection() {
    selectedCards.forEach(card => {
        card.classList.remove('selected');
        card.style.left = '';
        card.style.top = '';
        card.style.margin = '';
    });
    // 移除所有克隆卡牌
    document.querySelectorAll('.selected-clone').forEach(e => e.remove());
    selectedCards = [];
    canSelect = true;
    cardActions.style.display = 'none';
    confirmInstruction.style.display = 'none'; // Hide confirm instruction on reset
}

resetBtn.onclick = resetCardSelection;
confirmBtn.onclick = () => {
    localStorage.setItem('tarotAnimationDone', 'true');
    window.location.href = 'draw.html';
};

function isCursorInCenter(x, y) {
    // 屏幕中心±180px的正方形 (扩大检测范围)
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2 - 100;
    return Math.abs(x - cx) < 180 && Math.abs(y - cy) < 180;
}

function startAutoConfirm() {
    if (autoConfirmTimer) return;
    autoConfirmStart = Date.now();
    autoConfirmIndicator.style.display = '';
    autoConfirmProgress.setAttribute('stroke-dashoffset', 226.2);
    
    // 重置并显示魔法阵
    magicCircleContainer.classList.remove('disappear');
    magicCircleContainer.classList.remove('active');
    // 强制重排以重置动画
    void magicCircleContainer.offsetWidth;
    magicCircleContainer.style.opacity = '0';
    magicCircleContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
    magicCircleContainer.style.display = 'block';
    
    // 播放魔法阵音效
    playAudio('magic-array-open'); // 使用 magic-array-open 音效
    
    // 缓慢显示魔法阵
    requestAnimationFrame(() => {
        magicCircleContainer.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
        magicCircleContainer.style.opacity = '1';
        magicCircleContainer.style.transform = 'translate(-50%, -50%) scale(1)';
        
        // 显示完成后开始转动
        setTimeout(() => {
            magicCircleContainer.classList.add('active');
        }, 800);
    });
    
    autoConfirmTimer = setInterval(() => {
        const elapsed = (Date.now() - autoConfirmStart) / 1000;
        const percent = Math.min(elapsed / 3, 1); // 3秒
        
        // 更新进度条
        autoConfirmProgress.setAttribute('stroke-dashoffset', 226.2 * (1 - percent));
        
        if (percent >= 1) {
            clearInterval(autoConfirmTimer);
            autoConfirmTimer = null;
            autoConfirmIndicator.style.display = 'none';
            
            // 播放返回音效
            playAudio('back');
            
            // 添加金光闪烁效果
            const flash = document.createElement('div');
            flash.className = 'magic-flash';
            document.body.appendChild(flash);
            
            // 等待金光动画完成后跳转
            setTimeout(() => {
                localStorage.setItem('tarotAnimationDone', 'true');
                window.location.href = 'draw.html';
            }, 1500); // 金光动画进行到一半（1.5秒）时跳转
        }
    }, 30);
}

function stopAutoConfirm() {
    if (autoConfirmTimer) {
        clearInterval(autoConfirmTimer);
        autoConfirmTimer = null;
    }
    autoConfirmIndicator.style.display = 'none';
    autoConfirmProgress.setAttribute('stroke-dashoffset', 226.2);
}

// MediaPipe Hands 结果处理 - 更改为本地处理函数
// Removed lastFist to rely on GestureControl
let cursorStayedInCenterStartTime = null; // 新增：记录光标开始保持在中心的时间

function onGestureResults(results, gestureData) {
    if (gestureData.type === 'no_hand' || gestureData.type === 'other_hand') {
        updateCardHover(-9999, -9999);
        stopAutoConfirm();
        cursorStayedInCenterStartTime = null; // 重置计时
        return;
    }

    const { hand, center, isFist } = gestureData;

    // 卡牌悬停逻辑
    updateCardHover(center.x, center.y);

    // 激活魔法圈
    if (isRightHandOpen(hand) && !magicStarted) {
        magicStarted = true;
        activateMagicCircle();
    }

    // 握拳选中卡牌 - 更改为通过 GestureControl 的 isFistChangeOnlyTrue 来避免连选
    if (canSelect && hoveredCard && isFist && gestureData.isFistChangeOnlyTrue) {
        selectCard(hoveredCard);
        stopAutoConfirm(); // 选择卡牌后停止自动确认
        cursorStayedInCenterStartTime = null; // 重置计时
    }

    // 自动确认逻辑
    if (selectedCards.length === 3) {
        if (isCursorInCenter(center.x, center.y)) {
            if (cursorStayedInCenterStartTime === null) {
                cursorStayedInCenterStartTime = Date.now(); // 开始计时
            }
            // 检查是否连续稳定在中心2秒
            if ((Date.now() - cursorStayedInCenterStartTime) / 1000 >= 2) {
                // 只有当自动确认计时器未启动时才启动
                if (!autoConfirmTimer) {
                    startAutoConfirm();
                }
            }
        } else {
            cursorStayedInCenterStartTime = null; // 光标离开中心，重置计时
            stopAutoConfirm();
        }
    } else {
        // 如果未选择三张牌，也停止自动确认计时
        cursorStayedInCenterStartTime = null;
        stopAutoConfirm();
    }
}

// MediaPipe Hands Setup - 移除
// function setupMediaPipeHands() {
//     hands = new Hands({
//         locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
//     });
//     hands.setOptions({
//         maxNumHands: 1,
//         modelComplexity: 1,
//         minDetectionConfidence: 0.5,
//         minTrackingConfidence: 0.5
//     });
//     hands.onResults(onResults);
//     camera = new window.Camera(video, {
//         onFrame: async () => { await hands.send({image: video}); },
//         width: 320, height: 240
//     });
//     camera.start();
// }

// 魔法圈动画
function activateMagicCircle() {
    instructionText.textContent = '魔法阵已启动...';
    magicCircleContainer.classList.add('active');
    playAudio('magic-array-open'); // 播放魔法阵开启音效

    // 魔法阵旋转完成后直接显示卡牌
    setTimeout(() => {
        generateCards();
        cardsContainer.classList.add('visible');
    }, 6000); // 调整时间以匹配魔法阵动画时长，确保结束后直接显示牌组
}

// 生成卡牌函数
function generateCards() {
    cardsContainer.innerHTML = '';
    const numCards = 15;
    playAudio('cards'); // 播放牌组展示音效
    for (let i = 0; i < numCards; i++) {
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.setProperty('--card-index', i); // 设置卡牌索引用于动画延迟
        card.classList.add('spreading'); // 添加展开动画类
        card.innerHTML = `<img src="assets/image/card-back.jpg" alt="卡背">`;
        cardsContainer.appendChild(card);
    }
}

// 创建单张卡牌 - 此函数将被删除
// function createSingleCard() {
//     const singleCard = document.createElement('div');
//     singleCard.classList.add('single-card');
//     singleCard.innerHTML = `<img src="assets/image/card-back.jpg" alt="卡背">`;
//     document.body.appendChild(singleCard);
//     return singleCard;
// }

function init() {
    // 确保 GestureControl 已加载
    if (window.GestureControl) {
        window.GestureControl.enable();
        window.GestureControl.registerResultsCallback(onGestureResults);
    } else {
        console.error('GestureControl not loaded!');
    }
    // 移除 generateCards() 的直接调用，它会在 activateMagicCircle() 中被调用
    // generateCards();
    // Remove old event listener if any
    // window.removeEventListener('load', init);

    // Initial instruction text
    instructionText.textContent = '请举起右手激活魔法阵';
    instructionText.style.display = 'block'; // Show initial instruction
}

// 确保在DOM加载完成后执行初始化
document.addEventListener('DOMContentLoaded', init); 