var mongoose = require('mongoose')
var Schema = mongoose.Schema

var tokenSchema = new Schema({
    usuario : { type : mongoose.Schema.Types.ObjectId, ref : 'User' },
    expire : Date
})

module.exports = mongoose.model('Token', tokenSchema)