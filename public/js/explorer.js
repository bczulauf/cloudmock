(function ($, underscore, Popup) {
    "use strict";

    var browseList = $("#browse-list"),
        createForm = $("#create-folder");

    $("#create-project-form").submit(function(event) {
        event.preventDefault();

        var form = $(this),
            appName = form.find("#inpt-name").val(),
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
                "<li id='" + appName + "' class='tile clearfix'>" +
                    "<div class='column large-6'>" + appName + "</div>" + 
                    "<div class='column large-2'>app</div>" +
                    "<div class='column large-3'>" + location + "</div>" +
                    "<div class='column large-5 last-column'>none</div>" +
                "</li>"
            );

            browseList.append(item);
        });
    });

    $("#browse").on("click", ".tile", function() {
        // check type to know where to get children from.
        // if it is a website for instance it will have 4 children
        // analytics, code, dbs, users
        // if it is a code folder it will need to get its code.
        var folder = $(this);
        var name = $(this).attr('id');
        console.log(name);
        if(name === 'Default-Web-WestUS'){
            console.log("FOUND APP");
            console.log("HAS WEBSITES");

            $('#frame').hide();
            $('#file-loading').show();
            // should probably load resources when loading folders
            /* get file to edit */
            /* TODO: need to get website name and filename */
            $.get('/websites/cloudmocktest1/files/hostingstart.html', function(data){
                console.log(data);
                $('#file-loading').hide();
                $('#file-edit').show();
                $('#file-data').val(data);
            })
        }

        console.log(folder.data());
    });

    /* update local file and FTP to website */
    $('#update-file').on('click', function(){
        console.log("UPDATE FILE CLICKED");

        /* TODO: need to get website name and filename */
        $.post('/websites/cloudmocktest1/files/file',
            {filename: 'hostingstart.html',fileData: $('#file-data').val()},
            function(d){
                console.log(d);
            }
        )
    })

    var projectForm = $(
            "<div>" +
                "<form id='create-project-form' action='/subscriptions/NEEDTOFINDTHIS/resourcegroups' method='POST'>" +
                    "<div class='page-label'>Add Project</div>" +
                    "<input id='inpt-name' class='inpt-lg inpt-full' type='text' placeholder='Project name'>" +
                    "<button type='submit' class='btn-lg btn-primary'>Add</button>" +
                "</form>" +
            "</div>"
        );

    $("#add-app").on("click", function(event) {
        Popup.showPopup(projectForm);
    });
    
    // Gets me all the websites that I am a member of.
    // $.get("/websites", function(data) {
    //     var websites = data.websites;

    //     _.each(websites, function(website) {
    //         explorer.addChild(website.name, folderType.website);
    //         explorer.appendChild(website.name);
    //     });
    // });

}(window.jQuery, window.underscore, Popup))