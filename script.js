// Create a Game class to encapsulate game logic
class GameBoard {
    constructor(rows = 6, cols = 4) {
        this.rows = rows;
        this.cols = cols;
        this.board = null;
        this.pathResult = null;
    }

    generate() {
        do {
            this.board = this.generateInitialBoard();
            this.placeSpecialSquares();
            this.pathResult = this.findShortestPath();
        } while (this.pathResult.path.length === 0);
        
        this.pathResult.changesInDirection = this.calculateChangesInDirection();
        return {
            board: this.board,
            pathResult: this.pathResult,
            difficulty: this.calculateDifficulty()
        };
    }

    generateInitialBoard() {
        return new Array(this.rows).fill(null).map(() => new Array(this.cols).fill('normal'));
    }

    placeSpecialSquares() {
        // Place 'start' square randomly in the first row but not in the first position
        let startCol = Math.floor(Math.random() * this.board[0].length);
        this.board[0][startCol] = 'start';

        // Ensure one 'blocked' square in the first row, not in the 'start' position
        let firstRowBlockedCol = (startCol + 1 + Math.floor(Math.random() * (this.board[0].length - 1))) % this.board[0].length;
        this.board[0][firstRowBlockedCol] = 'blocked';

        // Place 'goal' square randomly in the last row but not in the last position
        let goalCol = Math.floor(Math.random() * this.board[this.board.length - 1].length);
        this.board[this.board.length - 1][goalCol] = 'goal';

        // Ensure one 'blocked' square in the last row, not in the 'goal' position
        let lastRowBlockedCol = (goalCol + 1 + Math.floor(Math.random() * (this.board[0].length - 1))) % this.board[0].length;
        this.board[this.board.length - 1][lastRowBlockedCol] = 'blocked';

        // For all other rows, place exactly two 'blocked' squares randomly
        for (let i = 1; i < this.board.length - 1; i++) {
            let blockedPositions = [];
            while (blockedPositions.length < 2) {
                let randomCol = Math.floor(Math.random() * this.board[i].length);
                if (!blockedPositions.includes(randomCol)) {
                    blockedPositions.push(randomCol);
                    this.board[i][randomCol] = 'blocked';
                }
            }
        }
    }

    findShortestPath() {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        let start, goal, deadEnds = new Set();
        
        for (let row = 0; row < this.board.length; row++) {
            for (let col = 0; col < this.board[0].length; col++) {
                if (this.board[row][col] === 'start') start = { row, col };
                if (this.board[row][col] === 'goal') goal = { row, col };
            }
        }

        let queue = [[start]];
        let visited = new Set([`${start.row},${start.col}`]);

        while (queue.length > 0) {
            let path = queue.shift();
            let { row, col } = path[path.length - 1];

            let neighbors = this.getNeighbors({ row, col }, directions);
            if (neighbors.length === 1 && this.board[row][col] !== 'start' && this.board[row][col] !== 'goal') {
                deadEnds.add(`${row},${col}`);
            }

            for (let neighbor of neighbors) {
                if (!visited.has(`${neighbor.row},${neighbor.col}`)) {
                    visited.add(`${neighbor.row},${neighbor.col}`);
                    queue.push([...path, neighbor]);
                }
            }

            if (row === goal.row && col === goal.col) {
                return { path, deadEnds };
            }
        }
        return { path: [], deadEnds };
    }

    getNeighbors(current, directions) {
        let neighbors = [];
        for (let [dRow, dCol] of directions) {
            let newRow = current.row + dRow, newCol = current.col + dCol;
            if (newRow >= 0 && newRow < this.board.length && newCol >= 0 && newCol < this.board[0].length &&
                this.board[newRow][newCol] !== 'blocked') {
                neighbors.push({ row: newRow, col: newCol });
            }
        }
        return neighbors;
    }

    calculateChangesInDirection() {
        const path = this.pathResult.path;
        let changesInDirection = 0;
        
        if (path.length > 2) { // Need at least 3 points to start comparing direction changes
            for (let i = 2; i < path.length; i++) {
                const dir1 = this.getDirection(path[i - 2], path[i - 1]);
                const dir2 = this.getDirection(path[i - 1], path[i]);
                if (dir1 !== dir2) {
                    changesInDirection++;
                }
            }
        }
        return changesInDirection;
    }

    getDirection(current, next) {
        const rowDiff = next.row - current.row;
        const colDiff = next.col - current.col;
        
        if (rowDiff === 1 && colDiff === 0) return 'down';
        if (rowDiff === -1 && colDiff === 0) return 'up';
        if (colDiff === 1 && rowDiff === 0) return 'right';
        if (colDiff === -1 && rowDiff === 0) return 'left';
        // Include conditions for diagonal directions if needed
        if (rowDiff === 1 && colDiff === 1) return 'down-right';
        if (rowDiff === 1 && colDiff === -1) return 'down-left';
        if (rowDiff === -1 && colDiff === 1) return 'up-right';
        if (rowDiff === -1 && colDiff === -1) return 'up-left';
    }

