// 游戏主要逻辑

// 卡片类型 - 使用真实黑猫图片
const cardTypes = [
    { id: 1, color: '#ffcdd2', name: '黑猫1', image: './images/cat1.jpg' },
    { id: 2, color: '#c8e6c9', name: '黑猫2', image: './images/cat2.jpg' },
    { id: 3, color: '#bbdefb', name: '黑猫3', image: './images/cat3.jpg' },
    { id: 4, color: '#fff9c4', name: '黑猫4', image: './images/cat4.jpg' },
    { id: 5, color: '#e1bee7', name: '黑猫5', image: './images/cat5.jpg' },
    { id: 6, color: '#ffe0b2', name: '黑猫6', image: './images/cat6.jpg' },
    { id: 7, color: '#d1c4e9', name: '黑猫7', image: './images/cat7.jpg' },
    { id: 8, color: '#b2dfdb', name: '黑猫8', image: './images/cat8.jpg' }
];

// 游戏状态
const gameState = {
    level: 1,
    score: 0,
    cards: [],
    selectedCard: null,  // 当前选中的卡片
    firstSelectedCard: null, // 第一个选中的卡片
    gameBoard: null,
    maxSlots: 7,
    history: [],
    isProcessing: false,  // 添加处理锁，防止同时点击多张卡片
    timer: null
};

// 初始化游戏
function initGame() {
    gameState.gameBoard = document.getElementById('game-board');
    
    // 设置工具按钮事件
    document.getElementById('cat-food').addEventListener('click', useCatFood);
    document.getElementById('shuffle').addEventListener('click', useShuffle);
    document.getElementById('undo').addEventListener('click', useUndo);
    
    // 设置下一关按钮事件
    document.getElementById('next-level').addEventListener('click', nextLevel);
    
    // 设置重新开始按钮事件
    document.getElementById('restart').addEventListener('click', restartGame);
    
    // 添加触摸事件触发的fastclick
    addTouchSupport();
    
    // 禁止双指缩放
    document.addEventListener('touchmove', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    }, { passive: false });
    
    // 开始第一关
    startLevel(gameState.level);
}

// 添加触摸事件支持
function addTouchSupport() {
    // 处理所有点击事件，减少触摸延迟
    document.addEventListener('touchstart', function() {}, {passive: true});
}

