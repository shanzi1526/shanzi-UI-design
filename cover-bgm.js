document.addEventListener('DOMContentLoaded', function() {
    const audio = document.getElementById('coverBgm');
    const btn = document.getElementById('coverMusicBtn');
    const icon = document.getElementById('coverMusicIcon');
    let isPlaying = false;

    function updateIcon() {
        icon.textContent = isPlaying ? '⏸️' : '🎵';
    }

    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
        } else {
            audio.volume = 1;
            audio.play();
            isPlaying = true;
        }
        updateIcon();
    });

    // 自动播放（需用户首次交互后）
    function onFirstUserGesture() {
        if (!isPlaying) {
            audio.play().then(() => {
                isPlaying = true;
                updateIcon();
            }).catch(() => {});
        }
        window.removeEventListener('pointerdown', onFirstUserGesture, true);
        window.removeEventListener('keydown', onFirstUserGesture, true);
    }
    window.addEventListener('pointerdown', onFirstUserGesture, true);
    window.addEventListener('keydown', onFirstUserGesture, true);

    updateIcon();
}); 