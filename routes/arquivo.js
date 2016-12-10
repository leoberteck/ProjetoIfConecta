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
var CategoriaModel = require('../models/Categoria.js')


//Show the form for item edition
function viewEdit(req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro a ser atualizado
    model.findOne({ _id : id }).populate({ path : 'criador', select : '_id nome' }).populate({ path : 'categoria', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewEdit: ", req.session.user._id, "arquivoViewEdit")
            next(err)
        } else {
            if (req.session.admin || req.session.user._id == obj.criador._id) {
                CategoriaModel.find({}, function (err, categorias) {
                    var locals = {
                        categorias : categorias,
                        arquivo : obj,
                        admin : req.session.admin,
                        name : req.session.user.nome,
                        userid : req.session.user._id
                    }
                    res.render(viewEditUrl, locals)
                })
            } else {
                res.render("401");
            }
        }
    })
}

//Show the form with a list of items
function viewList(req, res, next) {
    var order = req.query ? req.query.order : null
    var search = req.query? req.query.search : null
    var categoria = req.query && req.query.categoria != "none" ? req.query.categoria : null
    var page = req.params.page
    getListLocals(categoria, order, search, page, null, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user._id, "arquivoviewList")
            next(err)
        } else {
            CategoriaModel.find({}, function (err, categorias) {
                locals.categorias = categorias
                locals.admin = req.session.admin
                locals.userid = req.session.user._id
                locals.name = req.session.user.nome
                locals.search = search
                locals.order = order
                locals.categoria = categoria
                res.render(viewListUrl, locals)
            })
        }
    })
}

function viewListMy(req, res, next) {
    var idCriador = req.session.admin == true || req.params.all ? null : req.session.user._id
    var order = req.query ? req.query.order : null
    var search = req.query? req.query.search : null
    var categoria = req.query && req.query.categoria != "none" ? req.query.categoria : null
    var page = req.params.page
    getListLocals(categoria, order, search, page, idCriador, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user._id, "arquivoviewList")
            next(err)
        } else {
            CategoriaModel.find({}, function (err, categorias) {
                locals.categorias = categorias
                locals.admin = req.session.admin
                locals.userid = req.session.user._id
                locals.name = req.session.user.nome
                locals.search = search
                locals.order = order
                locals.categoria = categoria
                res.render("arquivo/arquivoListMy", locals)
            })
        }
    })
}

function viewListPublic(req, res, next) {
    var order = req.query ? req.query.order : null
    var search = req.query? req.query.search : null
    var categoria = req.query && req.query.categoria != "none" ? req.query.categoria : null
    var page = req.params.page
    getListLocals(categoria, order, search, page, null, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user._id, "arquivoviewList")
            next(err)
        } else {
            CategoriaModel.find({}, function (err, categorias) {
                locals.categorias = categorias
                locals.search = search
                locals.order = order
                locals.categoria = categoria
                res.render("arquivo/arquivoListPublic", locals)
            })
        }
    })
}

//Show the form for item inclusion
function viewForm (req, res, next) {
    res.render(viewFormUrl, { admin : req.session.admin, name : req.session.user.nome, userid : req.session.user._id })
}

//Mostra detalhes do arquivo
function viewShow (req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    //procura registro
    model.findOne({ _id : id }).populate({ path : 'criador', select : '_id nome' }).populate({ path : 'categoria', select : '_id nome' }).exec(function showFindOneCB(err, obj) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewShow: ", req.session.user._id, "arquivoViewShow")
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


function download(req, res, next) {
    if (!req.params.id) return next(Error('Nenhum item selecionado'))
    var id = req.params.id
    model.getForDownload(id, function (err, file, readstream) {
        if (err || !file) {
            res.redirect("/404");
        } else {
            res.set('Content-Type', file.contentType);
            res.set('Content-Disposition', 'attachment; filename="' + file.filename + '"');
            
            readstream.on("error", function (err) {
                res.end();
            });
            readstream.pipe(res);
        }
    })
}

//Handles save requests
function saveItem (req, res, next) {
    if (req.file) {
        model.addNewArquivo(req.file, req.session.user, function (err, newid) {
            if (err) {
                logger.newErrorLog(err, "Error on route saveItem: ", req.session.user._id, "arquivoSaveItem")
                res.status(err.status || 500).send("Erro ao tentar salvar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogAdd(req.body, req.session.user._id, "ArquivoAdded")
                res.redirect('/arquivo/editarquivo/' + newid);
            }
        })
    } else {
        logger.newErrorLog("A file was not uploaded", "Error on route saveItem: ", req.session.user._id, "arquivoSaveItem")
        res.status(400).send("Erro ao tentar salvar o item, detalhes : Nenhum arquivo foi recebido");
    }
}

//Handles update requests
function editItem (req, res, next) {
    var arquivo = req.body.arquivo
    model.updateArquivo(arquivo, req.session.user, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route editItem: ", req.session.user._id, "arquivoEditItem")
            res.status(err.status || 500).send("Erro ao tentar alterar o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
        } else {
            logger.newLogUpdate(arquivo, req.session.user._id, "ArquivoUpdated")
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
                logger.newErrorLog(err, "Error on route removeItem: ", req.session.user._id, "arquivoRemoveItem")
                res.status(err.status || 500).send("Erro ao tentar remover o item, detalhes : \n" + err.message || err || "Detalhes indisponíveis")
            } else {
                logger.newLogRemove(obj, req.session.user._id, "ArquivoRemoved")
                res.status(200).send("Removido com sucesso")
            }
        })
    } else {
        res.status(400).send("Nenhum item selectionado")
    }
}

//Generic functions can be used on both request  handlers and api functions
function getAll(categoria, order, search ,skip, idCriador, callback) {
    var filtro = {}
    var orderBy = {}
    if (idCriador) {
        filtro.criador = idCriador 
    }
    if (order && order == 2) {
        orderBy = { nome : 1 }
    }
    else {
        orderBy = { dataCriacao : -1 }
    }
    if (search) { 
        var searchClause = new RegExp('.*' + search + '.*', "i")
        filtro.$or = [{ nome : searchClause }, { descricao : searchClause } , { palavrasChave : { $in : [searchClause]} }]
    }
    if (categoria) { 
        filtro.categoria = categoria
    }
    model.find(filtro, {}, { skip: skip, limit: 30}).sort(orderBy).populate({ path : 'categoria', select : '_id nome' }).exec(function getobjsCB(err, objs) {
        if (err) {
            callback(err)
        } else {
            callback(null, objs)
        }
        return objs
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

function getListLocals(categoria, order, search, page, idCriador, callback) {
    page = page || 1
    if (page >= 1) {
        var skip = 30 * (page - 1)
        getAll(categoria, order, search, skip, idCriador, function (err, objs) {
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
    viewListMy : viewListMy,
    viewListPublic : viewListPublic,
    viewShow : viewShow,
    saveItem : saveItem,
    editItem : editItem,
    removeItem : removeItem,
    download : download
}