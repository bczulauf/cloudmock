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

    var getResources = function() {
        return resourcesJSON["resources"];
    }

    $("#action-bar").on("click", "#add-resource", function() {
        var popup = $("#popup");

        var resources = getResources();

        popup.css("display", "flex");
    });

    $("body").on("click", "#popup", function() {
        var popup = $("#popup");

        popup.css("display", "none");
    });

}(window.jQuery))