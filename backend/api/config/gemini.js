// backend/api/config/gemini.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '../.env' }); // Adjust path as necessary

let genAI;
let model;

try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
        console.warn('⚠️ Gemini AI API Key not found. AI features will be unavailable.');
        genAI = null;
        model = null;
    } else {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: "gemini-pro" });
        console.log('✅ Gemini AI initialized successfully.');
    }
} catch (error) {
    console.error('❌ Gemini AI initialization failed:', error);
    genAI = null;
    model = null;
}


module.exports = {
    genAI,
    model,
};