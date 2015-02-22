var Popup = (function($) {
	"use strict";

    var options = {},
        popup = $("#popup"),
        popupInner = $("#popup-inner");

    options.showPopup = function(content) {
        popupInner.append(content);
        popup.css("display", "flex");
    }

    $("body").on("click", "#popup", function(e) {
        if (e.target.id === "popup") {
            popup.css("display", "none");
        }
    });

    return options;

}(window.jQuery))