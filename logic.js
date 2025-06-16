const dealTilesButton = document.getElementById('dealTilesButton');
dealTilesButton.addEventListener('click', dealTiles);
const moveTilesToScoreboardButton = document.getElementById('moveTilesToScoreboard');
const moveTilesToGameboardButton = document.getElementById('moveTilesToGameboard');
const startGameButton = document.getElementById('startGame');
startGameButton.addEventListener('click', startGame);
moveTilesToScoreboardButton.addEventListener('click', moveTilesToScoreboard);
moveTilesToGameboardButton.addEventListener('click', handleMoveTilesToGameboard);
const endGameSection = document.getElementById('gameScore');
let currentPlayer = 'player1'; // Start with player 1

let selectedTile = null; // Track the selected tile
let selectedTiles = [];
let selectedRow = null;
/* Colors of tiles */
const tileColors = ['dark-gray', 'dark-tan', 'dark-pink', 'dark-blue', 'dark-yellow'];
let gameState = {
    round: 0,
    gameOver: false,
    playerOneScore: 0,
    playerTwoScore: 0,
    started: false
};

function updateScoringSection() {
    const round = endGameSection.querySelector('#round');
    round.innerHTML = gameState.round;
    const playerOneScore = endGameSection.querySelector('#playerOneScore');
    playerOneScore.innerHTML = gameState.playerOneScore;
    const playerTwoScore = endGameSection.querySelector('#playerTwoScore');
    playerTwoScore.innerHTML = gameState.playerTwoScore;
    const gameOver = endGameSection.querySelector('#gameOver');
    if (!gameState.started) {
        gameOver.innerHTML = 'Ready';
    }
    else {
        if (!gameState.gameOver) {
            gameOver.innerHTML = 'Playing';
        } else {
            gameOver.innerHTML = 'Game Over';
        }
    }
}

function calculateScore(scoreBoardSquare, scoreBoardRow, scoreBoardSquares, gridScoreBoard, player) {
    // Calculate score based on adjacency
    const row = parseInt(scoreBoardRow.getAttribute('row-index'));
    const col = Array.from(scoreBoardSquares).indexOf(scoreBoardSquare);

    let horizontalCount = 0;
    let verticalCount = 0;

    // Count horizontal tiles
    for (let i = col - 1; i >= 0; i--) {
        const sq = scoreBoardSquares[i];
        if (sq.hasAttribute('filled')) horizontalCount++;
        else break;
    }
    for (let i = col + 1; i < 5; i++) {
        const sq = scoreBoardSquares[i];
        if (sq.hasAttribute('filled')) horizontalCount++;
        else break;
    }

    // count the vertical tiles upwards
    for (let r = row - 1; r >= 0; r--) {
        const rowEl = gridScoreBoard.shadowRoot.querySelector(`board-row[row-index="${r}"]`)
        if (rowEl) {
            const square = rowEl.shadowRoot.querySelectorAll('board-square')[col]
            if (square.hasAttribute('filled')) verticalCount++;
            else break;
        }
    }

    for (let r = row + 1; r < 5; r++) {
        const rowEl = gridScoreBoard.shadowRoot.querySelector(`board-row[row-index="${r}"]`)
        if (rowEl) {
            const square = rowEl.shadowRoot.querySelectorAll('board-square')[col]
            if (square.hasAttribute('filled')) verticalCount++;
            else break;
        }
    }

    let scoreToAdd = 1;
    if (horizontalCount > 0) scoreToAdd += horizontalCount;
    if (verticalCount > 0) scoreToAdd += verticalCount;
    if (horizontalCount > 0 && verticalCount > 0) scoreToAdd--; // adjust overlap (center gets counted twice)

    if (player === 'player1') {
        gameState.playerOneScore += scoreToAdd;
    } else {
        gameState.playerTwoScore += scoreToAdd;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateScoringSection();
});

