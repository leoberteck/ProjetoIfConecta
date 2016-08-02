function login() {
    if ($('#email').val() && $('#pass').val()) {
        $("#frm-login").hide()
        $("#loader").show()
    }
}

$(document).ready(function () {
    $("#login").click(login)
    $("#changePass").click(function () {
        if ($('#email').val()) {
            window.location = "/pass/requestchange/" + encodeURIComponent($('#email').val())
        } else { 
            alert("Informe seu email")
        }
    })
    $("#loader").hide()
})