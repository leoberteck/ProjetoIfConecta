﻿var findTr = function (event) {
    var target = event.srcElement || event.target;
    var $target = $(target);
    var $tr = $target.parents('tr');
    return $tr;
};

var remove = function (event) {
    var conf = confirm("Deseja realmente alterar o status deste usuário?")
    if (conf === true) {
        var $tr = findTr(event);
        var id = $tr.attr('data-id');
        var obj = { id: id };
        $.ajax({
            type: "POST",
            url: "/usuario/removeusuario",
            contentType: "application/json; charset=utf-8",
            traditional: true,
            data: JSON.stringify(obj),
            success : function (data, status, xhr) {
                alert(data)
                location.reload();
            },
            error : function (jqXHR, status, error) {
                alert(jqXHR.status + ": " + jqXHR.responseText)
            }
        });
    }
};

var show = function (event) {
    var $tr = findTr(event)
    var id = $tr.attr('data-id')
    $("#modalBody").load('/usuario/show/' + id)
}

var edit = function (event) {
    var $tr = findTr(event);
    var id = $tr.attr('data-id');
    window.location.href = "/usuario/editusuario/" + id;
};

var navigate = function (event) {
    var target = event.srcElement || event.target;
    var $target = $(target);
    var page = $target.attr('page-id');
    window.location.href = "/usuario/list/" + page;
};

$(document).ready(function () {
    var $table = $('.table tbody');
    $table.on('click', 'button.remove', remove);
    $table.on('click', 'button.edit', edit);
    $table.on('click', 'button.show', show)
    $('.pagination').on('click', 'a', navigate);
})