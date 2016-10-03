$(document).ready(function () {
    $("#btnSubmit").hide()
    $("#_confirmaSenha").on("keyup", function () {
        if ($("#_confirmaSenha").val() == $("#senha").val()) {
            $("#btnSubmit").show()
            $("#msg").hide()
        } else {
            $("#btnSubmit").hide()
            $("#msg").show()
        }
    })
})