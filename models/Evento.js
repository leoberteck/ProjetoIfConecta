﻿var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var Schema = mongoose.Schema
var UsuarioModel = require('./Usuario.js')
var helper = require('../helper/modelHelper.js')

var EVENTO_ADD_NOTF = "Você foi incluído em um evento"
var EVENTO_REMOVED_NOFT = "Um evento foi removido"
var EVENTO_REMOVED_USER_NOTF = "Você foi removido de um evento"
var EVENTO_UPDATE_NOTF = "O evento foi alterado"

var eventoSchema = new Schema({
    nome: { type : String, required : true, },
    descricao : String,
    usuarios : [{ type : Schema.Types.ObjectId, ref : 'User' }],
    times : [{ type : Schema.Types.ObjectId, ref : 'Time' }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' },
    dataIni : Date,
    dataFim : Date
})

eventoSchema.statics.validateEvento = function (evento, callback) {
    var err = null
    if (!evento.nome || evento.nome.trim().length == 0) {
        err = new Error("Nome do evento vazio")
    } else if (checkForSpecialCharacters(evento.nome)) {
        err = new Error("Nome do evento não pode conter caracters especiais")
    }
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
            logger.newErrorLog(err, "Error on save validator", criador._id, "addNewEvento")
            callback(err)
        } else {
            obj.usuarios.push(criador._id.toString())
            helper.generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                var newevento = {
                    nome : obj.nome,
                    descricao : obj.descricao,
                    dataIni : Date.parse(obj.dataIni),
                    dataFim : Date.parse(obj.dataFim),
                    usuarios : usuarios,
                    times : obj.times,
                    criador : criador
                }
                model.create(newevento, function (err, evento) {
                    if (err) {
                        logger.newErrorLog(err, "Error on save route : ", criador._id, "addNewEvento")
                        callback(err)
                    } else {
                        updateUserTime(evento.times, evento)
                        upadteUserEvento(evento.usuarios, evento)
                        evento.usuarios.forEach(function (entry) { 
                            UsuarioModel.addNotfEvento(entry, EVENTO_ADD_NOTF, evento)
                        })
                        callback(err, evento)
                    }
                })
            })
        }
    })
}

eventoSchema.statics.updateEvento = function (obj, usuarios_to_remove, times_to_remove, sessionUser, callback) {
    var model = this
    if ((obj.criador._id == sessionUser._id) || sessionUser.admin) {
        model.validateEvento(obj, function (err) {
            if (err) { 
                logger.newErrorLog(err, "Error on route update validator: ", sessionUser._id, "updateEvento")
                callback(err)
            } else {
                var id = obj._id
                //Retira os usuários do envento.usuários antes de da update
                var TimeModel = require('../models/Time.js')
                TimeModel.find({ _id : { $in : times_to_remove } }, {}, {}, function (err, times) {
                    if (times) {
                        for (var x = 0; x < times.length; x++) {
                            var timeObj = times[x]
                            if (timeObj.usuarios) {
                                for (var y = 0; y < timeObj.usuarios.length; y++) {
                                    var index = obj.usuarios.indexOf(timeObj.usuarios[y].toString())
                                    if (index >= 0) {
                                        obj.usuarios.splice(index, 1)
                                    }
                                }
                            }
                        }
                    }
                    //Gera novamente o array de usuários
                    helper.generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                        obj.usuarios = usuarios;
                        //update o evento    
                        model.findByIdAndUpdate(id, obj, {}, function (err, doc) {
                            if (err) {
                                logger.newErrorLog(err, "Error on route update: ", sessionUser._id, "updateEvento")
                                callback(err)
                            } else {
                                obj.usuarios.forEach(function (entry) {
                                    UsuarioModel.addNotfEvento(entry, EVENTO_UPDATE_NOTF, obj)
                                })
                                updateUserTime(obj.times, doc)
                                upadteUserEvento(obj.usuarios, doc)
                                removeEventoFromUsuarios(usuarios_to_remove, times_to_remove, doc, function () {
                                    removeEventoFromTimes(times_to_remove, doc, function () {
                                        callback()
                                    })
                                })
                            }
                        })
                    })
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
            logger.newErrorLog(err, "Error on remove", user._id)
            callback(err)
        } else {
            if (user.admin == true || doc.criador.toString() == user._id.toString()) {
                doc.usuarios.forEach(function (entry, doc) {
                    UsuarioModel.addNotfEvento(entry, EVENTO_REMOVED_NOFT, doc)
                })
                removeEventoFromUsuarios(doc.usuarios, [], doc, function (err) {
                    if (err) {
                        callback(err)
                    } else {
                        removeEventoFromTimes(doc.times, doc, function (err2) {
                            doc.remove(function (err3) {
                                if (err3) {
                                    callback(err3)
                                } else {
                                    callback()
                                }
                            })
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

function removeEventoFromTimes(times_to_remove, evento, callback) {
    var idEvento = evento._id
    if (times_to_remove) {
        var TimeModel = require('../models/Time.js')
        TimeModel.find({ _id : { $in : times_to_remove }}, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting times for update", null, "removeEventoFromTimes")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.time_eventos.indexOf(idEvento)
                    if (index >= 0) {
                        entry.time_eventos.splice(index, 1)
                        entry.save()
                    }
                })
                callback()
            }
        })
    } else {
        callback()
    }
}

function removeEventoFromUsuarios(usuarios_to_remove, times_to_remove, evento, callback) {
    var idEvento = evento._id
    if (usuarios_to_remove) {
        UsuarioModel.find({ $or :[{ _id : { $in : usuarios_to_remove } }, { times : { $in : times_to_remove } }] }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting usuarios for update", null, "removeEventoFromUsuarios")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.eventos.indexOf(idEvento)
                    if (index >= 0) {
                        entry.eventos.splice(index, 1)
                        entry.save()
                        UsuarioModel.addNotfEvento(entry._id, EVENTO_REMOVED_USER_NOTF, evento)
                    }
                })
                callback()
            }
        })
    } else {
        callback()
    }
}

function updateUserTime(times, evento) { 
    var idEvento = evento._id
    times.forEach(function (time) {
        var TimeModel = require('../models/Time.js')
        TimeModel.update({ _id : time }, { $addToSet: { time_eventos : idEvento } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error updating teams Events", null, "upadteTeamEvento")
            }
        })
    })
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

function checkForSpecialCharacters(str) {
    var pattern = new RegExp(/[~`!@#$%\^&*+=\-\[\]\.\\';,/{}|\\":<>\?]/);
    return pattern.test(str)
}

module.exports = mongoose.model('Evento', eventoSchema)