document.getElementById("generateBtn").addEventListener("click", function() {
    generateBoard();
});

function generateBoard() {
    const rows = 6;
    const cols = 4;
    let board = generateInitialBoard(rows, cols);
    placeSpecialSquares(board);
    const path = findShortestPath(board);
    displayBoard(board, path);
    displayPathInfo(path);
}

function generateInitialBoard(rows, cols) {
    let board = new Array(rows).fill(null).map(() => new Array(cols).fill('normal'));
    return board;
}

function placeSpecialSquares(board) {
    // First row: one start, one blocked, two normal
    shuffleArray(board[0]);
    board[0][0] = 'start';
    board[0][1] = 'blocked';

    // Last row: one goal, one blocked, two normal
    shuffleArray(board[board.length - 1]);
    board[board.length - 1][0] = 'goal';
    board[board.length - 1][1] = 'blocked';

    // Middle rows: two blocked, two normal
    for (let i = 1; i < board.length - 1; i++) {
        shuffleArray(board[i]);
        board[i][0] = 'blocked';
        board[i][1] = 'blocked';
    }
}

function findShortestPath(board) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]; // Including diagonals
    let start, goal;
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[0].length; col++) {
            if (board[row][col] === 'start') start = { row, col };
            if (board[row][col] === 'goal') goal = { row, col };
        }
    }

    let queue = [[start]];
    let visited = new Set([`${start.row},${start.col}`]);

    while (queue.length > 0) {
        let path = queue.shift();
        let { row, col } = path[path.length - 1];

        if (row === goal.row && col === goal.col) return path;

        for (let [dRow, dCol] of directions) {
            let newRow = row + dRow, newCol = col + dCol;
            if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length && 
                board[newRow][newCol] !== 'blocked' && !visited.has(`${newRow},${newCol}`)) {
                visited.add(`${newRow},${newCol}`);
                queue.push([...path, { row: newRow, col: newCol }]);
            }
        }
    }
    return [];
}

function displayBoard(board, path) {
    const boardElement = document.getElementById('gameBoard');
    boardElement.innerHTML = ''; // Clear previous board
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            let square = document.createElement('div');
            square.className = `square ${board[row][col]}`;
            if (path.some(p => p.row === row && p.col === col)) {
                square.classList.add('path');
            }
            boardElement.appendChild(square);
        }
    }
}

function displayPathInfo(path) {
    const infoElement = document.getElementById('pathInfo');
    if (path.length > 0) {
        infoElement.textContent = `Path found with ${path.length} steps.`;
    } else {
        infoElement.textContent = 'No path found.';
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}
