document.getElementById("generateBtn").addEventListener("click", function() {
    generateBoard();
});

function generateBoard() {
    const rows = 6;
    const cols = 4;
    let board, path = [];

    // Attempt to generate a solvable board
    do {
        board = generateInitialBoard(rows, cols);
        placeSpecialSquares(board);
        path = findShortestPath(board);
    } while (path.length === 0); // Continue if no path found

    // A solvable board has been generated, display it
    displayBoard(board, path);
    displayPathInfo(path);
}


function generateInitialBoard(rows, cols) {
    let board = new Array(rows).fill(null).map(() => new Array(cols).fill('normal'));
    return board;
}

function placeSpecialSquares(board) {
    // Place 'start' square randomly in the first row but not in the first position
    let startCol = Math.floor(Math.random() * board[0].length);
    board[0][startCol] = 'start';

    // Ensure one 'blocked' square in the first row, not in the 'start' position
    let firstRowBlockedCol = (startCol + 1 + Math.floor(Math.random() * (board[0].length - 1))) % board[0].length;
    board[0][firstRowBlockedCol] = 'blocked';

    // Place 'goal' square randomly in the last row but not in the last position
    let goalCol = Math.floor(Math.random() * board[board.length - 1].length);
    board[board.length - 1][goalCol] = 'goal';

    // Ensure one 'blocked' square in the last row, not in the 'goal' position
    let lastRowBlockedCol = (goalCol + 1 + Math.floor(Math.random() * (board[0].length - 1))) % board[0].length;
    board[board.length - 1][lastRowBlockedCol] = 'blocked';

    // For all other rows, place exactly two 'blocked' squares randomly
    for (let i = 1; i < board.length - 1; i++) {
        let blockedPositions = [];
        while (blockedPositions.length < 2) {
            let randomCol = Math.floor(Math.random() * board[i].length);
            if (!blockedPositions.includes(randomCol)) {
                blockedPositions.push(randomCol);
                board[i][randomCol] = 'blocked';
            }
        }
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

    // Assuming each square is 50x50 pixels and there's a 5px gap between squares
    const squareSize = 75;
    const gapSize = 6;

    // Calculate and draw the path
    path.forEach((point, index) => {
        if (index < path.length - 1) {
            const start = point;
            const end = path[index + 1];

            // Calculate center positions
            const x1 = (start.col * (squareSize + gapSize)) + (squareSize / 2);
            const y1 = (start.row * (squareSize + gapSize)) + (squareSize / 2);
            const x2 = (end.col * (squareSize + gapSize)) + (squareSize / 2);
            const y2 = (end.row * (squareSize + gapSize)) + (squareSize / 2);

            // Create SVG line element
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#4753fc'); // Use any color you like
            line.setAttribute('stroke-width', '3'); // Adjust the stroke width as needed

            svgOverlay.appendChild(line);
        }
    });
}



function getDirection(current, next) {
    const rowDiff = next.row - current.row;
    const colDiff = next.col - current.col;
    if (rowDiff === 1) return 'path-down';
    if (rowDiff === -1) return 'path-up';
    if (colDiff === 1) return 'path-right';
    if (colDiff === -1) return 'path-left';
    // Add more conditions here for diagonal directions if necessary
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