// 开始关卡
function startLevel(level) {
    // 清空游戏板和历史记录
    gameState.gameBoard.innerHTML = '';
    gameState.cards = [];
    gameState.selectedCard = null;
    gameState.firstSelectedCard = null;
    gameState.history = [];
    gameState.isProcessing = false; // 重置处理锁
    
    // 更新UI
    document.getElementById('level').textContent = level;
    document.getElementById('score').textContent = gameState.score;
    
    // 根据关卡生成卡片
    let rows, cols;
    
    // 根据关卡调整难度
    if (level === 1) {
        rows = 4;
        cols = 4;
    } else if (level === 2) {
        rows = 4;
        cols = 5;
    } else if (level === 3) {
        rows = 5;
        cols = 6;
    } else {
        // 更高关卡，进一步增加难度
        rows = Math.min(5 + Math.floor((level - 3) / 2), 8); // 行数随关卡增加，最多8行
        cols = Math.min(6 + Math.floor((level - 3) / 2), 8); // 列数随关卡增加，最多8列
    }
    
    // 确保卡片总数是2的倍数并且有意义
    let totalCards = rows * cols;
    if (totalCards % 2 !== 0) {
        totalCards--; // 确保是偶数
    }
    
    const cardPairs = Math.floor(totalCards / 2);
    if (cardPairs === 0) return; // 防止没有卡片的情况
    
    // 生成卡片类型列表（每种类型有两张）
    let cardIds = [];
    
    if (level >= 3) {
        // 第三关开始，增加难度，使用相似颜色的卡片
        const usedTypeIds = new Set();
        // 确保每对卡片都有些许不同，增加难度
        for (let i = 0; i < cardPairs; i++) {
            let typeIndex;
            // 尝试找到一个尚未使用的卡片类型
            do {
                typeIndex = i % cardTypes.length;
            } while (usedTypeIds.has(cardTypes[typeIndex].id) && usedTypeIds.size < cardTypes.length);
            
            const typeId = cardTypes[typeIndex].id;
            usedTypeIds.add(typeId);
            
            // 添加两张相同类型的卡片
            cardIds.push(typeId);
            cardIds.push(typeId);
        }
    } else {
        // 第一、二关使用标准配置
        for (let i = 0; i < cardPairs; i++) {
            const typeIndex = i % cardTypes.length;
            // 添加两张相同类型的卡片
            cardIds.push(cardTypes[typeIndex].id);
            cardIds.push(cardTypes[typeIndex].id);
        }
    }
    
    // 第二关开始增加翻牌时间限制
    if (level >= 2) {
        // 设置每关的翻牌时间限制
        const timeLimit = Math.max(60 - (level - 2) * 5, 30); // 从60秒开始，每关减少5秒，最少30秒
        startTimer(timeLimit);
    } else {
        // 第一关没有时间限制
        hideTimer();
    }
    
    // 随机洗牌
    cardIds = shuffleArray(cardIds);
    
    // 根据屏幕宽度调整卡片大小
    let cardWidth, cardHeight, padding;
    const screenWidth = window.innerWidth;
    
    if (screenWidth <= 360) {
        // 小屏手机
        cardWidth = 40;
        cardHeight = 40;
        padding = 8;
    } else if (screenWidth <= 480) {
        // 中等屏幕手机
        cardWidth = 50;
        cardHeight = 50;
        padding = 8;
    } else {
        // 大屏设备
        cardWidth = 60;
        cardHeight = 60;
        padding = 10;
    }
    
    // 创建布局
    // 调整游戏板大小适应网格
    const boardHeight = (rows * (cardHeight + padding) + padding);
    gameState.gameBoard.style.height = boardHeight + 'px';
    
    // 计算起始位置使网格居中
    const boardWidth = gameState.gameBoard.clientWidth;
    const gridWidth = cols * (cardWidth + padding);
    const startX = Math.max((boardWidth - gridWidth) / 2, padding);
    const startY = padding;
    
    // 创建卡片网格
    let cardCount = 0;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (cardCount >= totalCards) break;
            
            const cardId = cardIds.pop();
            if (!cardId) break;
            
            const cardType = cardTypes.find(type => type.id === cardId);
            if (!cardType) continue;
            
            const card = {
                id: gameState.cards.length,
                typeId: cardId,
                color: cardType.color,
                name: cardType.name,
                image: cardType.image,
                // 计算网格位置
                x: startX + col * (cardWidth + padding),
                y: startY + row * (cardHeight + padding),
                row: row,
                col: col,
                isFlipped: false, // 初始时卡片未翻开
                isMatched: false, // 初始时卡片未匹配
                element: null
            };
            
            gameState.cards.push(card);
            cardCount++;
        }
    }
    
    // 渲染所有卡片
    renderCards();
}

// 渲染所有卡片
function renderCards() {
    gameState.gameBoard.innerHTML = '';
    
    gameState.cards.forEach(card => {
        if (card.isMatched) return; // 已匹配的卡片不再显示
        
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        if (card.isFlipped) {
            cardElement.classList.add('flipped');
        }
        cardElement.style.left = card.x + 'px';
        cardElement.style.top = card.y + 'px';
        cardElement.setAttribute('data-id', card.id);
        cardElement.setAttribute('data-type', card.typeId);
        
        // 卡片正面（翻开后显示的内容）
        const cardFront = document.createElement('div');
        cardFront.className = 'card-front';
        
        // 使用真实猫咪图片
        const imgElement = document.createElement('img');
        imgElement.src = card.image;
        imgElement.alt = card.name;
        imgElement.className = 'card-img';
        
        // 添加图片加载错误处理
        imgElement.onerror = function() {
            // 图片加载失败时使用颜色背景和名称
            this.style.display = 'none';
            cardFront.style.backgroundColor = card.color;
            const nameBackup = document.createElement('div');
            nameBackup.className = 'card-name-backup';
            nameBackup.textContent = card.name;
            cardFront.appendChild(nameBackup);
        };
        
        cardFront.appendChild(imgElement);
        
        // 卡片背面（默认显示的内容）
        const cardBack = document.createElement('div');
        cardBack.className = 'card-back';
        
        cardElement.appendChild(cardFront);
        cardElement.appendChild(cardBack);
        
        gameState.gameBoard.appendChild(cardElement);
        
        // 设置点击事件
        cardElement.addEventListener('click', () => selectCard(card));
        
        // 添加触摸事件（优化移动端体验）
        cardElement.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止触摸延迟
            selectCard(card);
        }, { passive: false });
        
        card.element = cardElement;
    });
}

