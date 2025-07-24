const applyHttpsRedirect = (app) => {
    if (process.env.NODE_ENV === 'production') {
        app.use((req, res, next) => {
            if (req.header('x-forwarded-proto') !== 'https') {
                console.log(`Redirecting to HTTPS: ${req.header('host')}${req.url}`);
                res.redirect(`https://${req.header('host')}${req.url}`);
            } else {
                next(); // Already on HTTPS, proceed
            }
        });
        console.log('✅ HTTPS redirect middleware enabled for production.');
    } else {
        console.log('ℹ️ HTTPS redirect middleware disabled in non-production environment.');
    }
};

module.exports = { applyHttpsRedirect };