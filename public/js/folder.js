(function($, underscore, Breadcrumb) {
	"use strict";

    var options = {},
        breadcrumb = $("#breadcrumb"),
        browseList = $("#browse-list");

    // This is temp.
    var directoriesJSON = {
            "directories": [
                {
                    "name": "default"
                },
                {
                    "name": "microsoft"
                },
                {
                    "name": "corpinc"
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
    var appendFolder = function(name, type) {
    	var item = $(
	    		"<li class='browse-folder clearfix'>" +
	    			"<div class='column large-5'>" + name + "</div>" + 
	    			"<div class='column large-2'>" + type + "</div>" +
	    		"</li>"
    		);

    	browseList.append(item);
    }

    var getDirectories = function() {
    	return directoriesJSON["directories"];
    }

    // Initializes root folder.
    var root = new Folder("azure");

    // Gets directories for user.
    var directories = getDirectories();

    _.each(directories, function(directory) {
        // Adds directories to root folder.
        root.addChild(directory.name);

        // Appends directories to dom.
        appendFolder(directory.name, "directory");
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
            appendFolder(folder.name, "directory");
        });
    });

}(window.jQuery, window.underscore, Breadcrumb))