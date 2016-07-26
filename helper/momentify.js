var moment = require('moment-timezone')

function momentifyDate(_date) {
    var year = _date.getUTCFullYear().toString()
    var month = _date.getUTCMonth().toString()
    var day = _date.getUTCDate().toString()
    var hours = _date.getUTCHours().toString()
    var minutes = _date.getUTCMinutes().toString()
    if (month < 10)
        month = "0" + month
    if (day < 10)
        day = "0" + day
    if (hours < 10)
        hours = "0" + hours
    if (minutes < 10)
        minutes = "0" + minutes
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + "00"
}

function fixTimeZone(_date, timezone) {
    timezone = timezone || process.env.TIME_ZONE
    var str = momentifyDate(_date)
    return moment.tz(str, timezone).toDate()
}

module.exports.momentifyDate = momentifyDate;
module.exports.fixTimeZone = fixTimeZone;