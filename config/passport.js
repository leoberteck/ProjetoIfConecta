var LocalStrategy = require('passport-local').Strategy
var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy
var refresh = require('passport-oauth2-refresh')
var userModel = require('../models/Usuario.js')
var configAuth = require('./auth.js')
var logHelper = require('../helper/logHelper.js')

module.exports = function (passport) {
    passport.serializeUser(function (user, done) { 
        done(null, user._id)
    })

    passport.deserializeUser(function (id, done) {
        userModel.findById(id, function (err, user) { 
            done(err, user)
        })
    })
    
    var localSignIn = new LocalStrategy({
        usernameField : 'email',
        passwordField : 'senha',
        passReqToCallback   : true
    },
    function (req, email, password, done) {
        process.nextTick(function () {
            var user = {
                nome : req.body.nome,
                descricao : req.body.descricao,
                email : req.body.email,
                senha : req.body.senha,
                cargo : {
                    id : req.body.cargo
                },
                campus : {
                    id : req.body.campus
                }
            }
            userModel.addNewUser(user, function (err, newUser) {
                if (err) {
                    return done(null, false, req.flash('signupMessage', 'Erro ao criar usuario. Detalhes: ' + err.message || err || "Detalhes indisponíveis"))
                } else {
                    return done(null, newUser)
                }
            })
        })
    })
    
    var localLogIn = new LocalStrategy({
        usernameField : 'email',
        passwordField : 'senha',
        passReqToCallback : true
    }, 
    function (req, email, password, done) { 
        var email = req.body.email
        var pass = req.body.senha
        if (email && pass) {
            userModel.findOne({ email : email, ativo : true }, { notificacoes : false} , function (err, doc) {
                if (err || !doc) {
                    logHelper.newLogAccessDenied(email, "Email ou senha incorretos")
                    return done(null, false, req.flash('loginMessage', 'Erro de autenticação. Detalhes: Email ou senha incorretos'))
                } else {
                    if (!userModel.validatePassword(pass, doc.senha)) {
                        logHelper.newLogAccessDenied(email, "Email ou senha incorretos")
                        return done(null, false, req.flash('loginMessage', 'Erro de autenticação. Detalhes: Email ou senha incorretos'))
                    } else {
                        logHelper.newLogAccessOk(email, "OK")
                        req.session.user = doc
                        req.session.admin = doc.admin || false
                        req.session.save(function (err) {
                            return done(null, doc)
                        })
                    }
                }
            })
        } else {
            logHelper.newLogAccessDenied(email, "Email ou senha incorretos")
            return done(null, false, req.flash('loginMessage', 'Erro de autenticação. Detalhes: Informe email e a senha'))
        }
    })
    
    var google = new GoogleStrategy({
        clientID : configAuth.googleAuth.clientID,
        clientSecret : configAuth.googleAuth.clientSecret,
        callbackURL : configAuth.googleAuth.callbackURL,
        passReqToCallback : true,
    }, function (req, token, refreshToken, profile, done) {
        process.nextTick(function () {
            req.session.reload(function (err) {
                req.session.user.google.id = profile.id
                req.user.google.token = token
                req.user.google.name = profile.displayName
                req.user.google.email = profile.emails[0].value
                req.user.google.photo = profile.photos[0].value
                req.user.google.refreshToken = refreshToken
                req.user.save()
                return done(null, req.session.user)
            })
        })
    })
    
    passport.use('local-signup', localSignIn)
    passport.use('local-login', localLogIn)
    passport.use('google', google)
    refresh.use(google)
}