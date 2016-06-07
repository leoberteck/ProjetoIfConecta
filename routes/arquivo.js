var msgSaveSuccess = 'Salvo com sucesso'
var msgSaveError = 'Não foi possivel salvar'
var msgEditSuccess = 'Salvo com sucesso'
var msgEditError = 'Não foi possivel salvar'
var msgDelSuccess = 'Deletado com sucesso'
var msgDelError = 'Não foi possível deletar'
var viewFormUrl = 'arquivo/arquivoForm'
var viewListUrl = 'arquivo/arquivoList'
var viewEditUrl = 'arquivo/arquivoEdit'
var viewShowUrl = 'arquivo/arquivoShow'
var logger = require('../helper/logHelper.js')
var model = require('../models/Arquivo.js')


//Show the form for item edition
function viewEdit(req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro a ser atualizado
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user, "arquivoViewEdit")
            next(err)
        } else {
            var arquivo = obj
            //busca por todos os usuarios para preencher dropdowns
            getFormLocals(function (err, result) {
                if (err) {
                    next(err)
                } else {
                    var locals = {
                        usuarios : result.usuarios,
                        times : result.times,
                        arquivo : arquivo,
                        admin : req.session.admin,
                        name : req.session.user.nome
                    }
                    res.render(viewEditUrl, locals)
                }
            })
        }
    })
}

//Show the form with a list of items
function viewList(req, res, next) {
    var idCriador = req.session.admin == true || req.params.all ? null : req.session.user._id
    getListLocals(req.params.page, idCriador, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user, "arquivoviewList")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            res.render(viewListUrl, locals)
        }
    })
}

//Show the form for item inclusion
function viewForm (req, res, next) {
    getFormLocals(function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewForm: ", req.session.user, "arquivoviewForm")
            next(err)
        } else {
            locals.admin = req.session.admin
            res.render(viewFormUrl, locals)
        }
    })
}

//Mostra detalhes do arquivo
function viewShow (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro
    model.findOne({ _id : id }).populate({ path : 'usuarios', select : '_id nome', options : { sort : 'nome' } }).populate({ path : 'criador', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user, "arquivoViewShow")
            next(err)
        } else {
            var locals = {
                arquivo : obj,
                admin : req.session.admin
            }
            res.render(viewShowUrl, locals)
        }
    })
}

//Handles save requests
function saveItem (req, res, next) {
    if (req.file) {
        model.addNewArquivo(req.file, req.session.user, function (err, newid) {
            if (err) {
                logger.newErrorLog(err, "Error on route saveItem: ", req.session.user, "arquivoSaveItem")
                res.status(err.status || 500).send("Erro tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogAdd(req.body, req.session.user, "ArquivoAdded")
                res.redirect('/arquivo/editarquivo/' + newid);
            }
        })
    } else {
        logger.newErrorLog("A file was not uploaded", "Error on route saveItem: ", req.session.user, "arquivoSaveItem")
        res.status(400).send("Erro tentar salvar o item, detalhes : Nenhum arquivo foi recebido");
    }
}

//Handles update requests
function editItem (req, res, next) {
    var arquivo = req.body.arquivo
    var usuarios_to_remove = req.body.usuarios_to_remove
    
    model.updateArquivo(arquivo, usuarios_to_remove, req.session.user, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route editItem: ", req.session.user, "arquivoEditItem")
            res.status(err.status || 500).send("Erro tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogUpdate(arquivo, req.session.user, "ArquivoUpdated")
            res.status(200).send("Alterado com sucesso")
        }
    })
}

//Handles deletion requests
function removeItem (req, res, next) {
    var obj = req.body
    if (obj.id) {
        model.removeArquivo(obj.id, req.session.user, function (err) {
            if (err) {
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user, "arquivoRemoveItem")
                res.status(err.status || 500).send("Erro tentar remover o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user, "ArquivoRemoved")
                res.status(200).send("Removido com sucesso")
            }
        })
    } else {
        res.status(400).send("Nenhum item selectionado")
    }
}

//Generic functions can be used on both request  handlers and api functions
function getAll(skip, idCriador, callback) {
    var filtro = {}
    if (idCriador) {
        filtro = { criador : idCriador }
    }
    model.find(filtro, {}, { skip: skip, limit: 30, sort : "nome" }, function getobjsCB(err, objs) {
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
    UsuarioModel.find({}, {}, { sort : "nome" }, function (err, usuarios) {
        if (err) {
            error.status = 500
            callback(error)
        } else {
            var TimeModel = require('../models/Time.js')
            locals = { usuarios : usuarios, times : null, admin : false }
            TimeModel.find({}, {}, {sort :"nome"}, function (err, times) {
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

function generatePagination (page, callback) {
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
                            arquivos : objs,
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

module.exports = {
    viewEdit : viewEdit,
    viewForm : viewForm,
    viewList : viewList,
    viewShow : viewShow,
    saveItem : saveItem,
    editItem : editItem,
    removeItem : removeItem
}