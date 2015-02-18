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
    	},
        browseList = $("#browse-list");

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

    var addToBreadcrumb = function(name) {
        breadcrumbList.push(name);
    }

    var breadcrumbList = [];

    // Initializes root folder.
    var root = new Folder("azure");

    // Adds root to breadcrumb.
    addToBreadcrumb("azure");

    // Gets directories for user.
    var directories = getDirectories();

    // Adds directories to root folder.
    // Appends directories to dom.
    _.each(directories, function(directory) {
    	root.addChild(directory.name);
    	appendFolder(directory.name, "directory");
    });

    var getSelectedCrumb = function(name) {
    	if (breadcrumbList.length === 0) {
    		return null;
    	}

    	var crumb = root.getFolder(name);

        return crumb;
    }

    var appendCrumb = function(name) {
        var breadcrumb = $("#breadcrumb");

        var crumb = $(
                "<span>" + name + "</span>"
            );

        breadcrumb.append(crumb);
    }

    _.each(breadcrumbList, function(crumb) {
        appendCrumb(crumb);
    });

    $("#breadcrumb").on("click", "span", function(e) {
        var clickedCrumb = $(e.target).text(),
            clickedCrumbObj = getSelectedCrumb(clickedCrumb);

        // Clears browse list.
        browseList.html("");

        _.each(clickedCrumbObj.children, function(folder) {
            appendFolder(folder.name, "directory");
        });
    });

}(window.jQuery))