const dealTilesButton = document.getElementById('dealTilesButton');
dealTilesButton.addEventListener('click', dealTiles);

const tileCircles = document.getElementById('tileCircles');
export function dealTiles () {
    /* color of tiles */
    const tileColors = ['dark-gray', 'dark-tan', 'dark-pink', 'dark-blue', 'dark-yellow']
    /* circle */
    for (let i = 0; i < 5; i++) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        /* tile */
        const tile = document.createElement('div');
        tile.classList.add('tile');
        for (let tileColor of tileColors) {
            let colorTile = tile.cloneNode(false);
            colorTile.classList.add(tileColor)
            circle.appendChild(colorTile);
        }

        tileCircles.appendChild(circle);
    }
}

export function shuffleTiles () {
    console.log('shuffle tiles')
}