const xss = require('xss');
const validator = require('validator');

const sanitizeString = (str, maxLength = 1000) => {
    if (!str || typeof str !== 'string') return '';
    let sanitized = str
        .replace(/[\x00-\x1F\x7F]/g, '') 
        .replace(/[<>]/g, '') 
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/data:/gi, '') 
        .replace(/vbscript:/gi, '') 
        .replace(/file:/gi, '') 
        .trim()
        .substring(0, maxLength);
    return xss(validator.escape(sanitized));
};

const sanitizeEmail = (email) => {
    if (!email || typeof email !== 'string') return '';
    const sanitized = email.trim().toLowerCase()
        .replace(/[^\w@\.\-\+]/g, '')
        .substring(0, 254);
    return validator.isEmail(sanitized) ? validator.normalizeEmail(sanitized) : '';
};

const sanitizePhone = (phone) => {
    if (!phone || typeof phone !== 'string') return '';
    const sanitized = phone.replace(/[^\d\+\-\(\)\s]/g, '').trim().substring(0, 20);
    return /^[\+]?[0-9\s\-\(\)]{7,20}$/.test(sanitized) ? sanitized : '';
};

const sanitizeNumber = (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const parsed = parseFloat(num);
    if (isNaN(parsed) || !isFinite(parsed)) return min;
    return Math.min(Math.max(parsed, min), max);
};

const sanitizeArray = (arr, maxLength = 100, itemValidator = null) => {
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, maxLength).map(item => {
        if (typeof item === 'string') {
            return sanitizeString(item, 200);
        } else if (itemValidator && typeof itemValidator === 'function') {
            return itemValidator(item);
        }
        return item;
    }).filter(item => item !== null && item !== undefined);
};

const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const sanitized = url.trim().substring(0, 2048);
    try {
        const urlObj = new URL(sanitized);
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            return validator.isURL(sanitized) ? sanitized : '';
        }
    } catch {
        return '';
    }
    return '';
};

const sanitizeFilename = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    return filename
        .replace(/[^a-zA-Z0-9\.\-\_]/g, '') // Only allow safe filename characters
        .replace(/\.{2,}/g, '.') // Prevent directory traversal
        .substring(0, 255)
        .trim();
};

module.exports = {
    sanitizeString,
    sanitizeEmail,
    sanitizePhone,
    sanitizeNumber,
    sanitizeArray,
    sanitizeUrl,
    sanitizeFilename
};