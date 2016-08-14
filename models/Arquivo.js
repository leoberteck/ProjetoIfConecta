var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var UsuarioModel = require('./Usuario.js')
var gridfs = require('../config/gridfs.js')()
var Schema = mongoose.Schema

var ARQUIVO_UPDATE_NOTF = "O arquivo foi alterado"

var arquivoSchema = new Schema({
    nome : { type : String, required : true },
    nomeArquivo : String,
    gridId : { type : Schema.Types.ObjectId },
    descricao  : String,
    palavrasChave : [{ type: String, trim: true }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' },
    categoria : { type : Schema.Types.ObjectId, ref : 'Categoria' },
    dataCriacao : Date
})

arquivoSchema.statics.validateArquivo = function (arquivo, callback) {
    var err = null
    if (!arquivo.nome) {
        err = new Error("Nome do arquivo vazio.");
    }
    if (err) {
        err.status = 400
    }
    callback(err)
}

arquivoSchema.statics.addNewArquivo = function (file, criador, callback) {
    var model = this
    var newArquivo = {
        nome : file.gridfsEntry.filename,
        nomeArquivo : file.gridfsEntry.filename,
        gridId : file.gridfsEntry._id,
        criador : criador,
        dataCriacao : new Date()
    }
    gridfs.db.collection('fs.files').update({ _id : newArquivo.gridId }, { $set: { status: 'OK' } })
    model.create(newArquivo, function (err, response) {
        if (err) {
            logger.newErrorLog(err, "Error on save", null, "addNewArquivo")
            callback(err)
        } else {
            callback(null, response._id)
        }
    })
}

arquivoSchema.statics.updateArquivo = function (obj, sessionUser, callback) {
    if ((obj.criador._id == sessionUser._id) || sessionUser.admin) {
        var model = this
        model.validateArquivo(obj, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route update validator: ", null, "updateArquivo")
                callback(err)
            } else {
                var id = obj._id
                model.findByIdAndUpdate(id, obj, {}, function (err, doc) {
                    if (err) {
                        logger.newErrorLog(err, "Error on route update: ", null, "updateArquivo")
                        callback(err)
                    } else {
                        var newnotf = UsuarioModel.generateNotf(ARQUIVO_UPDATE_NOTF, doc, "arquivo")
                        UsuarioModel.update({}, { $push: { notificacoes : newnotf } }, { multi : true }, function (err, result) { })
                        callback()
                    }
                })
            }
        })
    } else {
        var err = new Error("Não autorizado")
        err.status = 401
        callback(err)
    }
}

arquivoSchema.statics.removeArquivo = function (id, user, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", null, "removeArquivo")
            callback(err)
        } else {
            if (user.admin == true || doc.criador == user._id) {
                gridfs.findOne({ _id : doc.gridId }, function (err, file) {
                    if (err) {
                        callback(err)
                    } else {
                        gridfs.remove(file)
                    }
                })
                doc.remove(function (err) {
                    if (err) {
                        callback(err)
                    } else {           
                        callback()
                    }
                })
            } else {
                var err = new Error("Não autorizado")
                err.status = 401
                callback(err)
            }
        }
    })
}

arquivoSchema.statics.getForDownload = function (id, callback) {
    gridfs.findOne({ _id : id, root : null }, function (err, file) {
        if (err || !file || !file._id) {
            callback(err, file, null)
        }
        else {
            var readstream = gridfs.createReadStream({
                _id: id
            });
            callback(err, file, readstream)
        }
    })
}

module.exports = mongoose.model('Arquivo', arquivoSchema)