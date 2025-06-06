// 塔罗牌数据
const tarotCards = [
    {
        name: "愚者 (The Fool)",
        image: "assets/fool.jpg",
        prediction: "新的开始即将到来，保持开放和冒险的心态，勇敢地踏上未知的旅程。机会与挑战并存，相信自己的直觉。"
    },
    {
        name: "魔术师 (The Magician)",
        image: "assets/magician.jpg",
        prediction: "你拥有实现目标所需的一切工具和才能。现在是采取行动的最佳时机，相信自己的能力。"
    },
    {
        name: "女祭司 (The High Priestess)",
        image: "assets/priestess.jpg",
        prediction: "倾听你的直觉和内心的声音，答案就在你的内心深处。保持耐心，等待合适的时机。"
    },
    {
        name: "皇后 (The Empress)",
        image: "assets/empress.jpg",
        prediction: "创造力和丰盛正在绽放，关注自我照顾和滋养。这是收获与成长的时期。"
    },
    {
        name: "命运之轮 (Wheel of Fortune)",
        image: "assets/wheel.jpg",
        prediction: "命运正在转动，改变即将发生。保持积极的态度，接受生活的起起落落。"
    }
];

// 获取DOM元素
const cardImage = document.getElementById('tarot-card');
const cardName = document.getElementById('card-name');
const prediction = document.getElementById('prediction');
const drawButton = document.getElementById('draw-button');

// 只在相关元素都存在时才绑定事件和动画
if (cardImage && cardName && prediction && drawButton) {
    drawButton.addEventListener('click', drawCard);
    cardImage.style.transition = 'transform 0.5s ease';
}

// 抽牌函数
function drawCard() {
    if (!(cardImage && cardName && prediction && drawButton)) return;
    // 禁用按钮，防止连续点击
    drawButton.disabled = true;
    // 添加翻转动画
    cardImage.style.transform = 'rotateY(90deg)';
    // 随机选择一张牌
    const randomCard = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    // 设置延时，让动画更自然
    setTimeout(() => {
        // 更新卡牌信息
        cardImage.src = randomCard.image;
        cardName.textContent = randomCard.name;
        prediction.textContent = randomCard.prediction;
        // 翻转回来
        cardImage.style.transform = 'rotateY(0deg)';
        // 启用按钮
        drawButton.disabled = false;
    }, 500);
} 