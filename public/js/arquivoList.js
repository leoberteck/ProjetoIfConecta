var findTr = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var $tr = $target.parents('tr')
    return $tr
}

var remove = function (event) {
    var conf = confirm("Deseja realmente excluir o item selecionado?")
    if (conf === true) {
        var $tr = findTr(event)
        var id = $tr.attr('data-id')
        var obj = { id: id }
        $.ajax({
            type: "POST",
            url: "/arquivo/removearquivo",
            contentType: "application/json; charset=utf-8",
            traditional: true,
            data: JSON.stringify(obj),
            success : function (data, status, xhr) {
                alert(data)
                location.reload()
            },
            error : function (jqXHR, status, error) {
                alert(jqXHR.status + ": " + jqXHR.responseText)
            }
        })
    }
}

var show = function (event) {
    var $tr = findTr(event)
    var id = $tr.attr('data-id')
    $("#modalBody").load('/arquivo/show/' + id)
}

var edit = function (event) {
    var $tr = findTr(event)
    var id = $tr.attr('data-id')
    window.location.href = "/arquivo/editarquivo/" + id
}

var navigate = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var page = $target.attr('page-id')
    window.location.href = "/arquivo/list/" + page
}

$(document).ready(function () {
    var $table = $('.table tbody')
    $table.on('click', 'button.remove', remove)
    $table.on('click', 'button.edit', edit)
    $table.on('click', 'button.show', show)
    $('.pagination').on('click', 'a', navigate)
})