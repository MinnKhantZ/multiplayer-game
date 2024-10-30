require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const expect = require('chai');
const socket = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const fccTestingRoutes = require('./routes/fcctesting.js');
const runner = require('./test-runner.js');
const { default: Player } = require('./public/Player.mjs');
const { default: Collectible } = require('./public/Collectible.mjs');

const app = express();

app.use(helmet.hidePoweredBy({ setTo: "PHP 7.4.3" }));
app.use(helmet.noSniff()); // Prevent MIME sniffing
app.use(helmet.xssFilter()); // Prevent XSS
app.use(helmet.noCache()); // Disable client caching

const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use('/public', express.static(process.cwd() + '/public'));
app.use('/assets', express.static(process.cwd() + '/assets'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//For FCC testing purposes and enables user to connect from outside the hosting platform
app.use(cors({origin: '*'})); 

// Index page (static HTML)
app.route('/')
  .get(function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  }); 

//For FCC testing purposes
fccTestingRoutes(app);

// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});

const players = {};
const collectibles = [new Collectible(100, 150, 10, 'c1')];
function calculateRanks() {
  const sortedPlayers = Object.values(players).sort((a, b) => b.score - a.score);
  sortedPlayers.forEach((player, index) => {
    player.rank = `Rank: ${index + 1}/${sortedPlayers.length}`;
  });
}

function generateCollectible() {
  const x = Math.random() * 640; // Assuming you have defined canvasWidth
  const y = Math.random() * 480; // Assuming you have defined canvasHeight
  return new Collectible(x, y, 10, `c${Date.now()}`);
}

io.on('connection', (socket) => {
  const player = new Player(socket.id, 50, 50);
  players[socket.id] = player;

  socket.emit('init', { playerId: socket.id, players, collectibles });

  socket.broadcast.emit('playerJoined', player);

  socket.on('move', (directions) => {
    directions.forEach(direction => player.movePlayer(direction, 5));

    collectibles.forEach((item, index) => {
      if (player.collision(item)) {
        player.score += item.value;
        collectibles.splice(index, 1); // Remove the collected item
        collectibles.push(generateCollectible()); // Add a new collectible
      }
    });
    calculateRanks();
    io.emit('gameState', { players, collectibles });
  });

  socket.on('disconnect', () => {
    delete players[socket.id];
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = http.listen(portNum, () => {
  console.log(`Listening on port ${portNum}`);
  if (process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch (error) {
        console.log('Tests are not valid:');
        console.error(error);
      }
    }, 1500);
  }
});

module.exports = app; // For testing
