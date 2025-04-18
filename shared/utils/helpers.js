const crypto = require('crypto');
const dotenv = require('dotenv');
dotenv.config();

// Hash'leme işlemi
const generateCode = () => {
    const randomString = Math.floor(100000 + Math.random() * 900000); // 6 haneli rastgele sayı
    return randomString;
};

const hashCode = (code) => {
    const secret = process.env.SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(code.toString()); // Veriyi hashle
    const hashedCode = hmac.digest('hex'); // Hash'i hex formatında döndür
    return hashedCode;
};

const verifyHashedCode = (code, hashedCode) => {
    const secret = process.env.SECRET_KEY;

    // HMAC ile kodu hashleyin
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(code.toString()); // Veriyi hashle
    const hashedInputCode = hmac.digest('hex'); // Hash'i hex formatında döndür

    // Kullanıcıdan alınan hash ile orijinal hash'i karşılaştırın
    return hashedInputCode === hashedCode;
};

const hashPassword = async (password) => {
    const secret = process.env.SECRET_KEY;
    if (!secret) {
        throw new Error('SECRET_KEY is not defined in environment variables');
    }
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(password);
    const hashedPassword = hmac.digest('hex');
    return hashedPassword;
};

const verifyPassword = async (password, hashedPassword) => {
    const computedHash = await hashPassword(password);
    return computedHash === hashedPassword;
};

const hashCreaterData = (data) => {
    const secret = process.env.CREATER_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const hashedData = hmac.digest('hex');
    return hashedData;
};

const hashAdminData = (data) => {
    const secret = process.env.ADMIN_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const hashedData = hmac.digest('hex');
    return hashedData;
};

const verifyAdminData = (data, hashedData) => {
    const secret = process.env.ADMIN_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const hashedInputData = hmac.digest('hex');
    return hashedInputData === hashedData;
};

const verifyCreaterData = (data, hashedData) => {
    const secret = process.env.CREATER_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const hashedInputData = hmac.digest('hex');
    return hashedInputData === hashedData;
};

const verifyCreatorEmailWithHash = (email) => {
    const secret = process.env.CREATER_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(email);
    const hashedInputEmail = hmac.digest('hex');
    const hashedCreatorEmail = hashCreaterData(process.env.CREATER_EMAIL);
    return hashedInputEmail === hashedCreatorEmail;
};

const verifyCreatorPasswordWithHash = (password) => {
    const secret = process.env.CREATER_SECRET_KEY;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(password);
    const hashedInputPassword = hmac.digest('hex');
    const hashedCreatorPassword = hashCreaterData(process.env.CREATER_PASSWORD);
    return hashedInputPassword === hashedCreatorPassword;
};

const verifyCreatorEmail = (email) => {
    const creatorEmail = process.env.CREATER_EMAIL;
    return email === creatorEmail;
};

const verifyCreatorPassword = (password) => {
    const creatorPassword = process.env.CREATER_PASSWORD;
    return password === creatorPassword;
};

module.exports = {
    generateCode,
    hashCode,
    verifyHashedCode,
    hashPassword,
    verifyPassword,
    hashCreaterData,
    verifyCreaterData,
    hashAdminData,
    verifyAdminData,
    verifyCreatorEmail,
    verifyCreatorPassword
};
