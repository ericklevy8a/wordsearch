/*
 * Wordsearch Game
 * (c) 2022 by Erick Levy!
 * A personal implementation of a word search game
 * or Sopa de Letras from the spaniard Pedro Ocón de Oro,
 */

const BOARD_ROWS = 16;
const BOARD_COLS = 16;

const VALID_CHARS = 'abcdefghijklmnñopqrstuvwxyz';
const INIT_CHAR = '.';

const DIR_HORIZONTAL = 'h';
const DIR_VERTICAL = 'v';
const DIR_DIAGONAL_UP = 'u';
const DIR_DIAGONAL_DOWN = 'd';

// Virtual list of words
var gWords = [];

// Virtual game board
var gBoard = null;

/**
 * Initialize the virtual board and fill all positions with INIT_CHAR
 */
function initBoard() {
    gBoard = [];
    for (let i = 0; i < BOARD_ROWS; i++) {
        gBoard[i] = [];
        for (let j = 0; j < BOARD_COLS; j++) {
            gBoard[i].push(INIT_CHAR);
        }
    }
}

/**
 * Fill the rest of board available positions with random chars from VALID_CHARS string
 */
function fillBoard() {
    for (let i = 0; i < BOARD_ROWS; i++) {
        for (let j = 0; j < BOARD_COLS; j++) {
            if (gBoard[i][j] === INIT_CHAR) gBoard[i][j] = pickRandomChar(VALID_CHARS);
        }
    }
}

/**
 * Force to put a word in the board a number of times
 * @param {string} word - word to put in the board
 * @param {number} times - number of times the algorithm will try to force the word in the board
 * @returns {boolean} true if the word could be placed on the board, false otherwise
 */
function forceWord(word, times = BOARD_ROWS * BOARD_COLS) {
    while (times > 0) {
        if (tryWord(word))
            return true;
        times -= 1;
    }
    return false;
}

/**
 * Try to put a word in the virtual board
 * @param {string} word - word to put in the board
 * @returns {boolean} true if the word could be placed on the board, false otherwise
 */
function tryWord(word) {
    let dir = pickRandomChar(DIR_HORIZONTAL + DIR_VERTICAL + DIR_DIAGONAL_UP + DIR_DIAGONAL_DOWN);
    let reverse = Math.random() > 0.5; // reverse proportion 50%
    // Delimits the start position according to board dimensions, direction and word length
    let minCol = 0;
    let maxCol = (dir === DIR_VERTICAL) ? BOARD_COLS : BOARD_COLS - (word.length - 1);
    let minRow = (dir === DIR_DIAGONAL_UP) ? word.length - 1 : 0;
    let maxRow = (dir === DIR_HORIZONTAL) ? BOARD_ROWS : BOARD_ROWS - (word.length - 1);
    // Generate a valid start position
    let row = Math.floor(minRow + Math.random() * (maxRow - minRow + 1));
    let col = Math.floor(minCol + Math.random() * (maxCol - minCol + 1));
    // Try to put in this position
    return putWord(word, row, col, dir, reverse);
}

/**
 * Put a word in the virtual board (gBoard)
 * @param {string} word - word to put in the board
 * @param {number} row - start position row
 * @param {number} col - start position column
 * @param {'h'|'v'|'u'|'d'} dir - h: horizontal, v: vertical, u: diagonal up, d: diagonal down
 * @param {boolean} reverse - put chars in reverse mode (default = false)
 * @returns {boolean} true if the word could be placed on the board, false otherwise
 */
function putWord(word, row, col, dir, reverse = false) {
    let retval = false;
    // Check reverse mode
    if (reverse) word = reverseString(word);
    switch (dir) {
        case DIR_HORIZONTAL: retval = putWordHorizontal(word, row, col); break;
        case DIR_VERTICAL: retval = putWordVertical(word, row, col); break;
        case DIR_DIAGONAL_UP: retval = putWordDiagonalUp(word, row, col); break;
        case DIR_DIAGONAL_DOWN: retval = putWordDiagonalDown(word, row, col); break;
    }
    return retval;
}

