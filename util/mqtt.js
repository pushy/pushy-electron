const config = require('../config');
const localStorage = require('./storage');
const mqtt = require('mqtt/lib/connect');

module.exports = {
    connect(Pushy) {
        // Device not registered yet?
        if (!Pushy.isRegistered()) {
            return;
        }

        // If client exists, don't recreate it
        // A disconnected client will reconnect automatically
        if (this.client) {
            return;
        }

        // Save for later
        this.Pushy = Pushy;

        // Create long-lived MQTT client
        const client = mqtt(this.getMqttHost(), this.getMqttOptions());

        // Listen for events
        client.on('error', this.onError.bind(this));
        client.on('close', this.onClose.bind(this));
        client.on('connect', this.onConnect.bind(this));
        client.on('message', this.onMessage.bind(this));

        // Save MQTT instance
        this.client = client;
    },

    onError(err) {
        // Log to ipcMain console
        console.log('[Pushy] MQTT Error\n', err);

        // Invoke connectivity listener (in renderer process)
        this.Pushy.onConnectivityChanged((this.client ? this.client.connected : false), err);
    },

    onClose() {
        // Log to ipcMain console
        console.log(`[Pushy] Disconnected from server`);

        // Invoke connectivity listener (in renderer process)
        this.Pushy.onConnectivityChanged((this.client ? this.client.connected : false));
    },

    onConnect() {
        // Log to ipcMain console
        console.log(`[Pushy] Connected successfully (device token ${localStorage.get(config.storageKeys.token)})`);

        // Invoke connectivity listener (in renderer process)
        this.Pushy.onConnectivityChanged((this.client ? this.client.connected : false));
    },

    onMessage(topic, message) {
        // Get stringified JSON payload
        let payload = message.toString();

        // Log to ipcMain console
        console.log(`[Pushy] Received notification: ${payload}`);
        
        try {
            // Attempt to parse into JSON
            payload = JSON.parse(payload);
        }
        catch (err) {
            // Log failure
            console.log('[Pushy] MQTT JSON Parse Error\n', err);
            return;
        }

        // Invoke notification listener (in renderer process)
        this.Pushy.onNotification(payload);
    },

    getMqttHost() {
        // Attempt to fetch Pushy Enterprise hostname (fall back to Pushy Pro endpoint)
        let endpoint = localStorage.get(config.storageKeys.enterpriseMqttEndpoint) || config.mqtt.endpoint;

        // Get current unix timestamp (for ts injection)
        const unix = Math.round(new Date().getTime() / 1000);

        // Inject unix timestamp into hostname (if placeholder present)
        return endpoint.replace('{timestamp}', unix);
    },

    disconnect(Pushy) {
        // No need to disconnect if client doesn't exist yet
        if (!this.client) {
            return;
        }

        // Attempt to end connection
        this.client.end();

        // Clear client reference
        this.client = undefined;

        // Try to reconnect if registered
        this.connect(Pushy);
    },

    getMqttOptions() {
        // Attempt to fetch existing token and auth
        let token = localStorage.get(config.storageKeys.token);
        let tokenAuth = localStorage.get(config.storageKeys.tokenAuth);
        
        // Fetch keepalive interval (seconds) or default to 300
        let keepAlive = localStorage.get(config.storageKeys.keepAliveInt) || config.mqtt.defaultKeepAlive;

        // MQTT connection options
        let options = { keepalive: keepAlive, username: token, password: tokenAuth, clientId: token };

        // mTLS support
        let mTLS = this.Pushy.mTLSConfig;
        
        // mTLS support
        if (mTLS) {
            options.ca = mTLS.ca;
            options.key = mTLS.key;
            options.cert = mTLS.cert;
        }

        // Return options
        return options;
    }
}
