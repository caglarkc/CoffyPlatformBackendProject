const errorMessages = require('../config/errorMessages');
const ValidationError = require('../utils/errors/ValidationError');
const ConflictError = require('../utils/errors/ConflictError');
const validator = require('validator');
const dotenv = require('dotenv');
dotenv.config();


const validateName = (name) => {
    if (!name) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME);
    }
    if (name.length < 3 || name.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(name)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME_FORMAT);
    }
};

const validateSurname = (surname) => {
    if (!surname) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME);
    }
    if (surname.length < 3 || surname.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(surname)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME_FORMAT);
    }
};

const validatePhone = (phone) => {
    if (!phone) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE);
    }
    if (phone.length !== 10) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE_LENGTH);
    }
    if (!/^[0-9]+$/.test(phone)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE_NUMBER);
    }
    if (phone === process.env.CREATER_PHONE) {
        throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
    }
};

const validateEmail = (email) => {
    if (!email) {
        throw new ValidationError(errorMessages.INVALID.INVALID_EMAIL);
    }
    if (!validator.isEmail(email)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_EMAIL_FORMAT);
    }
    if (email === process.env.CREATER_EMAIL) {
        throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
    }
};

const validatePassword = (password) => {
    if (!password) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD);
    }
    if (password.length < 8 || password.length > 20) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_LENGTH);
    }
    if (!/[A-Z]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_UPPERCASE);
    }
    
    if (!/[a-z]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_LOWERCASE);
    }
    
    if (!/[0-9]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_NUMBER);
    }
};

const validateRole = (role) => {
    const validRoles = ['0', '1', '2', '3', '4', '5'];
    if (!role) {
        throw new ValidationError(errorMessages.INVALID.INVALID_ROLE);
    }

    if (!validRoles.includes(role)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_ROLE_VALUE);
    }
};


const validateStoreName = (name) => {
    if (!name) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME);
    }
    if (name.length < 3 || name.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME_LENGTH);
    }
}

const validateStoreId = (storeId) => {
    if (!storeId) {
        throw new ValidationError(errorMessages.INVALID.INVALID_STORE_ID);
    }
    if (storeId.length > 4) {
        throw new ValidationError(errorMessages.INVALID.INVALID_STORE_ID_LENGTH);
    }
    if (!/^[0-9]+$/.test(storeId)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_STORE_ID_FORMAT);
    }
};

const validateLocation = (locationData) => {
    if (!locationData) {
        throw new ValidationError(errorMessages.INVALID.INVALID_LOCATION);
    }
    if (locationData.length < 3 || locationData.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_LOCATION_LENGTH);
    }
};

module.exports = {
    validateName,
    validateStoreId,
    validateLocation,
    validatePassword,
    validateEmail,
    validatePhone,
    validateStoreName,
    validateSurname,
    validateRole
};