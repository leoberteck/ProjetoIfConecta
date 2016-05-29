var mongoose = require('mongoose')

var db

module.exports = function () { 
    if (!db) {
        var dbUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb//@localhost:27017/ifconecta'
        var db = mongoose.connect(dbUrl, { safe: true })
    } 
    return db
}