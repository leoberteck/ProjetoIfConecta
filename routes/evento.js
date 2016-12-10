var msgSaveSuccess = 'Salvo com sucesso'
var msgSaveError = 'Não foi possivel salvar'
var msgEditSuccess = 'Salvo com sucesso'
var msgEditError = 'Não foi possivel salvar'
var msgDelSuccess = 'Deletado com sucesso'
var msgDelError = 'Não foi possível deletar'
var viewFormUrl = 'evento/eventoForm'
var viewListUrl = 'evento/eventoList'
var viewEditUrl = 'evento/eventoEdit'
var viewShowUrl = 'evento/eventoShow'
var model = require('../models/Evento.js')
var logger = require('../helper/logHelper.js')

//Show the form for item edition
exports.viewEdit = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro a ser atualizado
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'times', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user._id, "eventoViewEdit")
            next(err)
        } else {
            var evento = obj
            if (req.session.admin || req.session.user._id == evento.criador._id) {
                //busca por todos os usuarios para preencher dropdowns
                getFormLocals(req.session.user._id, function (err, result) {
                    if (err) {
                        next(err)
                    } else {
                        var locals = {
                            usuarios : result.usuarios,
                            times : result.times,
                            evento : evento,
                            admin : req.session.admin,
                            name : req.session.user.nome,
                            userid : req.session.user._id
                        }
                        res.render(viewEditUrl, locals)
                    }
                })
            }
            else {
                res.render("401")
            }
        }
    })
}

//Show the form with a list of items
exports.viewList = function (req, res, next) {
    var idCriador = req.session.admin == true || req.params.all ? null : req.session.user._id
    getListLocals(req.params.page, idCriador, function (err, locals) {
        if (err) {
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            locals.name = req.session.user.nome
            res.render(viewListUrl, locals)
        }
    })
}

//Show the form for item inclusion
exports.viewForm = function (req, res, next) {
    getFormLocals(req.session.user._id, function (err, locals) {
        if (err) {
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.name = req.session.user.nome
            res.render(viewFormUrl, locals)
        }
    })
}

//Mostra detalhes do evento
exports.viewShow = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user._id, "eventoViewShow")
            next(err)
        } else {
            var locals = {
                evento : obj,
                admin : req.session.admin,
                name : req.session.user.nome,
                userid : req.session.user._id
            }
            res.render(viewShowUrl, locals)
        }
    })
}

exports.viewListAll = function (req, res, next) {
    getListLocals(req.params.page, null, function (err, locals) {
        if (err) {
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            res.render(viewListUrl, locals)
        }
    })
}

//Handles save requests
exports.saveItem = function (req, res, next) {
    model.addNewEvento(req.body, req.session.user, function (err, response) {
        if (err) {
            logger.newErrorLog(err, "Error on route saveItem: ", req.session.user._id, "eventoSaveItem")
            res.status(err.status || 500).send("Erro ao tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogAdd(req.body, req.session.user._id, "EventoAdded")
            res.status(200).send("Salvo com sucesso")
        }
    })
}

//Handles update requests
exports.editItem = function (req, res, next) {
    var evento = req.body.evento
    var usuarios_to_remove = req.body.usuarios_to_remove
    var times_to_remove = req.body.times_to_remove
    model.updateEvento(evento, usuarios_to_remove, times_to_remove, req.session.user, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route editItem: ", req.session.user._id, "eventoEditItem")
            res.status(err.status || 500).send("Erro ao tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogUpdate(evento, req.session.user._id, "EventoUpdated")
            res.status(200).send("Alterado com sucesso")
        }
    })
}

//Handles deletion requests
exports.removeItem = function (req, res, next) {
    var obj = req.body
    if (obj.id) {
        model.removeEvento(obj.id, req.session.user, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user._id, "eventoRemoveItem")
                res.status(err.status || 500).send("Erro ao tentar remover o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user._id, "EventoRemoved")
                res.status(200).send("Removido com sucesso")
            }
        })
    } else {
        res.status(400).send("Nenhum item selectionado")
    }
}

//Generic functions can be used on both request  handlers and api functions
var getAll = function (skip, idCriador, callback) {
    var filtro = {}
    if (idCriador) {
        filtro = { $or : [ { criador : idCriador}, { usuarios : { $in : [idCriador] } }] }
    }
    model.find(filtro, {}, { skip: skip, limit: 30, sort : "-dataIni" }, function getobjsCB(err, objs) {
        if (err) {
            callback(err)
        } else {
            //quebra os eventos dos usuários por "Futuros", "Agora" e "Passados"
            var grouped = []
            grouped[0] = [] //future
            grouped[1] = [] //ongoing
            grouped[2] = [] //past
            var today = new Date()
            objs.forEach(function (evento) {
                if (today >= evento.dataIni && today <= evento.dataFim) {
                    grouped[1].push(evento);
                } else if (today < evento.dataIni) {
                    grouped[0].push(evento);
                } else {
                    grouped[2].push(evento);
                }
            })
            callback(null, grouped)
        }
    })
}

//Search for all cargos and all campus to fill form dropdowns
function getFormLocals(idUsuario, callback) {
    var locals
    var UsuarioModel = require('../models/Usuario.js')
    var TimeModel = require('../models/Time.js')
    //Get usuarios
    UsuarioModel.find({}, {}, {sort : "nome"}, function (err, usuarios) {
        if (err) {
            error.status = 500
            callback(error)
        } else {
            locals = { usuarios : usuarios, times : null, admin : false }
            TimeModel.getAllForUsuario(null, idUsuario, function (err, times) {
                if (err) {
                    callback(err)
                } else {
                    locals.times = times
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

function getListLocals(page, idCriador, callback) {
    page = page || 1
    if (page >= 1) {
        var skip = 30 * (page - 1)
        getAll(skip, idCriador, function (err, objs) {
            if (err) {
                err.status = 500
                callback(err)
            } else {
                generatePagination(page, function (err, pages) {
                    if (err) {
                        err.status = 404
                        callback(err)
                    } else {
                        var locals = {
                            eventos : objs,
                            pages : pages,
                            active : page,
                            admin : null,
                            userid : null
                        }
                        callback(null, locals)
                    }
                })
            }
        })
    } else {
        var err = new Error("Index out of bounds")
        err.status = 404
        callback(err)
    }
}