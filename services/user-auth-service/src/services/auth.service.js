const User = require('../models/user.model');
const nodemailer = require('nodemailer');
const { generateCode , hashCode , verifyHashedCode , hashPassword , verifyPassword } = require('../../../../shared/utils/helpers');
const { NOW, FORMAT_EXPIRES_AT } = require('../../../../shared/utils/constants/time');
const { validateRegister , validateSendEmailVerifyToken , validateUser, validateLoginToken } = require('../utils/validationUtils');
const { validateName , validateSurname , validatePassword , validateEmail , validatePhone } = require('../../../../shared/utils/textUtils');
const errorMessages = require('../../../../shared/config/errorMessages');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const successMessages = require('../../../../shared/config/successMessages');
const { getRedisClient } = require('../utils/database');
const { logger } = require('../../../../shared/utils/logger');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const dotenv = require('dotenv');
dotenv.config();

// Kullanıcı bilgilerini filtreleme yardımcı metodu
const _formatUserResponse = (user) => {
    return {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone
    };
};


class AuthService {

    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            secure: false,
            port: 587,
            tls: {
                rejectUnauthorized: true
            }
        });
    }

    async sendVerificationEmail(email) {
        try {
            const user = await User.findOne({ email });

            validateUser(user);

            validateSendEmailVerifyToken(user.isActive , user.verificationTokenExpiresAt);


            const verifyCode = generateCode();
            const hashedCode = hashCode(verifyCode);

            
            await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify your email",
            text: `Your verification code is: ${verifyCode}`,
            });

            // Redis'e geçici olarak yeni veriyi ve doğrulama kodunu sakla
            const redisClient = getRedisClient();
            const redisKey = `user:${user._id}:verify:email`;
            const updateData = {
                value: verifyCode,
                code: hashedCode,
                userId: user._id
            };
            
            // 5 dakika (300 saniye) sonra otomatik silinecek şekilde Redis'e kaydet
            await redisClient.setEx(redisKey, 300, JSON.stringify(updateData));

            logger.info('Verification email sent', { email });
            const message = {
                message: successMessages.AUTH.VERIFICATION_EMAIL_SENT,
                expiresAt: FORMAT_EXPIRES_AT(NOW().getTime() + (1000 * 60 * 5)) // 5 dakika
            }

            return message;
        } catch (error) {
            throw error;
        }
    }

    async verifyEmail(email , code) {
        try {
            const user = await User.findOne({ email });
            validateUser(user);

            const redisClient = getRedisClient();
            const redisKey = `user:${user._id}:verify:email`;
            const updateDataStr = await redisClient.get(redisKey);
            
            if (!updateDataStr) {
                logger.warn('Verification token expired', { email });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_TOKEN_EXPIRED);
            }

            const updateData = JSON.parse(updateDataStr);
            const isVerified = verifyHashedCode(code, updateData.code);

            if (!isVerified) {
                logger.warn('Verification token invalid', { email });
                throw new ValidationError(errorMessages.TOKEN.TOKEN_INVALID);
            }

            user.isActive = 'active';
            await user.save();
            await redisClient.del(redisKey);

            const message = {
                message: successMessages.AUTH.EMAIL_VERIFIED,
                user: _formatUserResponse(user)
            }

            logger.info('Email verified', { email });

            return message;
        } catch (error) {
            throw error;
        }
    }

    async register(userData) {
        try {
            validateRegister(userData);

            const existingEmail = await User.findOne({ email: userData.email });
            const existingPhone = await User.findOne({ phone: userData.phone });
            if (existingEmail) {
                logger.warn('Email already exists', { email: userData.email });
                throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
            }
    
            if (existingPhone) {
                logger.warn('Phone already exists', { phone: userData.phone });
                throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
            }
            
            const user = await this.createUser({ 
                name: userData.name, 
                surname: userData.surname, 
                email: userData.email, 
                phone: userData.phone, 
                password: userData.password
            });

            logger.info('User created successfully', { userId: user._id });
            
            
            return {
                message: successMessages.AUTH.USER_CREATED,
                user: _formatUserResponse(user)
            };
        } catch (error) {
            throw error;
        }
    }

    async createUser(userData) {
        try {
            
            const { name, surname, email, phone, password } = userData;
            const hashedPassword = await hashPassword(password);
            
            logger.info('Password hashed successfully');
            
            const user = new User({ 
                name, 
                surname, 
                email, 
                phone, 
                password: hashedPassword 
            });

            logger.info('User model created, saving to database...');
            await user.save();
            logger.info('User saved to database successfully');
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    async checkPhone(phone) {
        try {
            const user = await User.findOne({ phone });
            if (user) {
                logger.warn('Phone already exists', { phone });
                throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
            }
            logger.info('Phone checked', { phone });
            return {
                message: successMessages.AUTH.PHONE_CHECKED,
                isExist: false
            };
        } catch (error) {
            throw error;
        }
    }

    async checkEmail(email) {
        try {
            const user = await User.findOne({ email });
            if (user) {
                logger.warn('Email already exists', { email });
                throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
            }
            logger.info('Email checked', { email });
            return {
                message: successMessages.AUTH.EMAIL_CHECKED,
                isExist: false
            };
        } catch (error) {
            throw error;
        }
    }

    async loginWithEmailSendCode(email) {
        try {
            const user = await User.findOne({ email });
            validateUser(user);
            validateLoginToken(user.isLoggedIn, user.loginTokenExpiresAt);

            const verifyCode = generateCode();
            const hashedCode = hashCode(verifyCode);

            
            await this.transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Login Code",
            text: `Your login code is: ${verifyCode}`,
            });

            const redisClient = getRedisClient();
            const redisKey = `user:${user._id}:login:email`;
            const updateData = {
                value: verifyCode,
                code: hashedCode,
                userId: user._id
            };
            
            await redisClient.setEx(redisKey, 300, JSON.stringify(updateData));

            logger.info('Login code sent', { email });

            const message = {
                message: successMessages.AUTH.LOGIN_CODE_SENT,
                expiresAt: FORMAT_EXPIRES_AT(NOW().getTime() + (1000 * 60 * 5)) // 5 dakika
            }

            return message;

        } catch (error) {
            throw error;
        }
    }

    async loginWithEmailVerifyCode(email, code) {
        try {
            const user = await User.findOne({ email });
            validateUser(user);
            validateLoginToken(user.isLoggedIn, user.loginTokenExpiresAt);

            const redisClient = getRedisClient();
            const redisKey = `user:${user._id}:login:email`;
            const updateDataStr = await redisClient.get(redisKey);
            
            if (!updateDataStr) {
                logger.warn('Login token expired', { email });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_TOKEN_EXPIRED);
            }

            const updateData = JSON.parse(updateDataStr);
            const isVerified = verifyHashedCode(code, updateData.code);
            if (!isVerified) {
                logger.warn('Login token invalid', { email });
                throw new ValidationError(errorMessages.INVALID.INVALID_LOGIN_CODE);
            }
            
            user.isLoggedIn = true;
            user.lastLoginAt = NOW();
            await user.save();
            await redisClient.del(redisKey);

            logger.info('Login successful', { email });

            return {
                message: successMessages.AUTH.LOGIN_SUCCESS,
                user: _formatUserResponse(user)
            };

        } catch (error) {
            throw error;
        }
    }

    async loginWithEmailPassword(email, password) {
        try {
            const user = await User.findOne({ email });
            validateUser(user);
            if (user.isActive === "notVerified") {
                logger.warn('User not verified', { email });
                throw new ForbiddenError(errorMessages.FORBIDDEN.USER_NOT_VERIFIED);
            }else if (user.isActive === "blocked") {
                logger.warn('User blocked', { email });
                throw new ForbiddenError(errorMessages.FORBIDDEN.USER_BLOCKED);
            }else if (user.isActive === "deleted") {
                logger.warn('User deleted', { email });
                throw new ForbiddenError(errorMessages.FORBIDDEN.USER_DELETED);
            }


            if (user.isLoggedIn) {
                logger.warn('User already logged in', { email });
                throw new ForbiddenError(errorMessages.FORBIDDEN.USER_ALREADY_LOGGED_IN);
            }

            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                logger.warn('Password wrong', { email });
                throw new ValidationError(errorMessages.INVALID.PASSWORD_WRONG);
            }
            
            user.isLoggedIn = true;
            user.lastLoginAt = NOW();
            await user.save();

            logger.info('Login successful', { email });

            return {
                message: successMessages.AUTH.LOGIN_SUCCESS,
                user: _formatUserResponse(user)
            };

            
        } catch (error) {
            throw error;
        }
    }

    async loginWithPhonePassword(phone, password) {
        try {
            const user = await User.findOne({ phone });
            validateUser(user);

            if (user.isLoggedIn) {  
                logger.warn('User already logged in', { phone });
                throw new ForbiddenError(errorMessages.FORBIDDEN.USER_ALREADY_LOGGED_IN);
            }

            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                logger.warn('Password wrong', { phone });
                throw new ValidationError(errorMessages.INVALID.PASSWORD_WRONG);
            }
            
            user.isLoggedIn = true;
            user.lastLoginAt = NOW();
            await user.save();

            logger.info('Login successful', { phone });

            return {
                message: successMessages.AUTH.LOGIN_SUCCESS,
                user: _formatUserResponse(user)
            };

            
        } catch (error) {
            throw error;
        }
    }

    async logout(userId) {
        try {
            const user = await User.findById(userId);
            validateUser(user);

            user.isLoggedIn = false;
            await user.save();

            logger.info('Logout successful', { userId });

            return {
                message: successMessages.AUTH.LOGOUT_SUCCESS
            };
        } catch (error) {
            throw error;
        }
    }

    async updateUser(requestBody) {
        try {
            // Validate user exists
            const user = await User.findById(requestBody.userId);
            validateUser(user);
            
            // Check if all values are 'default' - no actual updates requested
            const allDefault = requestBody.password === 'default' && 
                             requestBody.name === 'default' && 
                             requestBody.surname === 'default';
            
            if (allDefault) {
                logger.warn('No information provided', { userId: requestBody.userId });
                throw new ValidationError(errorMessages.INVALID.NO_INFORMATION_PROVIDED);
            }

            // Track update status
            let isUpdated = false;
            let messageText = '';
            let fieldsChecked = 0;
            let fieldsUnchanged = 0;
            
            // Password validation and update
            if (requestBody.password && requestBody.password !== 'default') {
                fieldsChecked++;
                try {
                    validatePassword(requestBody.password);
                    const hashedPassword = await hashPassword(requestBody.password);
                    if (user.password !== hashedPassword) {
                        user.password = hashedPassword;
                        isUpdated = true;
                        messageText += successMessages.UPDATE.PASSWORD_UPDATED + ' ';
                    } else {
                        fieldsUnchanged++;
                    }
                } catch (validationError) {
                    logger.warn('Invalid password', { userId: requestBody.userId });
                    throw new ValidationError(errorMessages.INVALID.PASSWORD + ': ' + validationError.message);
                }
            }
    
            // Name validation and update
            if (requestBody.name && requestBody.name !== 'default') {
                fieldsChecked++;
                try {
                    validateName(requestBody.name);
                    if (user.name !== requestBody.name) {
                        user.name = requestBody.name;
                        isUpdated = true;
                        messageText += successMessages.UPDATE.NAME_UPDATED + ' ';
                    } else {
                        fieldsUnchanged++;
                    }
                } catch (validationError) {
                    logger.warn('Invalid name', { userId: requestBody.userId });
                    throw new ValidationError(errorMessages.INVALID.INVALID_NAME + ': ' + validationError.message);
                }
            }
    
            // Surname validation and update
            if (requestBody.surname && requestBody.surname !== 'default') {
                fieldsChecked++;
                try {
                    validateSurname(requestBody.surname);
                    if (user.surname !== requestBody.surname) {
                        user.surname = requestBody.surname;
                        isUpdated = true;
                        messageText += successMessages.UPDATE.SURNAME_UPDATED + ' ';
                    } else {
                        fieldsUnchanged++;
                    }
                } catch (validationError) {
                    logger.warn('Invalid surname', { userId: requestBody.userId });
                    throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME + ': ' + validationError.message);
                }
            }

            // Check if any fields were provided for update
            if (fieldsChecked === 0) {
                logger.warn('No information provided', { userId: requestBody.userId });
                throw new ValidationError(errorMessages.INVALID.NO_INFORMATION_PROVIDED);
            }

            // Check if all provided values are the same as current values
            if (fieldsChecked > 0 && fieldsChecked === fieldsUnchanged) {
                logger.warn('All values are the same', { userId: requestBody.userId });
                throw new ValidationError(errorMessages.INVALID.ALL_VALUES_SAME);
            }
    
            // Save changes if any updates were made
            if (isUpdated) {
                await user.save();
                const updatedUser = await User.findById(requestBody.userId);
                logger.info('User updated', { userId: requestBody.userId });
                return {
                    message: messageText.trim(),
                    user: _formatUserResponse(updatedUser),
                    success: true
                };
            } else {
                // This should not happen with the above checks, but keeping as a fallback
                logger.warn('No updates made', { userId: requestBody.userId });
                return {
                    message: errorMessages.INVALID.NO_UPDATE,
                    user: _formatUserResponse(user),
                    success: false
                };
            }
        } catch (error) {
            // Enhance error with more context if needed
            if (error instanceof ValidationError || 
                error instanceof ConflictError || 
                error instanceof ForbiddenError) {
                throw error;
            } else {
                // For unexpected errors, provide a generic message but log the actual error
                logger.error('Error in updateUser:', error);
                throw new Error(errorMessages.INTERNAL.SERVER_ERROR);
            }
        }
    }

    async updateUserUniqueRequest(userId, data, type) {
        try {
            const user = await User.findById(userId);
            validateUser(user);

            if (type === 'email') {
                validateEmail(data);

                const existingUser = await User.findOne({ email: data });
                if (existingUser && existingUser._id.toString() !== userId) {
                    logger.warn('Email already exists', { email: data });
                    throw new ConflictError(errorMessages.CONFLICT.USER_ALREADY_EXISTS);
                }
            }
            if (type === 'phone') {
                validatePhone(data);

                const existingUser = await User.findOne({ phone: data });
                if (existingUser && existingUser._id.toString() !== userId) {
                    logger.warn('Phone already exists', { phone: data });
                    throw new ConflictError(errorMessages.CONFLICT.USER_ALREADY_EXISTS);
                }
            }
    
            // Doğrulama kodu oluştur ve gönder
            const verifyCode = generateCode();
            const hashedCode = hashCode(verifyCode);
    
            // Email gönder
            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: "Değişikliği Doğrulama",
                text: `Değişikliği doğrulama kodunuz: ${verifyCode}`,
            });
    
            // Redis'e geçici olarak yeni veriyi ve doğrulama kodunu sakla
            const redisClient = getRedisClient();
            const redisKey = `user:${userId}:update:${type}`;
            const updateData = {
                value: data,
                code: hashedCode,
                userId: userId
            };
            
            // 5 dakika (300 saniye) sonra otomatik silinecek şekilde Redis'e kaydet
            await redisClient.setEx(redisKey, 300, JSON.stringify(updateData));
            
            // Kullanıcıya güncelleme isteği yapıldığını bildir
            logger.info('Update request sent', { userId: userId });
            return {
                message: successMessages.AUTH.VERIFICATION_EMAIL_SENT,
                expiresAt: FORMAT_EXPIRES_AT(NOW().getTime() + (1000 * 60 * 5)) // 5 dakika
            };
    
        } catch (error) {
            throw error;
        }
    }

    async verifyUpdateRequest(userId, code, type) {
        try {
            const user = await User.findById(userId);
            validateUser(user);


            const redisClient = getRedisClient();
            const redisKey = `user:${userId}:update:${type}`;
            // Redis'ten güncelleme verilerini al
            const updateDataStr = await redisClient.get(redisKey);
            
            if (!updateDataStr) {
                logger.warn('Verification token expired', { userId: userId });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_TOKEN_EXPIRED);
            }
            
            const updateData = JSON.parse(updateDataStr);
            
            // Doğrulama kodunu kontrol et
            const isCodeValid = verifyHashedCode(code, updateData.code);
            
            if (!isCodeValid) {
                logger.warn('Verification code invalid', { userId: userId });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_CODE);
            }
            
            // Kullanıcı bilgilerini güncelle
            if (type === 'email') {
                user.email = updateData.value;
            } else if (type === 'phone') {
                user.phone = updateData.value;
            }
            
            await user.save();
            
            // Redis'ten geçici veriyi sil
            await redisClient.del(redisKey);
            logger.info('Update request verified', { userId: userId });
            return {
                message: successMessages.UPDATE.USER_UPDATED,
                user: _formatUserResponse(user)
            };
            
        } catch (error) {
            throw error;
        }
    }

    async cancelUpdateRequest(userId, type) {
        try {
            const user = await User.findById(userId);
            validateUser(user);
            
            const redisClient = getRedisClient();
            const redisKey = `user:${userId}:update:${type}`;
            // Redis'ten güncelleme verilerini al
            const updateDataStr = await redisClient.get(redisKey);
            
            if (!updateDataStr) {
                logger.warn('Update request not found', { userId: userId });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_TOKEN_EXPIRED);
            }

            await redisClient.del(redisKey);
            logger.info('Update request cancelled', { userId: userId });
            return {
                message: successMessages.UPDATE.UPDATE_REQUEST_CANCELLED
            };
        } catch (error) {
            throw error;
        }
    }
    

    async getUser(userId) {
        try {
            const user = await User.findById(userId);
            validateUser(user);
            const message = {
                message: successMessages.SEARCH.USER_FOUND,
                user: _formatUserResponse(user)
            }
            logger.info('User found', { userId: userId });
            return message;
        } catch (error) {
            throw error;
        }
    }

    async initializeEventListeners() {
        try {
            const queueNamePrefix = 'user-auth-service.queue';
            
            await eventSubscriber.respondTo('user.auth.getUsers', async (payload, metadata) => {
                logger.info('Received getUsers request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const users = await User.find();
                const formattedUsers = users.map(user => _formatUserResponse(user));
                console.log(users);

                if (formattedUsers.length === 0) {
                    return {
                        success: false,
                        message: "Kullanıcı bulunamadı",
                        error: "NotFoundError",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
                return {
                    success: true,
                    message: "Kullanıcılar başarıyla alındı",
                    receivedData: payload,
                    timestamp: new Date().toISOString(),
                    users: formattedUsers
                };

            });
            
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
