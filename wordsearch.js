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

// Global game variables
var gSets = []; // Store the parsed contents of words.json file
var gSet = {} // Store the picked set and his data
var gWords = []; // the list of words to search
var gBoard = null; // virtual game board

// Try to get the game state, statistical and settings structures from local storage
// let gameState = getGameState() || false;
let gameSettings = getGameSettings() || false;
// let gameStatistics = getGameStatistics() || false;

// If present, apply some gamesettings
if (gameSettings) {
    if (gameSettings.darkTheme) document.body.classList.add('dark-theme');
}

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
    const listTitle = document.getElementById('list-title');
    const wordList = document.getElementById('list-container');
    listTitle.innerHTML = `<h2>${gSet.title}</h2>`
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
 * Integrates all the initilizations for a new word search game.
 */
async function initGame() {
    // Select a set of words
    if (gameSettings)
        gSet = await getWordSet();
    gWords = gSet.words;
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
 * Fetchs the words.json file and get one of the word sets.
 * @param {string} name
 * @returns A word set (or a default one).
 */
async function getWordSet(name = 'random') {
    // Fetch the file
    gSets = await fetch('./words.json')
        .then(response => { return response.json(); });
    // If no set name as passed, then pick a random set
    if (name === 'random') {
        return gSets[Math.floor(Math.random() * gSets.length)];
    } else {
        return gSets.find(set => set.name === name);
    }
}

/**
 * Clean a word string replacing some ilegal chars for the game.
 * @param {string} word A word to apply the cleaning procedure.
 * @returns The cleaned word.
 */
function cleanWord(word) {
    return word
        .replace(/[áâàä]/g, 'a')
        .replace(/[éêèë]/g, 'e')
        .replace(/[íîìï]/g, 'i')
        .replace(/[óôòö]/g, 'o')
        .replace(/[úûùü]/g, 'u')
        .replace(/[úûùü]/g, 'u')
        .replace(/[\s']/g, '');
}

// WORD SEARCHING EVENTS AND OUTLINERS

var gCellWidth = 0;
var gCellHeight = 0;

var gOutlinerFactor = 0.75;

var gOutlinerMovingFlag = false;
var gOutlinerStartPosition = { row: 0, col: 0 };

var gFoundWords = 0;

/**
 * Listener for the mousedown event. Starts the word outline process by setting the start position.
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
 * Listener for the mousemove event. Calculate the actual position and draw an outliner element.
 * @param {*} e Event object.
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
        // Calculate deltas and initialize diagonal angle
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
            // Select the minor delta and calculate the hypothenusa for diagonal widths
            const delta = Math.min(deltaRows, deltaCols);
            aCol = sCol + Math.sqrt(2 * delta * delta);
        }
        // Prepare the outliner dimensions
        const xPadding = Math.floor(((1 - gOutlinerFactor) * gCellWidth) / 2) + 1;
        const yPadding = Math.floor(((1 - gOutlinerFactor) * gCellHeight) / 2) + 1;
        let x = Math.floor(Math.min(sCol, aCol) * gCellWidth) + xPadding + 1;
        let y = Math.floor(Math.min(sRow, aRow) * gCellHeight) + yPadding + 1;
        let w = Math.floor((Math.abs(aCol - sCol) + 1) * gCellWidth) - 2 * xPadding;
        let h = Math.floor((Math.abs(aRow - sRow) + 1) * gCellHeight) - 2 * yPadding;
        // Apply dimension to DOM element
        outliner.style.left = `${x}px`;
        outliner.style.top = `${y}px`;
        outliner.style.transformOrigin = `${h / 2}px ${h / 2}px`;
        outliner.style.transform = `rotate(${theta}deg)`;
        outliner.style.width = `${w}px`;
        outliner.style.height = `${h}px`;
    }
}

/**
 * Listener for the mouseout event. Cancel the word outline process when the mouse cursor leaves the board.
 * @param {*} e Event object.
 */
function mouseOutListener(e) {
    // DOM elements
    const outliner = document.getElementById('outliner-search');
    // Hide the outline element and reset moving flag
    outliner.classList.add('hidden');
    gOutlinerMovingFlag = false;
}

/**
 * Listener for the mouseup event. Finish the word outline process and validate the found word.
 * @param {*} e Event object.
 */
function mouseUpListener(e) {
    // DOM elements
    const outliner = document.getElementById('outliner-search');
    // Get the end position
    let eRow = Math.floor(e.offsetY / gCellHeight);
    let eCol = Math.floor(e.offsetX / gCellWidth);
    // Hide the outliner element and reset moving flag
    outliner.classList.add('hidden');
    gOutlinerMovingFlag = false;
    // Get the word under the outliner
    let word = getWordFound(eRow, eCol);
    // Check found word in list
    if (checkWordNotFound(word) !== undefined) {
        // Copy the outline element to found words layer
        const wordFoundLayer = document.getElementById('word-found-layer');
        const outlinerClone = outliner.cloneNode();
        // Change color of outliner clone
        outlinerClone.classList.add('highlight');
        // If game setting for colorful mode its true
        if (true) { // @TODO use game settings from local storage
            // Select a distinct color
            outlinerClone.classList.add('color' + (gFoundWords++ % 10));
        }
        outlinerClone.classList.remove('hidden');
        outlinerClone.id = 'ouliner-found-' + word;
        wordFoundLayer.appendChild(outlinerClone);
        // Cross the found word in the list
        markWordAsFound(word)
        // Verify GAME OVER condition
        if (countWordsNotFound() === 0) {
            let msg = 'You have found all the words!<br>';
            msg += 'Press RESTART button or refresh page to play again.';
            msgbox('Congratulations!', msg, 'Restart', clickToRestart);
        }
    }
}

/**
 * Get the word found from start to end position.
 * @param {number} eRow The row from outliner end position.
 * @param {number} eCol The column from outliner end position.
 * @returns {string} The word found.
 */
function getWordFound(eRow, eCol) {
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

/**
 * Validate if the word is in the NOT FOUND portion of the list of words to search.
 * @param {string} word The word to find in list.
 * @returns {boolean} True if the word is still in not found part of the list.
 */
function checkWordNotFound(word) {
    const list = [...document.querySelectorAll('#list-container li:not(.found)')];
    return list.find(element => element.dataset.clean === word);
}

/**
 * Mark the word as found in the list of words to search.
 * @param {string} word The word to be marked as found.
 * @returns True if the word could be marked.
 */
function markWordAsFound(word) {
    const element = checkWordNotFound(word);
    if (element) {
        element.classList.add('found');
        return true;
    }
    return false;
}

/**
 * Gets the count of words in the NOT FOUND portion of the search word list.
 * @returns {number} The word count.
 */
function countWordsNotFound() {
    return [...document.querySelectorAll('#list-container li:not(.found)')].length;
}

/**
 * Listener to RESTART button click event. Lets restart a new game.
 * @param {*} e Event object.
 */
function clickToRestart(e) {
    msgboxClose();
    initGame();
}

// LOCAL STORAGE FUNCTIONS

/**
 * Restores a game previusly saved in local storage or create a new one
 */
function restoreGameState() {
    if (gameState) {
        if (gameState.gameStatus === 'IN_PROGRESS') {
            // Reconstructs the game from the stored state data
            restoreBoardState();
            // Restore timer and step counter
            gStartTime = gameState.startTime;
            gSteps = gameState.steps;
        } else {
            gameRestart();
        }
    } else {
        msgbox('Error', 'There is a problem with local storage that prevents knowing the game status!');
    }
}

/**
 * Prepare the game board state for store
 */
function updateBoardState() {
}

/**
 * Restore the game board state from store
 */
function restoreBoardState() {
}

/**
 * Get the game state from local storage or creates a initial one
 * @returns a structure with the game state data
 */
function getGameState() {
    return getLocalStorageItem('wordsearch-state', {
        boardState: [],
        gameStatus: '',
        startTime: 0,
        steps: 0
    });
}

/**
 * Store the game state to local storage
 */
function setGameState() {
    setLocalStorageItem('wordsearch-state', gameState);
}

/**
 * Get the game statistics from local storage or creates a initial one
 * @returns a structure with the game statistics data
 */
function getGameStatistics() {
    return getLocalStorageItem('wordsearch-statistics', {
        gamesPlayed: 0,
    });
}

/**
 * Store the game statistics to local storage
 */
function setGameStatistics() {
    setLocalStorageItem('wordsearch-statistics', gameStatistics);
}

/**
 * Get the game settings from local storage or creates a initial one
 * @returns a structure with the game settings data
 */
function getGameSettings() {
    return getLocalStorageItem('wordsearch-settings', {
        darkTheme: false,
        set: "random"
    });
}

/**
 * Store the game settings to local storage
 */
function setGameSettings() {
    setLocalStorageItem('wordsearch-settings', gameSettings);
}

/**
 * Save an item in local storage
 * @param {string} key - The name or key of the item
 * @param {*} value - The value to stringify and save
 */
function setLocalStorageItem(key, value) {
    if (typeof (Storage) !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

/**
 * Get an item value from local storage
 * @param {string} key  - The name or key of the item
 * @param {*} value - A default value to return in case of fail
 * @returns A parsed object or the default value or false
 */
function getLocalStorageItem(key, value = false) {
    if (typeof (Storage) !== 'undefined') {
        return JSON.parse(localStorage.getItem(key)) || value;
    }
}

// NAV BAR ACTIONS

function showAbout() {
    let msg = `
        <div id="about-container">
            <p>© Copyright 2022 by Erick Levy!</p>
            <p>Some time ago I had a more relaxed stage in my life in which one of my favorite pastimes
            was solving the <b>word search</b> puzzles that were published in the newspaper of my city.</p>
            <p>Thank you for taking the time to learn about and play with this little app.</p>
            <h5>Other Games</h5>
            <p>There are other games and Apps I was implemented and published. If you want to take a look at them,
            here are the links: </p>
            <ul>
                <li><a href="../switcher/"><i class="switcher"></i>The Switcher Game</a></li>
                <li><a href="../tileslider/"><i class="tileslider"></i>The Tile Slider</a></li>
                <li><a href="../wordle/"><i class="wordle"></i>Wordle Clone</a></li>
                <li><a href="../memorama/"><i class="memorama"></i>Memorama</a></li>
                <li><a href="../pokedex/"><i class="pokedex"></i>Pokedex (not a game)</a></li>
            </ul>
        </div>
    `;
    msgbox('About This Game', msg);
}

function showHelp() {
    let msg = `
        <div id="help-container">
            <p>The objective of this puzzle is to find and mark all the words hidden inside the grid.</p>
            <p>The words may be placed horizontally, vertically, or diagonally, and can be reversed.</p>
            <p>A list of the hidden words is provided and have a theme to which all the words are related
             such as food, animals, or colors.</p>
            <p>The game is over when there are no more words of the list hidden on the grid.</p>
        </div>
    `;
    msgbox('How To Play', msg);
}

// Use msgbox to display a modal settings dialog
function showSettings() {
    let html = `
        <div id="settings-container">

            <div class="setting">
                <div class="Text">
                    <div class="title">Dark Theme</div>
                    <div class="description">Reduce luminance to ergonmy levels</div>
                </div>
                <div class="control">
                    <div class="switch" id="dark-theme" name="dark-theme">
                        <div class="knob">&nbsp;</div>
                    </div>
                </div>
            </div>

            <div class="setting vertical">
                <div class="Text">
                    <div class="title">Word Set</div>
                    <div class="description">Choose your favorite or let the game pick a random</div>
                </div>
                <div class="set-select">
                    <select name="set">
                        <option value="random">Random (default)</option>`;
    gSets.forEach(set => {
        html += `
                        <option value="${set.name}">${set.title}</option>`;
    });
    html += `
                    </select>
                </div>
            </div>

        </div>`;
    msgbox('Settings', html);
    // Check for dark theme mode value and initialize its checked attribute
    if (gameSettings.darkTheme) document.getElementById('dark-theme').setAttribute('checked', '');
    // Check for actual image set value and initialize its option selected attribute
    if (gameSettings.set) document.querySelector(`option[value='${gameSettings.set}']`).setAttribute('selected', '');
    // Event listener for changes in the settings controls
    document.getElementById('settings-container').addEventListener('click', (e) => {
        let target = e.target;
        let name = target.getAttribute('name');

        // Dark Theme (check type control)
        if (name == 'dark-theme') {
            // Inverts checked state and update game setting
            let checked = (target.getAttribute('checked') == null);
            gameSettings.darkTheme = checked;
            // Apply setting on game and update the input checked state
            if (checked) {
                document.body.classList.add('dark-theme');
                target.setAttribute('checked', '');
            } else {
                document.body.classList.remove('dark-theme');
                target.removeAttribute('checked');
            }
        }

        // Card image set (image select option type control)
        if (name == 'set') {
            // Update image options selected state
            let lastSelected = document.querySelector('.image-option[name="set"][selected]');
            if (lastSelected) lastSelected.removeAttribute('selected');
            target.setAttribute('selected', '');
            // Update game setting
            gameSettings.set = target.dataset.value;
            // Apply setting to actual game
            changeCardSet();
        }

        // Store configuration in local storage
        setGameSettings();
    });
}

// Nav bar initialization
document.getElementById('btn-info').addEventListener('click', showAbout);
document.getElementById('btn-help').addEventListener('click', showHelp);
document.getElementById('btn-stats').addEventListener('click', () => { msgbox('Statistics', 'Work in progress...'); });
document.getElementById('btn-setup').addEventListener('click', showSettings);

// RUN THE GAME
initGame();

// End of code.