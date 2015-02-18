(function($, underscore, Breadcrumb) {
	"use strict";

    var options = {},
        breadcrumb = $("#breadcrumb"),
        browseList = $("#browse-list");

    // This is temp.
    var resourceGroupsJSON = {
            "groups": [
                {
                    "name": "default",
                    "type": "app",
                    "location": "us-west"
                },
                {
                    "name": "microsoft",
                    "type": "app",
                    "location": "us-west"
                },
                {
                    "name": "corpinc",
                    "type": "app",
                    "location": "us-west"
                }
            ]
        };

	// Folder class.
	function Folder(name) {
		this.children = [];
		this.name = name;
		this.selected = false;
	}

	Folder.prototype.addChild = function(name) {
        this.children.push(new Folder(name));
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
    	return resourceGroupsJSON["groups"];
    }

    // Initializes root folder.
    var root = new Folder("azure");

    // Gets resource groups for user.
    var apps = getResourceGroups();

    _.each(apps, function(app) {
        // Adds directories to root folder.
        root.addChild(app.name);

        // Appends directories to dom.
        appendFolder(app.name, app.type, app.location);
    });

    // Adds root to breadcrumb.
    Breadcrumb.addCrumb("azure");

    // Creates breadcrumb.
    Breadcrumb.displayBreadcrumb();

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