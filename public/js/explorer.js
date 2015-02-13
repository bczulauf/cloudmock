(function ($) {
    "use strict";

    var folderType = {
        organization: 0,
        app: 1,
        website: 2,
        database: 3
    }

    var makeFolder = function(name, type){
        var newFolder = {};

        _.extend(newFolder, folderMethods);
        newFolder.name = name;
        newFolder.type = type;

        switch(type) {
            case folderType.organization:
                newFolder.url = "/organization"
                break;
            case folderType.app:
                newFolder.url = "/app"
                break;
            case folderType.website:
                newFolder.url = "/website"
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
            console.log(data);
        });
    });

    $("#add-button").on("click", function() {
        $("#create-folder").show();
    })

}(window.jQuery))