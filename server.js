var express = require('express'),
	app = express(),
	path = require('path'),
	bodyParser = require('body-parser'),
	swig = require('swig'),
	fs = require('fs'),
	http = require('http'),
	https = require('https'),
	webSiteManagement = require('azure-mgmt-website');

var cookieParser = require('cookie-parser');
var session = require('cookie-session');
var crypto = require('crypto');
var common = require("azure-common"),
    http = require('http'),
    resourceManagement = require("azure-mgmt-resource");
var websiteMgmt = require('azure-mgmt-website');
var AuthenticationContext = require('adal-node').AuthenticationContext;
var xml = require('xml2js');
var util = require('util');

app.use(cookieParser('a deep secret'));
// azure sub id: 3baf7cce-0610-43bc-b384-5105b8e71ab2
app.use(express.static(path.join(__dirname, '/public')));


// Template render magic.
app.engine('html', swig.renderFile);
app.set('view engine', 'html');
app.set('views', __dirname + '/public/html');

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());
app.set('view cache', false);
// Disables Swig's cache
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

var hostName = '.azurewebsites.net',
	webSpaceName = 'westuswebspace',
	serverFarm = 'Default1',
	webSiteManagementClient,
	managementClient;

var sampleParameters = {
  tenant : '3f6c9704-10d4-4108-aac1-d5a26ac5f799', // unique identifier of the directory tenant that issued the token. found in directory -> app -> view endpoints at the bottom
  authorityHostUrl : 'https://login.windows.net',
  clientId : '8f6b2a6c-fba5-43e9-a0b2-1639553c571c', // cloudOS app (under jimmywoods1 subscription) client id
  clientSecret: 'zuiVAwjZs7kREke2diuWMKHJoGWH6HMIjbDSkn0ojXk=',
  //username : 'rnchell@jimmywoods1outlook.onmicrosoft.com',
  //username: 'jimmywoods1@outlook.com',
  //password : 'thewizard1!'
  //password: 'thewizard!'
};

/*
	Any api calls have to be made by whichever user is logged in has to use
	that users subscription id
*/

/* 
	When prompted to login, all api calls that require a subscription id
	need to be associated with the user logging in

	If login as jimmywoods1, use the subscriptionid for jimmywoods1
	otherwise the token will be incorrect and api calls will fail
*/
var jimmywoods1SubscriptionId = '3baf7cce-0610-43bc-b384-5105b8e71ab2';
var rnchelljimmywoods1outlookSubId = '9e65f69f-b5c2-48ce-9260-e0a6c51f9b23';

var subscriptionId = jimmywoods1SubscriptionId;

var resourceManagementClient;

var authorityUrl = sampleParameters.authorityHostUrl + '/' + sampleParameters.tenant;
var redirectUri = 'http://localhost:3000/getAToken';

/* 
	resources vary depending on what api you are using.
*/
//var resource = 'https://management.azure.com/'; // needed for resource management api calls
var resource = 'https://management.core.windows.net/'; // needed for service management api calls

var templateAuthzUrl = 'https://login.windows.net/' + sampleParameters.tenant + '/oauth2/authorize?response_type=code&client_id=<client_id>&redirect_uri=<redirect_uri>&state=<state>&resource=<resource>';
var token = '';

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/login', function(req,res){
  res.redirect('/auth');
})

/* Gets provider namespace needed for other calls */
function getProviderName(resourceType) {
  var firstIndex = resourceType.indexOf('/');
  var providerName;
  if (firstIndex !== -1){
    providerName = resourceType.substr(0, firstIndex);
  }
  return providerName;
}

function createAuthorizationUrl(state) {
  var authorizationUrl = templateAuthzUrl.replace('<client_id>', sampleParameters.clientId);
  authorizationUrl = authorizationUrl.replace('<redirect_uri>',redirectUri);
  authorizationUrl = authorizationUrl.replace('<state>', state);
  authorizationUrl = authorizationUrl.replace('<resource>', resource);
  return authorizationUrl;
}