/** Put a word in horizontal direction */
function putWordHorizontal(word, row, col) {
    // Do some validations
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
    if (word.length < 0 || col + word.length > BOARD_COLS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gBoard[row][col + i] !== INIT_CHAR && gBoard[row][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the board
    for (let i = 0; i < word.length; i++) { gBoard[row][col + i] = word[i] }
    return true;
}

/** Put a word in vertical direction */
function putWordVertical(word, row, col) {
    // Do some validations
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
    if (word.length < 0 || row + word.length > BOARD_ROWS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gBoard[row + i][col] !== INIT_CHAR && gBoard[row + i][col] !== word[i]) {
            return false;
        }
    }
    // Copy word to the board
    for (let i = 0; i < word.length; i++) { gBoard[row + i][col] = word[i] }
    return true;
}

/** Put a word in diagonal up direction */
function putWordDiagonalUp(word, row, col) {
    // Do some validations
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
    if (word.length < 0 || col + word.length > BOARD_COLS || row - (word.length - 1) < 0) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gBoard[row - i][col + i] !== INIT_CHAR && gBoard[row - i][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the board
    for (let i = 0; i < word.length; i++) { gBoard[row - i][col + i] = word[i] }
    return true;
}

/** Put a word in diagonal down direction */
function putWordDiagonalDown(word, row, col) {
    // Do some validations
    if (row < 0 || row >= BOARD_ROWS || col < 0 || col >= BOARD_COLS) return false;
    if (word.length < 0 || col + word.length > BOARD_COLS || row + word.length > BOARD_ROWS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gBoard[row + i][col + i] !== INIT_CHAR && gBoard[row + i][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the board
    for (let i = 0; i < word.length; i++) { gBoard[row + i][col + i] = word[i] }
    return true;
}

/**
 * Generates DOM elements to display the virtual board
 */
function displayBoard() {
    let board = document.getElementById('board-container');
    board.innerHTML = '';
    for (let i = 0; i < BOARD_ROWS; i++) {
        for (let j = 0; j < BOARD_COLS; j++) {
            let letterTile = document.createElement('div');
            letterTile.classList.add('letter-tile');
            letterTile.innerText = gBoard[i][j];
            board.appendChild(letterTile);
        }
    }
}

/**
 * Generates DOM elements to display the list of words
 */
function displayWordList(list) {
    let wordList = document.getElementById('list-container');
    wordList.innerHTML = '';
    list.forEach(item => {
        let li = document.createElement('li');
        li.innerText = item.word;
        li.dataset.clean = item.clean;
        wordList.appendChild(li);
    });
}

/* SOME TOOLS */

/**
 * Pick a ramdom char from a valid chars string
 * @param {string} chars - valid chars string
 * @returns {string} a randomly picked char from chars
 */
function pickRandomChar(chars) {
    return chars[Math.floor(chars.length * Math.random())];
}

/**
 * Reverse a string
 * @param {string} str - the string to reverse
 * @returns {string} reversed string
 */
function reverseString(str) {
    return str.split('').reverse().join('');
}

// INITIALIZE GAME

/**
 * Integrates all the initilization for a new word search game
 */
async function initGame() {
    // Select a set of words
    gWords = await getRandomWordSet();
    // Create game board
    initBoard();
    // Initialize a map of the word list
    let map = gWords.map((word, index) => {
        return {
            index: index,
            word: word,
            clean: cleanWord(word),
            inBoard: false
        }
    });
    // Sort items by word length descending for efficiency
    map.sort((a, b) => b.clean.length - a.clean.length);
    // Force the words into the board and store its in board state
    map.forEach(item => item.inBoard = forceWord(item.clean));
    // Complete the board and display
    fillBoard();
    displayBoard();
    // Filter only in board words and sort by index to restore the original list order
    map = map.filter(item => item.inBoard).sort((a, b) => a.index - b.index);
    displayWordList(map);
    // Creates DOM elements for a word search outliner and its layer and a words found layer
    const gameBoard = document.getElementById('board-container');
    const wordSearchLayer = document.createElement('div');
    wordSearchLayer.id = 'word-search-layer';
    const wordFoundLayer = document.createElement('div');
    wordFoundLayer.id = 'word-found-layer';
    const outliner = document.createElement('div');
    outliner.id = 'outliner-search';
    outliner.classList.add('outliner', 'hidden');
    wordSearchLayer.appendChild(outliner);
    gameBoard.appendChild(wordSearchLayer);
    gameBoard.appendChild(wordFoundLayer);
    // Add mouse event listeners
    gameBoard.addEventListener('mousedown', mouseDownListener);
    gameBoard.addEventListener('mousemove', mouseMoveListener);
    gameBoard.addEventListener('mouseup', mouseUpListener);
    gameBoard.addEventListener('mouseout', mouseOutListener);
}

/**
 * Fetchs a JSON file with a collection of sets of 20 words each and randomly pick one
 * @returns A randomly picked 20 words set (or a default one).
 */
async function getRandomWordSet() {
    const jsonWordSets = await fetch('./words.json')
        .then(response => { return response.json(); });
    return jsonWordSets[Math.floor(Math.random() * jsonWordSets.length)] || [
        'this is a',
        'default',
        'list of',
        'words',
        'and its presence',
        'means',
        'there was',
        'an error',
        'configuration',
        'existence',
        'collection',
        'json file',
        'should be',
        'verified',
        'even so',
        'you can play',
        'with the',
        'phrases',
        'of this',
        'message'
    ];
}

/**
 * Clean a word string replacing some ilegal chars for the game.
 * @param {string} word A word to apply the cleaning procedure.
 * @returns The cleaned word.
 */
function cleanWord(word) {
    return word
        .replaceAll(' ', '')
        .replace(/[áâàä]/g, 'a')
        .replace(/[éêèë]/g, 'e')
        .replace(/[íîìï]/g, 'i')
        .replace(/[óôòö]/g, 'o')
        .replace(/[úûùü]/g, 'u')
        .replace(/[úûùü]/g, 'u');
}

// WORD SEARCHING EVENTS AND OUTLINERS

var gCellWidth = 0;
var gCellHeight = 0;

var gOutlinerFactor = 0.75;

var gOutlinerMovingFlag = false;
var gOutlinerStartPosition = { row: 0, col: 0 };

/**
 * Listener for the mousedown event.
 * @param {*} e Event object.
 */
function mouseDownListener(e) {
    // Calculate and store the outline start position
    gCellWidth = (e.target.offsetWidth / BOARD_COLS);
    gCellHeight = (e.target.offsetHeight / BOARD_ROWS);
    gOutlinerStartPosition.col = Math.floor(e.offsetX / gCellWidth);
    gOutlinerStartPosition.row = Math.floor(e.offsetY / gCellHeight);
    // Set the moving flag for display the outline element
    gOutlinerMovingFlag = true;
}

/**
 * Listener for the mousemove event.
 * @param {*} e Event object.
 * @returns
 */
function mouseMoveListener(e) {
    // Check moving flag
    if (gOutlinerMovingFlag) {
        const outliner = document.getElementById('outliner-search');
        let sRow = gOutlinerStartPosition.row;
        let sCol = gOutlinerStartPosition.col;
        // Calculate actual position
        let aRow = Math.floor(e.offsetY / gCellHeight);
        let aCol = Math.floor(e.offsetX / gCellWidth);
        // Validate if still in the start position
        if (aCol === sCol && aRow === sRow) {
            outliner.classList.add('hidden');
            return;
        }
        outliner.classList.remove('hidden');
        // Calculate deltas and initialize angle degradians
        let deltaRows = aRow - sRow;
        let deltaCols = aCol - sCol;
        let theta = 0;
        // Check for directional conditions
        if (Math.abs(deltaCols) > 2 * Math.abs(deltaRows)) {
            aRow = sRow; // horizontal
        } else if (Math.abs(deltaRows) > 2 * Math.abs(deltaCols)) {
            aCol = sCol; // vertical
        } else {
            if (aRow > sRow && aCol > sCol) {
                theta = 45; // diagonal down normal
            } else if (aRow < sRow && aCol < sCol) {
                theta = -135; // diagonal down reverse
            } else if (aRow > sRow && aCol < sCol) {
                theta = 135; // diagonal up reverse
            } else if (aRow < sRow && aCol > sCol) {
                theta = -45; // diagonal up normal
            }
            aRow = sRow;
            // Calculate the hypothenusa of delta for diagonal widths
            const delta = Math.min(deltaRows, deltaCols);
            aCol = sCol + Math.sqrt(2 * delta * delta);
        }
        // Prepare the outline element
        const xPadding = Math.floor(((1 - gOutlinerFactor) * gCellWidth) / 2) + 1;
        const yPadding = Math.floor(((1 - gOutlinerFactor) * gCellHeight) / 2) + 1;
        let x = Math.floor(Math.min(sCol, aCol) * gCellWidth) + xPadding + 1;
        let y = Math.floor(Math.min(sRow, aRow) * gCellHeight) + yPadding + 1;
        let w = Math.floor((Math.abs(aCol - sCol) + 1) * gCellWidth) - 2 * xPadding;
        let h = Math.floor((Math.abs(aRow - sRow) + 1) * gCellHeight) - 2 * yPadding;
        outliner.style.left = `${x}px`;
        outliner.style.top = `${y}px`;
        outliner.style.transformOrigin = `${h / 2}px ${h / 2}px`;
        outliner.style.transform = `rotate(${theta}deg)`;
        outliner.style.width = `${w}px`;
        outliner.style.height = `${h}px`;
        // Check the word under the outline
        // Stylize the outline to show word found
    }
}

function mouseOutListener(e) {
    // DOM elements
    const outliner = document.getElementById('outliner-search');
    // Hide the outline element and reset moving flag
    outliner.classList.add('hidden');
    gOutlinerMovingFlag = false;
}

function mouseUpListener(e) {
    // DOM elements
    const outliner = document.getElementById('outliner-search');
    // Update the outline position, angle and size
    let sRow = gOutlinerStartPosition.row;
    let sCol = gOutlinerStartPosition.col;
    let eRow = Math.floor(e.offsetY / gCellHeight);
    let eCol = Math.floor(e.offsetX / gCellWidth);
    // Hide the outline element and reset moving flag
    outliner.classList.add('hidden');
    gOutlinerMovingFlag = false;
    // Restore the word under the outliner
    let word = restoreWordUnderOutliner(eRow, eCol);
    // Check found word in list
    if (findWordInList(word) !== undefined) {
        // Copy the outline element to found words layer
        const wordFoundLayer = document.getElementById('word-found-layer');
        const outlinerClone = outliner.cloneNode();
        // Change color of found outliner
        outlinerClone.classList.add('highlight');
        outlinerClone.classList.remove('hidden');
        outlinerClone.id = 'ouliner-found-' + word;
        wordFoundLayer.appendChild(outlinerClone);
        // Cross the found word in the list
        markWordAsFound(word)
        // Verify game over condition
        if (wordsRemain() === 0) {
            let msg = 'You have found all the words!<br>';
            msg += 'Press RESTART button or refresh page to play again.';
            msgbox('Congratulations!', msg, 'Restart', clickToRestart);
        }
    }
}

function restoreWordUnderOutliner(eRow, eCol) {
    let sRow = gOutlinerStartPosition.row;
    let sCol = gOutlinerStartPosition.col;
    let word = '';
    do {
        word += gBoard[sRow][sCol];
        if (sCol === eCol && sRow === eRow) break;
        sRow += Math.sign(eRow - sRow);
        sCol += Math.sign(eCol - sCol);
    } while (true);
    return word;
}

function findWordInList(word) {
    const list = [...document.querySelectorAll('#list-container li:not(.found)')];
    return list.find(element => element.dataset.clean === word);
}

function markWordAsFound(word) {
    const element = findWordInList(word);
    if (element) {
        element.classList.add('found');
        return true;
    }
    return false;
}

function wordsRemain() {
    const list = [...document.querySelectorAll('#list-container li')];
    const found = [...document.querySelectorAll('#list-container li.found')]
    return list.length - found.length;
}

function clickToRestart(e) {
    msgboxClose();
    initGame();
}

// NAV BAR ICONS INICIALIZATION
document.getElementById('btn-info').addEventListener('click', () => { msgbox('About This Game', 'Work in progress...'); });
document.getElementById('btn-help').addEventListener('click', () => { msgbox('How To Play', 'Work in progress...'); });
document.getElementById('btn-stats').addEventListener('click', () => { msgbox('Statistics', 'Work in progress...'); });
document.getElementById('btn-setup').addEventListener('click', () => { msgbox('Settings', 'Work in progress...'); });

// RUN THE GAME
initGame();

// End of code.