var page = 2

function loadMore() {
    var container = $(".load-more-container")
    container.load("/timeline/" + page)
    page++
    container.removeAttr("class")
}

$(document).ready(function () {
    $(".timeline-container").load("/timeline/1")

    $(window).scroll(function () {
        if ($(window).scrollTop() + $(window).height() == $(document).height()) {
            loadMore()
        }
    });

})