function tileScoreboardButton() {
    const tileCircles = document.getElementById('tileCircles');
    const floor = document.getElementById('floor');

    // Check if all tiles are moved (i.e., no `.tile` elements inside `#tileCircles`)
    const noRemainingTiles = tileCircles.querySelectorAll('.tile').length === 0;
    const noRemainingFloorTiles = floor.querySelectorAll('.tile').length === 0;

    if (noRemainingTiles && noRemainingFloorTiles) {
        moveTilesToScoreboardButton.style.display = 'block'; // Show button
    } else {
        moveTilesToScoreboardButton.style.display = 'none'; // Hide button
    }
}

function tileGameboardButton() {
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
    let freeRow = false;
    if (triangleGameBoard && selectedTile) {
        for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
            const boardRow = triangleGameBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
            const boardSquares = boardRow ? boardRow.shadowRoot.querySelectorAll('board-square') : [];
            Array.from(boardSquares).every(square => {
                if (square.hasAttribute('filled')) {
                    const squareColor = square.getAttribute('filled-color');
                    const tileColor = selectedTile.style.backgroundColor;
                    if (tileColor === squareColor) {
                        let targetSquare = getTargetSquare(boardSquares);
                        if (targetSquare) {
                            freeRow = true;
                        }
                    }
                } else {
                    freeRow = true;
                }
            })
        }
    }
    if (selectedTile && selectedRow || selectedTile && !freeRow) {
        moveTilesToGameboardButton.style.display = 'block';
    } else {
        moveTilesToGameboardButton.style.display = 'none'; // Hide button
    }
}

function handleTileSelection(event) {
    const clickedTile = event.target.closest('.tile');
    // Remove previous selection
    if (selectedTile) {
        selectedTile = null;
        for (const tile of selectedTiles) {
            tile.classList.remove('selected');
        }
        selectedTiles = [];
    }

    // add selected to all the tiles with same colors
    const tileColor = tileColors.find(c => clickedTile.classList.contains(c));
    let tileArea = clickedTile.closest('.circle');
    if (!tileArea) {
        tileArea = clickedTile.closest('#floor')
    }
    const allChildrenTiles = tileArea.children;
    for (const tile of allChildrenTiles) {
        if (tile.classList.contains(tileColor)) {
            selectedTiles.push(tile);
            tile.classList.add('selected');
        }
    }

    // Set the new selected tile
    selectedTile = clickedTile;
    tileGameboardButton();
}

// step 1 of 3 for move tiles to gameboard
function handleMoveTilesToGameboard() {
    let isOverflowRow = false;
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
    selectedRow = triangleGameBoard.shadowRoot.querySelector(`board-row[class="selected"]`);
    if (!selectedRow) {
        const overflowBoard = playerBoard.querySelector('overflow-board');
        selectedRow = overflowBoard.shadowRoot.querySelector(`board-row[class="selected"]`);
        isOverflowRow = true;
    }

    const boardSquares = selectedRow ? selectedRow.shadowRoot.querySelectorAll('board-square') : [];
    const tileClassToRemove = Array.from(selectedTile.classList).find(className => className !== 'tile');
    let lockedColor = null;
    if (!isOverflowRow) {
        for (const square of boardSquares) {
            if (square.hasAttribute('filled')) {
                lockedColor = square.getAttribute('filled-color');
                if (lockedColor !== tileClassToRemove) {
                    // let user know that they can't put colors that don't match in same row
                    return;
                }
            }
        }
    }
    let tileArea = selectedTile.closest('.circle');
    let floor = false;
    if (!tileArea) {
        tileArea = selectedTile.closest('#floor');
        floor = true;
    }
    if (tileClassToRemove) {
        Array.from(tileArea.children).forEach(child => {
            if (child.classList.contains(tileClassToRemove)) {
                moveToGameBoard(child, tileClassToRemove, boardSquares);
                child.remove();
            }
        })
        if (!floor) {
            Array.from(tileArea.children).forEach(child => {
                if (!child.classList.contains(tileClassToRemove)) {
                    moveToFloor(child);
                }
            })
        }
    }
    // **Switch to the next player**
    currentPlayer = currentPlayer === "player1" ? "player2" : "player1"; // Toggle player
    // Highlight the active player's board
    document.getElementById("player1").classList.toggle("current-turn", currentPlayer === "player1");
    document.getElementById("player2").classList.toggle("current-turn", currentPlayer === "player2");
    // reset selected and button
    for (const square of boardSquares) {
        square.classList.remove('selected');
    }
    if (selectedRow) {
        selectedRow.classList.remove('selected');
    }
    selectedRow = null;
    selectedTile = null;
    moveTilesToGameboardButton.style.display = 'none'; // rehide the button once the rows are moved
    // if the round is over, show move tiles to scoreboard
    tileScoreboardButton();
}

