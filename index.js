class GameBoard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        const type = this.getAttribute('type');
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    width: 290px;
                    height: 290px;
                    border: 2px solid red;
                }
                :host([type="grid"]) {
                    display: grid;
                    grid-template-columns: repeat(5, 50px);
                    grid-template-rows: repeat(5, 50px);
                    gap: 10px;
                }
            </style>
            <slot></slot>
        `;
        this.shadowRoot.appendChild(template.content.cloneNode(true));
        // Render children based on type
        if (type === 'triangle') {
            const div = document.createElement('div');
            div.style.width = 290;
            div.style.height = 290;
            this.shadowRoot.appendChild(div);
            for (let row = 1; row <= 5; row++) {
                const boardRow = document.createElement('board-row');
                boardRow.setAttribute('squares', row);
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
            this.shadowRoot.appendChild(square);
        }
    }
}

class BoardSquare extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    width: 50px;
                    height: 50px;
                    background-color: tan;
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
