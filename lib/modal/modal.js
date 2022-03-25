//
// CODE FOR MODAL DIALOGS
//

const MODAL_TRANSITIONS_DELAY = 500;
const MODAL_PATH = './lib/modal/';

/**
 * Displays a message in a modal dialog box, waits for the user to click a button, and send the click event to the callback function to process the user choice.
 *
 * Must call msgboxClose function in the callback to close the dialog box.
 *
 * @param {string} title String to display as a window title.
 * @param {string} msg String with the main message or HTML code.
 * @param {array} buttons String or array of strings with the label(s) of the button(s) to display. default: only an Ok button will be displayed.
 * @param {function} callback A callback function to process the button click event. If omitted, only the msgboxClose function will be called.
 */
function msgbox(title, text, buttons = 'Ok', callback = msgboxClose) {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    const msgboxTitleClose = document.getElementById('msgbox-title-close');
    const msgboxTitle = document.getElementById('msgbox-title');
    const msgboxText = document.getElementById('msgbox-text');
    const msgboxButtons = document.getElementById('msgbox-buttons');
    // Close dialog handlers
    document.addEventListener('keyup', document.keyupfn = function (e) { if (e.code == 'Escape') msgboxClose() });
    msgboxTitleClose.addEventListener('click', msgboxClose);
    // Displat texts in title and message
    msgboxTitle.textContent = title;
    msgboxText.innerHTML = text;
    // Force the parameter for button(s) to an array
    if (!Array.isArray(buttons)) {
        buttons = [buttons];
    }
    // Empty the button(s) container tag and...
    msgboxButtons.innerHTML = '';
    // ...fill it again with all the new buttons
    buttons.forEach(element => {
        let button = document.createElement('button');
        button.innerText = element;
        button.addEventListener('click', callback);
        msgboxButtons.appendChild(button);
    });
    // Add a blur effect on backstage area(s) with blurable class
    let blurables = Array.from(document.getElementsByClassName('blurable'));
    blurables.forEach(blurable => { blurable.classList.add('blur'); });
    // Un-hide modal screen and box
    modalScreen.classList.remove('hide');
    msgbox.classList.remove('hide');
    // Use a timeout to let the un-hide be processed before show transition
    setTimeout(() => {
        modalScreen.classList.add('show');
        msgbox.classList.add('show');
    }, 0);
}

/**
 * Close the msgbox dialog and restore the modal screen state
 */
function msgboxClose() {
    const modalScreen = document.getElementById('modal-screen');
    const msgbox = document.getElementById('msgbox');
    document.removeEventListener('keyup', document.keyupfn);
    // Remove the blur effect on backstage area(s)
    let blurables = Array.from(document.getElementsByClassName('blurable'));
    blurables.forEach(blurable => { blurable.classList.remove('blur'); });
    // Hide modal screen and box
    msgbox.classList.remove('show');
    modalScreen.classList.remove('show');
    // Use a timeout to let the un-show transitions take place
    setTimeout(() => {
        modalScreen.classList.add('hide');
        msgbox.classList.add('hide');
    }, MODAL_TRANSITIONS_DELAY);
}

/**
 * Import a CSS stylesheet usig a head link tag element
 * @param {*} href The URL path to the CSS file to import. Defaults to modal.css styles file.
 */
function importCSS(href = MODAL_PATH + 'modal.css') {
    link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = href;
    document.head.appendChild(link);
}

/**
 * Inserts HTML code to the end of the document body
 * @param {*} url The URL path to the HTML file to insert. Defaults to modal.html layout file.
 */
function insertHTML(url = MODAL_PATH + 'modal.html') {
    fetch(url).then(response => {
        return response.text();
    }).then(html => {
        document.body.insertAdjacentHTML('beforeend', html);
    });
}

// INITIALIZATION

// Imports the modal.css styles file
importCSS();
// Inserts the modal.html layout file
insertHTML();

// End of code.