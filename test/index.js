// Replace '../lib/Pushy' with 'pushy-electron' if using this code elsewhere
const Pushy = require('../lib/Pushy');

// Listen for notifications
Pushy.listen();

// Register device for push notifications
Pushy.register({ appId: '550ee57c5b5d72117f51e801' }).then(function (deviceToken) {
    // Print device token to console
    console.log('Pushy device token: ' + deviceToken);
}).catch(function (err) {
    // Handle registration errors
    alert('Pushy Error: ' + err.message);
});

Pushy.setNotificationListener((data) => {
    // Print notification payload data
    console.log('Received notification: ' + JSON.stringify(data));

    // Display an alert with the "message" payload value
    alert('Received notification: ' + data.message);
});