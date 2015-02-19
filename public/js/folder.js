(function($, underscore, Breadcrumb) {
	"use strict";

    var options = {},
        breadcrumb = $("#breadcrumb"),
        browseList = $("#browse-list");

	// Folder class.
	function Folder(name, type, location) {
		this.children = [];
		this.name = name;
        this.type = type;
        this.location = location;
		this.selected = false;
	}

	Folder.prototype.addChild = function(name, type, location) {
        this.children.push(new Folder(name, type, location));
    };

    Folder.prototype.contains = function(target) {
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

    // Returns the folder.
    Folder.prototype.getFolder = function(target) {
        if (this.name === target) {
            return this;
        }

    	var folderToReturn = null;

    	var checkChild = function(target, node) {
            var children = node.children;

            for(var i = 0; i < children.length; i++) {
                if(children[i].name === target) {
                    folderToReturn = children[i];
                }

                if(children[i].children.length) {
                    checkChild(target, children[i]);
                }
            }
        }
        checkChild(target, this);

        return folderToReturn;
    }

    // Appends the folder name to the DOM.
    var appendFolder = function(name, type, location) {
    	var item = $(
	    		"<li class='browse-folder clearfix'>" +
	    			"<div class='column large-6'>" + name + "</div>" + 
	    			"<div class='column large-2'>" + type + "</div>" +
                    "<div class='column large-3'>" + location + "</div>" +
                    "<div class='column large-5 last-column'>none</div>" +
	    		"</li>"
    		);

    	browseList.append(item);
    }

    var getResourceGroups = function() {
        $.get("/subscriptions/:subscriptionId/resourcegroups", function(groups) {
            // Gets resource groups for user.
            var apps = $.parseJSON(groups).resourceGroups;

            _.each(apps, function(app) {
                // Adds directories to root folder.
                root.addChild(app.name, "app", app.location);

                // Appends directories to dom.
                appendFolder(app.name, "app", app.location);
            });
        })
    }

    getResourceGroups();

    // Initializes root folder.
    var root = new Folder("azure");

    // Adds root to breadcrumb.
    Breadcrumb.addCrumb("azure");

    // Creates breadcrumb.
    Breadcrumb.createBreadcrumb();

    // Listens for click on breadcrumb.
    breadcrumb.on("click", "span", function(e) {
        var clickedCrumb = $(e.target).text(),
            clickedCrumbObj = root.getFolder(clickedCrumb);

        // Clears browse list.
        browseList.html("");

        _.each(clickedCrumbObj.children, function(folder) {
            appendFolder(folder.name, folder.type, folder.location);
        });
    });

}(window.jQuery, window.underscore, Breadcrumb))