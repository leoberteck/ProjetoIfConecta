var mongoose = require('mongoose')
var Usuario = require('./Usuario.js')
var logger = require('../helper/logHelper.js')

var cargoSchema = new mongoose.Schema({
    nome : String
})

cargoSchema.pre('save', function cargoPreSaveHook(next) {
    var docCargo = this;
    Usuario.update({ 'cargo.id' : docCargo._id }, { cargo : { nome : docCargo.nome, id : docCargo._id } }, { multi : true }, function (err, Count, raw) {
        next(err)
    })
})

cargoSchema.statics.addNewCargo = function (obj, callback) {
    var model = this
    model.validateCargo(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on save validator: ", null, "addNewCargo")
            callback(err)
        } else {
            model.create(obj, function saveCB(err, response) {
                if (err) {
                    logger.newErrorLog(err, "Error on save: ", null, "addNewCargo")
                    callback(err)
                } else {
                    callback(err, response)
                }
            })
        }
    })
}

cargoSchema.statics.updateCargo = function (obj, callback) {
    var model = this
    model.validateCargo(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route update validator: ", null, "updateCargo")
            callback(err)
        } else {
            var id = obj._id
            model.findOne({ _id : id }, function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on route update: ", null, "updateCargo")
                    callback(err)
                } else {
                    doc.nome = obj.nome
                    doc.save()
                    callback()
                }
            })
        }
    })
}

cargoSchema.statics.removeCargo = function (id, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", null, "removeCargo")
            callback(err)
        } else {
            Usuario.find({ "cargo.id" : doc._id }, function (err, users) {
                if (users && users.length > 0) {
                    var erro = new Error("Não é possível remover este cargo. Há usuários atrelados a ele.")
                    callback(erro)
                }
                else {
                    doc.remove(function (err, doc) {
                        if (err) {
                            logger.newErrorLog(err, "Error on remove", null, "removeCargo")
                            callback(err)
                        } else {
                            callback()
                        }
                    })
                }
            })
        }
    })
}

cargoSchema.statics.validateCargo = function (cargo, callback) {
    if (!cargo.nome) {
        var err = new Error('Nome esta vazio')
        err.status = 400
        callback(err)
    }
    else {
        callback()
    }
}


module.exports = mongoose.model('Cargo', cargoSchema)