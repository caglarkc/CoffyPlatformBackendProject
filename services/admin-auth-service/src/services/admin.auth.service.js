const Admin = require('../models/admin.model');
const helpers = require('../../../../shared/utils/helpers');
const errorMessages = require('../../../../shared/config/errorMessages');
const successMessages = require('../../../../shared/config/successMessages');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const redisService = require('../../../../shared/services/redis.service');
const tokenService = require('../../../../shared/services/token.service');
const { getRedisClient } = require('../utils/database');
const { getRequestContext } = require('../middlewares/requestContext');
const { logger } = require('../../../../shared/utils/logger');
const {validatePhone , validateEmail, validateName, validateSurname, validatePassword} = require('../../../../shared/utils/textUtils');
const {validateAdminRegister} = require('../../../../shared/utils/validationUtils');
const eventPublisher = require('../../../../shared/services/event/eventPublisher');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const dotenv = require('dotenv');
dotenv.config();

const _formatAdminResponse = (admin) => {
    return {
        id: admin._id,
        email: admin.email,
        phone: admin.phone,
        name: admin.name,
        surname: admin.surname,
        role: admin.role,
        location: admin.location,
        whoCreate: admin.whoCreate
    };
};


class AdminAuthService {
    
    async createCreator(key) {
        try {
            if (!key || key !== process.env.SECRET_KEY) {
                throw new ForbiddenError(errorMessages.FORBIDDEN.INVALID_SECRET_KEY);
            }
            const name = "Ali Çağlar";
            const surname = "Koçer";
            const email = "alicaglarkocer@gmail.com";
            const phone = "5521791303";
            const password = "Erebus13032003_";

            const hashedEmail = helpers.hashCreaterData(email);
            const hashedPhone = helpers.hashCreaterData(phone);
            const hashedPassword = helpers.hashCreaterData(password);

            const creator = await Admin.create({
                name,
                surname,
                email: hashedEmail,
                phone: hashedPhone,
                password: hashedPassword,
                role: 5,
                status: "active",
                whoCreate: null
            });

            creator.save();

            const message = "Admin başarıyla oluşturuldu";
            return {
                message: message,
                admin: _formatAdminResponse(creator)
            };
            
            
        } catch (error) {
            throw error;
        }
    }

    async _checkCreator(email, password) {
        const isCreatorEmail = helpers.verifyCreatorEmail(email);
        const isCreatorPassword = helpers.verifyCreatorPassword(password);

        if (!isCreatorEmail) {
            return null; // Doğrudan null dön
        }

        if (isCreatorEmail && !isCreatorPassword) {
            throw new ValidationError(errorMessages.INVALID.INVALID_CREDENTIALS);
        }


        const admin = await Admin.findOne({"role": 5});
        return admin; // Doğrudan admin nesnesini dön
    }

    async _checkAdmin(email, password) {
        const admin = await Admin.findOne({email: email});
        if (!admin) {
            throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
        }
        const isPasswordCorrect = helpers.verifyAdminData(password, admin.password);
        if (!isPasswordCorrect) {
            throw new ForbiddenError(errorMessages.INVALID.INVALID_CREDENTIALS);
        }
        return admin; // Doğrudan admin nesnesini dön
    }



    async checkPhone(data) {
        try {
            const phone = data.phone;
            validatePhone(phone);
            
            const admin = await Admin.findOne({ phone: phone });
            if (admin) {
                throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
            }
            return {
                message: successMessages.AUTH.PHONE_CHECKED,
                isExist: false
            };
        } catch (error) {
            throw error;
        }
    }

    async checkEmail(data) {
        try {
            const email = data.email;
            validateEmail(email);
            const admin = await Admin.findOne({ email: email });
            if (admin) {
                throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
            }
            return {
                message: successMessages.AUTH.EMAIL_CHECKED,
                isExist: false
            };
        } catch (error) {
            throw error;
        }
    }

