const api = require('../util/api');
const mqtt = require('../util/mqtt');
const config = require('../config');
const localStorage = new (require('electron-store'))();
const { ipcMain, ipcRenderer, remote } = require('electron');

module.exports = {
    listen() {
        // Context: ipcRenderer
        // Load Pushy package remotely in ipcMain process
        if (!this.loaded) {
            this.loaded = true;
            remote.require('pushy-electron');
        }

        // Send '_ipcMain.listen' command
        ipcRenderer.send('_ipcMain.listen');
    },

    setNotificationListener(listener) {
        // Context: ipcRenderer
        // Listen for '_pushyNotification' event from IPC main
        ipcRenderer.on('_pushyNotification', (event, message) => {
            // Invoke user listener
            listener(message);
        })
    },

    async register(options) {
        // Context: ipcRenderer
        // Make sure options is an object
        if (!options || typeof options !== 'object') {
            options = {};
        }

        // No App ID passed in via options?
        if (!options.appId) {
            throw new Error('Please provide your Pushy App ID as per the documentation.');
        }

        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);
        let tokenAppId = localStorage.get(config.storageKeys.tokenAppId);

        // Check for new app ID different than the one we registered with
        if (token && tokenAppId && options.appId && typeof tokenAppId === 'string' && tokenAppId !== options.appId) {
            token = undefined;
        }

        // Already registered?
        if (token && tokenAuth) {
            try {
                // Validate device credentials
                await this.validateDeviceCredentials();

                // Attempt to listen
                this.listen();

                // Device is valid
                return token;
            }
            catch (e) {
                // Ignore error and register new device
            }
        }

        // Registration post data
        let postData = {
            sdk: config.version,
            appId: options.appId,
            platform: config.platform
        };

        // API response
        let response;

        try {
            // Register the device
            response = await api.post('/register', postData);
        }
        catch (e) {
            // Registration failed
            throw new Error(`The API request failed: ${e.message}`, e);
        }

        // Validate response
        if (!response.token || !response.auth) {
            throw new Error('An unexpected response was received from the Pushy API.');
        }

        // Save device token and auth in local storage
        localStorage.set(config.storageKeys.token, response.token);
        localStorage.set(config.storageKeys.tokenAuth, response.auth);
        localStorage.set(config.storageKeys.tokenAppId, options.appId);

        // Disconnect any existing connection
        this.disconnect();
        
        // Start listening for notifications
        this.listen();

        // Provide app with device token
        return response.token;
    },

    isRegistered() {
        // Context: ipcRenderer
        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);

        // Both values must exist
        return token && tokenAuth;
    },

    async subscribe(topics) {
        // Context: ipcRenderer
        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);

        // Not registered yet?
        if (!token || !tokenAuth) {
            throw new Error('This device is not registered to receive push notifications.');
        }

        // Convert single topic to array
        if (typeof topics === 'string') {
            topics = [topics];
        }

        // Post data
        let postData = { token: token, auth: tokenAuth, topics: topics };

        // API response
        let response;

        try {
            // Subscribe to topic(s)
            response = await api.post('/devices/subscribe', postData);
        }
        catch (e) {
            // Request failed
            throw new Error(`The API request failed: ${e.message}`, e);
        }

        // Validate response
        if (!response.success) {
            throw new Error('An unexpected response was received from the Pushy API.');
        }
    },

    async unsubscribe(topics) {
        // Context: ipcRenderer
        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);

        // Not registered yet?
        if (!token || !tokenAuth) {
            throw new Error('This device is not registered to receive push notifications.');
        }

        // Convert single topic to array
        if (typeof topics === 'string') {
            topics = [topics];
        }

        // Post data
        let postData = { token: token, auth: tokenAuth, topics: topics };

        // API response
        let response;

        try {
            // Unsubscribe from topic(s)
            response = await api.post('/devices/unsubscribe', postData);
        }
        catch (e) {
            // Request failed
            throw new Error(`The API request failed: ${e.message}`, e);
        }

        // Validate response
        if (!response.success) {
            throw new Error('An unexpected response was received from the Pushy API.');
        }
    },

    async validateDeviceCredentials() {
        // Context: ipcRenderer
        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);

        // Not registered yet?
        if (!token || !tokenAuth) {
            throw new Error('The device is not registered to receive push notifications.');
        }

        // Registration post data
        let postData = { sdk: config.version, token: token, auth: tokenAuth };

        // API response
        let response;

        try {
            // Authenticate the device
            response = await api.post('/devices/auth', postData);
        }
        catch (e) {
            // Request failed
            throw new Error(`The API request failed: ${e.message}`, e);
        }

        // Validate response
        if (!response.success) {
            throw new Error('An unexpected response was received from the Pushy API.');
        }
    },

    isEnterpriseConfigured() {
        // Check whether the key is set
        return localStorage.get(config.storageKeys.enterpriseEndpoint) != undefined;
    },

    setEnterpriseConfig(endpoint, mqttEndpoint) {
        // Clear requested?
        if (!endpoint || !mqttEndpoint) {
            // Clear saved credentials and config
            localStorage.delete(config.storageKeys.token);
            localStorage.delete(config.storageKeys.tokenAuth);
            localStorage.delete(config.storageKeys.tokenAppId);
            localStorage.delete(config.storageKeys.enterpriseEndpoint);
            localStorage.delete(config.storageKeys.enterpriseMqttEndpoint);
            
            // Disconnect any existing connection
            this.disconnect();

            return;
        }

        // Strip trailing slash from API endpoint
        if (endpoint.substr(-1) === '/') 
            endpoint = endpoint.substr(0, endpoint.length - 1);

        // Strip trailing slash from mqtt endpoint
        if (mqttEndpoint.substr(-1) === '/') 
            mqttEndpoint = mqttEndpoint.substr(0, mqttEndpoint.length - 1);

        // Retrieve previous endpoint (may be null)
        let previousEndpoint = localStorage.get(config.storageKeys.enterpriseEndpoint);
        let previousMqttEndpoint = localStorage.get(config.storageKeys.enterpriseMqttEndpoint);

        // Endpoint changed?
        if (endpoint != previousEndpoint || mqttEndpoint != previousMqttEndpoint) {
            // Clear existing registration
            localStorage.delete(config.storageKeys.token);
            localStorage.delete(config.storageKeys.tokenAuth);
            localStorage.delete(config.storageKeys.tokenAppId);

            // Save updated Pushy Enterprise hostnames in local storage
            localStorage.set(config.storageKeys.enterpriseEndpoint, endpoint);
            localStorage.set(config.storageKeys.enterpriseMqttEndpoint, mqttEndpoint);
        }
    },

    disconnect() {
        // Context: ipcRenderer
        // Send '_ipcMain.disconnect' command
        ipcRenderer.send('_ipcMain.disconnect');
    },

    setup() {
        // Context: ipcMain
        // Listen for "_ipcMain.listen" event
        ipcMain.on('_ipcMain.listen', (event) => {
            // Store event sender (ipcRenderer) for sending messages back
            this.ipcRenderer = event.sender;

            // Attempt to connect to Pushy
            mqtt.connect(this);
        });

        // Listen for "_ipcMain.disconnect" event
        ipcMain.on('_ipcMain.disconnect', (event) => {
            // Attempt to disconnect from Pushy
            mqtt.disconnect(this);
        });
    }
}

// Check if running in ipcMain
if (ipcMain) {
    // Run ipcMain setup method
    module.exports.setup();
}