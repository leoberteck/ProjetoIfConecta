var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var Schema = mongoose.Schema
var UsuarioModel = require('./Usuario.js')

var EVENTO_ADD_NOTF = "Você foi incluído em um evento"
var EVENTO_REMOVED_NOFT = "Um evento foi removido"
var EVENTO_REMOVED_USER_NOTF = "Você foi removido de um evento"
var EVENTO_UPDATE_NOTF = "O evento foi alterado"

var eventoSchema = new Schema({
    nome: { type : String, required : true, },
    descricao : String,
    usuarios : [{ type : Schema.Types.ObjectId, ref : 'User' }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' },
    dataIni : Date,
    dataFim : Date
})

eventoSchema.statics.validateEvento = function (evento, callback) {
    var err = null
    if (!evento.nome)
        err = new Error("Nome do evento vazio")
    if (!evento.criador)
        err = new Error("O evento deve possuir um criardor")
    if (err) {
        err.status = 400
        callback(err)
    } else { 
        callback()
    }
}

eventoSchema.statics.addNewEvento = function (obj, criador, callback) {
    var model = this
    obj['criador'] = criador._id
    model.validateEvento(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on save validator", criador, "addNewEvento")
            callback(err)
        } else {
            generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                var newevento = {
                    nome : obj.nome,
                    descricao : obj.descricao,
                    dataIni : Date.parse(obj.dataIni),
                    dataFim : Date.parse(obj.dataFim),
                    usuarios : usuarios,
                    criador : criador
                }
                model.create(newevento, function (err, evento) {
                    if (err) {
                        logger.newErrorLog(err, "Error on save route : ", criador, "addNewEvento")
                        callback(err)
                    } else {
                        upadteUserEvento(evento.usuarios, evento)
                        evento.usuarios.forEach(function (entry) { 
                            UsuarioModel.addNotfEvento(evento.criador, entry, EVENTO_ADD_NOTF, evento)
                        })
                        callback(err, evento)
                    }
                })
            })
        }
    })
}

eventoSchema.statics.updateEvento = function (obj, usuarios_to_remove, sessionUser, callback) {
    var model = this
    if ((obj.criador._id == sessionUser._id) || sessionUser.admin) {
        model.validateEvento(obj, function (err) {
            if (err) { 
                logger.newErrorLog(err, "Error on route update validator: ", null, "updateEvento")
                callback(err)
            } else {
                var id = obj._id
                model.findByIdAndUpdate(id, obj, {}, function (err, doc) {
                    if (err) {
                        logger.newErrorLog(err, "Error on route update: ", null, "updateEvento")
                        callback(err)
                    } else {
                        upadteUserEvento(obj.usuarios, doc)
                        removeEventoFromUsuarios(usuarios_to_remove, doc, function () { })
                        doc.usuarios.forEach(function (entry) {
                            UsuarioModel.addNotfEvento(doc.criador, entry, EVENTO_UPDATE_NOTF, obj)
                        })
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

eventoSchema.statics.removeEvento = function (id, user, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove")
            callback(err)
        } else {
            if (user.admin == true || doc.criador == user._id) {
                doc.usuarios.forEach(function (entry, doc) {
                    UsuarioModel.addNotfEvento(doc.criador, entry, EVENTO_REMOVED_NOFT, doc)
                })
                removeEventoFromUsuarios(doc.usuarios, doc, function (err) {
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
    var timeModel = require('./Time.js')
    if (usuarios && usuarios.length > 0) {
        if (times && times.length > 0) {
            timeModel.find({ _id : { $in: times } }, function (err, docs) {
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

function removeEventoFromUsuarios(usuarios_to_remove, evento, callback) {
    var idEvento = evento._id
    if (usuarios_to_remove) {
        UsuarioModel.find({ _id : { $in : usuarios_to_remove } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting usuarios for update", null, "removeEventoFromUsuarios")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.eventos.indexOf(idEvento)
                    entry.eventos.splice(index, 1)
                    entry.save()
                    UsuarioModel.addNotfEvento(evento.criador, entry._id, EVENTO_REMOVED_USER_NOTF, evento)
                })
                callback()
            }
        })
    } else {
        callback()
    }
}

function upadteUserEvento(usuarios, evento) {
    var idEvento = evento._id
    usuarios.forEach(function (usuario) {
        UsuarioModel.update({ _id : usuario }, { $addToSet: { eventos : idEvento } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error updating users Events", null, "upadteUserEvento")
            }
        })
    })
}

module.exports = mongoose.model('Evento', eventoSchema)