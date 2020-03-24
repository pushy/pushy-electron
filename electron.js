const { app, BrowserWindow, dialog } = require('electron');

// Replace '../lib/Pushy' with 'pushy-electron' if using this code in your own project
const Pushy = require('./lib/Pushy');

function createWindow() {
    // Create a test browser window
    let win = new BrowserWindow({
        width: 800,
        height: 600
    });

    // On window load listener
    win.webContents.on('did-finish-load', () => {
        // Listen for notifications
        Pushy.listen();

        // Register device for push notifications
        Pushy.register({ appId: '550ee57c5b5d72117f51e801' }).then(function (deviceToken) {
            // Display an alert with the Pushy device token
            dialog.showMessageBox(win, { message: 'Pushy device token: ' + deviceToken });
        }).catch(function (err) {
            // Display error dialog
            dialog.showMessageBox(win, { message: 'Pushy Error: ' + err.message });
        });

        // Listen for incoming notifications
        Pushy.setNotificationListener((data) => {
            // Display an alert with the "message" payload value
            dialog.showMessageBox(win, { message: 'Received notification: ' + data.message });
        });
    });

    // Load the index.html of the app
    win.loadFile('test/index.html');
}

// Listen for ready event
app.on('ready', createWindow);
