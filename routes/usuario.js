var msgSaveSuccess = 'Salvo com sucesso'
var msgSaveError = 'Não foi possivel salvar'
var msgEditSuccess = 'Salvo com sucesso'
var msgEditError = 'Não foi possivel salvar'
var msgDelSuccess = 'Deletado com sucesso'
var msgDelError = 'Não foi possível deletar'
var viewFormUrl = 'usuario/UsuarioForm'
var viewListUrl = 'usuario/UsuarioList'
var viewEditUrl = 'usuario/UsuarioEdit'
var viewShowUrl = 'usuario/UsuarioShow'
var model = require('../models/Usuario.js')
var TokenModel = require('../models/Token.js')
var logger = require('../helper/logHelper.js')
var mailer = require('../helper/mailer.js')
var mongoose = require('mongoose')

//login route
exports.login = function (req, res, next) {
    var email = req.body.email
    var pass = req.body.pass
    if (email && pass) {
        model.findOne({ email : email }, function (err, doc) {
            if (err || !doc) {
                logger.newLogAccessDenied(email, "login")
                res.status(400).send("Email ou senha incorretos")
            } else {
                if (!model.validatePassword(pass, doc.senha)) {
                    logger.newLogAccessDenied(email, "login")
                    res.status(400).send("Email ou senha incorretos")
                } else {
                    req.session.user = doc
                    req.session.admin = doc.admin || false
                    res.status(200).send("OK")
                }
            }
        })
    } else {
        logger.newLogAccessDenied(email, "login")
        res.status(400).send("Informe email e a senha")
    }
}

exports.logout = function (req, res, next) {
    req.session.destroy(function (err) { 
        res.redirect('/')
    })
}

//Show the form for item edition
exports.viewEdit = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro a ser atualizado
    model.findOne({ _id : id }).populate({path : 'times', select : '_id nome', options : {sort : 'nome'}}).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user._id, "usuarioviewEdit")
            next(err)
        } else {
            var usuario = obj
            //verificar as permissões do usuário
            if (usuario._id == req.session.user._id || req.session.admin) {
                //busca por todos os cargos e campus para preencher dropdowns
                getFormLocals(function (err, result) {
                    if (err) {
                        next(err)
                    } else {
                        var locals = {
                            cargos : result.cargos,
                            campuss : result.campuss,
                            usuario : usuario,
                            admin : req.session.admin,
                            name : req.session.user.nome,
                            userid : req.session.user._id
                        }
                        res.render(viewEditUrl, locals)
                    }
                })
            } else { 
                res.render("401");
            }
        }
    })
}

//Show the form with a list of items
exports.viewList = function (req, res, next) {
    if (req.params.page >= 1) {
        var page = req.params.page || 1
        var skip = 30 * (page - 1)
        getAll(skip, function (err, objs) {
            if (err) {
                err.status = 500
                next(err)
            } else {
                generatePagination(page, function (err, pages) {
                    if (err) {
                        err.status = 404
                        next(err)
                    } else {
                        var locals = {
                            usuarios : objs,
                            pages : pages,
                            active : page,
                            admin : req.session.admin,
                            name : req.session.user.nome,
                            userid : req.session.user._id
                        }
                        res.render(viewListUrl, locals)
                    }
                })
            }
        })
    } else {
        var err = new Error("Index out of bounds")
        err.status = 404
        next(err)
    }
}

//Show the form for item inclusion
exports.viewForm = function (req, res, next) {
    getFormLocals(function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewForm: ", req.session.user._id, "usuarioviewForm")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.name = req.session.user.nome
            res.render(viewFormUrl, locals)
        }
    })
}

exports.viewNewForm = function (req, res, next) {
    getFormLocals(function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewNewForm: ", req.session.user._id, "usuarioviewNewForm")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.message = req.flash('signupMessage')
            res.render('usuario/NewUsuarioForm', locals)
        }
    })
}

//Mostra detalhes do usuario
exports.viewShow = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro
    model.findOne({ _id : id }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user._id, "usuarioShow")
            next(err)
        } else {
            var locals = {
                usuario : obj,
                admin : req.session.admin,
                name : req.session.user.nome,
                userid : req.session.user._id
            }
            res.render(viewShowUrl, locals)
        }
    })
}

//Handles save requests
exports.saveItem = function (req, res, next) {
    if (req.body && (req.body.admin == false || req.session.admin == true)) {
        model.addNewUser(req.body, function (err, response) {
            if (err) {
                logger.newErrorLog(err, "Error on route saveItem: ", req.session.user._id, "usuariosaveItem")
                res.status(err.status || 500).send("Erro tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogAdd(req.body, req.session.user._id, "UsuarioAdded")
                res.status(200).send("Salvo com sucesso")
            }
        })
    } else {
        res.status(400).send("Erro tentar salvar o item, detalhes : formulário não preenchido corretamente.")
    }
}

//Handles update requests
exports.editItem = function (req, res, next) {
    var usuario = req.body.usuario
    var times_to_remove = req.body.times_to_remove
    //verificar as permissões do usuário
    if (usuario._id.toString() == req.session.user._id.toString() || req.session.admin) {
        model.updateUser(usuario, times_to_remove, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route editItem: ", req.session.user._id, "usuarioeditItem")
                res.status(err.status || 500).send("Erro tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogUpdate(usuario, req.session.user._id, "UsuarioUpdated")
                res.status(200).send("Alterado com sucesso")
            }
        })
    } else { 
        res.status(401).send("Acesso não permitido")
    }
}

