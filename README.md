# cloudmock
The goal is to create a developer workflow using the apis provided by Azure:
[The Azure SDk] https://github.com/Azure/azure-sdk-for-node

Design thoughts on directories:

1. I want to see all my resources and apps.
2. The current mix of subscriptions, user groups, and directories makes my head hurt.
3. I don't want to have to change directories.
4. An app or resource from a different directory should just be marked as having a different owner.
5. I should invite users to read/write my app.

Design thoughts on apps (formerly resource groups)

1. An app should be helpful.
2. A helpful app is more than just a folder.
3. A helpful app makes it easier to create and connect resources.

Design thoughts on extensions:

1. A resource should be an extension.
2. When I open a resource I should be opening an extension.
3. Extensions should be branded.