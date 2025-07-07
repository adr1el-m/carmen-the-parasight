// Emergency Auth Popup Closer
// Run this in your browser console to immediately close any lingering Firebase auth popups

(function() {
    console.log('🚨 Emergency Auth Popup Closer - Running...');
    
    let closedCount = 0;
    
    // Method 1: Close window.authPopup
    if (typeof window.authPopup !== 'undefined' && window.authPopup && !window.authPopup.closed) {
        console.log('✅ Closing window.authPopup');
        window.authPopup.close();
        window.authPopup = null;
        closedCount++;
    }
    
    // Method 2: Check common popup variable names
    const popupVars = ['authPopup', 'googleAuthPopup', 'firebasePopup', '_popupWindow', 'popupWindow'];
    popupVars.forEach(varName => {
        if (window[varName] && typeof window[varName].close === 'function' && !window[varName].closed) {
            console.log(`✅ Closing ${varName}`);
            window[varName].close();
            window[varName] = null;
            closedCount++;
        }
    });
    
    // Method 3: If this window itself is a popup, close it
    if (window.opener) {
        console.log('✅ This window appears to be a popup, closing it');
        window.close();
        return;
    }
    
    // Method 4: Send message to close popups
    try {
        window.postMessage({ type: 'CLOSE_AUTH_POPUP' }, window.location.origin);
        console.log('✅ Sent close popup message');
    } catch (e) {
        console.log('⚠️ Could not send close popup message:', e.message);
    }
    
    // Method 5: Clear auth processing flags
    if (window.isProcessingGoogleAuth) {
        window.isProcessingGoogleAuth = false;
        console.log('✅ Cleared auth processing flag');
    }
    
    console.log(`🎉 Emergency popup closer completed! Closed ${closedCount} popup(s).`);
    
    if (closedCount === 0) {
        console.log('ℹ️ No open auth popups found. If you still see a popup, try closing it manually.');
    }
})(); 