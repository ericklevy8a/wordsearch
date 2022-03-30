/*
 * Wordsearch Game
 * (c) 2022 by Erick Levy!
 * A personal implementation of a word search game
 * or Sopa de Letras from the spaniard Pedro Ocón de Oro,
 */

const PATH_TO_SETS_FILE = './data/words-es.json';

const GRID_ROWS = 16;
const GRID_COLS = 16;

const VALID_CHARS = 'abcdefghijklmnñopqrstuvwxyz';
const INIT_CHAR = '.';

const DIR_HORIZONTAL = 'h';
const DIR_VERTICAL = 'v';
const DIR_DIAGONAL_UP = 'u';
const DIR_DIAGONAL_DOWN = 'd';

const GAME_STATUS = {
    IN_PROGRESS: Symbol('IN_PROGRESS'),
    GAME_OVER: Symbol('GAME_OVER'),
}

// GLOBAL GAME VARIABLES

var gSets = []; // the sets of words parsed from words-xx.json file
var gSet = {}; // the actual game picked set
var gWords = []; // the list of words to search
var gGrid = []; // virtual game grid

var gForceNewGame = false;

// Global vars for word placement algorithm statistics
var gWPAStats = {};
var gOverlaps = 0;

// Try to get the game state, statistical and settings structures from local storage
var gGameState = getGameState() || false;
var gGameSettings = getGameSettings() || false;
var gGameStatistics = getGameStatistics() || false;

// If present, apply some game settings
if (gGameSettings) {
    if (gGameSettings.darkTheme) document.body.classList.add('dark-theme');
    if (gGameSettings.hardMode) document.getElementById('list-container').classList.add('hide');
}

// INITIALIZING GAME AND GENERATING GRID ROUTINES

/**
 * Integrates all the initializations and generation of the grid for a new game.
 */
function initGame() {
    // Check for a previous game IN PROGRESS to restore, or create a new one
    if (gGameState && gGameState.status === GAME_STATUS.IN_PROGRESS) {
        restoreGame();
    } else {
        createGame();
    }
}

/**
 * Create a net game
 */
async function createGame() {
    gSet = await getWordSet(gGameSettings.setName);
    displayName();
    // Create a list of word objects from the set and initialize its properties
    gWords = gSet.words.map((word, index) => {
        return {
            index: index, // original position of the word within the list
            word: word, // the original word to put in the search list
            clean: cleanWord(word), // a cleaned version of the word to put in the grid (only valid chars)
            placed: false, // to know if the word is already placed in the grid
            found: false, // to know if the word is already found by player
        }
    });
    // Sort items by word length descending for efficiency
    gWords = gWords.sort((a, b) => b.clean.length - a.clean.length);
    // Create and initialize the letters grid
    initGrid();

    // START OF THE WORD PLACEMENT ALGORITHM (WPA)
    initWPAStats();
    // Repeat while evaluation don't pass
    while (true) {
        initWPApass();
        // Force the words into the grid and update its placed state
        gWords.forEach(item => item.placed = forceWordPro(item.clean));
        if (evalWPAStats()) break;
    }
    // END OF THE WORD PLACEMENT ALGORITHM (WPA)

    // Complete the grid and display
    fillGridSpaces();
    displayGrid();
    // Filter only placed words and sort by index to restore the original list order
    gWords = gWords.filter(item => item.placed).sort((a, b) => a.index - b.index);
    // Display the search words list
    displayList();
    prepareOutlinerLayers();
    gGameState.found = '';
    gGameState.status = GAME_STATUS.IN_PROGRESS;
    backupGame();
}

