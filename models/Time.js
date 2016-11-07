var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var UsuarioModel = require('./Usuario.js')
var EventoModel = require('./Evento.js')
var helper = require('../helper/modelHelper.js')

var TIME_ADD_NOTF = "Você foi incluído em um time"
var TIME_REMOVED_NOFT = "Um time foi removido"
var TIME_REMOVED_USER_NOTF = "Você foi removido de um time"
var TIME_UPDATE_NOTF = "O time foi alterado"

var Schema = mongoose.Schema
var timeSchema = new Schema({
    nome : { type : String, unique: true, required : true },
    descricao : String,
    usuarios : [{ type : Schema.Types.ObjectId, ref : 'User' }],
    times : [{ type : Schema.Types.ObjectId, ref : 'Time' }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' },
    time_eventos : [{ type : Schema.Types.ObjectId, ref : 'Evento' }],
    time_times : [{ type : Schema.Types.ObjectId, ref : 'Time' }]
})

timeSchema.statics.validateTeam = function (time, isUpdate, callback) {
    var model = this
    var err = null
    if (!time.nome) {
        err = new Error('Nome do time vazio')
    }
    
    if (err) {
        err.status = 400
        callback(err)
    } else {
        //Verifica se o nome é duplicado
        model.findOne({ nome : time.nome }, {}, {}, function (err, doc) {
            if (doc) {
                if (!isUpdate || (doc._id && time._id && doc._id.toString() != time._id.toString())) {
                    err = new Error("Ja existe um time com este nome")
                    err.status = 400
                    callback(err)
                } else {
                    callback()
                }
            }
            else {
                callback()
            }
        })
    }
}

timeSchema.statics.addNewTime = function (obj, criador, callback) {
    var model = this
    model.validateTeam(obj, false, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route save validator: ", criador._id, "addNewTime")
            callback(err)
        } else {
            helper.generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                var newtime = {
                    nome : obj.nome,
                    descricao : obj.descricao,
                    usuarios : usuarios,
                    times : obj.times,
                    criador : criador
                }
                model.create(newtime, function saveCB(err, response) {
                    if (err) {
                        logger.newErrorLog(err, "Error on route save: ", criador._id, "addNewTime")
                        callback(err)
                    } else {
                        response.usuarios.forEach(function (entry) {
                            UsuarioModel.addNotfTime(entry, TIME_ADD_NOTF, response)
                        })
                        upadteTeamTeam(response.times, response._id)
                        upadteUserTeam(response.usuarios, response._id)
                        callback(null, response)
                    }
                })
            })
        }
    })
}

