$(document).ready(function () {
    $("#btnSubmit").hide()
    $("#newpass2").on("keyup", function () {  
        if ($("#newpass2").val() == $("#newpass").val()) {
            $("#btnSubmit").show()
            $("#msg").hide()
        } else {
            $("#btnSubmit").hide()
            $("#msg").show()
        }
    })
})