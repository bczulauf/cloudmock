(function ($) {
    "use strict";

    var folderType = {
        website: 0,
        database: 1,
        analytics: 2,
        code: 3
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

    folderMethods.addChild = function(name, type){
        this.children.push(makeFolder(name, type));
    };

    folderMethods.contains = function(target){
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

    $(".browse-folder").on("click", function() {
        // check type to know where to get children from.
        // if it is a website for instance it will have 4 children
        // analytics, code, dbs, users
        // if it is a code folder it will need to get its code.
    });

    $("#add-button").on("click", function() {
        $("#create-folder").show();
    });

}(window.jQuery))