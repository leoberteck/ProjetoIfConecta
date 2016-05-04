var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var UsuarioModel = require('./Usuario.js')
var fs = require('fs')
var Schema = mongoose.Schema
var gridfs

var ARQUIVO_ADD_NOTF = "Você ganhou acesso a um arquivo"
var ARQUIVO_REMOVED_NOFT = "Um Arquivo foi removido"
var ARQUIVO_REMOVED_USER_NOTF = "Você perdeu o acesso a um arquivo"
var ARQUIVO_UPDATE_NOTF = "O arquivo foi alterado"

var arquivoSchema = new Schema({
    nome : { type : String, required : true },
    nomeArquivo : String,
    idArquivo : { type : Schema.Types.ObjectId },
    descricao  : String,
    dados : Buffer,
    tamanhoBytes : Number,
    palavrasChave : [{ type: String, trim: true }],
    usuarios : [{ type : Schema.Types.ObjectId, ref : 'User' }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' }
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
    generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
        var extension = file.path.split(/[. ]+/).pop()
        var is = fs.createReadStream(file.path)
        var os = gridfs.createWriteStream({ filename : obj.nomeArquivo })
        is.pipe(os)
                
        os.on('close', function (savedFile) {
            fs.unlink(file.path)
            var newarquivo = {
                nome : file.name,
                nomeArquivo : file.name,
                idArquivo : savedFile._id
            }
                    
            model.create(newarquivo, function saveCB(err, response) {
                if (err) {
                    logger.newErrorLog(err, "Error on route save validator: ", criador, "addNewArquivo")
                    callback(err)
                } else {
                    response.usuarios.forEach(function (entry) {
                        UsuarioModel.addNotfArquivo(response.criador, entry, ARQUIVO_ADD_NOTF, response)
                    })
                    upadteUserArquivo(response.usuarios, response._id)
                    callback(null, response._id)
                }
            })
        })
    })
}

arquivoSchema.statics.updateArquivo = function (obj, usuarios_to_remove, sessionUser, callback) {
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
                        doc.usuarios.forEach(function (entry) {
                            UsuarioModel.addNotfArquivo(doc.criador, entry, ARQUIVO_UPDATE_NOTF, obj)
                        })
                        upadteUserArquivo(obj.usuarios, doc._id)
                        removeArquivoFromUsuarios(usuarios_to_remove, doc, function () { })
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
                doc.usuarios.forEach(function (entry) {
                    UsuarioModel.addNotfArquivo(doc.criador, entry, ARQUIVO_REMOVED_NOFT, doc)
                })
                removeArquivoFromUsuarios(doc.usuarios, doc, function (err) {
                    if (err) {
                        callback(err)
                    } else {
                        doc.remove(function (err) {
                            if (err) {
                                callback(err)
                            } else {
                                
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
    })
}

function generateUsersArray(usuarios, times, callback) {
    var model = require('./Time.js')
    if (usuarios && usuarios.length > 0) {
        if (times && times.length > 0) {
            model.find({ _id : { $in: times } }, function (err, docs) {
                docs.forEach(function (entry) {
                    if (entry.usuarios) {
                        usuarios.concat(entry.usuarios)
                    }
                })
                callback(usuarios)
            })
        }
        else {
            callback(usuarios)
        }
    }
    else {
        callback(usuarios)
    }
}

function removeArquivoFromUsuarios(usuarios_to_remove, arquivo, callback) {
    var idArquivo = arquivo._id
    if (usuarios_to_remove) {
        UsuarioModel.find({ _id : { $in : usuarios_to_remove } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting usuarios for update", null, "removeArquivoFromUsuarios")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    UsuarioModel.addNotfArquivo(arquivo.criador, entry, ARQUIVO_REMOVED_USER_NOTF, arquivo)
                    var index = entry.arquivos.indexOf(idArquivo)
                    entry.arquivos.splice(index, 1)
                    entry.save()
                })
                callback()
            }
        })
    } else {
        callback()
    }
}

function upadteUserArquivo(usuarios, idArquivo) {
    userModel = require('./Usuario.js')
    usuarios.forEach(function (usuario) {
        userModel.update({ _id : usuario }, { $addToSet: { arquivos : idArquivo } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error updating users archives", null, "upadteUserArquivo")
            }
        })
    })
}

module.exports = function (gfs) 
{
    gridfs = gfs
    return mongoose.model('Arquivo', arquivoSchema)
}