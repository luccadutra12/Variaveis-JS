const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const statusEl = document.getElementById('status');
const restartBtn = document.getElementById('restartBtn');

const GAME = {
  running: false,
  score: 0,
  lives: 3,
  width: canvas.width,
  height: canvas.height,
  coinsToSpawn: 12,
  invincibleTime: 1000,
};

const player = {
  x: 40,
  y: 40,
  width: 30,
  height: 30,
  speed: 4,
  color: '#f8c948',
  invincible: false,
  invincibleTimer: 0,
};

const coins = [];
const enemies = [];
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, KeyW: false, KeyA: false, KeyS: false, KeyD: false };

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function makeCoin() {
  const size = 18;
  return {
    x: random(size, GAME.width - size),
    y: random(size, GAME.height - size),
    width: size,
    height: size,
    color: '#ffde00',
  };
}

function makeEnemy() {
  const size = 28;
  return {
    x: random(size, GAME.width - size),
    y: random(size, GAME.height - size),
    width: size,
    height: size,
    color: '#e03f3f',
    vx: random(-2.2, 2.2),
    vy: random(-2.2, 2.2),
  };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resetGame() {
  GAME.running = true;
  GAME.score = 0;
  GAME.lives = 3;
  player.x = 40;
  player.y = 40;
  player.invincible = false;
  player.invincibleTimer = 0;
  coins.length = 0;
  enemies.length = 0;

  for (let i = 0; i < GAME.coinsToSpawn; i++) coins.push(makeCoin());
  for (let i = 0; i < 4; i++) enemies.push(makeEnemy());
  updateHUD();
  statusEl.textContent = 'Jogo iniciado! Colete todas as moedas e evite inimigos.';
  window.requestAnimationFrame(gameLoop);
}

function updateHUD() {
  scoreEl.textContent = `Moedas: ${GAME.score}`;
  livesEl.textContent = `Vidas: ${GAME.lives}`;
}

function updatePlayer() {
  let dx = 0;
  let dy = 0;
  if (keys.ArrowUp || keys.KeyW) dy = -player.speed;
  if (keys.ArrowDown || keys.KeyS) dy = player.speed;
  if (keys.ArrowLeft || keys.KeyA) dx = -player.speed;
  if (keys.ArrowRight || keys.KeyD) dx = player.speed;

  player.x += dx;
  player.y += dy;

  if (player.x < 0) player.x = 0;
  if (player.y < 0) player.y = 0;
  if (player.x + player.width > GAME.width) player.x = GAME.width - player.width;
  if (player.y + player.height > GAME.height) player.y = GAME.height - player.height;

  if (player.invincible) {
    player.invincibleTimer -= 16;
    if (player.invincibleTimer <= 0) {
      player.invincible = false;
    }
  }
}

function updateEnemies() {
  enemies.forEach((enemy) => {
    enemy.x += enemy.vx;
    enemy.y += enemy.vy;

    if (enemy.x < 0 || enemy.x + enemy.width > GAME.width) {
      enemy.vx *= -1;
    }
    if (enemy.y < 0 || enemy.y + enemy.height > GAME.height) {
      enemy.vy *= -1;
    }
  });
}

function drawRect(entity) {
  ctx.fillStyle = entity.color;
  ctx.fillRect(entity.x, entity.y, entity.width, entity.height);
}

function draw() {
  ctx.clearRect(0, 0, GAME.width, GAME.height);

  ctx.fillStyle = '#0f202f';
  ctx.fillRect(0, 0, GAME.width, GAME.height);

  // Coins
  coins.forEach((coin) => {
    ctx.fillStyle = coin.color;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, coin.width / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // Enemies
  enemies.forEach(drawRect);

  // Player
  ctx.fillStyle = player.invincible ? 'rgba(248, 201, 72, 0.6)' : player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);

  if (!GAME.running) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, GAME.width, GAME.height);
    ctx.fillStyle = '#fff';
    ctx.font = '28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', GAME.width / 2, GAME.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Clique em Reiniciar para tentar novamente', GAME.width / 2, GAME.height / 2 + 20);
  }
}

function gameLoop() {
  if (!GAME.running) {
    draw();
    return;
  }

  updatePlayer();
  updateEnemies();

  // Colisão com coin
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];
    const coinRect = { x: coin.x - coin.width / 2, y: coin.y - coin.height / 2, width: coin.width, height: coin.height };
    const playerRect = { x: player.x, y: player.y, width: player.width, height: player.height };
    if (rectsOverlap(playerRect, coinRect)) {
      coins.splice(i, 1);
      GAME.score += 1;
      updateHUD();
      if (coins.length === 0) {
        statusEl.textContent = 'Parabéns! Você coletou todas as moedas. Reinicie para jogar de novo.';
        GAME.running = false;
      }
    }
  }

  // Colisão com inimigo
  enemies.forEach((enemy) => {
    if (!player.invincible && rectsOverlap(player, enemy)) {
      GAME.lives -= 1;
      player.invincible = true;
      player.invincibleTimer = GAME.invincibleTime;
      player.x = 40;
      player.y = 40;
      updateHUD();
      statusEl.textContent = `Você foi atingido! Vidas restantes: ${GAME.lives}`;
      if (GAME.lives <= 0) {
        GAME.running = false;
        statusEl.textContent = 'Game Over! Clique em Reiniciar.';
      }
    }
  });

  draw();

  if (GAME.running) {
    window.requestAnimationFrame(gameLoop);
  }
}

window.addEventListener('keydown', (event) => {
  if (keys.hasOwnProperty(event.code)) {
    keys[event.code] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (keys.hasOwnProperty(event.code)) {
    keys[event.code] = false;
  }
});

restartBtn.addEventListener('click', () => {
  resetGame();
});

resetGame();
