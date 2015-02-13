(function ($) {
    
    "use strict";

    var folderType = {
        explorer: 0,
        website: 1,
        database: 2,
        analytics: 3,
        code: 4
    }

    var makeFolder = function(name, type){
        var newFolder = {};

        _.extend(newFolder, folderMethods);
        newFolder.name = name;
        newFolder.type = type;

        switch(type) {
            case folderType.website:
                newFolder.url = "/website"
                break;
            case folderType.app:
                newFolder.url = "/database"
                break;
            case folderType.analytics:
                newFolder.url = "/analytics"
                break;
        }

        newFolder.children = [];

        return newFolder;
    };

    var folderMethods = {};

    folderMethods.appendChild = function(name) {
        var browseList = $("#browse-list"),
            template = $("<li class='browse-folder'><div class='column large-8'></div></li>"),
            folder = template.find(".browse-folder");

        $.data(folder, {name: name});
        template.find(".column").text(name);
        
        browseList.append(template);
    };

    folderMethods.addChild = function(name, type) {
        this.children.push(makeFolder(name, type));
    };

    folderMethods.contains = function(target) {
        var result = false;
        var hasName = function(target, node) {
            var children = node.children;

            for(var i = 0; i < children.length; i++) {
                if(children[i].name === target) {
                    result = true;
                }

                if(children[i].children.length) {
                    hasName(target, children[i]);
                }
            }
        }
        hasName(target, this);

        return result;
    };

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

    $("#add-button").on("click", function() {
        $("#create-folder").show();
    });

    // Initializes a new explorer.
    var explorer = makeFolder("explorer", folderType.explorer);

    // Gets me all the websites that I am a member of.
    $.get("/websites", function(data) {
        var websites = data.websites;

        _.each(websites, function(website) {
            explorer.addChild(website.name, folderType.website);
            explorer.appendChild(website.name);
        });
    });

}(window.jQuery))