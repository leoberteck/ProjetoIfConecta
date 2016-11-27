var findTr = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var $tr = $target.parents('tr')
    return $tr
}

var show = function (event) {
    var $tr = findTr(event)
    var id = $tr.attr('data-id')
    $("#modalBody").load('/log/show/' + id)
}

var navigate = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var page = $target.attr('page-id')
    window.location.href = "/log/list/" + page
}

$(document).ready(function () {
    var $table = $('.table tbody')
    $table.on('click', 'button.show', show)
    $('.pagination').on('click', 'a', navigate)
})