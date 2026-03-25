// ============================================
// DEFESA DA PALAVRA - Game Logic
// ============================================

// Configurações do jogo
const WORD = "ESCOLA";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GAME_AREA_HEIGHT = 600;
const GAME_AREA_WIDTH = 900;

// Estado do jogo
let gameState = {
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
    startTime: Date.now(),
    lettersOnScreen: []
};

// Configurações dinâmicas (aumentam com o nível)
let gameConfig = {
    spawnRate: 1500,      // ms entre spawn de letras
    fallSpeed: 3000       // ms para uma letra cair completamente
};

// Elementos DOM
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const gameOverModal = document.getElementById('gameOverModal');
const gameOverTitle = document.getElementById('gameOverTitle');
const gameOverMessage = document.getElementById('gameOverMessage');
const finalScoreDisplay = document.getElementById('finalScore');
const finalLevelDisplay = document.getElementById('finalLevel');

// ============================================
// AUDIO FUNCTIONS
// ============================================

// Criar som simples usando Web Audio API
function playSound(frequency, duration, type = 'sine') {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    } catch (e) {
        // Audio não suportado, ignorar
    }
}

function soundCorrect() {
    playSound(800, 0.1, 'sine');
    playSound(1000, 0.1, 'sine');
}

function soundIncorrect() {
    playSound(300, 0.15, 'square');
}

function soundMissed() {
    playSound(200, 0.2, 'sawtooth');
}

function soundLevelUp() {
    playSound(523, 0.1, 'sine');
    setTimeout(() => playSound(659, 0.15, 'sine'), 100);
    setTimeout(() => playSound(784, 0.2, 'sine'), 200);
}

// ============================================
// GAME FUNCTIONS
// ============================================

function getRandomLetter() {
    return ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
}

function updateDisplay() {
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;

    // Atualizar corações
    const hearts = '❤️ '.repeat(gameState.lives).trim();
    livesDisplay.textContent = hearts || '💔';
}

function createLetter() {
    const letter = getRandomLetter();
    const isCorrect = WORD.includes(letter);
    
    const letterElement = document.createElement('div');
    letterElement.className = 'letter';
    if (isCorrect) {
        letterElement.classList.add('correct');
    }
    letterElement.textContent = letter;
    
    // Posição aleatória no topo
    const posX = Math.random() * (GAME_AREA_WIDTH - 50);
    letterElement.style.left = posX + 'px';
    letterElement.style.top = '-60px';

    // Objeto para rastrear cada letra
    const letterObj = {
        element: letterElement,
        letter: letter,
        isCorrect: isCorrect,
        startTime: Date.now(),
        posX: posX,
        clicked: false
    };

    gameArea.appendChild(letterElement);
    gameState.lettersOnScreen.push(letterObj);

    // Iniciar animação de queda
    animateFall(letterObj);

    // Detectar clique
    letterElement.addEventListener('click', () => {
        if (!letterObj.clicked && !gameState.gameOver) {
            handleLetterClick(letterObj);
        }
    });

    return letterObj;
}

function animateFall(letterObj) {
    const startY = -60;
    const endY = GAME_AREA_HEIGHT;
    const distance = endY - startY;
    const startTime = Date.now();

    function animate() {
        if (gameState.gameOver || letterObj.clicked) {
            return;
        }

        const elapsed = Date.now() - startTime;
        const progress = elapsed / gameConfig.fallSpeed;

        if (progress >= 1) {
            // Letra chegou ao final
            if (letterObj.isCorrect) {
                // Deixou uma letra correta cair
                showFeedback('❌ -1 VIDA', letterObj.posX, GAME_AREA_HEIGHT - 30, 'missed');
                gameState.lives--;
                soundMissed();
            }
            
            // Remover letra da tela
            letterObj.element.remove();
            gameState.lettersOnScreen = gameState.lettersOnScreen.filter(l => l !== letterObj);
            
            updateDisplay();
            checkGameOver();
            return;
        }

        const currentY = startY + (distance * progress);
        letterObj.element.style.top = currentY + 'px';

        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

function handleLetterClick(letterObj) {
    letterObj.clicked = true;
    letterObj.element.classList.add('hit');

    const posX = parseInt(letterObj.element.style.left);
    const posY = parseInt(letterObj.element.style.top);

    if (letterObj.isCorrect) {
        // Acertou!
        gameState.score++;
        showFeedback('✅ +1 PONTO', posX, posY, 'correct');
        soundCorrect();
    } else {
        // Errou!
        gameState.lives--;
        showFeedback('❌ ERRADO!', posX, posY, 'incorrect');
        soundIncorrect();
    }

    updateDisplay();

    setTimeout(() => {
        letterObj.element.remove();
        gameState.lettersOnScreen = gameState.lettersOnScreen.filter(l => l !== letterObj);
    }, 300);

    checkGameOver();
    checkLevelUp();
}

function showFeedback(text, x, y, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = text;
    feedback.style.left = x + 'px';
    feedback.style.top = y + 'px';

    gameArea.appendChild(feedback);

    setTimeout(() => feedback.remove(), 1000);
}

function checkLevelUp() {
    const newLevel = Math.floor(gameState.score / 10) + 1;
    
    if (newLevel > gameState.level) {
        gameState.level = newLevel;
        soundLevelUp();
        
        // Aumentar dificuldade
        gameConfig.spawnRate = Math.max(800, 1500 - (gameState.level * 150));
        gameConfig.fallSpeed = Math.max(2000, 3000 - (gameState.level * 200));
        
        console.log(`🎉 LEVEL UP! Nível: ${gameState.level}`);
        console.log(`   Spawn: ${gameConfig.spawnRate}ms, Fall: ${gameConfig.fallSpeed}ms`);
    }
}

function checkGameOver() {
    if (gameState.lives <= 0) {
        endGame();
    }
}

function endGame() {
    gameState.gameOver = true;
    
    // Remover todas as letras
    gameState.lettersOnScreen.forEach(letterObj => {
        if (letterObj.element.parentNode) {
            letterObj.element.remove();
        }
    });

    // Mostrar modal
    gameOverTitle.textContent = "💔 Game Over!";
    gameOverMessage.textContent = `Você perdeu todas as vidas!\n\nPontuação: ${gameState.score}`;
    finalScoreDisplay.textContent = gameState.score;
    finalLevelDisplay.textContent = gameState.level;
    gameOverModal.classList.remove('hidden');
}

function restartGame() {
    // Resetar estado
    gameState = {
        score: 0,
        lives: 3,
        level: 1,
        gameOver: false,
        startTime: Date.now(),
        lettersOnScreen: []
    };

    // Resetar config
    gameConfig = {
        spawnRate: 1500,
        fallSpeed: 3000
    };

    // Limpar tela
    gameArea.innerHTML = '';
    gameOverModal.classList.add('hidden');

    // Atualizar display
    updateDisplay();

    // Reiniciar spawn
    startGame();
}

function startGame() {
    updateDisplay();

    // Spawn inicial de letras
    setInterval(() => {
        if (!gameState.gameOver) {
            createLetter();
        }
    }, gameConfig.spawnRate);
}

// ============================================
// INICIALIZAÇÃO
// ============================================

startGame();

// Opcional: Debug
window.gameState = gameState;
window.debugSetScore = (value) => {
    gameState.score = value;
    updateDisplay();
    checkLevelUp();
};
window.debugSetLives = (value) => {
    gameState.lives = Math.max(0, value);
    updateDisplay();
    checkGameOver();
};
window.debugSkipLevel = () => {
    gameState.score += 10;
    updateDisplay();
    checkLevelUp();
};