timeSchema.statics.updateTime = function (obj, usuarios_to_remove, times_to_remove, sessionUser, callback) {
    if ((obj.criador._id == sessionUser._id) || sessionUser.admin) {
        var model = this
        model.validateTeam(obj, true, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route update validator: ", sessionUser._id, "updateTime")
                callback(err)
            } else {
                var id = obj._id
                model.find({ _id : { $in : times_to_remove } }, {}, {}, function (err, times) {
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
                    helper.generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                        obj.usuarios = usuarios;
                        model.findByIdAndUpdate(id, obj, {}, function (err, doc) {
                            if (err) {
                                logger.newErrorLog(err, "Error on route update: ", sessionUser._id, "updateTime")
                                callback(err)
                            } else {
                                obj.usuarios.forEach(function (entry) {
                                    UsuarioModel.addNotfTime(entry, TIME_UPDATE_NOTF, obj)
                                })
                                upadteTeamTeam(obj.times, doc._id)
                                upadteUserTeam(obj.usuarios, doc._id)
                                removeTimeFromUsuarios(usuarios_to_remove, times_to_remove, doc, function () {
                                    updateUserTeamRecursive(usuarios_to_remove, [], doc, sessionUser, function () {
                                        updateTimeEventosRecursive(usuarios_to_remove, [], doc, sessionUser, function () {
                                            callback()
                                        })
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

timeSchema.statics.removeTime = function (id, user, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", user._id, "removeTime")
            callback(err)
        } else {
            if (user.admin == true || doc.criador == user._id) {
                doc.usuarios.forEach(function (entry) { 
                    UsuarioModel.addNotfTime(entry, TIME_REMOVED_NOFT, doc)
                })
                removeTimeFromUsuarios(doc.usuarios, [], doc, function (err) {
                    if (err) {
                        callback(err)
                    } else {
                        removeTimeFromEventos(doc, function (err) {
                            if (err) {
                                callback(err)
                            } else {
                                removeTimeFromTimes(doc, function (err) {
                                    if (err) {
                                        callback(err)
                                    } else {
                                        doc.remove(function (err) {
                                            if (err) {
                                                callback(err)
                                            } else {
                                                updateUserTeamRecursive(doc.usuarios, [], doc, user, function () {
                                                    updateTimeEventosRecursive(doc.usuarios, [], doc, user, callback)
                                                })
                                            }
                                        })
                                    }
                                })
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

function removeTimeFromUsuarios(usuarios_to_remove, times_to_remove, time, callback) {
    var idTime = time._id
    if (usuarios_to_remove) {
        UsuarioModel.find({ $or : [{ _id : { $in : usuarios_to_remove } }, { times : { $in : times_to_remove } }] }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting usuarios for update", null, "removeTimeFromUsuarios")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.times.indexOf(idTime)
                    if (index >= 0) {
                        entry.times.splice(index, 1)
                        entry.save()
                        UsuarioModel.addNotfTime(entry, TIME_REMOVED_USER_NOTF, time)
                    }
                })
                callback()
            }
        })
    } else {
        callback()
    }
}

function removeTimeFromEventos(time, callback) {
    var time_to_remove = time._id
    if (time.time_eventos && time.time_eventos.length > 0) {
        EventoModel.find({ _id : { $in : time.time_eventos } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting eventos for update", null, "removeTimeFromEventos")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.times.indexOf(time_to_remove)
                    if (index >= 0) {
                        entry.times.splice(index, 1)
                        entry.save()
                    }
                })
                callback()
            }
        })
    }
    else {
        callback()
    }
    
}

function removeTimeFromTimes(time, callback) {
    model = require("./Time.js")
    if (time.time_times && time.time_times.lengh > 0) {
        var time_to_remove = time._id
        model.find({ _id : { $in : time.time_times } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting eventos for update", null, "removeTimeFromEventos")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    var index = entry.times.indexOf(time_to_remove)
                    if (index >= 0) {
                        entry.times.splice(index, 1)
                        entry.save()
                    }
                })
                if (time.times) {
                    model.find({ _id : { $in : time.times } }, function (err, docs) {
                        if (err) {
                            logger.newErrorLog(err, "Error getting eventos for update", null, "removeTimeFromEventos")
                            callback(err)
                        } else {
                            docs.forEach(function (entry) {
                                var index = entry.time_times.indexOf(time_to_remove)
                                if (index >= 0) {
                                    entry.time_times.splice(index, 1)
                                    entry.save()
                                }
                            })
                            callback()
                        }
                    })
                }
                else {
                    callback()
                }
            }
        })
    }
    else {
        callback()
    }
}

function updateUserTeamRecursive(usuarios_to_remove, usuarios_to_add, time, sessionUser, callback) {
    TimeModel = require('./Time.js')
    if (time.time_times && time.time_times.length > 0) {
        TimeModel.find({ _id : { $in : time.time_times } }, function (err, docs) {
            if (docs && docs.length > 0) {
                docs.forEach(function (entry) {
                    if (usuarios_to_add) {
                        for (var x = 0; x < usuarios_to_add.length; x++) {
                            var index = entry.usuarios.indexOf(usuarios_to_add[x])
                            if (index < 0) {
                                entry.usuarios.push(usuarios_to_add[x])
                            }
                        }
                    }
                    if (usuarios_to_remove) {
                        for (var x = 0; x < usuarios_to_remove.length; x++) {
                            var index = entry.usuarios.indexOf(usuarios_to_remove[x])
                            if (index >= 0) {
                                entry.usuarios.splice(index, 1)
                            }
                        }
                    }
                    TimeModel.updateTime(entry, usuarios_to_remove, [], sessionUser, callback)
                })
            }
            else {
                callback(); 
            }
        })
    }
    else { 
        callback()
    }
}

function updateTimeEventosRecursive(usuarios_to_remove, usuarios_to_add, time, sessionUser, callback) {
    var EventoModel = require('./Evento.js')
    if (time.time_eventos && time.time_eventos.length > 0) {
        EventoModel.find({ _id : { $in : time.time_eventos } }, function (err, eventos) {
            if (eventos && eventos.length > 0) {
                eventos.forEach(function (entry) {
                    if (usuarios_to_add) {
                        for (var x = 0; x < usuarios_to_add.length; x++) {
                            var index = entry.usuarios.indexOf(usuarios_to_add[x])
                            if (index < 0) {
                                entry.usuarios.push(usuarios_to_add[x])
                            }
                        }
                    }
                    if (usuarios_to_remove) {
                        for (var x = 0; x < usuarios_to_remove.length; x++) {
                            var index = entry.usuarios.indexOf(usuarios_to_remove[x])
                            if (index >= 0) {
                                entry.usuarios.splice(index, 1)
                            }
                        }
                    }
                    EventoModel.updateEvento(entry, usuarios_to_remove, [], sessionUser, callback)
                })
            } else {
                callback() 
            }
        })
    }
    else { 
        callback();
    }
}


function upadteTeamTeam(times, idTime) {
    TimeModel = require('./Time.js')
    times.forEach(function (time) {
        TimeModel.update({ _id : time }, { $addToSet: { time_times : idTime } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error updating teams teams", null, "upadteTeamTeam")
            }
        })
    })
}

function upadteUserTeam(usuarios, idTime) {
    userModel = require('./Usuario.js')
    usuarios.forEach(function (usuario) {
        userModel.update({ _id : usuario }, { $addToSet: { times : idTime } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error updating users teams", null, "upadteUserTeam")
            }
        })
    })
}

module.exports = mongoose.model('Time', timeSchema)