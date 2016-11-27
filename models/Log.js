var mongoose = require('mongoose');

var Schema = mongoose.Schema
var logSchema = new Schema({
    usuario : {type : Schema.Types.ObjectId, ref : "User"},
    descricao : String,
    json: { type: Schema.Types.Mixed },
    data: { type: Date, default: Date.now },
    type : String
})


logSchema.statics.getAll = function (skip, callback) {
    var model = this
    var filtro = {}
    var options = { sort : "-data" }
    if (skip || skip == 0) {
        options.skip = skip
        options.limit = 30
    }

    model.find(filtro, {}, options, function (err, docs) {
        callback(err, docs)
    })
}

module.exports = mongoose.model('Log', logSchema)