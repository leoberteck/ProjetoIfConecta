var express = require('express')
var path = require('path')
var logger = require('morgan')
var bodyParser = require('body-parser')
var session = require('express-session')
var passport = require('passport')
var flash = require('connect-flash')
var insights = require('applicationinsights')
var multer = require('multer')
var mongoStore = require('connect-mongo')(session)
var storage = require('gridfs-storage-engine')({
    url: process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://@localhost:27017/ifconecta'
})
var logHelper = require('./helper/logHelper.js')
process.env.TZ = "America/Sao_Paulo";

//Configure Environment
//Adds the function string.parse to the String prototype
require('./config/confstring.js')()
//Connects with the database
var dbInfo = require('./config/db.js')
var db = dbInfo.getDb()
insights.setup("01b3ae60-6cb5-4c64-81c6-2b4fc209b99b").start()

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

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
var routes = require('./routes/index.js')

app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
require('./config/passport.js')(passport)
//Os cookies são cookies de sessão, ou seja, quando fecha a aba perde os cookies
app.use(session({
    secret : "037ac86061f8cccc60a64b4d399549fb",
    resave : false  ,
    saveUninitialized : false,
    cookie: { secure : false },
    store: new mongoStore({
        url: dbInfo.getMongoFullUrl()
    })
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(logger('dev'))
app.use(flash())
//Multer
app.use('/uploads', express.static(__dirname + "/uploads"));
//Limit upload files in 10MB
app.use(multer({
        storage: storage, 
        limits : { fileSize : 10485760 },
    }).single('arquivo'))
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
app.get('/400', function (req, res) { res.render('400') })
app.get('/errfile', function (req, res) { res.render('errfile') })
//Link google account
app.get('/auth/*', function (req, res, next) {
    if (req.session.user) {
        req.session.save(function (err) {
            next()
        })
    }
    else { 
        next()
    }
})
app.get('/auth/google', authorize, passport.authenticate('google', { scope : ['profile', 'email'], session : true }) )
app.get('/auth/google/callback', passport.authorize('google', { successRedirect : '/', failureRedirect : '/500', }))
//LOGS
app.get('/log/*', authorizeAdmin)
app.get('/log/list/:page', routes.log.viewList)
app.get('/log/show/:id', routes.log.viewShow)
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
app.get('/usuario/list/:page', authorizeAdmin, routes.usuario.viewList)
app.get('/usuario/show/:id', authorize, routes.usuario.viewShow)
app.get('/pass/requestchange/:email', routes.usuario.requestPassChange)
app.get('/pass/change/:token', routes.usuario.viewChangePass)
app.post('/pass/change', routes.usuario.changePass)
//cargo
app.get('/cargo/*', authorizeAdmin)
app.post('/cargo/*', authorizeAdmin)
app.get('/cargo/addcargo', routes.cargo.viewForm)
app.post('/cargo/addcargo', routes.cargo.saveItem)
app.get('/cargo/editcargo/:id', routes.cargo.viewEdit)
app.post('/cargo/editcargo', routes.cargo.editItem)
app.post('/cargo/removecargo', routes.cargo.removeItem)
app.get('/cargo/list/:page', routes.cargo.viewList)
//campus
app.get('/campus/*', authorizeAdmin)
app.post('/campus/*', authorizeAdmin)
app.get('/campus/addcampus', routes.campus.viewForm)
app.post('/campus/addcampus', routes.campus.saveItem)
app.get('/campus/editcampus/:id', routes.campus.viewEdit)
app.post('/campus/editcampus', routes.campus.editItem)
app.post('/campus/removecampus', routes.campus.removeItem)
app.get('/campus/list/:page', routes.campus.viewList)
//categoria
app.get('/categoria/*', authorize)
app.get('/categoria/addcategoria', routes.categoria.viewForm)
app.post('/categoria/addcategoria', routes.categoria.saveItem)
app.get('/categoria/editcategoria/:id', routes.categoria.viewEdit)
app.post('/categoria/editcategoria', routes.categoria.editItem)
app.post('/categoria/removecategoria', routes.categoria.removeItem)
app.get('/categoria/list/:page', routes.categoria.viewList)
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
app.get('/arquivo/listmy/:page', routes.arquivo.viewListMy)
app.get('/arquivo/show/:id', routes.arquivo.viewShow)
app.get('/arquivo/download/:id', routes.arquivo.download)
//Rota pública para acessar os arquivos
app.get('/public/list/:page', routes.arquivo.viewListPublic)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found :' + req.originalUrl)
    err.status = 404
    next(err)
})

// error handlers

// development error handler
// will print stacktrace
app.use(function (err, req, res, next) {
    err.status = err.status || 500;
    res.status(err.status)
    logHelper.newErrorLog(err, "Error : ", req.session.user ? req.session.user._id : "no session data", "error middleware")
    if (err.code == "LIMIT_FILE_SIZE") {
        deleteCorruptedFiles()
        res.redirect('/errfile')
    } else if (err.status === 500) {
        res.redirect('/500')
    } else if (err.status === 404) {
        res.redirect('/404')
    } else if (err.status === 401) {
        res.redirect('/401')
    } else if (err.status === 400) { 
        res.redirect('/400')
    }
})

/*Deletes files on de /upload folder
 * These files were probably bigger than 10MB
 * and multer rejected them, but they have been kept on harddrive
 */
function deleteCorruptedFiles() {
   var db = db.connection.db
   var gridfs = require('./config/gridfs.js')()
   db.collection('fs.files')
    .find({ $or : [{ status : { $exists: false } }, { status: null }] })
    .toArray(function (err, files) {
        files.forEach(function (file) {
            gridfs.findOne({ _id : file._id }, function (err, doc) { 
                if (doc) {
                    gridfs.remove(doc)
                }
            });
        });
    });
}

module.exports = app
