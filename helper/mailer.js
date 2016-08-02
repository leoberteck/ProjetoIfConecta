var nodemailer = require('nodemailer')
var xoauth = require('xoauth2')
var auth = require('../config/auth.js')

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        xoauth2: xoauth.createXOAuth2Generator({
            user: 'ifconecta.manage@gmail.com',
            clientId: auth.googleAuth.clientID,
            clientSecret: auth.googleAuth.clientSecret,
            refreshToken: auth.googleAuth.refreshToken,
            accessToken: auth.googleAuth.accessToken
        })
    }
})

module.exports.sendEmail = function (to, subject, htmlBody, callback) {
    callback = callback || function () { }
    var mailOptions = {
        from: '"IFConecta" <no_reply@ifconecta.com>', // sender address 
        to: to,
        subject: subject,
        html: htmlBody
    }
    
    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            callback(err)
        }
        else { 
            callback()
        }
    })
}
