const AuthService = require('../services/auth.service');
const { logger } = require('../../../../shared/utils/logger');

class AuthController {

    constructor() {
        this.authService = AuthService;
    }
    
    async checkPhone(req, res, next) {
        const { phone } = req.query;
        const message = await this.authService.checkPhone(phone);
        return res.status(200).json(message);
    }

    async checkEmail(req, res, next) {
        const { email } = req.query;
        const message = await this.authService.checkEmail(email);
        return res.status(200).json(message);
    }

    async register(req, res, next) {
        try {
            logger.info('Register request received', { 
                user: { 
                    email: req.body.email,
                    phone: req.body.phone,
                    name: req.body.name 
                },
                requestId: req.requestId
            });
            
            const { name, surname, email, phone, password } = req.body;
            
            const message = await this.authService.register({ name, surname, email, phone, password });
            
            logger.info('User registered successfully', { 
                userId: message.userId || 'unknown',
                email: email,
                requestId: req.requestId 
            });
            
            return res.status(201).json(message);
        } catch (error) {
            // Hatayı error middleware'e iletiyoruz
            next(error);
        }
    }

    async sendVerificationEmail(req, res, next) {
        try {
            const { email } = req.body;
            const message = await this.authService.sendVerificationEmail(email);
            return res.status(200).json(message);
            
        } catch (error) {
            // Hata mesajını controller katmanında loglamıyoruz
            next(error);
        }
    }
    
    async verifyEmail(req, res, next) {
        try {
            const { email, code } = req.body;
            const message = await this.authService.verifyEmail(email, code);
            console.log('Email verified successfully:', message);
            return res.status(200).json(message);
        } catch (error) {
            // Hata mesajını controller katmanında loglamıyoruz
            next(error);
        }
    }

    async loginWithEmailSendCode(req, res, next) {
        const { email } = req.body;
        const message = await this.authService.loginWithEmailSendCode(email);
        return res.status(200).json(message);
    }

    async loginWithEmailVerifyCode(req, res, next) {
        const { email, code } = req.body;
        const message = await this.authService.loginWithEmailVerifyCode(email, code);
        return res.status(200).json(message);
    }

    async loginWithEmailPassword(req, res, next) {
        const { email, password } = req.body;
        const message = await this.authService.loginWithEmailPassword(email, password);
        return res.status(200).json(message);
    }

    async loginWithPhonePassword(req, res, next) {
        const { phone, password } = req.body;
        const message = await this.authService.loginWithPhonePassword(phone, password);
        return res.status(200).json(message);
    }

    async logout(req, res, next) {
        const { userId } = req.query;
        const message = await this.authService.logout(userId);
        return res.status(200).json(message);
    }

    async updateUser(req, res, next) {
        console.log(req.body);
        const message = await this.authService.updateUser(req.body);
        return res.status(200).json(message);
    }
    
    async updateUserUniqueRequest(req, res, next) {
        const { userId, data, type } = req.query;
        const message = await this.authService.updateUserUniqueRequest(userId, data, type);
        return res.status(200).json(message);
    }

    async verifyUpdateRequest(req, res, next) {
        const { userId, code, type } = req.query;
        const message = await this.authService.verifyUpdateRequest(userId, code, type);
        return res.status(200).json(message);
    }

    async getUser(req, res, next) {
        const { userId } = req.query;
        const message = await this.authService.getUser(userId);
        return res.status(200).json(message);
    }

    async cancelUpdateRequest(req, res, next) {
        const { userId, type } = req.query;
        const message = await this.authService.cancelUpdateRequest(userId, type);
        return res.status(200).json(message);
    }

    async getTime(req, res, next) {
        const now = () => new Date();
        
        console.log("Şu anki zaman:", now().toString());
    }


    
}

module.exports = new AuthController();