    async createAdmin(data, loggedAdmin) {
        try {
            logger.info('Admin registration attempt', { 
                creatorId: loggedAdmin._id,
                creatorRole: loggedAdmin.role,
                newAdminEmail: data.email
            });
            
            const {name, surname, email, phone, password, role, city, region, district, storeId} = data;
            const existingEmail = await Admin.findOne({email: email});
            const existingPhone = await Admin.findOne({phone: phone});
    
            if (existingEmail) {
                logger.warn('Admin registration failed - email exists', { email });
                throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
            }
    
            if (existingPhone) {
                logger.warn('Admin registration failed - phone exists', { phone });
                throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
            }


            validateAdminRegister(data, loggedAdmin.role);

            const newAdmin = new Admin({
                name,
                surname,
                email: email,
                phone: phone,
                password: helpers.hashAdminData(password),
                role: role,
                location: {
                    city,
                    region,
                    district,
                    storeId
                },
                whoCreate: loggedAdmin._id
            });
            await newAdmin.save();
            
            logger.info('Admin registered successfully', { 
                adminId: newAdmin._id,
                role: role,
                createdBy: loggedAdmin._id
            });
            
            const message = "Admin başarıyla oluşturuldu";
            return {message: message, 
                    admin: _formatAdminResponse(newAdmin)};
            
        } catch (error) {
            logger.error('Admin registration error', { 
                error: error.message, 
                stack: error.stack,
                creatorId: loggedAdmin?._id 
            });
            throw error;
        }

    }

    async loginAdmin(data) {
        try {
            logger.info('Admin login attempt', { email: data.email });
            
            const { email, password } = data;
    
            // Yöneticiyi kontrol et
            let admin = await this._checkCreator(email, password);
            if (!admin) {
                admin = await this._checkAdmin(email, password);
            }

            if (!admin) {
                logger.warn('Admin login failed - admin not found', { email });
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
            }

            if (admin.status === "blocked") {
                logger.warn('Admin login failed - admin is blocked', { adminId: admin._id });
                throw new ForbiddenError(errorMessages.FORBIDDEN.BLOCKED_ADMIN);
            }

            if (admin.status === "deleted") {
                logger.warn('Admin login failed - admin is deleted', { adminId: admin._id });
                throw new ForbiddenError(errorMessages.FORBIDDEN.DELETED_ADMIN);
            }

            // Redis'te token kontrolü
            const existRefreshToken = await redisService.get(`auth:refresh:${admin._id}`);

            if (existRefreshToken) {
                const existAccessToken = await redisService.get(`auth:access:${admin._id}`);
                if (existAccessToken) {
                    // Kullanıcı zaten giriş yapmış
                    logger.info('Admin already logged in', { adminId: admin._id });
                    return {
                        message: "Bu kullanıcı giriş yapmış, lütfen önce çıkış yapınız",
                        alreadyLoggedIn: true,
                        adminId: admin._id.toString(),
                        adminName: admin.name,
                        adminRole: admin.role
                    };
                } else {
                    // Access token süresi dolmuş ama refresh token geçerli
                    // Otomatik olarak yeni access token oluştur
                    const tokenPair = tokenService.createTokenPair(admin._id);
                    const accessToken = tokenPair.accessToken;


                    // Redis'e yeni access token'ı kaydet
                    await redisService.put(`auth:access:${admin._id}`, accessToken, 900); // 15 minutes

                    
                    logger.info('Admin access token refreshed', { adminId: admin._id });
                    return {
                        message: "Oturumunuz yenilendi, yeni token oluşturuldu",
                        accessTokenRefreshed: true,
                        admin: _formatAdminResponse(admin),
                        accessToken: accessToken,
                        refreshToken: existRefreshToken
                    };
                }
            }

            // Yeni token çifti oluştur
            const tokenPair = tokenService.createTokenPair(admin._id);

            

            // RequestContext güncelle
            const requestContext = getRequestContext();
            requestContext.setUserId(admin._id);
            requestContext.setData('adminRole', admin.role);
            requestContext.setData('adminName', admin.name);

            // Redis'e kaydet
            await redisService.put(`auth:access:${admin._id}`, tokenPair.accessToken, 900); // 15 minutes
            await redisService.put(`auth:refresh:${admin._id}`, tokenPair.refreshToken, 3600 * 7); // 7 hours
   
            
            logger.info('Admin logged in successfully', { adminId: admin._id, role: admin.role });

            return {
                message: successMessages.AUTH.LOGIN_SUCCESS,
                admin: _formatAdminResponse(admin),
                tokenPair,
                adminId: admin._id.toString()
            };
    
            
        } catch (error) {
            logger.error('Admin login error', { 
                error: error.message, 
                stack: error.stack,
                email: data?.email 
            });
            throw error;
        }
    }

