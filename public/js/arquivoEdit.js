var tr_id = 0

function save() {
    
    var chaves = []
    $("tr.key").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        chaves.push(id)
    })

    var arquivo = {
        _id : $("#id").val(),
        nome : $("#nome").val(),
        descricao : $("#descricao").val(),
        palavrasChave : chaves,
        criador : {
            _id : $("#idcriador").val()
        }
    }

    var obj = {
        arquivo : arquivo,
    }

    $.ajax({
        type : "POST",
        url : "/arquivo/editarquivo",
        contentType: "application/json; charset=utf-8",
        traditional: true,
        data: JSON.stringify(obj),
        success : function (data, status, xhr) {
            alert(data)
            window.location.href = "/arquivo/list/1"
        },
        error : function (jqXHR, status, error) {
            if (jqXHR.status == 500) {
                window.location.href = "/500"
            }
            else {
                alert(jqXHR.status + ": " + jqXHR.responseText)
            }
        }
    })
}

var findTr = function (event) {
    var target = event.srcElement || event.target
    var $target = $(target)
    var $tr = $target.parents('tr')
    return $tr
}

function createRow(trId, trClass, tdText) {
    if (trId == null || tdText == "")
        return ""
    var row = "<tr id='tr_" + tr_id + "' name='" + tr_id + "' data-id='" + trId + "' class='" + trClass + "'><td>" + tdText + "</td><td><button class = 'btn remove'><span class=' glyphicon glyphicon-trash'></span></button</td></tr>"
    tr_id++
    return row
}

function addpalavra() {
    var novaChave = $("#chaves").val() || ""
    if (novaChave.trim().length > 0) {
        $("#keys_table > tbody:last-child").append(createRow(novaChave, "key", novaChave))
    }
    $("#chaves").val("")
}

function removetablerow(event) {
    var $tr = findTr(event)
    var cls = $tr.attr('class')
    var id = "#" + $tr.attr('id')
    var data_id = $tr.attr('data-id')
    $(id).remove()
}

$(document).ready(function () {
    var $table = $('.table tbody')
    $table.on('click', 'button.remove', removetablerow)

    var $tableKey = $('#keys_table')
    $tableKey.on('click', 'button.remove', removetablerow)
    
    $('form').on('submit', function (e) {
        e.preventDefault();
    });
    
    /*
     * Adiciona linhas quando aperta enter mas remove as outra linhas da tabela....
    $(document).on("keyup", "#chaves", function (event) {
        if (event.which == 13) {
            $('#add_key').trigger("click")
        }
    })
    */
    $('#add_key').click(addpalavra)
    $("#btnSubmit").click(save)
})