function getTargetSquare(squares, allowOverflow = true) {
    // 1. Try to find an empty square in the given row
    const target = Array.from(squares).reverse().find(square => {
        const shadowChildren = Array.from(square.shadowRoot.children);
        return !square.hasAttribute('filled') && shadowChildren.every(child => !child.classList.contains('tile'));
    });

    if (target || !allowOverflow) return target;

    // 2. If no empty square found and overflow is allowed, try the overflow row
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const overflowBoard = playerBoard.querySelector('overflow-board');

    const overflowRow = overflowBoard.shadowRoot.querySelector('board-row');
    const overflowSquares = overflowRow ? overflowRow.shadowRoot.querySelectorAll('board-square') : [];

    return Array.from(overflowSquares).reverse().find(square => {
        const shadowChildren = Array.from(square.shadowRoot.children);
        return !square.hasAttribute('filled') && shadowChildren.every(child => !child.classList.contains('tile'));
    });
}

// step 2 of 3 for move tiles to game board
function moveToGameBoard(tile, tileClass, boardSquares) {
    // Try to find an empty square in the game board
    let targetSquare = getTargetSquare(boardSquares);

    if (targetSquare) {
        // Update the target square to visually represent the tile
        const tileClassList = Array.from(tile.classList).filter(cls => cls !== 'selected');
        const tileDiv = targetSquare.shadowRoot.querySelector('.tile-display');

        // Clear old classes
        tileDiv.className = 'tile-display';
        tileClassList.forEach(cls => tileDiv.classList.add(cls));

        // Mark the square as "filled" to prevent future updates
        targetSquare.setAttribute('filled', 'true');
        targetSquare.setAttribute('filled-color', tileClass);
    }
}

// step 3 of 3 for move tiles to game board, move extra to floor
function moveToFloor(tile) {
    const floor = document.querySelector('#floor');
    floor.appendChild(tile);
    tile.addEventListener('click', handleTileSelection);
}

