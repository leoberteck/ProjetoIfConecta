var mongoose = require('mongoose')

var db

function getMongoFullUrl() {  
    return process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://@localhost:27017/ifconecta'
}

function getMongoUrl() {
    var fullUrl = getMongoFullUrl()
    var pieces = fullUrl.split(':')
    var url = ""
    for (var x = 0; x < pieces.length - 1; x++) {
        url += pieces[x]
    }
    return url
}

function getMongoPort() {
    var fullUrl = getMongoFullUrl()
    var pieces = fullUrl.split('@')
    pieces = pieces[1].split(':')
    pieces = pieces[1].split('/')
    return pieces[0]
}

function getMongoDatabase() {
    var fullUrl = getMongoFullUrl()
    var pieces = fullUrl.split('@')
    pieces = pieces[1].split(':')
    pieces = pieces[1].split('/')
    return pieces[1]
}

module.exports.getMongoFullUrl = getMongoFullUrl
module.exports.getMongoUrl = getMongoUrl
module.exports.getMongoPort = getMongoPort
module.exports.getMongoDatabase = getMongoDatabase

module.exports.getDb = function () { 
    if (!db) {
        var dbUrl = getMongoFullUrl()
        //var dbUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://leoberteck:*LB753159LB*@ds013192.mlab.com:13192/heroku_0rg1xstj'
        db = mongoose.connect(dbUrl, { safe: true })
    } 
    return db
}