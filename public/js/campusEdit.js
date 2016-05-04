$("#btnSubmit").click(save);

function save() {
    var obj = {
        _id : $("#id").val(),
        nome : $("#nome").val()
    }
    
    $.ajax({
        type: "POST",
        url: "/campus/editcampus",
        contentType: "application/json; charset=utf-8",
        traditional: true,
        data: JSON.stringify(obj),
        success : function (data, status, xhr) {
            alert(data)
            window.location.href = "/campus/list/1"
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