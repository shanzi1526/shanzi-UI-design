// gesture-control.js
(function() {
    if (window.GestureControl) return; // 防止重复注入
    const GestureControl = {};
    let enabled = false;
    let video, starCursor, lastCursor = {x: null, y: null};
    let hands, camera;
    let lastFist = false;
    let hoveredBtn = null;
    let camWrap;
    const _resultsCallbacks = [];

    // 注入摄像头画面
    function injectCamera() {
        camWrap = document.createElement('div');
        camWrap.style.position = 'fixed';
        camWrap.style.top = '20px';
        camWrap.style.left = '20px';
        camWrap.style.width = '160px';
        camWrap.style.height = '120px';
        camWrap.style.zIndex = '99999';
        camWrap.style.border = '3px solid rgba(255,255,255,0.8)';
        camWrap.style.borderRadius = '8px';
        camWrap.style.overflow = 'hidden';
        camWrap.style.background = '#222';
        camWrap.style.boxShadow = '0 0 15px rgba(0,255,255,0.5)';
        video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.transform = 'scaleX(-1)';
        camWrap.appendChild(video);
        document.body.appendChild(camWrap);
    }

    // 注入星星光标
    function injectCursor() {
        starCursor = document.createElement('div');
        starCursor.id = 'gesture-star-cursor';
        starCursor.style.position = 'fixed';
        starCursor.style.left = '0';
        starCursor.style.top = '0';
        starCursor.style.width = '36px';
        starCursor.style.height = '36px';
        starCursor.style.pointerEvents = 'none';
        starCursor.style.zIndex = '99999';
        starCursor.style.transform = 'translate(-50%, -50%)';
        starCursor.style.filter = 'drop-shadow(0 0 12px gold) drop-shadow(0 0 24px #fff59d)';
        starCursor.style.opacity = 0;
        starCursor.innerHTML = `<svg viewBox="0 0 36 36"><polygon points="18,2 22,14 35,14 24,22 28,34 18,27 8,34 12,22 1,14 14,14" fill="gold" stroke="#fff59d" stroke-width="2"/></svg>`;
        document.body.appendChild(starCursor);
    }

    function showStarCursor(x, y) {
        starCursor.style.opacity = 1;
        starCursor.style.left = x + 'px';
        starCursor.style.top = y + 'px';
        // 拖尾
        if (lastCursor.x !== null && lastCursor.y !== null) {
            const trail = document.createElement('div');
            trail.className = 'gesture-star-trail';
            trail.style.position = 'fixed';
            trail.style.width = '24px';
            trail.style.height = '24px';
            trail.style.left = lastCursor.x + 'px';
            trail.style.top = lastCursor.y + 'px';
            trail.style.pointerEvents = 'none';
            trail.style.zIndex = '99998';
            trail.style.borderRadius = '50%';
            trail.style.background = 'radial-gradient(circle, gold 60%, transparent 100%)';
            trail.style.opacity = 0.5;
            trail.style.transform = 'translate(-50%, -50%)';
            trail.style.animation = 'gestureStarTrailFade 0.7s linear forwards';
            document.body.appendChild(trail);
            setTimeout(() => trail.remove(), 700);
        }
        lastCursor = {x, y};
    }
    function hideStarCursor() { starCursor.style.opacity = 0; }

    // 注入拖尾动画样式
    function injectTrailStyle() {
        if (document.getElementById('gesture-trail-style')) return;
        const style = document.createElement('style');
        style.id = 'gesture-trail-style';
        style.innerHTML = `@keyframes gestureStarTrailFade {0%{opacity:0.5;}100%{opacity:0;}}`;
        document.head.appendChild(style);
    }

    // MediaPipe Hands
    function isRightHandFist(landmarks) {
        return [8, 12, 16, 20].every(i => landmarks[i].y > landmarks[i-2].y);
    }
    function getHandCenter(landmarks) {
        let x = 0, y = 0;
        for (const pt of landmarks) { x += pt.x; y += pt.y; }
        x /= landmarks.length; y /= landmarks.length;
        return { x: (1 - x) * window.innerWidth, y: y * window.innerHeight };
    }
    function getCursorButton(x, y) {
        const btns = Array.from(document.querySelectorAll('.action-button'));
        for (const btn of btns) {
            const rect = btn.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return btn;
        }
        return null;
    }
    function updateButtonHover(x, y) {
        const btn = getCursorButton(x, y);
        if (hoveredBtn && hoveredBtn !== btn) hoveredBtn.classList.remove('hovered-by-cursor');
        if (btn) { btn.classList.add('hovered-by-cursor'); hoveredBtn = btn; }
        else hoveredBtn = null;
    }

    function onResults(results) {
        if (!enabled) return;
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            hideStarCursor();
            updateButtonHover(-9999, -9999);
            lastFist = false;
            // 通知所有注册的回调手势消失
            _resultsCallbacks.forEach(cb => cb(results, { type: 'no_hand' }));
            return;
        }
        const hand = results.multiHandLandmarks[0];
        let handedness = results.multiHandedness[0].label;
        handedness = handedness === 'Right' ? 'Left' : 'Right';
        if (handedness === 'Right') {
            const center = getHandCenter(hand);
            showStarCursor(center.x, center.y);
            updateButtonHover(center.x, center.y);
            const isFist = isRightHandFist(hand);
            const isFistChangeOnlyTrue = isFist && !lastFist;

            if (hoveredBtn && isFistChangeOnlyTrue) {
                hoveredBtn.click();
            }
            lastFist = isFist;
            // 通知所有注册的回调右手手势结果，并包含 isFistChangeOnlyTrue
            _resultsCallbacks.forEach(cb => cb(results, { type: 'right_hand', hand, handedness, center, isFist, isFistChangeOnlyTrue }));
        } else {
            hideStarCursor();
            updateButtonHover(-9999, -9999);
            lastFist = false;
            // 通知所有注册的回调非右手手势结果
            _resultsCallbacks.forEach(cb => cb(results, { type: 'other_hand' }));
        }
    }

    function setupMediaPipeHands() {
        hands = new Hands({
            locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        hands.onResults(onResults);
        camera = new window.Camera(video, {
            onFrame: async () => { await hands.send({image: video}); },
            width: 320, height: 240
        });
        camera.start();
    }

    GestureControl.enable = function() {
        if (enabled) return;
        enabled = true;
        injectCamera();
        injectCursor();
        injectTrailStyle();
        setupMediaPipeHands();
    };
    GestureControl.disable = function() {
        enabled = false;
        if (camWrap) camWrap.remove();
        if (starCursor) starCursor.remove();
        document.querySelectorAll('.gesture-star-trail').forEach(e => e.remove());
    };

    GestureControl.registerResultsCallback = function(callback) {
        if (typeof callback === 'function') {
            _resultsCallbacks.push(callback);
        }
    };
    GestureControl.unregisterResultsCallback = function(callback) {
        const index = _resultsCallbacks.indexOf(callback);
        if (index > -1) {
            _resultsCallbacks.splice(index, 1);
        }
    };

    GestureControl.getHandCenter = getHandCenter; // 暴露给外部使用
    GestureControl.isRightHandFist = isRightHandFist; // 暴露给外部使用
    GestureControl.showStarCursor = showStarCursor; // 暴露给外部使用
    GestureControl.hideStarCursor = hideStarCursor; // 暴露给外部使用
    GestureControl.updateButtonHover = updateButtonHover; // 暴露给外部使用
    GestureControl.getCursorButton = getCursorButton; // 暴露给外部使用

    window.GestureControl = GestureControl;
})(); 