function moveTilesToScoreboard() {
    const players = ['player1', 'player2'];

    // Mapping dark tiles to their light background counterparts
    const darkLightColorConversion = {
        'dark-pink': 'var(--pink)',
        'dark-blue': 'var(--blue)',
        'dark-yellow': 'var(--yellow)',
        'dark-tan': 'var(--tan)',
        'dark-gray': 'var(--med)'
    };

    for (let player of players) {
        const playerBoard = document.querySelector(`#${player}`);
        const overflowBoard = playerBoard.querySelector('overflow-board');
        if (overflowBoard) {
            // Get the gameboard row
            const overflowRow = overflowBoard.shadowRoot.querySelector(`board-row`);
            const overflowSquares = overflowRow ? overflowRow.shadowRoot.querySelectorAll('board-square') : [];

            // Check if the row is fully filled and get the color of the tiles
            Array.from(overflowSquares).forEach(overflowSquare => {
                const tileDiv = overflowSquare.shadowRoot.querySelector('.tile-display');
                if (tileDiv) {
                    tileDiv.className = 'tile-display'; // Reset tile styles
                }
                overflowSquare.removeAttribute('filled-color');
                overflowSquare.removeAttribute('filled');
            });
        }
        const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
        const gridScoreBoard = playerBoard.querySelector('game-board[type="grid"]');

        if (triangleGameBoard) {
            for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
                let gameboardSquareColor = null;
                let rowFilled = true;

                // Get the gameboard row
                const gameboardRow = triangleGameBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
                const gameboardSquares = gameboardRow ? gameboardRow.shadowRoot.querySelectorAll('board-square') : [];

                // Check if the row is fully filled and get the color of the tiles
                Array.from(gameboardSquares).forEach(gameboardSquare => {
                    const squareFilled = gameboardSquare.hasAttribute('filled');
                    if (squareFilled && !gameboardSquareColor) {
                        gameboardSquareColor = gameboardSquare.getAttribute('filled-color');
                    }
                    if (!squareFilled) {
                        rowFilled = false;
                    }
                });

                // If the row is filled, move tiles to scoreboard
                if (rowFilled) {
                    const scoreBoardRow = gridScoreBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
                    const scoreBoardSquares = scoreBoardRow ? scoreBoardRow.shadowRoot.querySelectorAll('board-square') : [];

                    // Find the correct light-colored square on the scoreboard
                    Array.from(scoreBoardSquares).forEach(scoreBoardSquare => {
                        const scoreboardSquareColor = scoreBoardSquare.getAttribute('gridcolor');
                        if (scoreboardSquareColor === darkLightColorConversion[gameboardSquareColor]) {
                            // Apply the full tile style using the class
                            const tileDiv = scoreBoardSquare.shadowRoot.querySelector('.tile-display');
                            tileDiv.className = 'tile-display'; // reset first
                            tileDiv.classList.add('tile', gameboardSquareColor); // e.g. 'tile', 'dark-pink'

                            // Mark as filled
                            scoreBoardSquare.setAttribute('filled', 'true');
                            calculateScore(scoreBoardSquare, scoreBoardRow, scoreBoardSquares, gridScoreBoard, player);
                            updateScoringSection();
                        }
                    });

                    // **Clear the gameboard row after moving tiles**
                    Array.from(gameboardSquares).forEach(gameboardSquare => {
                        const tileDiv = gameboardSquare.shadowRoot.querySelector('.tile-display');
                        tileDiv.className = 'tile-display'; // remove tile classes
                        gameboardSquare.removeAttribute('filled'); // Remove 'filled' attribute
                        gameboardSquare.removeAttribute('filled-color'); // Remove color reference
                    });
                }
            }
        }
    }

    // check if game is over
    for (let player of players) {
        const grid = document.querySelector(`#${player} game-board[type="grid"]`);
        if (grid) {
            for (let row = 0; row < 5; row++) {
                const rowEl = grid.shadowRoot.querySelector(`board-row[row-index="${row}"]`);
                const squares = rowEl.shadowRoot.querySelectorAll('board-square');
                const filled = Array.from(squares).every(s => s.hasAttribute('filled'));
                if (filled) {
                    gameState.gameOver = true; // end condition met
                    dealTilesButton.style.display = 'none';
                    startGameButton.style.display = 'block';
                    updateScoringSection();
                }
            }
        }
    }

    // Hide "Move Tiles to Scoreboard" button after moving
    moveTilesToScoreboardButton.style.display = 'none';
}

export function dealTiles() {
    // Generate an array with 5 tiles of each color
    let allTiles = [];
    for (let tileColor of tileColors) {
        for (let i = 0; i < 5; i++) {
            allTiles.push(tileColor);
        }
    }

    // Shuffle the tiles using Fisher-Yates Shuffle
    for (let i = allTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allTiles[i], allTiles[j]] = [allTiles[j], allTiles[i]];
    }

    // Append tiles to the circles
    const tileCircles = document.querySelector('#tileCircles');
    tileCircles.replaceChildren();
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        const positions = [];
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.addEventListener('click', handleTileSelection);

            const maxPosition = 90;
            const edgeCircle = 25;
            const minDistance = 40;

            let x, y;

            // position randomly within circle
            x = Math.random() * maxPosition + edgeCircle;
            y = Math.random() * maxPosition + edgeCircle;
            positions.every(pos => {
                const dx = x - pos.x;
                const dy = y - pos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= minDistance) {
                    x += 15
                }
            });
            positions.push({ x, y })
            tile.classList.add('tile', allTiles[i * 5 + j]); // Assign a one of the randomly ordered color

            if (j % 2 === 0) {
                tile.style.top = `${x}px`;
                tile.style.right = `${y}px`;
            } else {
                tile.style.bottom = `${x}px`;
                tile.style.left = `${y}px`;
            }

            circle.appendChild(tile);
        }

        tileCircles.appendChild(circle);
    }

    gameState.round++;
    updateScoringSection();
}

