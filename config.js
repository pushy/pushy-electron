module.exports = {
    // Pushy Electron SDK version code
    version: 1012,
    // SDK platform code
    platform: 'electron',
    // API production and development endpoints
    api: {
        endpoint: 'https://api.pushy.me',
        devEndpoint: 'http://localhost:3001'
    },
    // MQTT endpoint
    mqtt: {
        endpoint: 'mqtts://mqtt-{timestamp}.pushy.io:443',
        defaultKeepAlive: 300
    },
    // Local storage preference keys
    storageKeys: {
        token: 'pushyToken',
        tokenAuth: 'pushyTokenAuth',
        tokenAppId: 'pushyTokenAppId',
        keepAliveInt: 'pushyKeepAliveInt',
        enterpriseEndpoint: 'pushyEnterpriseEndpoint',
        enterpriseMqttEndpoint: 'pushyEnterpriseMqttEndpoint'
    }
};