//Handles deletion requests
exports.removeItem = function (req, res, next) {
    var obj = req.body
    if (obj.id) {
        model.removeUser(obj.id, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user._id, "usuarioremoveItem")
                res.status(err.status || 500).send("Erro tentar mudar status do item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user._id, "UsuarioRemoved")
                res.status(200).send("Status alterado com sucesso")
            }
        })
    }
}

exports.timeline = function (req, res, next) {
    getDashUserLocas(req.params.page, req.session.user._id, function (locals) {
        res.render("usuario/timeline", locals)
    })
}

exports.requestPassChange = function (req, res, next) {
    var email = req.params.email
    model.findOne({ email : email, ativo : true }, '_id email', function (err, doc) {
        if (err || !doc) {
            res.status(400).send("Usuário não encontrado")
        }
        else {
            var expire = new Date()
            expire.setDate(expire.getDate() + 1)
            var newToken = new TokenModel({ usuario : doc._id, expire : expire })
            newToken.save(function (err) {
                mailer.sendEmail(
                    doc.email, 
                    "Pedido de mudança de senha", 
                    "<h1>Acesse este link para mudar sua senha</h1><br />" + 
                    "<a href='http://" + req.get('host') + "/pass/change/" + newToken._id + "'>Clique aqui</a>"
                )
                res.render("usuario/passChangeRquest")
            })
        }
    })
}

exports.viewChangePass = function (req, res, next) {
    var today = new Date()
    var tokenId = req.params.token
    TokenModel.findById(tokenId).populate({ path : 'usuario', select : '_id nome'}).exec(function (err, token) {
        if (err || !token) {
            res.status(400).send("Token Inválido")
        }
        else {
            if (token.expire < today) {
                res.status(400).send("Token Inválido")
            }
            else { 
                res.render('usuario/viewChangePass', token.usuario)
            }
        }
    })
}

exports.changePass = function (req, res, next) {
    var id = req.body.idusuario
    var newpass = req.body.newpass
    model.findById(id, function (err, doc) {
        if (err || !doc) {
            res.status(400).send("Usuário não encontrado")
        } else {
            TokenModel.remove({usuario : doc._id}, function () { })
            doc.senha = model.generateHash(newpass)
            doc.save(function (err) { 
                res.redirect('/login')
            })
        }
    })
}

//Generic functions can be used on both request  handlers and api functions
var getAll = function (skip, callback) {
    model.find({}, { notificacoes : false }, { skip: skip, limit: 30, sort : "nome" }, function getobjsCB(err, objs) {
        if (err) {
            callback(err)
        } else { 
            callback(null, objs)
        }
        return objs
    })
}


//Search for all cargos and all campus to fill form dropdowns
function getFormLocals(callback) {
    var locals
    var CargoModel = require('../models/Cargo.js')
    //Gets cargos
    CargoModel.find({}, {}, {sort : "nome"}, function (error, cargos) {
        if (error) {
            error.status = 500
            callback(error)
        } else {
            locals = { cargos : cargos, campuss : null, admin : false }
            //Get Campus
            var CampusModel = require('../models/Campus.js')
            CampusModel.find({}, {}, {sort : "nome"}, function (error, campuss) {
                if (error) {
                    error.status = 500
                    callback(error)
                } else {
                    locals.campuss = campuss
                    callback(null, locals)
                }
            })
        }
    })
}

var generatePagination = function (page, callback) {
    var min = page >= 6 ? page - 4 : 1
    model.count({}, function (err, count) {
        if (err) {
            callback(err)
        } else {
            var max = Math.ceil(count / 30);
            if (page > max && max != 0) {
                callback(new Error("Index out of bounds"))
            } else {
                var pages = []
                for (var x = 0; x < 10; x++) {
                    if (min > max) {
                        break
                    } else {
                        pages.push(min)
                        min++
                    }
                }
                callback(null, pages)
            }
        }
    })
}

function getDashUserLocas(page, idUser, callback) {
    var limit = 5
    idUser = new mongoose.Types.ObjectId(idUser)
    page = page || 1
    if (page >= 1) {
        var skip = limit * (page - 1)
        model.aggregate([
            { $match : { "_id" : new mongoose.Types.ObjectId(idUser) } },
            { $project : { "notificacoes" : true, "_id" : false } },
            { $unwind : "$notificacoes" },
            { $sort : { "notificacoes.data" : -1 } },
            { $skip : skip },
            { $limit : limit }
        ], function (err, docs) {
            if (!err && docs) {
                var notfs = docs.map(function (entry) { return entry.notificacoes})
                callback({notificacoes : notfs})
            } else {
                callback(null)
            }
        })
    }
}
