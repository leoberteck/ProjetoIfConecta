var mongoose = require('mongoose')
var Usuario = require('./Usuario.js')
var logger = require('../helper/logHelper.js')

var campusSchema = new mongoose.Schema({
    nome : String
})

campusSchema.pre('save', function campusPreSaveHook(next) {
    var docCampus = this;
    Usuario.update({ 'campus.id' : docCampus._id }, { campus : { nome : docCampus.nome, id : docCampus._id } }, { multi : true }, function (err, Count, raw) {
        if (err) {
            logger.newErrorLog(err, "Error on campus hook: pre save", null, "campusPreSaveHook")
        }
        next()
    })
})

campusSchema.pre('remove', function campusPreRemoveHook(next) {
    Usuario.remove({ 'campus.id' : this._id }, function (err, count) {
        if (err) {
            logger.newErrorLog(err, "Error on campus hook: pre remove", null, "campusPreRemoveHook")
        } else {
            console.log('Users with campus : ' + this.nome + ' have been removed')
        }
        next()
    })
})


campusSchema.statics.addNewCampus = function (obj, callback) {
    var model = this
    model.validateCampus(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on save validator: ", null, "addNewCampus")
            callback(err)
        } else {
            model.create(obj, function saveCB(err, response) {
                if (err) {
                    logger.newErrorLog(err, "Error on save: ", null, "addNewCampus")
                    callback(err)
                } else {
                    callback(err, response)
                }
            })
        }
    })
}

campusSchema.statics.updateCampus = function (obj, callback) {
    var model = this
    model.validateCampus(obj, function (err) {
        if (err) {
            logger.newErrorLog(err, "Error on route update validator: ", null, "updateCampus")
            callback(err)
        } else {
            var id = obj._id
            model.findOne({ _id : id }, function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on route update: ", null, "updateCampus")
                    callback(err)
                } else {
                    doc.nome = obj.nome
                    doc.save()
                    callback()
                }
            })
        }
    })
}

campusSchema.statics.removeCampus = function (id, callback) {
    var model = this
    model.findById(id, function delCB(err, doc) {
        if (err) {
            logger.newErrorLog(err, "Error on remove", null, "removeCampus")
            callback(err)
        } else {
            doc.remove(function (err, doc) {
                if (err) {
                    logger.newErrorLog(err, "Error on remove", null, "removeCampus")
                    callback(err)
                } else {
                    callback()
                }
            })
        }
    })
}

campusSchema.statics.validateCampus = function (campus, callback) {
    if (!campus.nome) {
        var err = new Error('Nome esta vazio')
        err.status = 400
        callback(err)
    }
    else {
        callback()
    }
}


module.exports = mongoose.model('Campus', campusSchema)