module.exports = {
    // Pushy Electron SDK version code
    version: 1000,
    // SDK platform code
    platform: 'electron',
    // API production and development endpoints
    api: {
        endpoint: 'https://api.pushy.me',
        devEndpoint: 'http://localhost:3001'
    },
    // MQTT endpoint
    mqtt: {
        endpoint: 'mqtts://mqtt-{timestamp}.pushy.io:443'
    },
    // Local storage preference keys
    storageKeys: {
        token: 'pushyToken',
        tokenAuth: 'pushyTokenAuth',
        tokenAppId: 'pushyTokenAppId',
        enterpriseEndpoint: 'pushyEnterpriseEndpoint',
        enterpriseMqttEndpoint: 'pushyEnterpriseMqttEndpoint'
    }
};