// 选中卡片
function selectCard(card) {
    // 如果正在处理其他卡片，或卡片已翻开或已匹配，则忽略点击
    if (gameState.isProcessing || card.isFlipped || card.isMatched) return;
    
    // 保存操作历史
    saveGameState();
    
    // 翻转卡片
    card.isFlipped = true;
    if (card.element) {
        card.element.classList.add('flipped');
    }
    
    // 获取所有已翻开但未匹配的卡片
    const flippedCards = gameState.cards.filter(c => c.isFlipped && !c.isMatched);
    
    // 生成类型计数
    const typeCount = {};
    flippedCards.forEach(c => {
        typeCount[c.typeId] = (typeCount[c.typeId] || 0) + 1;
    });
    
    // 检查当前点击的卡片类型是否有匹配
    if (typeCount[card.typeId] >= 2) {
        // 找到一对要消除的同类型卡片
        const matchingCards = flippedCards.filter(c => c.typeId === card.typeId);
        const [card1, card2] = matchingCards.slice(0, 2);
        
        // 设置这两张卡片为处理中，但不阻止其他卡片的点击
        card1.isProcessing = true;
        card2.isProcessing = true;
        
        // 延迟一下以便玩家看清匹配
        setTimeout(() => {
            matchCards(card1, card2);
            
            // 匹配完成后检查游戏是否结束
            checkGameEnd();
        }, 500);
    } else {
        // 检查是否需要翻回卡片
        // 如果当前翻开的卡片中有两张或以上，且没有匹配的对子
        // 则翻回所有不匹配的卡片（除了刚刚翻开的这一张）
        if (flippedCards.length >= 2) {
            // 延迟一下让玩家看清卡片
            setTimeout(() => {
                const allTypes = Object.keys(typeCount);
                const needsFlipBack = allTypes.every(type => typeCount[type] < 2);
                
                if (needsFlipBack) {
                    // 找到最近翻开的一张卡片（当前这张）
                    const latestCardId = card.id;
                    
                    // 翻回除最近翻开的卡片外的所有卡片
                    flippedCards.filter(c => c.id !== latestCardId).forEach(c => {
                        if (!c.isMatched && !c.isProcessing) {
                            flipCardBack(c);
                        }
                    });
                }
            }, 1000);
        }
    }
}

// 翻回卡片
function flipCardBack(card) {
    card.isFlipped = false;
    if (card.element) {
        card.element.classList.remove('flipped');
    }
}

// 匹配成功
function matchCards(card1, card2) {
    // 标记为已匹配
    card1.isMatched = true;
    card2.isMatched = true;
    
    // 移除处理中标记
    card1.isProcessing = false;
    card2.isProcessing = false;
    
    // 创建猫咪扑向屏幕特效
    createCatPounceEffect(card1);
    createCatPounceEffect(card2);
    
    // 移除卡片
    if (card1.element) {
        card1.element.classList.add('matched');
        setTimeout(() => {
            if (card1.element && card1.element.parentNode) {
                card1.element.remove();
                card1.element = null;
            }
        }, 500);
    }
    
    if (card2.element) {
        card2.element.classList.add('matched');
        setTimeout(() => {
            if (card2.element && card2.element.parentNode) {
                card2.element.remove();
                card2.element = null;
            }
        }, 500);
    }
    
    // 增加分数
    gameState.score += 10;
    document.getElementById('score').textContent = gameState.score;
}

