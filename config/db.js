var mongoose = require('mongoose')

var db

module.exports = function () { 
    if (!db) {
        //var dbUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb//@localhost:27017/ifconecta2'
        var dbUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://leoberteck:*LB753159LB*@ds013192.mlab.com:13192/heroku_0rg1xstj'
        var db = mongoose.connect(dbUrl, { safe: true })
    } 
    return db
}