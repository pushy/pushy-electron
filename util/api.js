const config = require('../config');
const localStorage = new (require('electron-store'))();

module.exports = {
    async get(path, options) {
        // Nothing special to do here, simply send the request
        return await this.execute(path, options || {});
    },

    async post(path, json, options) {
        // Default request options
        options = options || {};

        // Set POST request options
        options.method = 'POST';
        options.body = JSON.stringify(json);

        // We're sending JSON
        options.headers = {
            'Content-Type': 'application/json'
        };

        // Execute the request
        return await this.execute(path, options);
    },

    async execute(path, options) {
        // Build full URL to API endpoint
        var url = this.getApiHost() + path;

        // Execute HTTP request
        let response = await fetch(url, options);

        // Invalid status code?
        if (response.status < 200 || response.status > 299) {
            // Convert response to JSON
            let json = await response.json();

            // Build error message
            let error = json.error || 'An unknown error occurred';

            // Throw detailed error
            throw { status: response.status, message: error };
        }

        // Convert response to JSON
        return await response.json();
    },

    getApiHost() {
        // Development API endpoint for localhost
        // return config.api.devEndpoint;
        
        // Attempt to fetch Pushy Enterprise hostname (may be null)
        let enterpriseEndpoint = localStorage.get(config.storageKeys.enterpriseEndpoint);

        // Pushy Enterprise endpoint or fallback to Pushy Pro API endpoint
        return enterpriseEndpoint || config.api.endpoint;
    }
}
