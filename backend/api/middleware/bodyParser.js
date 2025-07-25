const express = require('express');

const applyBodyParser = (app) => {
    app.use(express.json({
        limit: '10mb', 
        strict: true 
    }));
    app.use(express.urlencoded({
        extended: true, 
        limit: '10mb' 
    }));
};

module.exports = { applyBodyParser };