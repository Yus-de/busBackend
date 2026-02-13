const logger = (req, res, next) => {
    const { method, url, body, query, headers } = req;
    const startTime = Date.now();

    // Helper to redact sensitive fields
    const redact = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        if (Array.isArray(obj)) return obj.map(redact);

        const redacted = { ...obj };
        const sensitiveFields = [
            'password',
            'oldpassword',
            'newpassword',
            'confirmpassword',
            'token',
            'accesstoken',
            'refreshtoken',
            'authorization',
            'cookie',
            'x-auth-token'
        ];

        for (const key in redacted) {
            if (sensitiveFields.includes(key.toLowerCase())) {
                redacted[key] = '***REDACTED***';
            } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
                redacted[key] = redact(redacted[key]);
            }
        }
        return redacted;
    };

    // Log request
    console.log(`\n[${new Date().toISOString()}] REQUEST: ${method} ${url}`);
    if (Object.keys(query).length > 0) {
        console.log(`Query Params: ${JSON.stringify(redact(query), null, 2)}`);
    }
    if (Object.keys(body).length > 0) {
        console.log(`Request Body: ${JSON.stringify(redact(body), null, 2)}`);
    }

    // Intercept response body
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] RESPONSE: ${method} ${url} ${res.statusCode} (${duration}ms)`);

        if (data) {
            try {
                const parsedData = JSON.parse(data);
                console.log(`Response Body: ${JSON.stringify(redact(parsedData), null, 2)}`);
            } catch (e) {
                // Not JSON or already a string/buffer
                // Only log if it's a string and looks like JSON, otherwise skip to avoid flooding
                if (typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))) {
                    try {
                        const reparsed = JSON.parse(data);
                        console.log(`Response Body: ${JSON.stringify(redact(reparsed), null, 2)}`);
                    } catch (err) { }
                }
            }
        }

        return originalSend.apply(this, arguments);
    };

    next();
};

module.exports = logger;
