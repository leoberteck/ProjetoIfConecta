var model = require("../models/Log.js")
var logger = require('../helper/logHelper.js')
var viewListUrl = "log/viewList"
var viewShowUrl = "log/viewShow"

exports.viewList = function (req, res, next) { 
    getListLocals(req.params.page, function (err, locals) {
        if (err) {
            logger.newErrorLog(err, "Error on route viewList: ", req.session.user._id, "logviewList")
            next(err)
        } else {
            locals.admin = req.session.admin
            locals.userid = req.session.user._id
            locals.name = req.session.user.nome
            res.render(viewListUrl, locals)
        }
    })
}

exports.viewShow = function (req, res, next) {
    var id = req.params.id;
    if (id) {
        var log = model.findById(id).populate({ path : 'usuario', select : '_id nome' })
        .exec(function (err, log) { 
            res.render(viewShowUrl, { log : log })
        })
    }
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

function getListLocals(page, callback) {
    page = page || 1
    if (page >= 1) {
        var skip = 30 * (page - 1)
        model.getAll(skip, function (err, objs) {
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
                            logs : objs,
                            pages : pages,
                            active : page,
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