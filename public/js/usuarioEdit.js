$("#btnSubmit").click(save);

var times_to_remove = []

function save() {
    
    var cargoOp = "#cargo option[value='" + $("#cargo").val() + "']"
    var campusOp = "#campus option[value='" + $("#campus").val() + "']" 
    
    var times = []
    $("#times_table tr").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        if (id) {
            times.push(id)
        }
    })

    var usuario = {
        _id : $("#id").val(),
        nome : $("#nome").val(),
        descricao : $("#descricao").val(),
        email: $("#email").val(),
        cargo : {
            id : $("#cargo").val(),
            nome : $(cargoOp).text()
        },
        campus : {
            id : $("#campus").val(),
            nome : $(campusOp).text()
        },
        times : times
    }
    
    var obj = {
        usuario : usuario,
        times_to_remove : times_to_remove
    }

    $.ajax({
        type: "POST",
        url: "/usuario/editusuario",
        contentType: "application/json; charset=utf-8",
        traditional: true,
        data: JSON.stringify(obj),
        success : function (data, status, xhr) {
            alert(data)
            window.location.href = "/"
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

function removetablerow(event) {
    var conf = confirm("Deseja realmente sair deste time?")
    if (conf === true) {
        var $tr = findTr(event)
        var id = "#" + $tr.attr('id')
        var data = $tr.attr('data-id')
        times_to_remove.push(data)
        $(id).remove()
    }
}

$(document).ready(function () {
    var table = $('#times_table')
    table.on('click', 'button.remove', removetablerow)
})