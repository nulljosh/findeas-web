const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            error: 'Validation failed', 
            details: errors.array() 
        });
    }
    next();
};

const sanitizeString = (value) => {
    if (typeof value !== 'string') {
        throw new Error('Must be a string');
    }
    return value.trim();
};

const validateUser = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Username can only contain letters, numbers, hyphens and underscores')
        .customSanitizer(sanitizeString),
    body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be 8-128 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
        .customSanitizer(sanitizeString),
    handleValidationErrors
];

const validatePost = [
    body('content')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Content must be 10-5000 characters')
        .customSanitizer(sanitizeString),
    body('title')
        .isLength({ min: 5, max: 200 })
        .withMessage('Title must be 5-200 characters')
        .customSanitizer(sanitizeString),
    body('category')
        .optional()
        .isIn(['tech', 'business', 'social', 'entertainment', 'other'])
        .withMessage('Invalid category'),
    handleValidationErrors
];

const validateLogin = [
    body('username')
        .isLength({ min: 1 })
        .withMessage('Username is required')
        .customSanitizer(sanitizeString),
    body('password')
        .isLength({ min: 1 })
        .withMessage('Password is required')
        .customSanitizer(sanitizeString),
    handleValidationErrors
];

const validateObjectId = [
    param('id')
        .custom((value) => {
            if (!mongoose.Types.ObjectId.isValid(value)) {
                throw new Error('Invalid ID format');
            }
            return true;
        }),
    handleValidationErrors
];

const validateUsername = [
    param('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be 3-30 characters')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid username format')
        .customSanitizer(sanitizeString),
    handleValidationErrors
];

module.exports = {
    validateUser,
    validatePost,
    validateLogin,
    validateObjectId,
    validateUsername,
    handleValidationErrors
};