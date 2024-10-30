const socket = io();
const canvas = document.getElementById('game-window');
const context = canvas.getContext('2d');

let playerId;
let players = {};
let collectibles = [];
const keysPressed = {};

socket.on('init', (data) => {
  playerId = data.playerId;
  players = data.players;
  collectibles = data.collectibles;
  render();
});

socket.on('gameState', (data) => {
  players = data.players;
  collectibles = data.collectibles;
  render();
});

socket.on('playerDisconnected', (id) => {
  delete players[id];
  render();
});

document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

function handleMovement() {
  const directions = [];
  if (keysPressed['ArrowUp'] || keysPressed['w']) directions.push('up');
  if (keysPressed['ArrowDown'] || keysPressed['s']) directions.push('down');
  if (keysPressed['ArrowLeft'] || keysPressed['a']) directions.push('left');
  if (keysPressed['ArrowRight'] || keysPressed['d']) directions.push('right');
  if (directions.length > 0) socket.emit('move', directions);
}

function render() {
  context.clearRect(0, 0, canvas.width, canvas.height);

  collectibles.forEach(item => {
    context.fillStyle = 'red';
    context.fillRect(item.x, item.y, 10, 10);
  });

  for (const id in players) {
    const player = players[id];
    context.fillStyle = id === playerId ? 'blue' : 'green';
    context.fillRect(player.x, player.y, 10, 10);
    context.fillStyle = 'white';
    context.fillText(player.rank, player.x, player.y - 5); // Display rank
  }
}

function gameLoop() {
  handleMovement();
  render();
  requestAnimationFrame(gameLoop);
}

gameLoop();
