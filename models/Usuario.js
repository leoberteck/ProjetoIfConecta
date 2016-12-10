var mongoose = require('mongoose')
var logger = require('../helper/logHelper.js')
var bcrypt = require('bcrypt-nodejs')
var notftype = require('../enum/notftype.js')

var Schema = mongoose.Schema
var userSchema = new Schema({
    nome : String,
    descricao : String,
    email: { type : String, unique: true, required : true},
    senha : { type : String, required : true },
    cargo : { type: { id : mongoose.Schema.Types.ObjectId, nome : String } },
    campus : { type: { id : mongoose.Schema.Types.ObjectId, nome : String } },
    admin : { type: Boolean, default: false },
    ativo : { type: Boolean, default: true },
    times : [{ type : mongoose.Schema.Types.ObjectId, ref : 'Time' }],
    eventos : [{ type : mongoose.Schema.Types.ObjectId, ref : 'Evento' }],
    arquivos : [{ type : mongoose.Schema.Types.ObjectId, ref : 'Arquivo' }],
    notificacoes : [{
        data : Date,
        mensagem : String,
        tag : { type: Schema.Types.Mixed },
        tipo : String
    }]
})

userSchema.statics.addNotfArquivo = function (iddestinatario, mensagem, arquivo, callback) {
    addNotf(iddestinatario, mensagem, arquivo, notftype.arquivo, callback)
}

userSchema.statics.addNotfEvento = function (iddestinatario, mensagem, evento, callback) {
    addNotf(iddestinatario, mensagem, evento, notftype.evento, callback)
}

userSchema.statics.addNotfTime = function (iddestinatario, mensagem, time, callback) {
    addNotf(iddestinatario, mensagem, time, notftype.time, callback)
}

userSchema.statics.generateNotf = function (mensagem, tag, type) {
    return {
        data : new Date(),
        mensagem : mensagem,
        tag : tag,
        tipo : type
    }
}

function addNotf(iddestinatario, mensagem, tag, type, callback) {
    var model = require("./Usuario.js")
    callback = callback || function () { }
    var newnotf = model.generateNotf(mensagem, tag, type)
    model.update({ _id : iddestinatario }, { $push: { notificacoes : newnotf } }, function (err, docs) {
        if (err) {
            callback(err)
        } else {
            callback()
        }
    })
}

userSchema.statics.generateHash = function (password) {
    return bcrypt.hashSync(password, null, null)
}

userSchema.statics.validatePassword = function (password, hash) { 
    return bcrypt.compareSync(password, hash)
}

userSchema.statics.validateUser = function (usuario, isUpdate, callback) {
    var model = this
    var err = null
    if (!usuario.nome || usuario.nome.trim().length == 0) {
        err = new Error('Nome do usuario vazio')
    } else if (checkForSpecialCharacters(usuario.nome)) {
        err = new Error('Nome do usuario não pode conter caracters especiais')
    } else if (!usuario.email) {
        err = new Error('Email do usuario vazio')
    } else if (!validateEmail(usuario.email)) {
        err = new Error('Email do usuario inválido')
    } else if (!usuario.senha && !isUpdate) {
        err = new Error('Senha do usuario vazia')
    } else if ((!usuario.senha && !isUpdate) && usuario.senha.length < 3) {
        err = new Error('Senha deve conter no mínimo 3 caracteres')
    } else if (!usuario.cargo || !usuario.cargo.id) {
        var err = new Error('Cargo do usuario vazio')
    } else if (!usuario.campus || !usuario.campus.id) {
        var err = new Error('Campus do usuario vazio')
    }
    usuario.cargo.id = new mongoose.Types.ObjectId(usuario.cargo.id)
    usuario.campus.id = new mongoose.Types.ObjectId(usuario.campus.id)
    if (err) {
        err.status = 400
        callback(err)
    } else {
        //Verifica se o email é duplicado
        this.findOne({ email : usuario.email }, {}, {}, function (err, doc) {
            if (doc) {
                if (!isUpdate || (doc._id != usuario._id)) {
                    err = new Error("Ja existe uma conta cadastrada com este email")
                    err.status = 400
                    callback(err)
                } else {
                    model.fillCargoCampus(usuario, function (userFilled) {
                        callback(null, userFilled)
                    })
                }
            }
            else {
                model.fillCargoCampus(usuario, function (userFilled) {
                    callback(null, userFilled)
                })
            }
        })
    }
}