export function startGame() {
    dealTiles();
    dealTilesButton.style.display = 'block';
    startGameButton.style.display = 'none';
    gameState.started = true;
    updateScoringSection();
}

const TILE_SIZE = 50;
const TILE_MARGIN = 10;
const NUM_TILES = 5;
// Calculate the total width of the game board
const BOARD_WIDTH = TILE_SIZE * NUM_TILES + TILE_MARGIN * (NUM_TILES - 1);

class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const type = this.getAttribute('type');
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    width: ${BOARD_WIDTH}px;
                    height: auto; /* maintain aspect ratio */
                }
            </style>
            <slot></slot>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        // Render children based on type
        if (type === 'triangle') {
            const div = document.createElement('div');

            this.shadowRoot.appendChild(div);
            for (let row = 1; row <= 5; row++) {
                const boardRow = document.createElement('board-row');
                boardRow.setAttribute('squares', String(row));
                boardRow.setAttribute('row-index', String(row - 1));
                boardRow.setAttribute('type', type);
                div.appendChild(boardRow);
            }
        } else if (type === 'grid') {
            const div = document.createElement('div');

            this.shadowRoot.appendChild(div);
            for (let row = 1; row <= 5; row++) {
                const boardRow = document.createElement('board-row');
                boardRow.setAttribute('squares', 5);
                boardRow.setAttribute('row-index', String(row - 1));
                boardRow.setAttribute('type', type);
                div.appendChild(boardRow);
            }
        }
    }
}

class BoardRow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback() {
        const squares = parseInt(this.getAttribute('squares'), 10) || 1;
        const rowIndex = this.getAttribute('row-index');
        const type = this.getAttribute('type');
        const colors = ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--tan)', 'var(--med)'];
        let gridColors = [];
        let index = rowIndex;
        for (var i = 0; i < 5; i++) {
            gridColors.push(colors[index])
            if (index == 4) {
                index = 0
            } else {
                index++
            }
        }
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 10px;
                }
                :host(:last-child) {
                    margin-bottom: 0;
                }
            </style>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        for (let i = 0; i < squares; i++) {
            let gridColor = '';

            if (type === 'grid') {
                gridColor = gridColors.shift();
            } else if (type === 'overflow') {
                gridColor = 'var(--light)'
            }
            const square = document.createElement('board-square');
            square.setAttribute('type', type);
            square.setAttribute('gridColor', gridColor);
            this.shadowRoot.appendChild(square);
        }
        this.addEventListener('click', this.handleRowSelection.bind(this));
    }

    handleRowSelection(event) {
        event.stopPropagation();
        const isOverflow = this.getAttribute('type') === 'overflow';

        let playerContainer = null;
        if (isOverflow) {
            playerContainer = this.getRootNode().host.closest('#player1, #player2');
        } else {
            const gameBoard = this.getRootNode().host.closest('game-board');
            playerContainer = gameBoard.closest('#player1, #player2');
        }
        if (!playerContainer.classList.contains('current-turn')) {
            // current player not selected
            return;
        }
        // Deselect the previously selected row
        if (selectedRow && selectedRow !== this) {
            this.removeSquareStyles(this.classList.contains('selected'), selectedRow);
            selectedRow.classList.remove('selected');
        }
        this.classList.add('selected');
        // Update the global selectedRow reference
        selectedRow = this.classList.contains('selected') ? this : null;
        this.addSquareStyles(this.classList.contains('selected'), this);
        tileGameboardButton();
    }
    removeSquareStyles(isSelected, row) {
        const squares = row.shadowRoot.querySelectorAll('board-square');
        squares.forEach(square => {
            square.classList.remove('selected');
        });
    }
    addSquareStyles(isSelected, row) {
        const squares = row.shadowRoot.querySelectorAll('board-square');
        squares.forEach(square => {
            square.classList.add('selected');
        });
    }
}