// Clients get redirected here in order to create an OAuth authorize url and redirect them to AAD.
// There they will authenticate and give their consent to allow this app access to
// some resource they own.
app.get('/auth', function(req, res) {
  crypto.randomBytes(48, function(ex, buf) {
    var token = buf.toString('base64').replace(/\//g,'_').replace(/\+/g,'-');

    res.cookie('authstate', token);
    var authorizationUrl = createAuthorizationUrl(token);

    console.log(authorizationUrl);

    res.redirect(authorizationUrl);
  });
});

// After consent is granted AAD redirects here.  The ADAL library is invoked via the
// AuthenticationContext and retrieves an access token that can be used to access the
// user owned resource.
app.get('/getAToken', function(req, res) {
  if (req.cookies.authstate !== req.query.state) {
    res.send('error: state does not match');
  }
  var authenticationContext = new AuthenticationContext(authorityUrl);
  authenticationContext.acquireTokenWithAuthorizationCode(req.query.code, redirectUri, resource, sampleParameters.clientId, sampleParameters.clientSecret, function(err, response) {
    var message = '';
    if (err) {
      message = 'error: ' + err.message + '\n';
    }
    message += 'response: ' + JSON.stringify(response);

    if (err) {
      res.send(message);
      return;
    }

    console.log("******RESPONSE*******");
    console.log(response);
    token = response.accessToken;
    //res.send(response);
    //res.redirect('http://portal.azure.com'); 
    //listAllSubscriptions();
    //getResourcesByResourceGroupID();
    //listAllTenants();

    // Later, if the access token is expired it can be refreshed.
    authenticationContext.acquireTokenWithRefreshToken(response.refreshToken, sampleParameters.clientId, sampleParameters.clientSecret, resource, function(refreshErr, refreshResponse) {
      if (refreshErr) {
        message += 'refreshError: ' + refreshErr.message + '\n';
      }
      message += 'refreshResponse: ' + JSON.stringify(refreshResponse);

      console.log("******REFRESH RESPONSE*******");
      console.log(refreshResponse);
      token = refreshResponse.accessToken;

      //res.redirect('http://portal.azure.com'); 
      //getResources();
      //getResourceGroups();
      res.redirect('/home');
    }); 
  });
});

// app.post('/websites/create', function(req, res){
// 	res.send(req.body.websiteName + ' created');
// 	var webSiteName = req.body.websiteName;

// 	// webSiteManagementClient.webSites.create("westuswebspace", {
// 	//   name: webSiteName,
// 	//   hostNames: [webSiteName + hostName],
// 	//   webSpaceName: webSpaceName,
// 	//   serverFarm: serverFarm
// 	// }, function (err, result) {
// 	//   if (err) {
// 	//     console.error(err);
// 	//   } else {
// 	//     console.info(result);
// 	//   }
// 	// });
// })

app.get('/home', function(req, res){
	res.render('home');
});

/* get websites for user and subscription */
app.get('/websites', function(req,res){
	/* 
		to use this client, you have to change the resource at the top to be
		https://management.core.windows.net/
	*/

	var websiteMgmtClient = websiteMgmt.createWebSiteManagementClient(new common.TokenCloudCredentials({
	    subscriptionId: subscriptionId,
	    token: token
	  }))

	websiteMgmtClient.webSpaces.list(function(err,result){
		if(err){
			console.log(err);
		} else {
			console.log(result);
      if(result && result.webSpaces.length > 0){
			var webSpaceName = result.webSpaces[0].name;
  			websiteMgmtClient.webSpaces.listWebSites(webSpaceName,function(err,results){
  				if(err){
  					console.log(err);
  				} else {
  					res.send(JSON.stringify({websites: results.webSites}));
  				}
  			})
      } else {
        res.send('no webspaces');
      }
		}
	});
})

/* Get resources under a subscription */
app.get('/subscriptions/:subscriptionId/resources', function(req,res){
  
  resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
	    subscriptionId: subscriptionId,
	    token: token
	  }));

  resourceManagementClient.resources.list(function(err,data){
    if(err){
      console.log(err);
    } else {
      res.send(JSON.stringify(data));
    }
   })
});

/* Get resource groups under a subscription */
app.get('/subscriptions/:subscriptionId/resourcegroups', function(req,res){
	resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
	    subscriptionId: subscriptionId,
	    token: token
	  }));

	resourceManagementClient.resourceGroups.list(function(err,data){
    if(err){
      console.log(err);
    } else {
      res.send(JSON.stringify(data));
    }
  })
})

/* Get resource belonging to a resource group */
app.get('/resourcegroups/:resourceGroupName/resources/:resourceName', function(req,res){
  
  /* TODO: store this somewhere or pass it in uri */
  //var resourceType = 'Microsoft.Web/serverFarms'; // this is the type for a website. 

  // This should be required with no default
  //var resourceGroupName = req.params.resourceGroupName || 'Default-Web-WestUS';
  
  // not needed for now
  //var resourceGroupId = '/subscriptions/' + subscriptionId + '/resourceGroups/' + resourceGroupName + '/providers/' + providerNamespace + '/serverFarms/Default1';
  
  //var resourceProviderNamespace = getProviderName(resourceType);

  // var options = {
  //   port: 3000,
  //   path: '/providers/' + resourceType,
  //   method: 'GET'
  // };

  // TODO: split resourceType into pieces
  http.get('http://localhost:3000/providers/' + resourceType, function(resp){
    var body = '';
    resp.on('data', function(chunk){
      body += chunk;
    });
    resp.on('end', function(){
      console.log(body);
      var parsedBody = JSON.parse(body);
      console.log(parsedBody);

      var resourceProviderApiVersion = parsedBody.apiVersion;
      console.log(resourceProviderApiVersion);

      var resourceName = req.params.resourceName || 'cloudmocktest1';

      var resourceType = 'Microsoft.Web/serverFarms'; //website
      var resourceGroupName = req.params.resourceGroupName || 'Default-Web-WestUS';
      var resourceProviderNamespace = getProviderName(resourceType); // Microsoft.Web
      var parent = '';

      var resourceIdentity = resourceManagement.createResourceIdentity(resourceName,resourceType,resourceProviderApiVersion,parent);


      resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
          subscriptionId: subscriptionId,
          token: token
        }));

      resourceManagementClient.resources.get(resourceGroupName,resourceIdentity,function(err,data){
        if(err){
          console.log(err);
        } else {
          res.send(JSON.stringify(data));
        }
      });
    });
      
  });
})

