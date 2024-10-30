export default class Player {
  constructor(id, x, y) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.score = 0;
  }

  movePlayer(direction, pixels) {
    switch (direction) {
      case 'up': this.y -= pixels; break;
      case 'down': this.y += pixels; break;
      case 'left': this.x -= pixels; break;
      case 'right': this.x += pixels; break;
    }
  }

  calculateRank(players) {
    players.sort((a, b) => b.score - a.score);
    const rank = players.findIndex(player => player.id === this.id) + 1;
    return `Rank: ${rank}/${players.length}`;
  }

  collision(collectible) {
    return (
      this.x < collectible.x + 10 &&
      this.x + 10 > collectible.x &&
      this.y < collectible.y + 10 &&
      this.y + 10 > collectible.y
    );
  }
}
