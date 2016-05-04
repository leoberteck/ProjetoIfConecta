var logModel = require('../models/Log.js')
var logType = require('../enum/logtype.js')

function newErrorLog(obj, customMessage, usuario, descricao) {
    var param = process.env.NODE_ENV || 'Development'
    if (param == 'Development') {
        console.log((customMessage || "Error: ") + obj)
    }
    newLog({Status : obj.status, Message : obj.message, Stack : obj.stack}, usuario, descricao, logType.error)
}

function newLogAdd(obj, usuario, descricao) { 
    newLog(obj, usuario, descricao, logType.add)
}

function newLogUpdate(obj, usuario, descricao) { 
    newLog(obj, usuario, descricao, logType.update)
}

function newLogRemove(obj, usuario, descricao) {
    newLog(obj, usuario, descricao, logType.remove)
}

function newLogAccessDenied(obj, descricao) { 
    newLog(obj, null, descricao, logType.accessdenied)
}

function newLog(obj, usuario, descricao, type) {
    var newlog = new logModel()
    newlog.data = new Date()
    newlog.type = type
    newlog.descricao = descricao
    newlog.usuario = usuario
    newlog.json = obj
    newlog.save(function (err, doc) {
        if (err) {
            console.log("Could not add log. Error: " + err)
        }
    })
}

exports.newErrorLog = newErrorLog;
exports.newLogAdd = newLogAdd;
exports.newLogUpdate = newLogUpdate;
exports.newLogRemove = newLogRemove;
exports.newLogAccessDenied = newLogAccessDenied;