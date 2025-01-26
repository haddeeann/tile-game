const dealTilesButton = document.getElementById('dealTilesButton');
dealTilesButton.addEventListener('click', dealTiles);
function handleMoveTile(event) {
    const clickedEl = event.target;
    const clickedTile = clickedEl.closest('.tile');
    const tileClassToRemove = Array.from(clickedTile.classList).find(className => className !== 'tile');
    const parentCircle = clickedTile.closest('.circle');
    if (tileClassToRemove) {
        Array.from(parentCircle.children).forEach(child => {
            if (child.classList.contains(tileClassToRemove)) {
                child.remove();
            }
        })
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