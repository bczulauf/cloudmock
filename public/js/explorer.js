(function ($) {
    "use strict";

    var makeFolder = function(value){
        var newFolder = {};

        _.extend(newFolder, folderMethods);
        newFolder.value = value;
        newFolder.children = [];

        return newFolder;
    };

    var folderMethods = {};

    folderMethods.addChild = function(value){
        this.children.push(makeFolder(value));
    };

    folderMethods.contains = function(target){
        var result = false;
        var hasValue = function(target, node) {
            var children = node.children;

            for(var i = 0; i < children.length; i++) {
                if(children[i].value === target) {
                    result = true;
                }

                if(children[i].children.length) {
                    hasValue(target, children[i]);
                }
            }
        }
        hasValue(target, this);

        return result;
    };

    $("#create-website-form").submit(function(event) {
        event.preventDefault();

        var form = $(this),
            websiteName = form.find("#website-name").val(),
            url = form.attr("action");
     
        var postPromise = $.post( url, { s: website-name } );

        postPromise.done(function(data) {
            console.log(data);
        });
    });

    $("#add-button").on("click", function() {
        var button = $(this);

        $("#browse-list").prepend("<li>hi</li>")
    })

}(window.jQuery))