    async changePassword(newPassword, loggedAdmin) {
        try {
            if (!loggedAdmin) {
                throw new ForbiddenError("burada bir hata var knk");
            }

            validatePassword(newPassword);

            const admin = await Admin.findById(loggedAdmin._id);
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
            }

            if (admin.email === helpers.hashCreaterData(process.env.CREATER_EMAIL)) {
                if (admin.password === helpers.hashCreaterData(newPassword)) {
                    throw new ValidationError(errorMessages.INVALID.PASSWORD_SAME);
                }
                admin.password = helpers.hashCreaterData(newPassword);
            } else {
                if (admin.password === helpers.hashAdminData(newPassword)) {
                    throw new ValidationError(errorMessages.INVALID.PASSWORD_SAME);
                }
                admin.password = helpers.hashAdminData(newPassword);
            }

            await admin.save();

            return {
                message: successMessages.AUTH.PASSWORD_CHANGED,
                admin: _formatAdminResponse(admin)
            };
        } catch (error) {
            throw error;
        }
    }
    
    async deleteAdmin(loggedAdmin, email) {
        try {
            if (!loggedAdmin) {
                throw new ForbiddenError("burada bir hata var knk");
            }

            const admin = await Admin.findOne({email: email});
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
            }

            if (loggedAdmin.role <= admin.role || loggedAdmin._id.toString() === admin._id.toString()) {
                throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
            }

            if (admin.status === "deleted") {
                throw new ForbiddenError(errorMessages.FORBIDDEN.ALREADY_DELETED);
            }

            admin.status = "deleted";
            await admin.save();

            const message = "Admin başarıyla silindi";
            return {message: message};

        } catch (error) {
            throw error;
        }
    }

    async logoutAdmin(adminId) {
        try {
            logger.info('Admin logout attempt', { adminId });
            
            // Redis'ten tokenleri silme
            const redisClient = getRedisClient();
            await redisClient.del(`auth:access:${adminId}`);
            await redisClient.del(`auth:refresh:${adminId}`);
            

            logger.info('Admin logged out successfully', { adminId });

            return {
                message: successMessages.AUTH.LOGOUT_SUCCESS,
                success: true
            };
        } catch (error) {
            logger.error('Admin logout error', { 
                error: error.message, 
                stack: error.stack,
                adminId
            });
            throw error;
        }
    }

    async getAdmin(adminData) {
        try {
            const admin = await Admin.findById(adminData._id);
            if (!admin) {
                throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
            }

            return {
                message: successMessages.SEARCH.ADMIN_FOUND,
                admin: _formatAdminResponse(admin)
            };
        } catch (error) {
            throw error;
        }
    }


    async createCreator() {
        try {
            const name = "Ali Çağlar";
            const surname = "Koçer";
            const email = "alicaglarkocer@gmail.com";
            const phone = "5521791303";
            const password = "Erebus13032003_";

            const hashedEmail = helpers.hashCreaterData(email);
            const hashedPhone = helpers.hashCreaterData(phone);
            const hashedPassword = helpers.hashCreaterData(password);

            const creator = await Admin.create({
                name,
                surname,
                email: hashedEmail,
                phone: hashedPhone,
                password: hashedPassword,
                role: 5,
                status: "active",
                whoCreate: null
            });

            return creator;
            
        } catch (error) {
            throw error;
        }
    }


    // EventBus başlatma ve olay yayınlama metotları
    async initializeEventListeners() {
        try {
            // Servis başladığında kalıcı kuyruklar ile olay dinleme
            const queueNamePrefix = 'admin-auth-service.queue';
            
            // Admin.getAdmin için responder ekle
            await eventSubscriber.respondTo('admin.auth.testCommunication', async (payload, metadata) => {
                logger.info('Received test communication request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });
                
                return {
                    success: true,
                    message: "İletişim başarılı",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };
            }, {
                queueName: `${queueNamePrefix}.testCommunication-responder`,
                durable: true
            });
            
            await eventSubscriber.respondTo('admin.auth.getMe', async (payload, metadata) => {
                logger.info('Received getMe request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        error: "NotFoundError",
                        code: 404,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                return {
                    success: true,
                    message: "Admin bulundu",
                    admin: _formatAdminResponse(admin),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };
            });

            await eventSubscriber.respondTo('admin.auth.changeLocation', async (payload, metadata) => {
                logger.info('Received changeLocation request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        error: "NotFoundError",
                        code: 404,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const isNotChanged = false;
                if (admin.location.city === payload.location.city && admin.location.region === payload.location.region 
                    && admin.location.district === payload.location.district && admin.location.storeId === payload.location.storeId) {
                    isNotChanged = true;
                }

                if (isNotChanged) {
                    throw new ValidationError(errorMessages.INVALID.NO_PENDING_REQUEST);
                }
                admin.location.city = payload.location.city;
                admin.location.region = payload.location.region;
                admin.location.district = payload.location.district;
                admin.location.storeId = payload.location.storeId;

                await admin.save();

                return {
                    success: true,
                    message: "Admin konumu başarıyla güncellendi",
                    admin: _formatAdminResponse(admin),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };
            });

            await eventSubscriber.respondTo('admin.auth.deleteMe', async (payload, metadata) => {
                logger.info('Received deleteMe request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (admin.status === "deleted") {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.ALREADY_DELETED);
                }

                admin.status = "deleted";
                await admin.save();

                this.logoutAdmin(admin._id);

                return {
                    success: true,
                    message: "Admin başarıyla silindi",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.blockAdmin', async (payload, metadata) => {
                logger.info('Received blockAdmin request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= admin.role) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                if (admin.status === "blocked") {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.ALREADY_BLOCKED);
                }

                admin.status = "blocked";
                await admin.save();

                return {
                    success: true,
                    message: "Admin başarıyla bloklandı",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.unblockAdmin', async (payload, metadata) => {
                logger.info('Received unblockAdmin request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= admin.role) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                if (admin.status !== "blocked") {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.ALREADY_UNBLOCKED);
                }

                admin.status = "active";
                await admin.save();


                return {
                    success: true,
                    message: "Admin başarıyla bloklanmamış",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });
            
            await eventSubscriber.respondTo('admin.auth.downgradeRole', async (payload, metadata) => {
                logger.info('Received downgradeRole request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= admin.role) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }


                admin.role = admin.role - 1;
                await admin.save();


                return {
                    success: true,
                    message: "Admin rolü başarıyla düşürüldü",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.upgradeRole', async (payload, metadata) => {
                logger.info('Received upgradeRole request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= admin.role + 1) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }


                admin.role = admin.role + 1;
                await admin.save();

                return {
                    success: true,
                    message: "Admin rolü başarıyla yükseltildi",
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.getAdminWithId', async (payload, metadata) => {
                logger.info('Received getAdminWithId request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findById(payload.adminId);
                if (!admin) {
                    console.log("Admin bulunamadıadslşdi");
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        error: "NotFoundError",
                        id: payload.adminId,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        error: "NotFoundError",
                        id: payload.creatorAdminId,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= 2) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                return {
                    success: true,
                    message: "Admin bulundu",
                    admin: _formatAdminResponse(admin),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.getAdminWithEmail', async (payload, metadata) => {
                logger.info('Received getAdminWithEmail request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findOne({email: payload.email});
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= 2) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                return {
                    success: true,
                    message: "Admin bulundu",
                    admin: _formatAdminResponse(admin),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.getAdminWithPhone', async (payload, metadata) => {
                logger.info('Received getAdminWithPhone request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admin = await Admin.findOne({phone: payload.phone});
                if (!admin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= 2) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                return {
                    success: true,
                    message: "Admin bulundu",
                    admin: _formatAdminResponse(admin),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.getAdmins', async (payload, metadata) => {
                logger.info('Received getAdmins request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const admins = await Admin.find({});
                if (!admins) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= 2) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                return {
                    success: true,
                    message: "Adminler bulundu",
                    admins: admins.map(admin => _formatAdminResponse(admin)),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });

            await eventSubscriber.respondTo('admin.auth.getAdminsWithUniqueData', async (payload, metadata) => {
                logger.info('Received getAdminsWithUniqueData request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const type = payload.data.type;
                const value = payload.data.value;
                let admins;

                if (!type || !value) {
                    throw new ValidationError(errorMessages.INVALID.NO_INFORMATION_PROVIDED);
                }

                if (type === "name") {
                    admins = await Admin.find({name: value});
                }

                if (type === "surname") {
                    admins = await Admin.find({surname: value});
                }

                if (type === "role") {
                    admins = await Admin.find({role: value});
                }

                if (type === "status") {
                    admins = await Admin.find({status: value});
                }
                if (!admins || admins.length === 0) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                const creatorAdmin = await Admin.findById(payload.creatorAdminId);
                if (!creatorAdmin) {
                    return {
                        success: false,
                        message: "Admin bulunamadı",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                if (creatorAdmin.role <= 2) {
                    throw new ForbiddenError(errorMessages.FORBIDDEN.INSUFFICIENT_PERMISSIONS);
                }

                return {
                    success: true,
                    message: "Adminler bulundu",
                    admins: admins.map(admin => _formatAdminResponse(admin)),
                    receivedData: payload,
                    timestamp: new Date().toISOString()
                };

            });



            await eventSubscriber.respondTo('admin.auth.changeAdminDataMany',async(payload,metadata)=>{
                logger.info('Received changeAdminDataMany request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                try {
                    const admin = await Admin.findById(payload.adminId);
                    if (!admin) {
                        return {
                            success: false,
                            message: "Admin bulunamadı",
                            receivedData: payload,
                            timestamp: new Date().toISOString()
                        };
                    }

                    const {name, surname, email, phone} = payload.newData;
                    if (!name && !surname && !email && !phone) {
                        throw new ValidationError(errorMessages.INVALID.NO_PENDING_REQUEST);
                    }

                    // Sadece gönderilen değerleri kontrol et
                    let isChanged = false;
                    
                    if (name && name === admin.name) {
                        // İsim gönderilmiş ama değişmemiş
                    } else if (name) {
                        isChanged = true;
                    }
                    
                    if (surname && surname === admin.surname) {
                        // Soyisim gönderilmiş ama değişmemiş
                    } else if (surname) {
                        isChanged = true;
                    }
                    
                    if (email && email === admin.email) {
                        // Email gönderilmiş ama değişmemiş
                    } else if (email) {
                        isChanged = true;
                    }
                    
                    if (phone && phone === admin.phone) {
                        // Telefon gönderilmiş ama değişmemiş
                    } else if (phone) {
                        isChanged = true;
                    }
                    
                    if (!isChanged) {
                        throw new ValidationError(errorMessages.INVALID.NO_PENDING_REQUEST);
                    }

                    if (name) {
                        validateName(name);
                        admin.name = name;
                    }
                    if (surname) {
                        validateSurname(surname);
                        admin.surname = surname;
                    }
                    if (email) {
                        validateEmail(email);
                        admin.email = email;
                    }   
                    if (phone) {
                        validatePhone(phone);
                        admin.phone = phone;
                    }

                    await admin.save();
                    return {
                        success: true,
                            message: "Admin bilgileri başarıyla güncellendi",
                            admin: _formatAdminResponse(admin),
                            receivedData: payload,
                            timestamp: new Date().toISOString()
                        };
                } catch (error) {
                    logger.error('Error updating admin data', {
                        error: error.message,
                        stack: error.stack,
                        adminId: payload.adminId
                    });

                    return {
                        success: false,
                        message: error.message,
                        error: error.name,
                        code: error.statusCode || 400,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
            });

            await eventSubscriber.respondTo('admin.auth.changeAdminDataJustOne',async(payload,metadata)=>{
                logger.info('Received changeAdminDataJustOne request from admin-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                try {
                    const admin = await Admin.findById(payload.adminId);
                    if (!admin) {
                        throw new NotFoundError(errorMessages.NOT_FOUND.ADMIN_NOT_FOUND);
                    }

                    if (payload.type === "name") {
                        validateName(payload.newData);
                        admin.name = payload.newData;
                    }
                    if (payload.type === "surname") {
                        validateSurname(payload.newData);
                        admin.surname = payload.newData;
                    }
                    if (payload.type === "email") {
                        validateEmail(payload.newData);
                        admin.email = payload.newData;
                    }
                    if (payload.type === "phone") {
                        validatePhone(payload.newData);
                        admin.phone = payload.newData;
                    }
                    
                    await admin.save();

                    return {
                        success: true,
                        message: `Admin ${payload.type} bilgisi başarıyla güncellendi`,
                        admin: _formatAdminResponse(admin),
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                } catch (error) {
                    logger.error(`Error updating admin ${payload.type}`, {
                        error: error.message,
                        stack: error.stack,
                        adminId: payload.adminId
                    });
                    
                    return {
                        success: false,
                        message: error.message,
                        error: error.name,
                        code: error.statusCode || 400,
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
              
            });

            logger.info('Admin-Auth service event listeners initialized');
        } catch (error) {
            logger.error('Failed to initialize event listeners', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    // Refresh token ile yeni access token oluşturma metodu
    async refreshAccessToken(adminId, refreshToken) {
        try {
            // Redis'ten refresh token kontrolü
            const storedRefreshToken = await redisService.get(`auth:refresh:${adminId}`);
            
            if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
                throw new ForbiddenError(errorMessages.INVALID.INVALID_REFRESH_TOKEN);
            }

            // Yeni access token oluştur
            const tokenPair = tokenService.createTokenPair(adminId);
            const accessToken = tokenPair.accessToken;

            // Redis'e yeni access token'ı kaydet
            await redisService.put(`auth:access:${adminId}`, accessToken, 900); // 15 minutes


            return {
                message: successMessages.AUTH.TOKEN_REFRESHED,
                accessToken: accessToken,
                expiresAt: new Date(Date.now() + 900 * 1000).toISOString()
            };
        } catch (error) {
            throw error;
        }
    }

    async getRefreshToken(adminId) {
        try {
            return await redisService.get(`auth:refresh:${adminId}`);
        } catch (error) {
            throw error;
        }
    }

}



module.exports = new AdminAuthService();