﻿var msgSaveSuccess = 'Salvo com sucesso'
var msgSaveError = 'Não foi possivel salvar'
var msgEditSuccess = 'Salvo com sucesso'
var msgEditError = 'Não foi possivel salvar'
var msgDelSuccess = 'Deletado com sucesso'
var msgDelError = 'Não foi possível deletar'
var viewFormUrl = "campus/campusForm"
var viewListUrl = "campus/campusList"
var viewEditUrl = "campus/campusEdit"
var model = require('../models/Campus.js')
var logger = require('../helper/logHelper.js')

//Show the form for item edition
exports.viewEdit = function (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    model.findOne({ _id : id }, function showFindOneCB(err, obj) {
        if (err) { logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user, "viewEdit") }
        var locals = { campus : obj, admin : req.session.admin }
        res.render(viewEditUrl, locals)
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
                            campuss : objs,
                            pages : pages,
                            active : page,
                            admin : req.session.admin
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
    res.render(viewFormUrl, { admin: req.session.admin })
}

//Handles save requests
exports.saveItem = function (req, res, next) {
    console.log(req.body)
    model.addNewCampus(req.body, function (err, response) {
        if (err) {
            logger.newErrorLog(err, "Error on route saveItem: ", req.session.user, "campusSaveItem")
            res.status(err.status || 500).send("Erro tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogAdd(req.body, req.session.user, "CampusAdded")
            res.status(200).send("Salvo com sucesso")
        }
    })
}

//Handles update requests
exports.editItem = function (req, res, next) {
    model.updateCampus(req.body, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route editItem: ", req.session.user, "campusEditItem")
            res.status(err.status || 500).send("Erro tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogUpdate(req.body, req.session.user, "CampusUpdated")
            res.status(200).send("Alterado com sucesso")
        }
    })
}

//Handles deletion requests
exports.removeItem = function (req, res, next) {
    var obj = req.body
    if (obj.id) {
        model.removeCampus(obj.id, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user, "campusRemoveItem")
                res.status(err.status || 500).send("Erro tentar remover o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user, "CampusRemoved")
                res.status(200).send("Removido com sucesso")
            }
        })
    }
}

//Generic functions can be used on both request  handlers and api functions

var getAll = function (skip, callback) {
    model.find({}, {}, { skip: skip, limit: 30 }, function getobjsCB(err, objs) {
        if (err) {
            callback(err)
        }
        callback(null, objs)
    })
}


//Create page numeration for pagination
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