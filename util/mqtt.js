const mqtt = require('mqtt');
const config = require('../config');
const localStorage = new (require('electron-store'))();

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
        const client = mqtt.connect(this.getMqttHost(), this.getMqttOptions());

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
    },

    onClose() {
        // Log to ipcMain console
        console.log(`[Pushy] Disconnected from server`);
    },

    onConnect() {
        // Log to ipcMain console
        console.log(`[Pushy] Connected successfully (device token ${localStorage.get(config.storageKeys.token)})`);
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
        this.Pushy.ipcRenderer.send('_pushyNotification', payload);
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

        // MQTT connection options
        return { keepalive: 300, username: token, password: tokenAuth, clientId: token };
    }
}
