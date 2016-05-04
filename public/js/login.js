function login() {
    if ($('#email').val() && $('#pass').val()) {
        $("#frm-login").hide()
        $("#loader").show()
    }
}

$(document).ready(function () { 
    $("#login").click(login)
    $("#loader").hide()
})