(function ($, underscore) {
    "use strict";

    var browseList = $("#browse-list");

    $("#create-app-form").submit(function(event) {
        event.preventDefault();

        var form = $(this),
            appName = form.find("#app-name").val(),
            url = form.attr("action");

        var postPromise = $.post( url, { appName: appName } );

        $("#create-folder").hide();

        postPromise.done(function(data) {
            var appData = JSON.parse(data).resourceGroup;
            var appName = appData.name;
            var location = appData.location;
            var appId = appData.id;
            var tags = appData.tags;
            var provisioningState = appData.provisioningState;

            var item = $(
                "<li class='browse-folder clearfix'>" +
                    "<div class='column large-6'>" + appName + "</div>" + 
                    "<div class='column large-2'>app</div>" +
                    "<div class='column large-3'>" + location + "</div>" +
                    "<div class='column large-5 last-column'>none</div>" +
                "</li>"
            );

            browseList.append(item);
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
    // $.get("/websites", function(data) {
    //     var websites = data.websites;

    //     _.each(websites, function(website) {
    //         explorer.addChild(website.name, folderType.website);
    //         explorer.appendChild(website.name);
    //     });
    // });

}(window.jQuery, window.underscore))