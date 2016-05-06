var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
var mongoose = require('mongoose')
var session = require('express-session')
var passport = require('passport')
var flash = require('connect-flash')
//var confString = require('./config/confstring.js')
var insights = require('applicationinsights')
var grid = require('gridfs-stream')

var dbUrl = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb//@localhost:27017/ifconecta'
var db = mongoose.connect(dbUrl, { safe: true })
var logHelper = require('./helper/logHelper.js')
grid.mongo = mongoose.mongo
var gridfs = grid(db)

//Configure Environment
//confString.config()
insights.setup("01b3ae60-6cb5-4c64-81c6-2b4fc209b99b").start()

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// seta gridfs
app.set('gridfs', gridfs)

//Autorization middleware
var authorizeAdmin = function (req, res, next) {
    if (req.session && req.session.user && req.session.admin) {
        next()
    } else {
        var err = Error("Unauthorized")
        err.status = 401
        next(err)
    }
};

var authorize = function (req, res, next) {
    if (req.session && req.session.user) {
        next()
    } else {
        var err = Error("Unauthorized")
        err.status = 401
        next(err)
    }
};

//Routes variables
var routes = require('./routes/index.js')(app)

require('./config/passport.js')(passport)

app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({
    secret : "037ac86061f8cccc60a64b4d399549fb",
    resave : false  ,
    saveUninitialized : false,
    cookie: {maxAge : 600000}
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())


//Public Routes
app.get('/', routes.index)
app.get('/login', routes.login)
app.post('/login', passport.authenticate('local-login', {
    successRedirect : '/',
    failureRedirect : '/login',
    failureFlash : true
}))
app.get('/logout', routes.usuario.logout)
app.get('/dashadmin', authorizeAdmin, routes.dashadmin)
app.get('/dashuser/', authorize, routes.dashuser)
app.get('/timeline/:page', authorize, routes.usuario.timeline)
app.get('/500', function (req, res) { res.render('500') })
app.get('/404', function (req, res) { res.render('404') })
app.get('/401', function (req, res) { res.render('401') })
//Link google account
app.get('/auth/google', authorize, passport.authorize('google', { scope : ['profile', 'email'] }))
app.get('/auth/google/callback', passport.authorize('google', {
    successRedirect : '/',
    failureRedirect : '/500',
}))
//Usuario
app.get('/usuario/new', routes.usuario.viewNewForm)
app.post('/usuario/new', passport.authenticate('local-signup', {
    successRedirect : '/',
    failureRedirect : '/usuario/new',
    failureFlash : true
}))
app.get('/usuario/addusuario', authorize, routes.usuario.viewForm)
app.post('/usuario/addusuario', authorizeAdmin, routes.usuario.saveItem)
app.get('/usuario/editusuario/:id', authorize, routes.usuario.viewEdit)
app.post('/usuario/editusuario', authorize, routes.usuario.editItem)
app.post('/usuario/removeusuario', authorizeAdmin, routes.usuario.removeItem)
app.get('/usuario/list/:page', authorize, routes.usuario.viewList)
//cargo
app.post('/cargo/*', authorizeAdmin)
app.get('/cargo/addcargo', routes.cargo.viewForm)
app.post('/cargo/addcargo', routes.cargo.saveItem)
app.get('/cargo/editcargo/:id', routes.cargo.viewEdit)
app.post('/cargo/editcargo', routes.cargo.editItem)
app.post('/cargo/removecargo', routes.cargo.removeItem)
app.get('/cargo/list/:page', routes.cargo.viewList)
//campus
app.get('/campus/*', authorizeAdmin)
app.get('/campus/addcampus', routes.campus.viewForm)
app.post('/campus/addcampus', routes.campus.saveItem)
app.get('/campus/editcampus/:id', routes.campus.viewEdit)
app.post('/campus/editcampus', routes.campus.editItem)
app.post('/campus/removecampus', routes.campus.removeItem)
app.get('/campus/list/:page', routes.campus.viewList)
//Time
app.post('/time/*', authorize)
app.get('/time/addtime', routes.time.viewForm)
app.post('/time/addtime', routes.time.saveItem)
app.get('/time/edittime/:id', routes.time.viewEdit)
app.post('/time/edittime', routes.time.editItem)
app.post('/time/removetime', routes.time.removeItem)
app.get('/time/listall/:page', routes.time.viewListAll)
app.get('/time/list/:page', routes.time.viewList)
app.get('/time/show/:id', routes.time.viewShow)

//Evento
app.get('/evento/*', authorize)
app.post('/time/*', authorize)
app.get('/evento/addevento', routes.evento.viewForm)
app.post('/evento/addevento', routes.evento.saveItem)
app.get('/evento/editevento/:id', routes.evento.viewEdit)
app.post('/evento/editevento', routes.evento.editItem)
app.post('/evento/removeevento', routes.evento.removeItem)
app.get('/evento/list/:page', routes.evento.viewList)
app.get('/evento/show/:id', routes.evento.viewShow)

//Arquivo
app.post('/arquivo/*', authorize)
app.get('/arquivo/addarquivo', routes.arquivo.viewForm)
app.post('/arquivo/addarquivo', routes.arquivo.saveItem)
app.get('/arquivo/editarquivo/:id', routes.arquivo.viewEdit)
app.post('/arquivo/editarquivo', routes.arquivo.editItem)
app.post('/arquivo/removearquivo', routes.arquivo.removeItem)
app.get('/arquivo/list/:page', routes.arquivo.viewList)
app.get('/arquivo/show/:id', routes.arquivo.viewShow)


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found')
    err.status = 404
    next(err)
})

// error handlers

// development error handler
// will print stacktrace
app.use(function (err, req, res, next) {
    logHelper.newErrorLog(err, "Error : ", req.session.user, "error middleware")
    res.status(err.status || 500)
    if (err.status === 500) {
        res.redirect('/500')
    } else if (err.status === 404) {
        res.redirect('/404')
    } else if (err.status === 401) {
        res.redirect('/401')
    }
})

module.exports = app
