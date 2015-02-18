(function ($, underscore, Breadcrumb) {
    "use strict";

    $("#create-website-form").submit(function(event) {
        event.preventDefault();

        var form = $(this),
            websiteName = form.find("#website-name").val(),
            url = form.attr("action");
     
        var postPromise = $.post( url, { websiteName: websiteName } );

        postPromise.done(function(data) {
            $("#browse-list").prepend("<li>hi</li>")
        });
    });

    $("#browse").on("click", ".browse-folder", function() {
        // check type to know where to get children from.
        // if it is a website for instance it will have 4 children
        // analytics, code, dbs, users
        // if it is a code folder it will need to get its code.
        var folder = $(this);

        console.log(folder.data());
    });

    $("#add-app").on("click", function() {
        $("#create-folder").show();
    });

    // Gets me all the websites that I am a member of.
    $.get("/websites", function(data) {
        var websites = data.websites;

        _.each(websites, function(website) {
            explorer.addChild(website.name, folderType.website);
            explorer.appendChild(website.name);
        });
    });

}(window.jQuery, window.underscore, Breadcrumb))