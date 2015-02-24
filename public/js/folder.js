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
    var appendFolder = function(name, className) {
        var folderSVG = 
            "<svg version='1.1' id='Layer_1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' height='24px' width='24px' viewBox='0 0 24 24' enable-background='new 0 0 24 24' xml:space='preserve'>" +
            "<path d='M22,8.1V5.4C22,4.6,21.6,4,20.8,4H14c-0.8,0-1,0-1.7,1.4L11,8.1L22,8.1z'/><path d='M20.7,7H3.2C2.4,7,2,7.6,2,8.4v11.2C2,20.4,2.4,21,3.2,21h17.5c0.8,0,1.2-0.6,1.2-1.4V8.4C21.9,7.6,21.5,7,20.7,7z M20,19H4V9h16V19z'/></svg>";

        var item;

        if(className) {
        	item = $(
    	    		"<div id='" + name + "' class='column large-4 tile " + className + "'>" +
                        "<div class='tile-inner'>" +
        	    			"<div class='folder-name'>" + name + "</div>" + 
                        "</div>" +
    	    		"</div>"
        		);
        } else {
            item = $(
                    "<div id='" + name + "' class='column large-4 tile'>" +
                        "<div class='tile-inner'>" +
                            "<div class='folder-name'>" + name + "</div>" + 
                        "</div>" +
                    "</div>"
                );
        }

    	browseList.append(item);
    }

    var getResourceGroups = function() {
        //$.get("/subscriptions/:subscriptionId/resourcegroups", function(groups) {
        $.get('/resourcegroups', function(groups){
            // Gets resource groups for user.
            var projects = $.parseJSON(groups),
                count = 0;

            _.each(projects, function(project) {
                count++;

                // Adds directories to root folder.
                root.addChild(project.name, "project", project.location);
                
                // Appends directories to dom.
                if(count === 4) {
                    appendFolder(project.name, "last-column");
                    count = 0;
                } else {
                    appendFolder(project.name);
                }
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
            clickedCrumbObj = root.getFolder(clickedCrumb),
            count = 0;;

        // Clears browse list.
        browseList.html("");

        _.each(clickedCrumbObj.children, function(folder) {
            count++;
            
            // Appends directories to dom.
            if(count === 4) {
                appendFolder(folder.name, "last-column");
                count = 0;
            } else {
                appendFolder(folder.name);
            }
        });
    });

}(window.jQuery, window.underscore, Breadcrumb))