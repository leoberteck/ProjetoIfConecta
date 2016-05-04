$("#btnSubmit").click(save);

function save() {
    var obj = {
        nome : $("#nome").val(),
        descricao : $("#descricao").val(),
        email: $("#email").val(),
        senha : $("#senha").val(),
        cargo : {
            id : $("#cargo").val()
        },
        campus : {
            id : $("#campus").val()
        },
        admin : $("#admin") == null ? false : $("#admin").is(':checked')
    }

    $.ajax({
        type: "POST",
        url: "/usuario/addusuario",
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