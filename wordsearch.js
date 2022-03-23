/*
 * Wordsearch Game
 * (c) 2022 by Erick Levy!
 * A personal implementation of a word search game
 * or Sopa de Letras from the spaniard Pedro Ocón de Oro,
 */

const BOARD_ROWS = 18;
const BOARD_COLS = 18;

const VALID_CHARS = 'abcdefghijklmnñopqrstuvwxyz';
const INIT_CHAR = '.';

const DIR_HORIZONTAL = 'h';
const DIR_VERTICAL = 'v';
const DIR_DIAGONAL_UP = 'u';
const DIR_DIAGONAL_DOWN = 'd';

// Provisional set of words, @TODO: get random list from a file/collection/url/etc
var gWords = [
    'espacio',
    'dedicado',
    'desplegar',
    'posteriormente',
    'lista',
    'original',
    'palabras',
    'seleccionadas',
    'encontrar',
    'subrayar',

    'preferentemente',
    'filtrara',
    'existentes',
    'tablero',
    'distribuidas',
    'ordenadas',
    'primera',
    'segunda',
    'columnas',
    'ericklevy'
];

var gTries = 0;

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

        gTries++; // @TODO: DELETE

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
        case 'h': retval = putWordHorizontal(word, row, col); break;
        case 'v': retval = putWordVertical(word, row, col); break;
        case 'u': retval = putWordDiagonalUp(word, row, col); break;
        case 'd': retval = putWordDiagonalDown(word, row, col); break;
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
    let board = document.getElementById('letter-board');
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
    let wordList = document.getElementById('word-list');
    wordList.innerHTML = '';
    list.forEach(item => {
        let li = document.createElement('li');
        li.innerText = item.word;
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

function initGame() {
    initBoard();
    // Initialize a map of the word list
    let map = gWords.map((word, index) => {
        return { index: index, word: word, inBoard: false }
    });
    // Sort items by word length descending for efficiency
    map.sort((a, b) => b.word.length - a.word.length);
    // Force the words into the board and store its in board state
    map.forEach(item => item.inBoard = forceWord(item.word));
    // Complete the board and display
    fillBoard();
    displayBoard();
    // Filter only in board words and sort by index to restore the original list order
    map = map.filter(item => item.inBoard).sort((a, b) => a.index - b.index);
    displayWordList(map);
}

initGame();
console.log(gTries);