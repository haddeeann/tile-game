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
            }
            const square = document.createElement('board-square');
            square.setAttribute('row-index', rowIndex);
            square.setAttribute('type', type);
            square.setAttribute('gridColor', gridColor);
            this.shadowRoot.appendChild(square);
        }
    }
}

class BoardSquare extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        const rowIndex = parseInt(this.getAttribute('row-index'), 10);
        const colors = ['var(--pink)', 'var(--blue)', 'var(--yellow)', 'var(--tan)', 'var(--med)'];
        const squareColor = colors[rowIndex];
        const template = document.createElement('template');
        const type = this.getAttribute('type');
        const gridColor = this.getAttribute('gridColor');

        template.innerHTML = `
            <style>
                :host {
                    ${type === 'triangle' ? `background-color: ${squareColor};` : `background-color: ${gridColor};`}
                    display: block;
                    width: ${TILE_SIZE};
                    height: ${TILE_SIZE};
                    border: 2px solid var(--dark-gray);
                    margin-right: 10px;
                }
                :host(:last-child) {
                    margin-right: 0;
                }
            </style>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
    }
}

customElements.define('game-board', GameBoard);
customElements.define('board-row', BoardRow);
customElements.define('board-square', BoardSquare);
