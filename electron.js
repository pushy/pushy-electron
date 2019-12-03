const { app, BrowserWindow } = require('electron');

function createWindow() {
    // Create a test browser window
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // Load the index.html of the app
    win.loadFile('test/index.html');
}

// Listen for ready event
app.on('ready', createWindow);
