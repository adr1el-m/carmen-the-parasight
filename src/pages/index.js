document.addEventListener('DOMContentLoaded', () => {
    const hospitalClinicBtn = document.getElementById('hospitalClinicBtn');
    const patientBtn = document.getElementById('patientBtn');

    if (hospitalClinicBtn) {
        hospitalClinicBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html'; // Corrected filename
        });
    }

    if (patientBtn) {
        patientBtn.addEventListener('click', () => {
            window.location.href = 'patientSign-up.html';
        });
    }
});