const tileStyles = `
<style>
/* pink tile and pattern dots */
.dark-pink {
    background-color: var(--dark-pink);
}
.tile-display.dark-pink.tile::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background-image: radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                      radial-gradient(circle at 75% 75%, white 2px, transparent 2px);
    background-size: 16px 16px;
    border-radius: inherit;
}
/* blue tile stripes */
.dark-blue {
    background-color: var(--dark-blue);
}
.tile-display.dark-blue.tile {
    background: repeating-linear-gradient(45deg, var(--dark-blue), white 4px, var(--dark-blue) 4px, var(--dark-blue) 8px);
}
/* dark yellow stripes */
.dark-yellow {
    background-color: var(--dark-yellow);
}
.tile-display.dark-yellow.tile {
    background: repeating-linear-gradient(45deg, var(--dark-yellow), white 4px, var(--dark-yellow) 4px, var(--dark-yellow) 8px);
}
/* dark tan patterns grid */
.dark-tan {
    background-color: var(--dark-tan);
}
.tile-display.dark-tan.tile {
    background-color: var(--dark-tan);
    background-image: linear-gradient(rgba(255, 255, 255, 0.3) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255, 255, 255, 0.3) 1px, transparent 1px);
    background-size: 8px 8px;
}
/* dark gray patterns waves */
.dark-gray {
    background-color: var(--dark-gray);
}
.tile-display.dark-gray.tile {
    background-color: var(--dark-gray);
    background-image: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.3) 2px,
        rgba(255, 255, 255, 0.3) 4px
    );
}
</style>
`;

class BoardSquare extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
    }

    connectedCallback() {
        const template = document.createElement('template');
        const type = this.getAttribute('type');
        const gridColor = this.getAttribute('gridColor');

        template.innerHTML = `
            <style>
                :host {
                    ${type === 'triangle' ? `background-color: var(--light);` : `background-color: ${gridColor};`}
                    display: block;
                    width: ${TILE_SIZE};
                    height: ${TILE_SIZE};
                    margin-right: 10px;
                    cursor: pointer;
                }
                :host(.selected) {
                    border: 2px solid var(--light);
                }
                :host(:last-child) {
                    margin-right: 0;
                }
                .tile-display {
                    width: 100%;
                    height: 100%;
                    position: relative;
                }
            </style>
            ${tileStyles}
            <div class="tile-display"></div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

class OverflowBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    connectedCallback () {
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    width: 100%;
                    height: 50px;
                    background-color: var(--lightest);
                    display: block;
                    padding-top: 10px;
                    padding-bottom: 10px;
                }
                .overflow-container {
                    display: flex;
                    gap: ${TILE_MARGIN}px;
                }
            </style>
            <div class="overflow-container"></div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        // Select the container where board-row should go
        const div = this.shadowRoot.querySelector(".overflow-container");

        // Create a BoardRow
        const boardRow = document.createElement('board-row');
        boardRow.setAttribute('squares', 5); // 5 squares in a row
        boardRow.setAttribute('row-index', '0');
        boardRow.setAttribute('type', 'overflow'); // Ensure it gets the right styling
        div.appendChild(boardRow);
    }
}

customElements.define('game-board', GameBoard);
customElements.define('board-row', BoardRow);
customElements.define('board-square', BoardSquare);
customElements.define('overflow-board', OverflowBoard);

document.getElementById('howToPlayButton').addEventListener('click', () => {
    document.getElementById('howToPlayModal').classList.remove('hidden');
});

document.querySelector('#howToPlayModal .close').addEventListener('click', () => {
    document.getElementById('howToPlayModal').classList.add('hidden');
});

window.addEventListener('click', (event) => {
    const modal = document.getElementById('howToPlayModal');
    if (event.target === modal) {
        modal.classList.add('hidden');
    }
});
