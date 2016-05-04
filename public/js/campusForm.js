$("#btnSubmit").click(save);

function save() {
    var obj = {
        nome : $("#nome").val()
    }
    
    $.ajax({
        type: "POST",
        url: "/campus/addcampus",
        contentType: "application/json; charset=utf-8",
        traditional: true,
        data: JSON.stringify(obj),
        success : function (data, status, xhr) {
            alert(data)
            window.location.href = "/";
        },
        error : function (jqXHR, status, error) {
            alert(jqXHR.status + ": " + jqXHR.responseText)
        }
    })
}