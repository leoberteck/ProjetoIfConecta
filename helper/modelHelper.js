module.exports.generateUsersArray = function (usuarios, times, callback) {
    var model = require('../models/Time.js')
    usuarios = usuarios ? usuarios : []
    if (times && times.length > 0) {
        model.find({ _id : { $in: times } }, function (err, docs) {
            for (var x = 0; x < docs.length; x++) {
                if (docs[x].usuarios) {
                    for (var y = 0; y < docs[x].usuarios.length; y++) {
                        var iduser = docs[x].usuarios[y].toString()
                        if(usuarios.indexOf(iduser) < 0)
                            usuarios.push(iduser)
                    }
                }
            }
            callback(usuarios)
        })
    }
    else {
        callback(usuarios)
    }
}