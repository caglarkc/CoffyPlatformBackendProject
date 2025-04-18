const mongoose = require('mongoose');
const { getRequestContext } = require('../middlewares/requestContext');

const logSchema = new mongoose.Schema({
    objectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    objectType: {
        type: String,
        enum: ['User', 'Admin'],
        required: true
    },
    actionType: {
        type: String,
        required: true    
    },
    ipAddress: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Log modelini tanımlıyoruz
const Log = mongoose.model('Log', logSchema);

const createLog = async (objectId, objectType, actionType) => {
    const context = getRequestContext();

    const log = new Log({ 
        objectId, 
        objectType, 
        actionType, 
        ipAddress: context.ip // context.ipAddress yerine context.ip kullanıyoruz
    });
    await log.save();
    return log;
};

module.exports = { createLog };