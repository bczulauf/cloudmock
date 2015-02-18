(function($) {
	"use strict";

    var resourcesJSON = {
        "resources": [
            {
                "name": "mongodb",
                "type": "database",
                "author": "mongo"
            },
            {
                "name": "nudge",
                "type": "website",
                "author": "nudgeinc"
            },
            {
                "name": "app insights",
                "type": "analytics",
                "author": "microsoft"
            }
        ]
    }

    var appendResource = function(name, type, author) {
        var resourceList = $("#resource-list"),
            item = $(
                "<li class='browse-folder clearfix'>" +
                    "<div class='column large-4'>" + name + "</div>" + 
                    "<div class='column large-2'>" + type + "</div>" +
                    "<div class='column large-2'>" + author + "</div>" +
                "</li>"
            );

        resourceList.append(item);
    }

    var getResources = function() {
        return resourcesJSON["resources"];
    }

    $("#action-bar").on("click", "#add-resource", function() {
        var popup = $("#popup");

        var resources = getResources();

        _.each(resources, function(resource) {
            appendResource(resource.name, resource.type, resource.author);
        });

        popup.css("display", "flex");
    });

    $("body").on("click", "#popup", function(e) {
        var popup = $("#popup");

        if (e.target.id === "popup") {
            popup.css("display", "none");
        }
    });

}(window.jQuery))