// 创建猫咪扑向屏幕特效
function createCatPounceEffect(card) {
    // 创建猫咪效果元素
    const catEffect = document.createElement('div');
    catEffect.className = 'cat-pounce-effect';
    
    // 使用相同的猫咪图片
    const catImg = document.createElement('img');
    catImg.src = card.image;
    catImg.alt = 'Cat pounce';
    
    catEffect.appendChild(catImg);
    
    // 设置初始位置（从卡片位置开始）
    catEffect.style.left = card.x + 'px';
    catEffect.style.top = card.y + 'px';
    
    // 添加到游戏板
    gameState.gameBoard.appendChild(catEffect);
    
    // 使用简单的动画方式
    const animationType = Math.floor(Math.random() * 3);
    
    setTimeout(() => {
        switch(animationType) {
            case 0: // 向中心扑来
                catEffect.style.transform = 'translate(50%, 50%) scale(3)';
                catEffect.style.opacity = '0';
                break;
            case 1: // 向上跳
                catEffect.style.transform = 'translateY(-300px) scale(1.5)';
                catEffect.style.opacity = '0';
                break;
            case 2: // 向玩家扑来
                catEffect.style.transform = 'scale(5)';
                catEffect.style.opacity = '0';
                break;
        }
    }, 10);
    
    // 动画结束后移除元素
    setTimeout(() => {
        if (catEffect && catEffect.parentNode) {
            catEffect.remove();
        }
    }, 1000);
}

// 检查游戏结束
function checkGameEnd() {
    // 检查是否所有卡片都已匹配
    const allMatched = gameState.cards.every(card => card.isMatched);
    
    if (allMatched) {
        // 如果游戏存在计时器，清除计时器
        if (gameState.timer) {
            clearInterval(gameState.timer);
            gameState.timer = null;
        }
        
        // 延迟一下以便玩家看到最后一对匹配的卡片
        setTimeout(() => {
            // 显示关卡完成对话框
            const dialog = document.getElementById('dialog');
            const dialogTitle = document.getElementById('dialog-title');
            const dialogMessage = document.getElementById('dialog-message');
            const dialogButtons = document.getElementById('dialog-buttons');
            
            // 设置对话框内容
            dialogTitle.textContent = '恭喜！';
            
            // 根据关卡不同显示不同消息
            if (gameState.level < 5) {
                dialogMessage.textContent = '关卡完成！';
                dialogButtons.innerHTML = `
                    <button id="next-level" class="dialog-button">下一关</button>
                `;
                
                // 设置下一关按钮事件
                document.getElementById('next-level').addEventListener('click', () => {
                    dialog.style.display = 'none';
                    nextLevel();
                });
            } else {
                dialogMessage.textContent = '恭喜你通关了！';
                dialogButtons.innerHTML = `
                    <button id="restart" class="dialog-button">重新开始</button>
                `;
                
                // 设置重新开始按钮事件
                document.getElementById('restart').addEventListener('click', () => {
                    dialog.style.display = 'none';
                    restartGame();
                });
            }
            
            // 显示对话框
            dialog.style.display = 'flex';
        }, 1000);
    }
}

// 使用猫粮道具（显示一对匹配的卡片）
function useCatFood() {
    // 如果正在处理卡片，则忽略
    if (gameState.isProcessing) return;
    
    // 查找未匹配的卡片
    const unmatchedCards = gameState.cards.filter(card => !card.isMatched && !card.isFlipped);
    
    if (unmatchedCards.length < 2) return;
    
    // 保存操作历史
    saveGameState();
    
    // 设置处理锁
    gameState.isProcessing = true;
    
    // 查找一对匹配的卡片
    const cardTypes = {};
    for (const card of unmatchedCards) {
        if (!cardTypes[card.typeId]) {
            cardTypes[card.typeId] = [];
        }
        cardTypes[card.typeId].push(card);
    }
    
    // 找到至少有一对的卡片类型
    let pairToShow = null;
    for (const typeId in cardTypes) {
        if (cardTypes[typeId].length >= 2) {
            pairToShow = cardTypes[typeId].slice(0, 2);
            break;
        }
    }
    
    if (pairToShow) {
        // 闪烁显示这对卡片
        pairToShow.forEach(card => {
            if (card.element) {
                card.element.classList.add('hint');
                setTimeout(() => {
                    if (card.element) {
                        card.element.classList.remove('hint');
                    }
                }, 1500);
            }
        });
    }
    
    // 1.5秒后解除处理锁
    setTimeout(() => {
        gameState.isProcessing = false;
    }, 1500);
}

