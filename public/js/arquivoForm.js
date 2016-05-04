function upload () {
    $('div.progress').show()
    var formData = new FormData()
    var file = document.getElementById('arquivo').files[0]
    formData.append('arquivo', file)
        
    var xhr = new XMLHttpRequest()
        
    xhr.open('post', '/arquivo/addarquivo', true)
        
    xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
            var percentage = (e.loaded / e.total) * 100
            $('div.progress div.bar').css('width', percentage + '%')
        }
    }
        
    xhr.onerror = function (e) {
        showInfo('An error occurred while submitting the form. Maybe your file is too big')
    }
        
    xhr.onload = function () {
        console.log('DONE', xhr.status)
    }
        
    xhr.send(formData)
}

$(document).ready(function () {
    $("#btnSubmit").on("click", upload())
})