const mongoose = require('mongoose');
const { getStoreConnection } = require('../utils/mongooseConnections');

// Store veritabanı için mongoose bağlantısını al
const storeConn = getStoreConnection();

const storeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    storeId: {
        type: String,
        required: true
    },
    location: {
        region: { type: String, default: null },
        city: { type: String, default: null },
        district: { type: String, default: null }
    },
    workers: {
        type: Array,
        default: []
    },
    status: {
        type: String,
        enum: ['active', 'tempClosed', 'closed'],
        default: 'active'
    }
}, { timestamps: true });

// Store veritabanı bağlantısını kullan
module.exports = storeConn.model('Store', storeSchema);