    calculateDifficulty() {
        const pathLength = this.pathResult.path.length;
        const changesInDirection = this.pathResult.changesInDirection;
        const deadEnds = this.pathResult.deadEnds;
        
        let score = (pathLength - 1) + (changesInDirection * 2) + (deadEnds.size * 1.5);
        
        if (score < 10.5) return 'Easy';
        else if (score < 16) return 'Medium';
        else return 'Hard';
    }
}

// UI Renderer class to handle all DOM manipulations
class GameRenderer {
    constructor() {
        this.updateDimensions();
        window.addEventListener('resize', () => this.updateDimensions());
    }

    updateDimensions() {
        const boardElement = document.getElementById('gameBoard');
        if (boardElement) {
            const squares = boardElement.querySelectorAll('.square');
            if (squares.length > 0) {
                const rect = squares[0].getBoundingClientRect();
                this.squareSize = rect.width;
                this.gapSize = parseFloat(getComputedStyle(boardElement).gap) || 6;
            }
        }
    }

    displayBoard(board, path) {
        const boardElement = document.getElementById('gameBoard');
        boardElement.innerHTML = ''; // Clear previous board content

        const svgOverlay = document.getElementById('pathOverlay');
        svgOverlay.innerHTML = ''; // Clear previous SVG paths

        for (let row = 0; row < board.length; row++) {
            for (let col = 0; col < board[row].length; col++) {
                let square = document.createElement('div');
                square.className = `square ${board[row][col]}`;
                boardElement.appendChild(square);
            }
        }

        this.updateDimensions();
        this.drawPath(path, svgOverlay);
    }

    drawPath(path, svgOverlay) {
        const boardElement = document.getElementById('gameBoard');
        const boardRect = boardElement.getBoundingClientRect();
        svgOverlay.setAttribute('viewBox', `0 0 ${boardRect.width} ${boardRect.height}`);
        svgOverlay.style.width = `${boardRect.width}px`;
        svgOverlay.style.height = `${boardRect.height}px`;

        path.forEach((point, index) => {
            if (index < path.length - 1) {
                const start = point;
                const end = path[index + 1];

                // Calculate center positions
                const x1 = (start.col * (this.squareSize + this.gapSize)) + (this.squareSize / 2);
                const y1 = (start.row * (this.squareSize + this.gapSize)) + (this.squareSize / 2);
                const x2 = (end.col * (this.squareSize + this.gapSize)) + (this.squareSize / 2);
                const y2 = (end.row * (this.squareSize + this.gapSize)) + (this.squareSize / 2);

                // Create SVG line element
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1);
                line.setAttribute('y1', y1);
                line.setAttribute('x2', x2);
                line.setAttribute('y2', y2);
                line.setAttribute('stroke', '#4753fc');
                line.setAttribute('stroke-width', Math.max(2, this.squareSize * 0.04));

                svgOverlay.appendChild(line);
            }
        });
    }

    displayDifficulty(difficulty, pathLength, changesInDirection, deadEnds) {
        const difficultyElement = document.getElementById('difficulty');
        if (!difficultyElement) {
            const newElement = document.createElement('div');
            newElement.id = 'difficulty';
            document.body.appendChild(newElement);
        }

        const difficultyLevel = difficulty.toLowerCase();
        const starElements = this.createStarElements(difficultyLevel === 'easy' ? 1 : difficultyLevel === 'medium' ? 2 : 3);

        document.getElementById('difficulty').innerHTML = '';
        document.getElementById('difficulty').appendChild(starElements);

        const infoContent = document.getElementById('infoContent');
        infoContent.innerHTML = `
            <p>Path Length: ${pathLength-1}</p>
            <p>Turns: ${changesInDirection}</p>
            <p>Traps: ${Array.from(deadEnds).join(', ')}</p>
        `;
    }

    createStarElements(difficulty) {
        const starContainer = document.createElement('div');
        starContainer.className = 'star-container';

        for (let i = 0; i < 3; i++) {
            const star = document.createElement('span');
            star.className = 'star';
            star.textContent = '★';

            if (i < difficulty) {
                star.classList.add('filled');
            }

            starContainer.appendChild(star);
        }

        return starContainer;
    }
}

// Game Controller to handle user interactions and connect model with view
class GameController {
    constructor() {
        this.gameBoard = new GameBoard();
        this.renderer = new GameRenderer();
        this.setupEventListeners();
        
        // Generate a board on initial load
        this.generateBoard();
    }

    setupEventListeners() {
        document.getElementById("generateBtn").addEventListener("click", () => this.generateBoard());
        document.getElementById('infoToggle').addEventListener('click', () => this.toggleScoreInfo());
    }

    generateBoard() {
        const gameData = this.gameBoard.generate();
        this.renderer.displayBoard(gameData.board, gameData.pathResult.path);
        this.renderer.displayDifficulty(
            gameData.difficulty, 
            gameData.pathResult.path.length, 
            gameData.pathResult.changesInDirection, 
            gameData.pathResult.deadEnds
        );
    }

    toggleScoreInfo() {
        const infoContent = document.getElementById('infoContent');
        const isVisible = infoContent.style.display === 'block';

        infoContent.style.display = isVisible ? 'none' : 'block';
        document.getElementById('infoToggle').textContent = isVisible ? '► Show Board Info' : '▼ Hide Board Info';
    }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new GameController();
});