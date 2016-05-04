﻿var msgSaveSuccess = 'Salvo com sucesso'
var msgSaveError = 'Não foi possivel salvar'
var msgEditSuccess = 'Salvo com sucesso'
var msgEditError = 'Não foi possivel salvar'
var msgDelSuccess = 'Deletado com sucesso'
var msgDelError = 'Não foi possível deletar'
var viewFormUrl = 'time/TimeForm'
var viewListUrl = 'time/TimeList'
var viewEditUrl = 'time/TimeEdit'
var viewShowUrl = 'time/timeShow'
var model = require('../models/Time.js')
var logger = require('../helper/logHelper.js')

//Show the form for item edition
exports.viewEdit = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro a ser atualizado
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user, "timeViewEdit")
            next(err)
        } else {
            var time = obj
            //busca por todos os usuarios para preencher dropdowns
            getFormLocals(function (err, result) {
                if (err) {
                    next(err)
                } else {
                    var locals = {
                        usuarios : result.usuarios,
                        times : result.times,
                        time : time,
                        admin : req.session.admin
                    }
                    res.render(viewEditUrl, locals)
                }
            })
        }
    })
}

//Show the form with a list of items
exports.viewList = function (req, res, next) {
    var idCriador = req.session.admin == true || req.params.all ? null : req.session.user._id
    getListLocals(req.params.page, idCriador, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user, "timeviewList")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            res.render(viewListUrl, locals)
        }
    })
}

exports.viewListAll = function (req, res, next) {
    getListLocals(req.params.page, null, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewListAll: ", req.session.user, "timeviewListAll")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            res.render(viewListUrl, locals)
        }
    })
}


//Show the form for item inclusion
exports.viewForm = function (req, res, next) {
    getFormLocals(function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewForm: ", req.session.user, "timeviewForm")
            next(err)
        } else {
            locals.admin = req.session.admin
            res.render(viewFormUrl, locals)
        }
    })
}

//Mostra detalhes do time
exports.viewShow = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user, "timeViewShow")
            next(err)
        } else {
            var locals = {
                time : obj,
                admin : req.session.admin
            }
            res.render(viewShowUrl, locals)
        }
    })
}

//Handles save requests
exports.saveItem = function (req, res, next) {
    console.log(req.body)
    model.addNewTime(req.body, req.session.user, function (err, response) {
        if (err) {
            logger.newErrorLog(err, "Error on route saveItem: ", req.session.user, "timeSaveItem")
            res.status(err.status || 500).send("Erro tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogAdd(req.body, req.session.user, "TimeAdded")
            res.status(200).send("Salvo com sucesso")
        }
    })
}

//Handles update requests
exports.editItem = function (req, res, next) {
    var time = req.body.time
    var usuarios_to_remove = req.body.usuarios_to_remove
    
    model.updateTime(time, usuarios_to_remove, req.session.user, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route editItem: ", req.session.user, "timeEditItem")
            res.status(err.status || 500).send("Erro tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogUpdate(time, req.session.user, "TimeUpdated")
            res.status(200).send("Alterado com sucesso")
        }
    })   
}

//Handles deletion requests
exports.removeItem = function (req, res, next) {
    var obj = req.body
    if (obj.id) {
        model.removeTime(obj.id, req.session.user, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user, "timeRemoveItem")
                res.status(err.status || 500).send("Erro tentar remover o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user, "TimeRemoved")
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
        filtro = {criador : idCriador}
    }
    model.find(filtro, {}, { skip: skip, limit: 30 }, function getobjsCB(err, objs) {
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
    var UsuarioModel = require('../models/Usuario.js')
    //Get usuarios
    UsuarioModel.find({}, function (err, usuarios) {
        if (err) {
            error.status = 500
            callback(error)
        } else {
            locals = { usuarios : usuarios, times : null, admin : false }
            model.find({}, function (err, times) {
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
                            times : objs,
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