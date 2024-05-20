const path = require('path');
const packpath = require('packpath');
const Store = require('electron-store');

// Cached electron-store object
let localStorage;

// Expose getter & setter methods
module.exports = {
    get(key) {
        return getLocalStorage().get(key);
    },
    set(key, value) {
        return getLocalStorage().set(key, value);
    },
    delete(key) {
        return getLocalStorage().delete(key);
    }
};

function getLocalStorage() {
    // Already cached?
    if (localStorage) {
        return localStorage;
    }

    // Default electron-store options
    const options = {};

    try {
        // Get Node.js package name from package.json
        const packageJson = require(path.join(packpath.parent(), 'package.json'));

        // Use name specified in package.json for electron-store config file name
        if (packageJson && packageJson.name) {
            options.name = packageJson.name;
        }
    }
    catch (exc) {
        // Ignore errors if unable to find package.json
        // Defaults to 'config.json'
    }

    // Cache electron-store object for subsequent calls
    localStorage = new Store(options);

    // All done
    return localStorage;
};