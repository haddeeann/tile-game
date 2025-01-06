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
                :host([type="grid"]) {
                    display: grid;
                    grid-template-columns: repeat(5, ${TILE_SIZE}px);
                    grid-template-rows: repeat(5, ${TILE_SIZE});
                    gap: 10px;
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
                boardRow.setAttribute('squares', row);
                boardRow.setAttribute('row-index', row - 1)
                div.appendChild(boardRow);
            }
        } else if (type === 'grid') {
            for (let i = 0; i < 25; i++) {
                const square = document.createElement('board-square');
                this.shadowRoot.appendChild(square);
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
            const square = document.createElement('board-square');
            square.setAttribute('row-index', rowIndex)
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
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: ${TILE_SIZE};
                    height: ${TILE_SIZE};
                    border: 2px solid var(--dark);
                    background-color: ${squareColor};
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