userSchema.statics.fillCargoCampus = function (user, callback) {
    //Verifica se o nome do cargo esta preenchido
    if (!user.cargo.nome && user.cargo.id) {
        var cargoModel = require('./Cargo.js');
        cargoModel.findOne({ _id: user.cargo.id }, function (err, doc) {
            if (!err && doc) {
                user.cargo.nome = doc.nome
                //Verifica se o nome do campus esta preenchido
                if (!user.campus.nome && user.campus.id) {
                    var campusModel = require('./Campus.js')
                    campusModel.findOne({ _id : user.campus.id }, function (err, campusDoc) {
                        if (!err && doc) {
                            user.campus.nome = campusDoc.nome
                            callback(user)
                        }
                    })
                }
                else {
                    callback(user)
                }
            }
        })
    } else {
        callback(user)
    }
}

userSchema.statics.addNewUser = function (obj, callback) {
    var model = this;
    model.validateUser(obj, false, function (err, usuario) {
        if (err) {
            logger.newErrorLog(err, "Error on save validator: ", null, "addNewUser")
            callback(err)
        } else {
            //encrypt passwaord
            usuario.senha = model.generateHash(usuario.senha)
            model.create(usuario, function saveCB(err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on save: ", null, "addNewUser")
                    callback(err)
                } else {
                    callback(err, doc)
                }
            })
        }
    })
}

userSchema.statics.updateUser = function (obj, times_to_remove, callback) {
    var model = this
    model.validateUser(obj, true, function (err, usuario) {
        if (err) {
            logger.newErrorLog(err, "Error on update validator: ", null, "updateUser")
            callback(err)
        } else {
            var id = usuario._id
            model.findByIdAndUpdate(id, usuario, {}, function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on update: ", null, "updateUser")
                    callback(err)
                } else {
                    removeUsuarioFromTimes(times_to_remove, doc._id, function (err) {
                        if (err) { 
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

userSchema.statics.removeUser = function (id, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err || !doc) {
            logger.newErrorLog(err, "Error while deactivating user", null, "removeUser")
            callback(err)
        }
        else {
            doc.ativo = !doc.ativo
            doc.save(function (err) {
                callback(err)
            })
        }
    })
}

function removeUsuarioFromTimes (times_to_remove, idUser, callback) {
    if (times_to_remove) {
        TimeModel = require('./Time.js')
        TimeModel.update({ _id : { $in : times_to_remove } }, { $pull : {usuarios : idUser}}, {multi : true}, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting times for update", null, "removeUsuarioFromTimes")
                callback(err)
            } else {
                callback()
            }
        })
    } else {
        callback()
    }
}

function removeUsuarioFromEventos(eventos_to_remove, idUser, callback) {
    if (eventos_to_remove) {
        EventoModel = require('./Evento.js')
        EventoModel.update({ _id : { $in : eventos_to_remove } }, { $pull : { usuarios : idUser } }, { multi : true }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting eventos for update", null, "removeUsuarioFromEventos")
                callback(err)
            } else {
                callback()
            }
        })
    } else { 
        callback()
    }
}

function removeUsuarioFromArquivos(arquivos_to_remove, idUser, callback) {
    if (arquivos_to_remove) {
        ArquivoModel = require('./Arquivo.js')
        ArquivoModel.update({ _id : { $in : arquivos_to_remove } }, { $pull : { usuarios : idUser } }, { multi : true }, function (err, docs) {
            if (err) {
                logger.newErrorLog(err, "Error getting arquivos for update", null, "removeUsuarioFromArquivos")
                callback(err)
            } else {
                callback()
            }
        })
    } else { 
        callback()
    }
}

function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

function checkForSpecialCharacters(str) {
    var pattern = new RegExp(/[~`!@#$%\^&*+=\-\[\]\.\\';,/{ }|\\":<>\?]/);
    return pattern.test(str)
}


module.exports = mongoose.model('User', userSchema)