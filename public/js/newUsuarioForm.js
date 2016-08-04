$(document).ready(function () {
    $("#btnSubmit").hide()
    $("#senha2").on("keyup", function () {
        if ($("#senha2").val() == $("#senha").val()) {
            $("#btnSubmit").show()
            $("#msg").hide()
        } else {
            $("#btnSubmit").hide()
            $("#msg").show()
        }
    })
})