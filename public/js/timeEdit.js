var tr_id = 0
var usuarios_to_remove = []
var times_to_remove = []

function save() {
    var users = []
    $("tr.user").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        users.push(id)
    })
    var times = []
    $("tr.team").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        times.push(id)
    })
    
    var time = {
        _id : $("#id").val(),
        nome : $("#nome").val(),
        descricao : $("#descricao").val(),
        usuarios : users,
        times : times,
        criador : {
            _id : $("#idcriador").val()
        }
    }

    var obj = {
        time : time,
        usuarios_to_remove : usuarios_to_remove,
        times_to_remove : times_to_remove
    }

    $.ajax({
        type : "POST",
        url : "/time/edittime",
        contentType: "application/json; charset=utf-8",
        traditional: true,
        data: JSON.stringify(obj),
        success : function (data, status, xhr) {
            alert(data)
            window.location.href = "/time/list/1"
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
    var row = "<tr id='tr_" + tr_id + "' data-id='" + trId + "' class='" + trClass + "'><td>" + tdText + "</td><td><button class = 'btn remove'><span class=' glyphicon glyphicon-trash'></span></button</td></tr>"
    tr_id++
    return row
}

function adduser() {
    var userop = "#user_select option[value='" + $("#user_select").val() + "']"
    $("#users_table > tbody:last-child").append(createRow($("#user_select").val(), "user", $(userop).text()))
    $(userop).wrap("<span/>")
    var index = usuarios_to_remove.indexOf(id)
    if (index >= 0) {
        usuarios_to_remove.splice(index, 1)
    }
}
function addtime() {
    var timeop = "#time_select option[value='" + $("#time_select").val() + "']"
    $("#times_table > tbody:last-child").append(createRow($("#time_select").val(), "team", $(timeop).text()))
    $(timeop).wrap("<span/>")
    var index = times_to_remove.indexOf(id)
    if (index >= 0) {
        times_to_remove.splice(index, 1)
    }
}

function removetablerow(event) {
    var $tr = findTr(event)
    var cls = $tr.attr('class')
    var id = "#" + $tr.attr('id')
    var data_id = $tr.attr('data-id')
    var selectOp
    if (cls == "user") {
        selectOp = "#user_select option[value='" + data_id + "']"
        usuarios_to_remove.push(data_id);
    } else {
        selectOp = "#time_select option[value='" + data_id + "']"
        times_to_remove.push(data_id)
    }
    $(selectOp).unwrap()
    $(id).remove()

}

$(document).ready(function () {
    var $users_table = $('#users_table')
    $users_table.on('click', 'button.remove', removetablerow)
    
    var $times_table = $('#times_table')
    $times_table.on('click', 'button.remove', removetablerow)
    $('#add_user').click(adduser)
    $('#add_time').click(addtime)
    $("#btnSubmit").click(save)

    $("tr.user").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        var userop = "#user_select option[value='" + id + "']"
        $(userop).wrap("<span/>")
    })

    $("tr.team").each(function () {
        $this = $(this);
        var id = $this.attr('data-id')
        var userop = "#time_select option[value='" + id + "']"
        $(userop).wrap("<span/>")
    })
})