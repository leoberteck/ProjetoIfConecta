//TODO: require all other route file here and exports them

//@param {Object} app - express instance
module.exports = function (app) {
    return {
        usuario : require('./usuario.js'),
        cargo : require('./cargo.js'),
        campus : require('./campus.js'),
        time : require('./time.js'),
        evento : require('./evento.js'),
        arquivo : require('./arquivo.js')(app),
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
            res.render('dashadmin', { admin : true })
        },
        dashuser : function (req, res, next) {
            res.render('dashuser', { admin : false })
        },
        login : function (req, res, next) {
            var locals = { message : req.flash('loginMessage') }
            res.render('login', locals)
        }
    }
}