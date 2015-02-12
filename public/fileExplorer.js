var makeFolder = function(value){
    var newFolder = {};

    _.extend(newFolder, folderMethods);
    newFolder.value = value;
    newFolder.children = [];

    return newFolder;
};

var folderMethods = {};

folderMethods.addChild = function(value){
    this.children.push(makeFolder(value));
};

folderMethods.contains = function(target){
    var result = false;
    var hasValue = function(target, node) {
        var children = node.children;

        for(var i = 0; i < children.length; i++) {
            if(children[i].value === target) {
                result = true;
            }

            if(children[i].children.length) {
                hasValue(target, children[i]);
            }
        }
    }
    hasValue(target, this);

    return result;
};