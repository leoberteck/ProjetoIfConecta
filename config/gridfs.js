var mongoose = require('mongoose')
var grid = require('gridfs-stream')
var mongoose = require("./db.js")()

var gridfs

module.exports = function () {
    if (!gridfs) {
        gridfs = grid(mongoose.connection.db, mongoose.mongo)
    }
    return gridfs
}