const dealTilesButton = document.getElementById('dealTilesButton');
const moveTilesButton = document.getElementById('moveTilesButton');
const moveTilesToGameboardButton = document.getElementById('moveTilesToGameboard');
dealTilesButton.addEventListener('click', dealTiles);
moveTilesButton.addEventListener('click', moveTilesToScoreboard);
moveTilesToGameboardButton.addEventListener('click', handleMoveTilesToGameboard)
let currentPlayer = 'player1'; // Start with player 1

let selectedTile = null; // Track the selected tile
let selectedTiles = [];
/* Colors of tiles */
const tileColors = ['dark-gray', 'dark-tan', 'dark-pink', 'dark-blue', 'dark-yellow'];

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
}

function handleMoveTilesToGameboard() {
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const triangleGameBoard = playerBoard.querySelector('game-board[type="triangle"]');
    const selectedRow = triangleGameBoard.shadowRoot.querySelector(`board-row[class="selected"]`);
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
                moveToGameBoard(child, tileClassToRemove, selectedRow, boardSquares);
                child.remove();
            }
        })
    }
    // **Switch to the next player**
    currentPlayer = currentPlayer === "player1" ? "player2" : "player1"; // Toggle player
    // Highlight the active player's board
    document.getElementById("player1").classList.toggle("current-turn", currentPlayer === "player1");
    document.getElementById("player2").classList.toggle("current-turn", currentPlayer === "player2");

    for (const square of boardSquares) {
        square.classList.remove('selected');
    }
    selectedRow.classList.remove('selected');
}

function getTargetSquare(squares) {
    return Array.from(squares).reverse().find(square => {
        const shadowChildren = Array.from(square.shadowRoot.children);
        return !square.hasAttribute('filled') && shadowChildren.every(child => !child.classList.contains('tile'));
    });
}

function moveToGameBoard(tile, tileClass, selectedRow, boardSquares) {
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