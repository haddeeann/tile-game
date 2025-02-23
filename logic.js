const dealTilesButton = document.getElementById('dealTilesButton');
const moveTilesToScoreboardButton = document.getElementById('moveTilesToScoreboard');
const moveTilesToGameboardButton = document.getElementById('moveTilesToGameboard');
dealTilesButton.addEventListener('click', dealTiles);
moveTilesToScoreboardButton.addEventListener('click', moveTilesToScoreboard);
moveTilesToGameboardButton.addEventListener('click', handleMoveTilesToGameboard)
let currentPlayer = 'player1'; // Start with player 1

let selectedTile = null; // Track the selected tile
let selectedTiles = [];
let selectedRow = null;
/* Colors of tiles */
const tileColors = ['dark-gray', 'dark-tan', 'dark-pink', 'dark-blue', 'dark-yellow'];

function updateMoveTilesToScoreboardButton() {
    const tileCircles = document.getElementById('tileCircles');

    // Check if all tiles are moved (i.e., no `.tile` elements inside `#tileCircles`)
    const remainingTiles = tileCircles.querySelectorAll('.tile').length === 0;

    if (remainingTiles) {
        moveTilesToScoreboardButton.style.display = 'block'; // Show button
    } else {
        moveTilesToScoreboardButton.style.display = 'none'; // Hide button
    }
}

function updateMoveTilesToGameboardButton() {
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
    let freeRow = false;
    if (triangleGameBoard) {
        for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
            const boardRow = triangleGameBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
            const boardSquares = boardRow ? boardRow.shadowRoot.querySelectorAll('board-square') : [];
            Array.from(boardSquares).every(square => {
                if (square.hasAttribute('filled')) {
                    const squareColor = square.getAttribute('filled-color');
                    console.log(squareColor);
                    const tileColor = selectedTile.style.backgroundColor;
                    if (tileColor === squareColor) {
                        let targetSquare = getTargetSquare(boardSquares);
                        if (targetSquare) {
                            freeRow = true;
                        }
                    }
                }
            })
        }
    }

    if (selectedTile && selectedRow || selectedTile && !freeRow) {
        moveTilesToGameboardButton.style.display = 'block'; // Show button
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
    const tileColor = clickedTile.classList[1]; // todo, don't assume the color is the second class
    const parentCircle = clickedTile.closest('.circle');
    const allChildrenTiles = parentCircle.children;
    for (const tile of allChildrenTiles) {
        if (tile.classList.contains(tileColor)) {
            selectedTiles.push(tile);
            tile.classList.add('selected');
        }
    }

    // Set the new selected tile
    selectedTile = clickedTile;
    updateMoveTilesToGameboardButton();
}

