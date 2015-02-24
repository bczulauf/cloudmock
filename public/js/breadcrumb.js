var Breadcrumb = (function($, underscore) {
	"use strict";

    var options = {},
        breadcrumbList = [],
        browseList = $("#browse-list"),
        breadcrumb = $("#breadcrumb");

    // Adds crumb to breadcrumbList.
    options.addCrumb = function(name) {
        breadcrumbList.push(name);
    }

    // Displays breadcrumb.
    options.createBreadcrumb = function() {
        _.each(breadcrumbList, function(crumb) {
            _appendCrumb(crumb);
        });
    }

    // Appends crumb to DOM.
    var _appendCrumb = function(name) {
        var crumb = $(
                "<span><a>" + name + "<a></span>"
            );

        breadcrumb.append(crumb);
    }

    return options;

}(window.jQuery, window.underscore))