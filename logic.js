const dealTilesButton = document.getElementById('dealTilesButton');
dealTilesButton.addEventListener('click', dealTiles);

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

        for (let j = 0; j < 5; j++) {
            const tile = document.createElement('div');
            tile.classList.add('tile', allTiles[i * 5 + j]); // Assign a one of the randomly ordered color
            circle.appendChild(tile);
        }

        tileCircles.appendChild(circle);
    }
}


export function shuffleTiles () {
    console.log('shuffle tiles')
}