// Initialize WPA statistics
function initWPAStats() {
    gWPAStats.passes = 0;
    gWPAStats.placedMax = 0;
    gWPAStats.placedMaxPasses = 0;
}
function initWPApass() {
    gWPAStats.passes += 1;
    gWPAStats.placed = 0; // words placed in the grid
    gWPAStats.cover = 0; // grid letters coverage
    gWPAStats.overlaps = 0; // word letter overlaps counter
    gWPAStats.dir = {
        [DIR_HORIZONTAL]: 0,
        [DIR_VERTICAL]: 0,
        [DIR_DIAGONAL_UP]: 0,
        [DIR_DIAGONAL_DOWN]: 0,
    }
}
// Evaluate WPA statistics to ensure a level o quality of the resulting grid
function evalWPAStats() {
    const THRESHOLD_PASSES = GRID_ROWS + GRID_COLS;
    const THRESHOLD_PLACED_MAX_PASSES = 3;
    const THRESHOLD_PLACED_RATIO = 18 / 20;
    // A control of maximum placed words to detect a practical limit
    if (gWPAStats.placed > gWPAStats.placedMax) {
        gWPAStats.placedMax = gWPAStats.placed;
        gWPAStats.placedMaxPasses = 0;
    } else if (gWPAStats.placed === gWPAStats.placedMax) {
        gWPAStats.placedMaxPasses += 1;
    }
    // If is difficult to surpass the maximun number of placed words then hold the last
    if (gWPAStats.placedMaxPasses > THRESHOLD_PLACED_MAX_PASSES && gWPAStats.passes > THRESHOLD_PASSES) return true;

    // Test the percentage of words placed vs words in list
    if (gWPAStats.placed / gWords.length < THRESHOLD_PLACED_RATIO) return false;
    // Test coverage
    // Test overlaps
    // Test directions
    // Passed all the test
    return true;
}

/**
 * Create DOM elements for a search layer, a found layer, and the ouliner.
 */
function prepareOutlinerLayers() {
    const gridCont = document.getElementById('grid-container');
    const searchLayer = document.createElement('div');
    const foundLayer = document.createElement('div');
    const outliner = document.createElement('div');
    searchLayer.id = 'search-layer';
    foundLayer.id = 'found-layer';
    outliner.id = 'outliner-search';
    outliner.classList.add('outliner', 'hidden');
    searchLayer.appendChild(outliner);
    gridCont.appendChild(searchLayer);
    gridCont.appendChild(foundLayer);
    // Add mouse event listeners
    gridCont.addEventListener('mousedown', mouseDownListener);
    gridCont.addEventListener('mousemove', mouseMoveListener);
    gridCont.addEventListener('mouseout', mouseOutListener);
    document.body.addEventListener('mouseup', mouseUpListener);
}

/**
 * Get one of the word sets in gSets
 * @param {string} name String with the key name of the set to get. If ommited, a random set from the file fetched will be picked.
 * @returns {object} A word set object.
 */
async function getWordSet(name = 'random') {
    try {
        const url = PATH_TO_SETS_FILE;
        const response = await fetch(url);
        gSets = await response.json();
        // If there are no set with the given name, then pick a random set
        if (gSets.some(x => x.name === name)) {
            return gSets.find(x => x.name === name);
        } else {
            return pickRandom(gSets);
        }
    } catch (err) {
        console.error(err);
    }
}

/**
 * Initialize the virtual grid and fill all positions with default INIT_CHAR.
 */
function initGrid() {
    gGrid = [];
    for (let i = 0; i < GRID_ROWS; i++) {
        gGrid[i] = [];
        for (let j = 0; j < GRID_COLS; j++) {
            gGrid[i].push(INIT_CHAR);
        }
    }
}

/**
 * Fill the virtual grid remain positions with random chars taken from VALID_CHARS string.
 */
function fillGridSpaces() {
    for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
            if (gGrid[i][j] === INIT_CHAR) gGrid[i][j] = pickRandomChar(VALID_CHARS);
        }
    }
}

/**
 * Force to put a word in the virtual grid for a limited number of times.
 * @param {string} word Word to put into the grid.
 * @param {number} attempts Number of attempts the algorithm will try to force the word into the grid. Defaults to the number or positions on the grid.
 * @returns {boolean} True if the word could be placed, false otherwise.
 */
function forceWord(word, attempts = GRID_ROWS * GRID_COLS) {
    while (attempts > 0) {
        if (tryWord(word))
            return true;
        attempts -= 1;
    }
    return false;
}

/**
 * Force to put a word in the virtual grid for a limited number of times (Pro version).
 * @param {string} word Word to put into the grid.
 * @param {number} attempts Number of attempts the algorithm will try to force the word into the grid. Defaults to the number or positions on the grid.
 * @returns {boolean} True if the word could be placed, false otherwise.
 */
