const dealTilesButton = document.getElementById('dealTilesButton');
dealTilesButton.addEventListener('click', dealTiles);
let currentPlayer = "player1"; // Start with player 1
function handleMoveTile(event) {
    console.log('handle move tile first', event.target);
    const clickedEl = event.target;
    const clickedTile = clickedEl.closest('.tile');
    const tileClassToRemove = Array.from(clickedTile.classList).find(className => className !== 'tile');
    const parentCircle = clickedTile.closest('.circle');
    if (tileClassToRemove) {
        Array.from(parentCircle.children).forEach(child => {
            if (child.classList.contains(tileClassToRemove)) {
                moveToGameBoard(child, tileClassToRemove);
                child.remove();
            }
        })
    }
    // Log the successful filling of the square
    console.log(`Player ${currentPlayer}.`);

    // **Switch to the next player**
    currentPlayer = currentPlayer === "player1" ? "player2" : "player1"; // Toggle player
    // Highlight the active player's board
    document.getElementById("player1").classList.toggle("current-turn", currentPlayer === "player1");
    document.getElementById("player2").classList.toggle("current-turn", currentPlayer === "player2");

    console.log(`Now it's ${currentPlayer}'s turn!`);
}

function moveToGameBoard(tile, tileClass) {
    // Select the correct player's board
    const playerBoard = document.querySelector(`#${currentPlayer}`);
    const gameBoard = playerBoard.querySelector('game-board[type="triangle"]'); // Choose the triangle board

    const tileIndex = ['dark-pink', 'dark-blue', 'dark-yellow', 'dark-tan', 'dark-gray'].indexOf(tileClass);
    if (gameBoard) {
        const boardRow = gameBoard.shadowRoot.querySelector(`board-row[row-index="${tileIndex}"]`);
        const boardSquares = boardRow.shadowRoot.querySelectorAll('board-square');

        // Find the first empty square
        const targetSquare = Array.from(boardSquares).find(square => {
            const shadowChildren = Array.from(square.shadowRoot.children);
            const hasNoTiles = shadowChildren.every(child => !child.classList.contains('tile'));
            return hasNoTiles && !square.hasAttribute('filled'); // Ensure it's not already marked as filled
        });

        if (targetSquare) {
            // Update the target square to visually represent the tile
            const tileColor = tile.classList[1]; // Assuming the tile color is the second class
            targetSquare.style.backgroundColor = getComputedStyle(tile).backgroundColor; // Copy tile's background color
            targetSquare.style.borderColor = getComputedStyle(tile).borderColor; // Copy tile's border color

            // Mark the square as "filled" to prevent future updates
            targetSquare.setAttribute('filled', 'true');
        } else {
            console.log(`No empty square available for ${currentPlayer}'s tile.`);
        }
    }
}
export function dealTiles() {
    /* Colors of tiles */
    const tileColors = ['dark-gray', 'dark-tan', 'dark-pink', 'dark-blue', 'dark-yellow'];

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
            tile.addEventListener('click', handleMoveTile);
            const tileTooltip = document.createElement('span');
            tileTooltip.innerHTML = `${allTiles[i * 5 + j]}`;
            tile.appendChild(tileTooltip);

            const tileSize = 30;
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


export function shuffleTiles () {
    console.log('shuffle tiles')
}

document.addEventListener('DOMContentLoaded', () => {
    dealTiles();
})