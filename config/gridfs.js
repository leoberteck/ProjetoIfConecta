var mongoose = require('mongoose')
var grid = require('gridfs-stream')
var db = require("./db.js")

var gridfs

module.exports = function () {
    if (!gridfs) {
        grid.mongo = mongoose.mongo
        var gridfs = grid(db)
    }
    return gridfs
}