function forceWordPro(word) {
    const DIRS = [DIR_DIAGONAL_UP, DIR_DIAGONAL_DOWN, DIR_VERTICAL, DIR_HORIZONTAL];
    let rRow = Math.floor(Math.random() * GRID_ROWS);
    let rCol = Math.floor(Math.random() * GRID_COLS);
    //let rDir = Math.floor(Math.random() * DIRS.length);
    let rSen = Math.round(Math.random());
    for (let r = 0; r < GRID_ROWS; r++) {
        const row = (rRow + r) % GRID_ROWS;
        for (let c = 0; c < GRID_COLS; c++) {
            const col = (rCol + c) % GRID_COLS;
            for (let d = 0; d < DIRS.length; d++) {
                const dir = d; //(rDir + d) % DIRS.length;
                for (let s = 0; s < 2; s++) {
                    const sen = (rSen + s) === 0;
                    if (putWord(word, row, col, DIRS[dir], sen)) {
                        return true;
                    }
                }
            }
        }
    }
    return false;
}

/**
 * Generate a random position and direction and try to put a word in the virtual grid with them.
 * @param {string} word Word to put into the grid.
 * @returns {boolean} True if the word could be placed into the grid, false otherwise.
 */
function tryWord(word) {
    const DIRS = [DIR_HORIZONTAL, DIR_VERTICAL, DIR_DIAGONAL_UP, DIR_DIAGONAL_DOWN];
    const dir = pickRandom(DIRS);
    const reverse = Math.random() > 0.5; // reverse proportion 50%
    // Delimits the start position according to grid dimensions, direction and word length
    const minCol = 0;
    const maxCol = (dir === DIR_VERTICAL) ? GRID_COLS : GRID_COLS - (word.length - 1);
    const minRow = (dir === DIR_DIAGONAL_UP) ? word.length - 1 : 0;
    const maxRow = (dir === DIR_HORIZONTAL) ? GRID_ROWS : GRID_ROWS - (word.length - 1);
    // Generate a valid start position
    const row = Math.floor(minRow + Math.random() * (maxRow - minRow + 1));
    const col = Math.floor(minCol + Math.random() * (maxCol - minCol + 1));
    // Try to put word in this position and return result
    return putWord(word, row, col, dir, reverse);
}

/**
 * Put a word in the virtual grid from a start position, a direction, and if in reverse mode.
 * @param {string} word Word to put into the grid.
 * @param {number} row Start position row.
 * @param {number} col Start position column.
 * @param {DIR_HORIZONTAL|DIR_VERTICAL|DIR_DIAGONAL_UP|DIR_DIAGONAL_DOWN} dir Direction.
 * @param {boolean} reverse Put chars in reverse mode. Defaults to false.
 * @returns {boolean} True if the word could be placed into the grid, false otherwise.
 */
