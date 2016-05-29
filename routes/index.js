﻿//TODO: require all other route file here and exports them

module.exports = {
    usuario : require('./usuario.js'),
    cargo : require('./cargo.js'),
    campus : require('./campus.js'),
    time : require('./time.js'),
    evento : require('./evento.js'),
    arquivo : require('./arquivo.js'),
    index : function (req, res, next) {
        if (req.session && req.session.user && req.session.admin) {
            res.redirect('/dashadmin')
        } else if (req.session && req.session.user) {
            res.redirect('/dashuser')
        } else {
            res.redirect('/login')
        }
    },
    dashadmin : function (req, res, next) {
        res.render('dashadmin', { admin : true, name : req.session.user.nome })
    },
    dashuser : function (req, res, next) {
        res.render('dashuser', { admin : false, name : req.session.user.nome })
    },
    login : function (req, res, next) {
        var locals = { message : req.flash('loginMessage') }
        res.render('login', locals)
    }
}