/* Create a new resource group */
app.put('/subscriptions/:subscriptionId/resourcegroups/:resourceGroupName', function(req,res){
  
  var resourceGroupName = req.params.resourceGroupName || 'cloudOSApp1';
  var parameters = {
    location: 'westus'};

  resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
      subscriptionId: subscriptionId,
      token: token
    }));

  resourceManagementClient.resourceGroups.createOrUpdate(resourceGroupName,parameters,function(err,data){
    if(err){
      console.log(err);
    } else {
      res.send(JSON.stringify(data));
    }
  })
})

/* Create a new resource under a resource group */
app.put('/subscriptions/:subscriptionId/resourcegroups/:resourceGroupName/resources/:resourceName', function(req,res){
  
  var resourceName = req.params.resourceName;

  if(!resourceName){
    res.send('resourceName is a required parameter');
  }

  var resourceType = 'Microsoft.Web/serverFarms'; // default to website for now
  var resourceGroupName = req.params.resourceGroupName || 'Default-Web-WestUS';
  var resourceGroupId = '/subscriptions/' + subscriptionId + '/resourceGroups/Default-Web-WestUS';
  var resourceProviderApiVersion = '2015-01-01';
  var parent = '';
  var parameters = {location: 'westus'}; // required

  var resourceIdentity = resourceManagement.createResourceIdentity(resourceName,resourceType,resourceProviderApiVersion,parent);

	resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
	    subscriptionId: subscriptionId,
	    token: token
	  }));

	resourceManagementClient.resources.createOrUpdate(resourceGroupName,resourceIdentity,parameters,function(err,data){
    if(err){
      console.log(err);
    } else {
      res.send(JSON.stringify(data));
    }
  })
})

app.get('/providers/:providerNamespace/:resourceTypeName', function(req,res){
  console.log('GETTING PROVIDER INFO');
  var namespace = req.params.providerNamespace;
  var resourceTypeName = req.params.resourceTypeName;

  resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
      subscriptionId: subscriptionId,
      token: token
    }));

  resourceManagementClient.providers.get(namespace,function(err,data){
    if(err){
      console.log(err);
    } else {
      //res.send(JSON.stringify(data));
      var info = {};

      var provider = data.provider;
      info.providerId = provider.id;
      info.registrationState = provider.registrationState;
      info.apiVersion = '';

      for (var i = 0; i < provider.resourceTypes.length; i++) {
        var type = provider.resourceTypes[i];
        if(type.name === resourceTypeName){
          if(type.apiVersions.length > 0){
            info.apiVersion = type.apiVersions[0];
          }
        }
      };

      res.send(JSON.stringify(info));
    }
  })
})
/*
  Other Resource Operations:
    - checkExistance (Checks whether resource exists.)
    - delete (Delete resource and all of its resources.)
    - move (Move resources within or across subscriptions.)
  Other Resource Group Operations:
    - beginDeleting (Begin deleting resource group.To determine whether the operation has finished processing the request, call GetLongRunningOperationStatus.)
    - checkExistence
    - createOrUpdate
    - delete
    - get
    - list

/*

Resource Providers are the beginning strings of the resource type
ex. microsoft.cache/redis -> resource provider = microsoft.cache


Resource Types

microsoft.cache/redis  
microsoft.classiccompute/domainnames  
microsoft.classiccompute/virtualmachines  
microsoft.classicnetwork/virtualnetworks  
microsoft.classicstorage/storageaccounts  
microsoft.classicstorage/storageaccounts/services/diagnosticsettings  
microsoft.datafactory/datafactories  
microsoft.documentdb/databaseaccounts  
microsoft.insights/alertrules  
microsoft.insights/autoscalesettings  
microsoft.insights/components  
microsoft.search/searchservices  
microsoft.sql/servers  
microsoft.sql/servers/databases  
microsoft.sql/servers/firewallrules  
microsoft.visualstudio/account  
microsoft.visualstudio/account/project  
microsoft.web/serverfarms  
microsoft.web/sites  
microsoft.web/sites/config  
microsoft.web/sites/extensions  
newrelic.apm/accounts  
successbricks.cleardb/databases  

*/

var server = app.listen(3000, function () {
	var host = server.address().address,
  		port = server.address().port;
})