function putWord(word, row, col, dir, reverse = false) {
    let placed = false;
    gOverlaps = 0;
    // Check reverse mode
    if (reverse) word = reverseString(word);
    // Use the direction corresponding routine
    switch (dir) {
        case DIR_HORIZONTAL: placed = putWordHorizontal(word, row, col); break;
        case DIR_VERTICAL: placed = putWordVertical(word, row, col); break;
        case DIR_DIAGONAL_UP: placed = putWordDiagonalUp(word, row, col); break;
        case DIR_DIAGONAL_DOWN: placed = putWordDiagonalDown(word, row, col); break;
    }
    // Update put words algorithm statistics
    if (placed) {
        gWPAStats.placed += 1;
        gWPAStats.cover += (word.length - gOverlaps);
        gWPAStats.overlaps += gOverlaps;
        gWPAStats.dir[dir] += 1;
    }
    // Return the word could be placed flag
    return placed;
}
/** Put a word in horizontal direction */
function putWordHorizontal(word, row, col) {
    // Do some validations
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (word.length === 0 || col + word.length > GRID_COLS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gGrid[row][col + i] === word[i]) gOverlaps += 1;
        if (gGrid[row][col + i] !== INIT_CHAR && gGrid[row][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the virtual grid
    for (let i = 0; i < word.length; i++) { gGrid[row][col + i] = word[i] }
    return true;
}
/** Put a word in vertical direction */
function putWordVertical(word, row, col) {
    // Do some validations
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (word.length === 0 || row + word.length > GRID_ROWS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gGrid[row + i][col] === word[i]) gOverlaps += 1;
        if (gGrid[row + i][col] !== INIT_CHAR && gGrid[row + i][col] !== word[i]) {
            return false;
        }
    }
    // Copy word to the virtual grid
    for (let i = 0; i < word.length; i++) { gGrid[row + i][col] = word[i] }
    return true;
}
/** Put a word in diagonal up direction */
function putWordDiagonalUp(word, row, col) {
    // Do some validations
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (word.length === 0 || col + word.length > GRID_COLS || row - (word.length - 1) < 0) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gGrid[row - i][col + i] === word[i]) gOverlaps += 1;
        if (gGrid[row - i][col + i] !== INIT_CHAR && gGrid[row - i][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the virtual grid
    for (let i = 0; i < word.length; i++) { gGrid[row - i][col + i] = word[i] }
    return true;
}
/** Put a word in diagonal down direction */
function putWordDiagonalDown(word, row, col) {
    // Do some validations
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return false;
    if (word.length === 0 || col + word.length > GRID_COLS || row + word.length > GRID_ROWS) return false;
    // Word position validation
    for (let i = 0; i < word.length; i++) {
        if (gGrid[row + i][col + i] === word[i]) gOverlaps += 1;
        if (gGrid[row + i][col + i] !== INIT_CHAR && gGrid[row + i][col + i] !== word[i]) {
            return false;
        }
    }
    // Copy word to the virtual grid
    for (let i = 0; i < word.length; i++) { gGrid[row + i][col + i] = word[i] }
    return true;
}

/**
 * Display the word set title over the grid
 */
function displayName() {
    const titleCont = document.getElementById('title-container');
    titleCont.innerHTML = `<h2>${gSet.title}</h2>`
}

/**
 * Generates DOM elements and display the virtual grid.
 */
function displayGrid() {
    const gridCont = document.getElementById('grid-container');
    gridCont.innerHTML = '';
    let letterLayer = document.createElement('div');
    letterLayer.id = 'letter-layer';
    letterLayer.innerHTML = '';
    for (let i = 0; i < GRID_ROWS; i++) {
        for (let j = 0; j < GRID_COLS; j++) {
            let letterTile = document.createElement('div');
            letterTile.classList.add('letter-tile');
            letterTile.innerText = gGrid[i][j];
            letterLayer.appendChild(letterTile);
        }
    }
    gridCont.appendChild(letterLayer);
}

/**
 * Generates DOM elements and display the list of words.
 */
function displayList() {
    const listCont = document.getElementById('list-container');
    listCont.innerHTML = '';
    gWords.forEach(item => {
        let li = document.createElement('li');
        li.innerText = item.word;
        li.dataset.clean = item.clean;
        if (item.found) li.classList.add('found');
        listCont.appendChild(li);
    });
}

/* SOME TOOLS */

/**
 * Clean a word string replacing and deleting some ilegal chars for the game.
 * @param {string} word A word to clean.
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

/**
 * Pick a ramdom element from an array.
 * @param {array} array Array of elements.
 * @returns {string} A randomly picked element from array.
 */
function pickRandom(array) {
    return array[Math.floor(array.length * Math.random())];
}

/**
 * Pick a ramdom char from a valid chars string.
 * @param {string} chars Valid chars string.
 * @returns {string} A randomly picked char from chars.
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

// WORD SEARCHING EVENTS AND OUTLINER

var gTileWidth = 0;
var gTileHeight = 0;

var gOutlinerFactor = 0.75;

var gOutlinerMoving = false;
var gOutlinerStart = { row: 0, col: 0 };
var gOutlinerEnd = { row: 0, col: 0 };

var gFoundWords = 0;

/**
 * Listener for the mousedown event. Starts the word outline process by setting the start position.
 * @param {*} e Event object.
 */
function mouseDownListener(e) {
    // Calculate and store the outline start position
    gTileWidth = (e.target.offsetWidth / GRID_COLS);
    gTileHeight = (e.target.offsetHeight / GRID_ROWS);
    gOutlinerStart.col = Math.floor(e.offsetX / gTileWidth);
    gOutlinerStart.row = Math.floor(e.offsetY / gTileHeight);
    gOutlinerEnd.col = gOutlinerStart.col;
    gOutlinerEnd.row = gOutlinerStart.row;
    // Set the moving flag for display the outline element
    gOutlinerMoving = true;
}

/**
 * Listener for the mousemove event. Calculate the actual position and draw an outliner element.
 * @param {*} e Event object.
 */
function mouseMoveListener(e) {
    // Check moving flag
    if (gOutlinerMoving) {
        const outliner = document.getElementById('outliner-search');
        const sRow = gOutlinerStart.row;
        const sCol = gOutlinerStart.col;
        // Calculate actual position
        let aRow = Math.floor(e.offsetY / gTileHeight);
        let aCol = Math.floor(e.offsetX / gTileWidth);
        // Validate if still in the start position
        if (aCol === sCol && aRow === sRow) {
            // Hide the outliner DOM element
            outliner.classList.add('hidden');
            return;
        }
        // Show the outliner DOM element
        outliner.classList.remove('hidden');
        // Calculate deltas and initialize diagonal angle
        let deltaRows = aRow - sRow;
        let deltaCols = aCol - sCol;
        let theta = 0;
        // Check for directional conditions
        if (Math.abs(deltaCols) > 2 * Math.abs(deltaRows)) {
            aRow = sRow; // horizontal
            gOutlinerEnd.row = aRow;
            gOutlinerEnd.col = aCol;
        } else if (Math.abs(deltaRows) > 2 * Math.abs(deltaCols)) {
            aCol = sCol; // vertical
            gOutlinerEnd.row = aRow;
            gOutlinerEnd.col = aCol;
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
            deltaRows = Math.min(Math.abs(deltaRows), Math.abs(deltaCols)) * Math.sign(deltaRows);
            deltaCols = Math.min(Math.abs(deltaRows), Math.abs(deltaCols)) * Math.sign(deltaCols);
            aCol = sCol + Math.sqrt(deltaRows * deltaRows + deltaCols * deltaCols);
            gOutlinerEnd.row = Math.round(sRow + deltaRows);
            gOutlinerEnd.col = Math.round(sCol + deltaCols);
        }
        // Prepare the outliner dimensions
        const xPadding = Math.round(((1 - gOutlinerFactor) * gTileWidth) / 2);
        const yPadding = Math.round(((1 - gOutlinerFactor) * gTileHeight) / 2);
        let x = Math.round(Math.min(sCol, aCol) * gTileWidth) + xPadding;
        let y = Math.round(Math.min(sRow, aRow) * gTileHeight) + yPadding;
        let w = Math.round((Math.abs(aCol - sCol) + 1) * gTileWidth) - 2 * xPadding;
        let h = Math.round((Math.abs(aRow - sRow) + 1) * gTileHeight) - 2 * yPadding;
        // Store the outliner corrected end position
        // Apply dimension to DOM element
        outliner.style.left = `${x}px`;
        outliner.style.top = `${y}px`;
        outliner.style.width = `${w}px`;
        outliner.style.height = `${h}px`;
        outliner.style.transform = `rotate(${theta}deg)`;
        outliner.style.transformOrigin = `${h / 2}px ${h / 2}px`;
    }
}

/**
 * Listener for the mouseout event. Cancel the word outline process when the mouse cursor leaves the grid.
 * @param {*} e Event object.
 */
function mouseOutListener(e) {
    if (gOutlinerMoving) {
        // DOM element
        const outliner = document.getElementById('outliner-search');
        // Hide the outliner element
        outliner.classList.add('hidden');
    }
}

/**
 * Listener for the mouseup event. Finish the word outline process and validate the found word.
 * @param {*} e Event object.
 */
function mouseUpListener(e) {
    if (gOutlinerMoving) {
        // DOM elements
        const outliner = document.getElementById('outliner-search');
        // Hide the outliner element and reset moving flag
        outliner.classList.add('hidden');
        gOutlinerMoving = false;
        if (e.target.id !== 'search-layer')
            return;
        // Get the end position
        let eRow = gOutlinerEnd.row;
        let eCol = gOutlinerEnd.col;
        // Get the word under the outliner
        let word = getMarkedWord(eRow, eCol);
        // Is the word in NOT FOUND part of the list
        if (isWordNotFound(word)) {
            // Copy the outline element to found words layer
            const wordFoundLayer = document.getElementById('found-layer');
            const outlinerClone = outliner.cloneNode();
            // Change color of outliner clone
            outlinerClone.classList.add('highlight');
            // If game colorful mode is set
            if (gGameSettings.colorfulMode) {
                // Select a distinct color
                outlinerClone.classList.add('color' + (countWordsFound() % 10));
            }
            outlinerClone.classList.remove('hidden');
            outlinerClone.id = 'outliner-found-' + word;
            wordFoundLayer.appendChild(outlinerClone);
            // Cross the found word in the list
            markWordAsFound(word);
            displayList();
            // Verify GAME OVER condition
            if (countWordsNotFound() === 0) {
                gGameState.status = GAME_STATUS.GAME_OVER;
                let msg = 'You have found all the words!<br>';
                msg += 'Press RESTART button or refresh page to play again.';
                msgbox('Congratulations!', msg, 'Restart', clickToRestart);
            }
            backupGame(gSet, gGrid, gWords);
        }
    }
}

/**
 * Get the word found from start to end position.
 * @param {number} eRow The row from outliner end position.
 * @param {number} eCol The column from outliner end position.
 * @returns {string} The word found.
 */
function getMarkedWord(eRow, eCol) {
    let sRow = gOutlinerStart.row;
    let sCol = gOutlinerStart.col;
    let iRow = Math.sign(eRow - sRow);
    let iCol = Math.sign(eCol - sCol);
    let word = '';
    do {
        word += gGrid[sRow][sCol];
        if (sCol === eCol && sRow === eRow) break;
        sRow += iRow;
        sCol += iCol;
    } while (true);
    return word;
}

/**
 * Mark the word as found in the list of words to search.
 * @param {string} word The word to be marked as found.
 * @returns True if the word could be marked.
 */
function markWordAsFound(word) {
    const thisWord = gWords.find(x => x.clean === word);
    if (thisWord) {
        if (!thisWord.found) {
            return thisWord.found = true;
        }
    }
    return false;
}

/**
 * Validate if the word is in the NOT FOUND portion of the list of words to search.
 * @param {string} word The word to find in list.
 * @returns {boolean} True if the word is still in not found part of the list.
 */
function isWordNotFound(word) {
    const thisWord = gWords.find(x => x.clean === word);
    if (thisWord) {
        return !thisWord.found;
    }
    return false;
}

/**
 * Gets the count of words FOUND.
 * @returns {number} The word count.
 */
function countWordsFound() {
    return gWords.filter(x => x.found).length;
}

/**
 * Gets the count of words NOT FOUND.
 * @returns {number} The word count.
 */
function countWordsNotFound() {
    return gWords.filter(x => x.placed && !x.found).length;
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
 * Restores a game from local storage
 */
function restoreGame() {
    gSet = gGameState.set;
    gGrid = gGameState.grid;
    gWords = gGameState.words;
    displayName();
    displayGrid();
    displayList(gWords);
    prepareOutlinerLayers();
    const foundLayer = document.getElementById('found-layer');
    if (foundLayer) foundLayer.innerHTML = gGameState.found;
}

/**
 * Back up the actual game to local storage
 */
function backupGame() {
    const foundLayer = document.getElementById('found-layer');
    if (foundLayer) gGameState.found = foundLayer.innerHTML;
    gGameState.set = gSet;
    gGameState.grid = gGrid;
    gGameState.words = gWords;
    setGameState();
}

/**
 * Get the game state from local storage or creates a initial one
 * @returns a structure with the game state data
 */
function getGameState() {
    return getLocalStorageItem('wordsearch-state', {
        set: {},
        grid: [],
        words: [],
        found: '',
        status: '',
    });
}

/**
 * Store the game state to local storage
 */
function setGameState() {
    setLocalStorageItem('wordsearch-state', gGameState);
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
    setLocalStorageItem('wordsearch-statistics', gGameStatistics);
}

/**
 * Get the game settings from local storage or creates a initial one
 * @returns a structure with the game settings data
 */
function getGameSettings() {
    return getLocalStorageItem('wordsearch-settings', {
        darkTheme: false,
        hardMode: false,
        colorfulMode: false,
        set: 'random'
    });
}

/**
 * Store the game settings to local storage
 */
function setGameSettings() {
    setLocalStorageItem('wordsearch-settings', gGameSettings);
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
    let html = `
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
    msgbox('About This Game', html);
}

function showHelp() {
    let html = `
        <div id="help-container">
            <p>The objective of this puzzle is to find and mark all the words hidden inside the grid.</p>
            <p>The words may be placed into the grid horizontal, vertical, or diagonal direction, and can be reversed.</p>
            <p>A list of the hidden words is provided (but hidden in hard mode) and have a theme to which
            all the words are related such as food, animals, or colors.</p>
            <p>The game is over when there are no more words of the list hidden on the grid.</p>
        </div>
    `;
    msgbox('How To Play', html);
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

            <div class="setting">
                <div class="Text">
                    <div class="title">Hard Mode</div>
                    <div class="description">The search word list is not provided (hidden)</div>
                </div>
                <div class="control">
                    <div class="switch" id="hard-mode" name="hard-mode">
                        <div class="knob">&nbsp;</div>
                    </div>
                </div>
            </div>

            <div class="setting">
                <div class="Text">
                    <div class="title">Colorful Mode</div>
                    <div class="description">The color of the marks changes with each word</div>
                </div>
                <div class="control">
                    <div class="switch" id="colorful-mode" name="colorful-mode">
                        <div class="knob">&nbsp;</div>
                    </div>
                </div>
            </div>

            <div class="setting vertical">
                <div class="Text">
                    <div class="title">Word Set</div>
                    <div class="description">Choose your favorite or let the game pick a random</div>
                    <div class="description small">[This option will apply until a new grid is generated]</div>
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

            <div class="setting">
                <div class="Text">
                    <div class="title">Force New Game</div>
                    <div class="description">Discards current game and apply settings to a new one</div>
                </div>
                <div class="control">
                    <div class="switch" id="force-new" name="force-new">
                        <div class="knob">&nbsp;</div>
                    </div>
                </div>
            </div>

        </div>`;
    msgbox('Settings', html, ['Ok'], settingsButtonListener);
    // Check for game settings values and initialize checked attribute of switch controls
    if (gGameSettings.darkTheme) document.getElementById('dark-theme').setAttribute('checked', '');
    if (gGameSettings.hardMode) document.getElementById('hard-mode').setAttribute('checked', '');
    if (gGameSettings.colorfulMode) document.getElementById('colorful-mode').setAttribute('checked', '');
    // Check for actual image set value and initialize its option selected attribute
    if (gGameSettings.setName) document.querySelector(`option[value="${gGameSettings.setName}"]`).setAttribute('selected', '');
    // Event listener for changes in the settings controls
    document.getElementById('settings-container').addEventListener('click', (e) => {
        let target = e.target;
        let name = target.getAttribute('name');

        // Dark Theme (check type control)
        if (name == 'dark-theme') {
            // Inverts checked state and update game setting
            let checked = (target.getAttribute('checked') == null);
            gGameSettings.darkTheme = checked;
            // Apply setting on game and update the input checked state
            if (checked) {
                document.body.classList.add('dark-theme');
                target.setAttribute('checked', '');
            } else {
                document.body.classList.remove('dark-theme');
                target.removeAttribute('checked');
            }
        }

        // Hard Mode (check type control)
        if (name == 'hard-mode') {
            // Inverts checked state and update game setting
            let checked = (target.getAttribute('checked') == null);
            gGameSettings.hardMode = checked;
            // Apply setting on game and update the input checked state
            if (checked) {
                document.getElementById('list-container').classList.add('hide');
                target.setAttribute('checked', '');
            } else {
                document.getElementById('list-container').classList.remove('hide');
                target.removeAttribute('checked');
            }
        }

        // Colorful Mode (check type control)
        if (name == 'colorful-mode') {
            // Inverts checked state and update game setting
            let checked = (target.getAttribute('checked') == null);
            gGameSettings.colorfulMode = checked;
            // Apply setting on game and update the input checked state
            if (checked) {
                target.setAttribute('checked', '');
            } else {
                target.removeAttribute('checked');
            }
        }

        // Set (select control)
        if (name == 'set') {
            gGameSettings.setName = target.value;
        }

        // Forde New Game (check type control)
        if (name == 'force-new') {
            // Inverts checked state and update game setting
            let checked = (target.getAttribute('checked') == null);
            gForceNewGame = checked;
            // Apply setting on game and update the input checked state
            if (checked) {
                target.setAttribute('checked', '');
            } else {
                target.removeAttribute('checked');
            }
        }

        // Store configuration in local storage
        setGameSettings();
    });
}

function settingsButtonListener(e) {
    msgboxClose();
    if (e.target.innerText === 'OK') {
        if (gForceNewGame) {
            gGameState.status = '';
            setGameState();
            initGame();
        }
    }

}

// Nav bar initialization
document.getElementById('btn-info').addEventListener('click', showAbout);
document.getElementById('btn-help').addEventListener('click', showHelp);
document.getElementById('btn-stats').addEventListener('click', () => { msgbox('Statistics', 'Work in progress...'); });
document.getElementById('btn-setup').addEventListener('click', showSettings);

// RUN THE GAME
initGame();

// End of code.