// step 1 of 2 for move tiles to gameboard
function handleMoveTilesToGameboard() {
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
    selectedRow = triangleGameBoard.shadowRoot.querySelector(`board-row[class="selected"]`);
    const boardSquares = selectedRow ? selectedRow.shadowRoot.querySelectorAll('board-square') : [];
    const tileClassToRemove = Array.from(selectedTile.classList).find(className => className !== 'tile');
    let lockedColor = null;
    for (const square of boardSquares) {
        if (square.hasAttribute('filled')) {
            lockedColor = square.getAttribute('filled-color');
            if (lockedColor !== tileClassToRemove) {
                // let user know that they can't put colors that don't match in same row
                return;
            }
        }
    }

    const parentCircle = selectedTile.closest('.circle');
    if (tileClassToRemove) {
        Array.from(parentCircle.children).forEach(child => {
            if (child.classList.contains(tileClassToRemove)) {
                moveToGameBoard(child, tileClassToRemove, boardSquares);
                child.remove();
            }
        })
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
    moveTilesToGameboardButton.style.display = 'none'; // rehide the button once the rows are moved
    // if the round is over, show move tiles to scoreboard
    updateMoveTilesToScoreboardButton();
}

function getTargetSquare(squares) {
    return Array.from(squares).reverse().find(square => {
        const shadowChildren = Array.from(square.shadowRoot.children);
        return !square.hasAttribute('filled') && shadowChildren.every(child => !child.classList.contains('tile'));
    });
}

// step 2 of 2 for move tiles to gameboard
function moveToGameBoard(tile, tileClass, boardSquares) {
    const playerBoard = document.querySelector(`#${currentPlayer}`);

    // Try to find an empty square in the game board
    let targetSquare = getTargetSquare(boardSquares);

    // If no empty square is found, try the overflow row
    if (!targetSquare) {
        const overflowBoard = playerBoard.querySelector('overflow-board');

        if (overflowBoard) {
            const overflowRow = overflowBoard.shadowRoot.querySelector('board-row');
            const overflowSquares = overflowRow ? overflowRow.shadowRoot.querySelectorAll('board-square') : [];
            targetSquare = getTargetSquare(overflowSquares);
        }
    }

    if (targetSquare) {
        // Update the target square to visually represent the tile
        const tileColor = tile.classList[1]; // Todo: test, don't assume, Assuming the tile color is the second class
        targetSquare.style.backgroundColor = getComputedStyle(tile).backgroundColor;
        targetSquare.style.borderColor = getComputedStyle(tile).borderColor;

        // Mark the square as "filled" to prevent future updates
        targetSquare.setAttribute('filled', 'true');
        targetSquare.setAttribute('filled-color', tileColor);
    }
}

function moveTilesToScoreboard() {
    const players = ['player1', 'player2'];
    const squareColors = ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--tan)', 'var(--med)'];
    const squareFilledColors = ['dark-pink', 'dark-blue', 'dark-yellow', 'dark-tan', 'dark-gray'];
    for (let player of players) {
        const playerBoard = document.querySelector(`#${player}`);
        const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
        const gridScoreBoard = playerBoard.querySelector('game-board[type="grid"]');
        if (triangleGameBoard) {
            for (let rowIndex = 0; rowIndex < 5; rowIndex++) {
                const rowColor = squareColors[rowIndex];
                const tileColor = squareFilledColors[rowIndex]
                let rowFilled = true;
                const boardRow = triangleGameBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
                const boardSquares = boardRow ? boardRow.shadowRoot.querySelectorAll('board-square') : [];
                Array.from(boardSquares).every(square => {
                    const squareFilled = square.hasAttribute('filled');
                    if (!squareFilled) {
                        rowFilled = false;
                    }
                })
                if (rowFilled) {
                    const scoreBoardRow = gridScoreBoard.shadowRoot.querySelector(`board-row[row-index="${rowIndex}"]`);
                    const scoreBoardSquares = scoreBoardRow ? scoreBoardRow.shadowRoot.querySelectorAll('board-square') : [];
                    Array.from(scoreBoardSquares).every(square => {
                        const squareColor = square.getAttribute('gridcolor');
                        if (squareColor === rowColor) {
                            square.style.backgroundColor = `var(--${tileColor})`; // Apply CSS variable color
                            square.setAttribute('filled', 'true'); // Mark as filled
                        }
                    })
                    Array.from(boardSquares).forEach(square => {
                        square.style.backgroundColor = `${rowColor}`; // Apply CSS variable color
                        square.setAttribute('filled', 'false'); // Mark as filled
                    })
                }
            }
        }
    }
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
            let isValidPosition = false;

            while(!isValidPosition) {
                // position randomly within circle
                x = Math.random() * maxPosition + edgeCircle;
                y = Math.random() * maxPosition + edgeCircle;

                isValidPosition = positions.every(pos => {
                    const dx = x - pos.x;
                    const dy = y- pos.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    return distance >= minDistance;
                });
            }
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
}

document.addEventListener('DOMContentLoaded', () => {
    dealTiles();
})

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
        const gameBoard = this.getRootNode().host.closest('game-board');
        const playerContainer = gameBoard.closest('#player1, #player2');
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
        updateMoveTilesToGameboardButton();
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
            </style>
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