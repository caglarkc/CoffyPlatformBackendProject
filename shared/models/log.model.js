const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    objectId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    objectType: {
        type: String,
        enum: ['User'],
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

module.exports = mongoose.model('Log', logSchema);