// 使用洗牌道具（重新排列卡片）
function useShuffle() {
    // 如果正在处理卡片，则忽略
    if (gameState.isProcessing) return;
    
    // 保存操作历史
    saveGameState();
    
    // 设置处理锁
    gameState.isProcessing = true;
    
    // 获取未匹配的卡片
    const unmatchedCards = gameState.cards.filter(card => !card.isMatched);
    
    if (unmatchedCards.length <= 1) {
        gameState.isProcessing = false;
        return;
    }
    
    // 收集所有位置
    const positions = unmatchedCards.map(card => ({
        x: card.x,
        y: card.y,
        row: card.row,
        col: card.col
    }));
    
    // 打乱位置
    const shuffledPositions = shuffleArray(positions);
    
    // 给卡片分配新位置
    unmatchedCards.forEach((card, index) => {
        card.x = shuffledPositions[index].x;
        card.y = shuffledPositions[index].y;
        card.row = shuffledPositions[index].row;
        card.col = shuffledPositions[index].col;
        
        // 翻回卡片
        card.isFlipped = false;
    });
    
    // 重新渲染卡片
    renderCards();
    
    // 解除处理锁
    setTimeout(() => {
        gameState.isProcessing = false;
    }, 600);
}

// 使用撤回道具（撤销上一步操作）
function useUndo() {
    // 如果正在处理卡片，则忽略
    if (gameState.isProcessing) return;
    
    if (gameState.history.length === 0) return;
    
    // 设置处理锁
    gameState.isProcessing = true;
    
    // 恢复上一步的游戏状态
    const lastState = gameState.history.pop();
    
    // 恢复卡片状态
    gameState.cards = lastState.cards.map(savedCard => {
        const currentCard = gameState.cards.find(c => c.id === savedCard.id);
        return {
            ...savedCard,
            element: currentCard ? currentCard.element : null
        };
    });
    
    // 恢复其他状态
    gameState.firstSelectedCard = lastState.firstSelectedCard ? 
        gameState.cards.find(c => c.id === lastState.firstSelectedCard.id) : null;
    
    // 重新渲染卡片
    renderCards();
    
    // 解除处理锁
    setTimeout(() => {
        gameState.isProcessing = false;
    }, 300);
}

// 保存当前游戏状态（用于撤回）
function saveGameState() {
    // 深拷贝当前游戏状态
    const savedState = {
        cards: gameState.cards.map(card => ({
            ...card,
            element: null
        })),
        firstSelectedCard: gameState.firstSelectedCard ? {
            id: gameState.firstSelectedCard.id,
            element: null
        } : null
    };
    
    gameState.history.push(savedState);
    
    // 限制历史记录长度
    if (gameState.history.length > 20) {
        gameState.history.shift();
    }
}

// 下一关
function nextLevel() {
    // 隐藏对话框
    document.getElementById('dialog').style.display = 'none';
    
    // 增加关卡计数
    gameState.level++;
    
    // 增加分数奖励
    const levelBonus = gameState.level * 20;
    gameState.score += levelBonus;
    
    // 开始新关卡
    startLevel(gameState.level);
}

