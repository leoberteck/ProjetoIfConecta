var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var UsuarioModel = require('./Usuario.js')

var TIME_ADD_NOTF = "Você foi incluído em um time"
var TIME_REMOVED_NOFT = "Um time foi removido"
var TIME_REMOVED_USER_NOTF = "Você foi removido de um time"
var TIME_UPDATE_NOTF = "O time foi alterado"

var Schema = mongoose.Schema
var timeSchema = new Schema({
    nome : { type : String, unique: true, required : true },
    descricao : String,
    usuarios : [{ type : Schema.Types.ObjectId, ref : 'User' }],
    criador : { type : Schema.Types.ObjectId, ref : 'User' }
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
                if (isUpdate && (doc._id != time._id)) {
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
            logger.newErrorLog(err, "Error on route save validator: ", criador, "addNewTime")
            callback(err)
        } else {
            generateUsersArray(obj.usuarios, obj.times, function (usuarios) {
                var newtime = {
                    nome : obj.nome,
                    descricao : obj.descricao,
                    usuarios : usuarios,
                    criador : criador
                }
                model.create(newtime, function saveCB(err, response) {
                    if (err) {
                        logger.newErrorLog(err, "Error on route save: ", criador, "addNewTime")
                        callback(err)
                    } else {
                        response.usuarios.forEach(function (entry) {
                            UsuarioModel.addNotfTime(response.criador, entry, TIME_ADD_NOTF, response)
                        })
                        upadteUserTeam(response.usuarios, response._id)
                        callback(null, response)
                    }
                })
            })
        }
    })
}

timeSchema.statics.updateTime = function (obj, usuarios_to_remove, sessionUser, callback) {
    if ((obj.criador._id == sessionUser._id) || sessionUser.admin) {
        var model = this
        model.validateTeam(obj, true, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route update validator: ", null, "updateTime")
                callback(err)
            } else {
                var id = obj._id
                model.findByIdAndUpdate(id, obj, {}, function (err, doc) {
                    if (err) {
                        logger.newErrorLog(err, "Error on route update: ", null, "updateTime")
                        callback(err)
                    } else {
                        doc.usuarios.forEach(function (entry) {
                            UsuarioModel.addNotfTime(doc.criador, entry, TIME_UPDATE_NOTF, obj)
                        })
                        upadteUserTeam(obj.usuarios, doc._id)
                        removeTimeFromUsuarios(usuarios_to_remove, doc, function () { })
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

timeSchema.statics.removeTime = function (id, user, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", null, "removeTime")
            callback(err)
        } else {
            if (user.admin == true || doc.criador == user._id) {
                doc.usuarios.forEach(function (entry) { 
                    UsuarioModel.addNotfTime(doc.criador, entry, TIME_REMOVED_NOFT, doc)
                })
                removeTimeFromUsuarios(doc.usuarios, doc, function (err) {
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

function removeTimeFromUsuarios(usuarios_to_remove, time, callback) {
    var idTime = time._id
    if (usuarios_to_remove) {
        UsuarioModel.find({ _id : { $in : usuarios_to_remove } }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting usuarios for update", null, "removeTimeFromUsuarios")
                callback(err)
            } else {
                docs.forEach(function (entry) {
                    UsuarioModel.addNotfTime(time.criador, entry, TIME_REMOVED_USER_NOTF, time)
                    var index = entry.times.indexOf(idTime)
                    entry.times.splice(index, 1)
                    entry.save()
                })
                callback()
            }
        })
    } else {
        callback()
    }
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