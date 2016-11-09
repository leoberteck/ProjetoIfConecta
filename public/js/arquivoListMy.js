var typingTimer;
var searchdDelay = 1500;  

var findTr = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var $tr = $target.parents('div')
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

var download = function(event) {
    var $tr = findTr(event)
    var id = $tr.attr('grid-id')
    window.location.assign('/arquivo/download/' + id)
}

var navigate = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var page = $target.attr('page-id')
    var search = $("#search").val()
    search = search.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    var order = $("#order").val()
    var categoria = $("#categoria").val()
    window.location.href = "/arquivo/listmy/" + page + "?search=" + search + "&order=" + order + "&categoria=" + categoria
}

function doSearch() {
    $("#search").prop('disabled', true);
    var search = $("#search").val()
    search = search.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '');
    var order = $("#order").val()
    var categoria = $("#categoria").val()
    window.location.href = "/arquivo/listmy/1?search=" + search + "&order=" + order + "&categoria=" + categoria
}

$(document).ready(function () {
    $(document).on('click', 'button.remove', remove)
    $(document).on('click', 'button.edit', edit)
    $(document).on('click', 'button.show', show)
    $(document).on('click', 'button.down', download)
    $('.pagination').on('click', 'a', navigate)
    $("#order").on('change', function () {
        doSearch()
    })
    $("#categoria").on('change', function () {
        doSearch()
    })
    $('#search').keyup(function (event) {
        clearTimeout(typingTimer)
        if (event.which == 13) {
            doSearch()
        }
        else {
            typingTimer = setTimeout(doSearch, searchdDelay)
        }
    });
})