// 重新开始游戏
function restartGame() {
    // 隐藏所有对话框
    document.getElementById('dialog').style.display = 'none';
    document.getElementById('game-over-dialog').style.display = 'none';
    
    // 重置游戏状态
    gameState.level = 1;
    gameState.score = 0;
    gameState.cards = [];
    gameState.history = [];
    gameState.firstSelectedCard = null;
    gameState.isProcessing = false;
    
    // 清除计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
        gameState.timer = null;
    }
    
    // 开始新游戏
    startLevel(gameState.level);
}

// 显示游戏结束对话框
function showGameOver() {
    const dialog = document.getElementById('dialog');
    const dialogTitle = document.getElementById('dialog-title');
    
    dialogTitle.textContent = '时间到！游戏结束';
    
    // 设置对话框按钮
    const dialogButtons = document.getElementById('dialog-buttons');
    dialogButtons.innerHTML = `
        <button id="restart" class="dialog-button">重新开始</button>
    `;
    
    // 显示对话框
    dialog.style.display = 'flex';
    
    // 设置重新开始按钮事件
    document.getElementById('restart').addEventListener('click', () => {
        dialog.style.display = 'none';
        restartGame();
    });
}

// 辅助函数：数组洗牌
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 根据猫咪类型获取颜色
function getColorForCat(typeId) {
    const colors = [
        '#ffcdd2', // 红色
        '#c8e6c9', // 绿色
        '#bbdefb', // 蓝色
        '#fff9c4', // 黄色
        '#e1bee7', // 紫色
        '#ffe0b2'  // 橙色
    ];
    
    return colors[(typeId - 1) % colors.length];
}

// 添加计时器功能
function startTimer(seconds) {
    // 清除之前的计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // 创建或更新计时器元素
    let timerElement = document.getElementById('timer-container');
    if (!timerElement) {
        // 如果不存在，创建计时器容器
        timerElement = document.createElement('div');
        timerElement.id = 'timer-container';
        timerElement.className = 'timer-container';
        
        // 添加到info-bar之后
        const infoBar = document.querySelector('.info-bar');
        infoBar.parentNode.insertBefore(timerElement, infoBar.nextSibling);
        
        // 创建CSS样式
        const style = document.createElement('style');
        style.textContent = `
            .timer-container {
                width: 100%;
                max-width: 500px;
                height: 20px;
                background-color: rgba(255, 255, 255, 0.8);
                border-radius: 10px;
                margin-bottom: 10px;
                overflow: hidden;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            }
            .timer-bar {
                height: 100%;
                background-color: #ff5252;
                width: 100%;
                transition: width 1s linear;
            }
            .timer-low {
                background-color: #ff3030;
                animation: pulse 1s infinite;
            }
            @keyframes pulse {
                0% { opacity: 0.7; }
                50% { opacity: 1; }
                100% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 创建计时器条
    timerElement.innerHTML = '<div class="timer-bar" id="timer-bar"></div>';
    const timerBar = document.getElementById('timer-bar');
    
    // 显示计时器
    timerElement.style.display = 'block';
    
    // 设置计时器
    let timeLeft = seconds;
    const totalTime = seconds;
    
    // 更新计时器显示
    const updateTimer = () => {
        const percentage = (timeLeft / totalTime) * 100;
        timerBar.style.width = `${percentage}%`;
        
        // 当时间不足30%时，添加警示动画
        if (percentage < 30) {
            timerBar.classList.add('timer-low');
        } else {
            timerBar.classList.remove('timer-low');
        }
        
        // 时间用完，游戏结束
        if (timeLeft <= 0) {
            clearInterval(gameState.timer);
            showGameOver();
        }
        
        timeLeft--;
    };
    
    // 立即更新一次
    updateTimer();
    
    // 设置定时器，每秒更新
    gameState.timer = setInterval(updateTimer, 1000);
}

// 隐藏计时器
function hideTimer() {
    // 清除计时器
    if (gameState.timer) {
        clearInterval(gameState.timer);
    }
    
    // 隐藏计时器元素
    const timerElement = document.getElementById('timer-container');
    if (timerElement) {
        timerElement.style.display = 'none';
    }
}

// 页面加载后初始化游戏
window.addEventListener('DOMContentLoaded', initGame);