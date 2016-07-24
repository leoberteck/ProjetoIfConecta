var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var Schema = mongoose.Schema

var categoriaSchema = new mongoose.Schema({
    nome : String
})

categoriaSchema.statics.addNewCategoria = function (obj, callback) {
    var model = this
    model.validateCategoria(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on save validator: ", null, "addNewCategoria")
            callback(err)
        } else {
            model.create(obj, function saveCB(err, response) {
                if (err) {
                    logger.newErrorLog(err, "Error on save: ", null, "addNewCategoria")
                    callback(err)
                } else {
                    callback(err, response)
                }
            })
        }
    })
}

categoriaSchema.statics.updateCategoria = function (obj, callback) {
    var model = this
    model.validateCategoria(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route update validator: ", null, "updateCategoria")
            callback(err)
        } else {
            var id = obj._id
            model.findOne({ _id : id }, function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on route update: ", null, "updateCategoria")
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

categoriaSchema.statics.removeCategoria = function (id, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", null, "removeCategoria")
            callback(err)
        } else {
            doc.remove(function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on remove", null, "removeCategoria")
                    callback(err)
                } else {
                    callback()
                }
            })
        }
    })
}

categoriaSchema.statics.validateCategoria = function (categoria, callback) {
    if (!categoria.nome) {
        var err = new Error('Nome esta vazio')
        err.status = 400
        callback(err)
    }
    else {
        callback()
    }
}


module.exports = mongoose.model('Categoria', categoriaSchema)