document.getElementById("generateBtn").addEventListener("click", function() {
    generateBoard();
});

function generateBoard() {
    const rows = 6;
    const cols = 4;
    let board, pathResult;

    do {
        board = generateInitialBoard(rows, cols);
        placeSpecialSquares(board);
        pathResult = findShortestPath(board);
    } while (pathResult.path.length === 0);

    displayBoard(board, pathResult.path);
    pathResult.changesInDirection = calculateChangesInDirection(pathResult.path);
    const difficulty = calculateDifficulty(pathResult.path.length, pathResult.changesInDirection, pathResult.deadEnds);
    displayDifficulty(difficulty, pathResult.path.length, pathResult.changesInDirection, pathResult.deadEnds);
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
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
    let start, goal, deadEnds = new Set();
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

        let neighbors = getNeighbors(board, { row, col }, directions);
        if (neighbors.length === 1 && board[row][col] !== 'start' && board[row][col] !== 'goal') {
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

function getNeighbors(board, current, directions) {
    let neighbors = [];
    for (let [dRow, dCol] of directions) {
        let newRow = current.row + dRow, newCol = current.col + dCol;
        if (newRow >= 0 && newRow < board.length && newCol >= 0 && newCol < board[0].length &&
            board[newRow][newCol] !== 'blocked') {
            neighbors.push({ row: newRow, col: newCol });
        }
    }
    return neighbors;
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

function displayPathInfo(pathResult) {
    const infoElement = document.getElementById('pathInfo');
    const path = pathResult.path;
    const changesInDirection = pathResult.changesInDirection;

    infoElement.innerHTML  = `Path found!<br>Length: ${path.length-1}<br>Turns: ${changesInDirection}`;
}

// Assuming path is an array of {row, col} objects
function calculateChangesInDirection(path) {
    let changesInDirection = 0;
    if (path.length > 2) { // Need at least 3 points to start comparing direction changes
        for (let i = 2; i < path.length; i++) {
            const dir1 = getDirection(path[i - 2], path[i - 1]);
            const dir2 = getDirection(path[i - 1], path[i]);
            if (dir1 !== dir2) {
                changesInDirection++;
            }
        }
    }
    return changesInDirection;
}

function getDirection(current, next) {
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

function calculateDifficulty(pathLength, changesInDirection, deadEnds) {
    console.log(deadEnds);
    let score = (pathLength - 1) + (changesInDirection * 2) + (deadEnds.size * 1.5);
    console.log(`Path Length: ${pathLength}, Changes in Direction: ${changesInDirection}, Dead Ends: ${deadEnds}, Score: ${score}`);

    if (score < 10.5) return 'Easy';
    else if (score < 16) return 'Medium';
    else return 'Hard';
}

function displayDifficulty(difficulty, pathLength, changesInDirection, deadEnds) {
    const difficultyElement = document.getElementById('difficulty');
    if (!difficultyElement) {
        const newElement = document.createElement('div');
        newElement.id = 'difficulty';
        document.body.appendChild(newElement);
    }

    const difficultyLevel = difficulty.toLowerCase();
    const starElements = createStarElements(difficultyLevel === 'easy' ? 1 : difficultyLevel === 'medium' ? 2 : 3);

    document.getElementById('difficulty').innerHTML = '';
    document.getElementById('difficulty').appendChild(starElements);

    const infoContent = document.getElementById('infoContent');
    infoContent.innerHTML = `
        <p>Path Length: ${pathLength-1}</p>
        <p>Turns: ${changesInDirection}</p>
        <p>Traps: ${Array.from(deadEnds).join(', ')}</p>
    `;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function createStarElements(difficulty) {
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

function toggleScoreInfo() {
    const infoContent = document.getElementById('infoContent');
    const isVisible = infoContent.style.display === 'block';

    infoContent.style.display = isVisible ? 'none' : 'block';
    document.getElementById('infoToggle').textContent = isVisible ? '► Show Board Info' : '▼ Hide Board Info';
}

document.getElementById('infoToggle').addEventListener('click', toggleScoreInfo);