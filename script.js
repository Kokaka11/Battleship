
const SHIPS = [['Carrier', 5], ['Battleship', 4], ['Cruiser', 3], ['Submarine', 3], ['Destroyer', 2]];
let player, enemy, turn, targets; 

const randomInt = max => Math.floor(Math.random() * max);

function makeBoard() {
  const board = { cells: [], ships: [] };
  for (let i = 0; i < 100; i++) board.cells.push({ ship: null, shot: false });

  for (const [name, size] of SHIPS) {
    const ship = { name, size, spots: [] };
    while (ship.spots.length === 0) {
      const row = randomInt(10), col = randomInt(10);
      const horizontal = Math.random() < 0.5;
      const step = horizontal ? 1 : 10;
      const fits = horizontal ? col + size <= 10 : row + size <= 10;
      const spots = [];
      for (let k = 0; k < size; k++) spots.push(row * 10 + col + k * step);
      if (fits && spots.every(i => !board.cells[i].ship)) ship.spots = spots;
    }
    ship.spots.forEach(i => (board.cells[i].ship = ship));
    board.ships.push(ship);
  }
  return board;
}

const isSunk = (board, ship) => ship.spots.every(i => board.cells[i].shot);
const allSunk = board => board.ships.every(ship => isSunk(board, ship));
const label = i => 'ABCDEFGHIJ'[i % 10] + (Math.floor(i / 10) + 1);

function shoot(board, i) {
  const cell = board.cells[i];
  cell.shot = true;
  if (!cell.ship) return 'miss';
  return isSunk(board, cell.ship) ? 'sunk' : 'hit';
}

function newGame() {
  player = makeBoard();
  enemy = makeBoard();
  targets = [];
  turn = 'player';
  render();
}

function playerFire(i) {
  if (turn !== 'player' || enemy.cells[i].shot) return;
  shoot(enemy, i);
  if (allSunk(enemy)) return finish('Victory! The enemy fleet is destroyed.');
  turn = 'enemy';
  render();
  setTimeout(enemyTurn, 600);
}

function enemyTurn() {
  if (turn !== 'enemy') return;


  let i = -1;
  while (targets.length > 0 && i === -1) {
    const next = targets.pop();
    if (!player.cells[next].shot) i = next;
  }
  while (i === -1) {
    const next = randomInt(100);
    if (!player.cells[next].shot) i = next;
  }

  const result = shoot(player, i);

  if (result === 'hit') {
    if (i >= 10) targets.push(i - 10);        
    if (i < 90) targets.push(i + 10);        
    if (i % 10 > 0) targets.push(i - 1); 
    if (i % 10 < 9) targets.push(i + 1);      
  }
  if (result === 'sunk') targets = [];

  if (allSunk(player)) return finish('Defeat. Your fleet is lost.');
  turn = 'player';
  render();
}

function finish(text) {
  turn = 'over';
  document.getElementById('status').textContent = text;
  render();
  document.getElementById('status').className = allSunk(enemy) ? 'win' : 'lose';
}

function drawBoard(element, board, showShips) {
  element.innerHTML = board.cells.map((cell, i) => {
    let style = '';
    if (cell.shot && !cell.ship) style = 'miss';
    else if (cell.shot) style = isSunk(board, cell.ship) ? 'sunk' : 'hit';
    else if (showShips && cell.ship) style = 'ship';
    return `<button class="cell ${style}" data-i="${i}" aria-label="${label(i)}"></button>`;
  }).join('');
}

function drawFleet(element, board) {
  element.innerHTML = board.ships
    .map(s => `<li class="${isSunk(board, s) ? 'down' : ''}">${s.name} (${s.size})</li>`)
    .join('');
}

function render() {
  drawBoard(document.getElementById('enemyGrid'), enemy, turn === 'over');
  drawBoard(document.getElementById('playerGrid'), player, true);
  drawFleet(document.getElementById('enemyFleet'), enemy);
  drawFleet(document.getElementById('playerFleet'), player);
  document.getElementById('enemyGrid').classList.toggle('live', turn === 'player');
  if (turn !== 'over') {
    document.getElementById('status').className = '';
    document.getElementById('status').textContent = turn === 'player' ? 'Your turn — pick a target.' : 'Enemy is aiming…';
  }
}

document.getElementById('enemyGrid').addEventListener('click', event => {
  const cell = event.target.closest('.cell');
  if (cell) playerFire(Number(cell.dataset.i));
});
document.getElementById('newGame').addEventListener('click', newGame);
newGame();
