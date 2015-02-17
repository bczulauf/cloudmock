(function($) {
	"use strict";

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
	}

	// Folder - superclass.
	function Folder(name) {
		this.children = [];
		this.name = name;
		this.selected = false;
	}

	// superclass methods.
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

    var appendFolder = function(name, type) {
    	var browseList = $("#browse-list"),
    		item = $(
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

    // Adds directories to root folder.
    // Appends directories to dom.
    _.each(directories, function(directory) {
    	root.addChild(directory.name);
    	appendFolder(directory.name, "directory");
    });

}(window.jQuery))