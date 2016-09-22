var mongoose = require('mongoose');

var Schema = mongoose.Schema
var logSchema = new Schema({
    usuario : {type : Schema.Types.ObjectId},
    descricao : String,
    json: { type: Schema.Types.Mixed },
    data: { type: Date, default: Date.now },
    type : String
})

module.exports = mongoose.model('Log', logSchema)