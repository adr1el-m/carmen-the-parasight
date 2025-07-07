// Auto-fill hidden fields based on form data
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    
    if (!form) return; // Exit if form doesn't exist
    
    // Auto-fill hidden fields when form is submitted
    form.addEventListener('submit', function(e) {
        // Extract first name from email if available
        const email = emailInput.value;
        const emailUsername = email.split('@')[0];
        
        // Try to extract name parts from email username
        const nameParts = emailUsername.split(/[._-]/);
        const firstName = nameParts[0] || '';
        const lastName = nameParts[1] || '';
        
        // Fill hidden fields
        const firstNameField = document.getElementById('firstName');
        const lastNameField = document.getElementById('lastName');
        const confirmPasswordField = document.getElementById('confirmPassword');
        const addressField = document.getElementById('address');
        
        if (firstNameField) firstNameField.value = firstName;
        if (lastNameField) lastNameField.value = lastName;
        if (confirmPasswordField) confirmPasswordField.value = passwordInput.value;
        if (addressField) addressField.value = ''; // Will be filled later in profile
    });
}); 