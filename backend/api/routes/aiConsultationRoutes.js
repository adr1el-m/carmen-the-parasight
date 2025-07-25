const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticateUser, requireRole } = require('../middleware/auth');
const { strictLimiter } = require('../middleware/rateLimiters');
const { validateInput } = require('../middleware/validation');
const { model: geminiModel } = require('../config/gemini'); 
const { sanitizeString } = require('../utils/inputSanitization');
const errorSanitizer = require('../utils/errorSanitizer');

/**
 * @route POST /api/ai/consultation
 * @desc Get a preliminary AI-powered health assessment.
 * @access Private (Admin, Doctor, Nurse, Patient)
 * @middleware strictLimiter, authenticateUser, requireRole, validateInput
 */
router.post('/consultation',
    strictLimiter,
    authenticateUser,
    requireRole(['admin', 'doctor', 'nurse', 'patient']), // Allow patients to use this
    [
        body('symptoms')
            .isString()
            .isLength({ min: 10, max: 2000 }) // Increased max length for detailed symptoms
            .withMessage('Symptoms must be between 10 and 2000 characters.'),
        body('patientHistory')
            .optional()
            .isString()
            .isLength({ max: 3000 }) // Increased max length for history
            .withMessage('Patient history must be less than 3000 characters.'),
        body('urgency')
            .isIn(['Low', 'Medium', 'High', 'Critical'])
            .withMessage('Urgency must be Low, Medium, High, or Critical.')
    ],
    validateInput,
    async (req, res) => {
        try {
            const { symptoms, patientHistory, urgency } = req.body;
            const userId = req.user.uid;
            const userRole = req.user.role || req.user.custom_claims?.role;

            // Input sanitization for AI prompt
            const sanitizedSymptoms = sanitizeString(symptoms, 2000);
            const sanitizedHistory = patientHistory ? sanitizeString(patientHistory, 3000) : 'None provided.';

            if (!geminiModel) {
                return res.status(503).json({
                    error: 'AI Service Unavailable',
                    message: 'AI consultation service is currently unavailable. Please check backend configuration or consult with a healthcare provider directly.'
                });
            }

            const prompt = `
            As a preliminary medical AI assistant for LingapLink PH, provide a non-diagnostic assessment and next steps for a patient in the Philippines.
            Focus on practical advice, local context (e.g., advising to visit local health centers), and emphasize the non-diagnostic nature of the assessment.

            Patient Symptoms: ${sanitizedSymptoms}
            Patient History: ${sanitizedHistory}
            Self-Assessed Urgency Level: ${urgency}

            Please provide the following in JSON format:
            1.  \`preliminaryAssessment\` (string): A non-diagnostic summary of the potential issues based on symptoms.
            2.  \`recommendedUrgency\` (string): Your recommended urgency level (Low/Medium/High/Critical).
            3.  \`suggestedNextSteps\` (array of strings): Actionable steps the patient should take.
            4.  \`immediateMedicalAttention\` (boolean): True if immediate medical attention is strongly advised.
            5.  \`telemedicineSuitability\` (boolean): True if a telemedicine consultation is likely suitable.
            6.  \`filipinoAdvice\` (string): A short, culturally relevant piece of advice in Filipino (e.g., "Kumonsulta sa doktor para sa tamang diagnosis.").
            7.  \`disclaimer\` (string): A strong disclaimer that this is not a diagnosis.

            Ensure the JSON is perfectly parsable. Do not include any text outside the JSON block.
            `;

            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            let assessmentText = response.text();

            let assessment;
            try {
                // Attempt to parse the AI's response as JSON
                assessment = JSON.parse(assessmentText);
                // Basic validation of the AI's JSON structure
                if (!assessment.preliminaryAssessment || !assessment.recommendedUrgency || !Array.isArray(assessment.suggestedNextSteps)) {
                    throw new Error('AI response structure is invalid.');
                }
            } catch (parseError) {
                console.warn('Failed to parse AI response as JSON, falling back to structured response:', parseError.message);
                console.warn('Raw AI response (partial):', assessmentText.substring(0, 500) + '...');
                // Fallback structured response
                assessment = {
                    preliminaryAssessment: "Based on the information provided, it's essential to seek professional medical advice. The symptoms suggest a need for further evaluation by a doctor to determine the exact cause and appropriate treatment.",
                    recommendedUrgency: urgency, // Fallback to user's urgency
                    suggestedNextSteps: [
                        "Schedule an in-person or telemedicine consultation with a qualified doctor as soon as possible.",
                        "Monitor your symptoms closely for any changes or worsening.",
                        "If symptoms become severe (e.g., difficulty breathing, severe pain, loss of consciousness), seek emergency medical attention immediately.",
                        "Ensure you are well-hydrated and resting."
                    ],
                    immediateMedicalAttention: urgency === 'Critical' || urgency === 'High',
                    telemedicineSuitability: true,
                    filipinoAdvice: "Mahalaga ang konsultasyon sa doktor para sa tumpak na diagnosis at paggamot. Huwag mag-atubiling humingi ng tulong medikal.",
                    disclaimer: "This is not a medical diagnosis. The information provided is for preliminary assessment and informational purposes only and does not substitute for professional medical advice, diagnosis, or treatment. Always consult with a qualified healthcare professional."
                };
            }

            res.json({
                consultationId: `ai_consult_${Date.now()}_${userId}`,
                timestamp: new Date().toISOString(),
                userId: userId,
                userRole: userRole,
                assessment: assessment
            });
        } catch (error) {
            console.error('Error in /ai/consultation:', error);
            const sanitized = errorSanitizer.sanitizeError(error, { context: 'generate-ai-consultation' });
            res.status(500).json({
                error: 'Failed to generate AI consultation. Please try again later.',
                ...sanitized,
                details: process.env.NODE_ENV === 'development' ? error.message : undefined 
            });
        }
    }
);

module.exports = router;