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
  tenant : '3f6c9704-10d4-4108-aac1-d5a26ac5f799', // can get this with users login response
  authorityHostUrl : 'https://login.windows.net',
  clientId : '8f6b2a6c-fba5-43e9-a0b2-1639553c571c', // jimmywoods1 app client id
  clientSecret: 'zuiVAwjZs7kREke2diuWMKHJoGWH6HMIjbDSkn0ojXk=',
  //username : 'rnchell@jimmywoods1outlook.onmicrosoft.com',
  username: 'jimmywoods1@outlook.com',
  //password : 'thewizard1!'
  password: 'thewizard!'
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
  res.redirect('login');
});

app.get('/login', function(req, res) {
  console.log(req.cookies);

  res.cookie('acookie', 'this is a cookie');

  res.send('\
<head>\
  <title>FooBar</title>\
</head>\
<body>\
  <a href="./auth">Login</a>\
</body>\
    ');
});


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

app.post('/websites/create', function(req, res){
	res.send(req.body.websiteName + ' created');
	var webSiteName = req.body.websiteName;

	// webSiteManagementClient.webSites.create("westuswebspace", {
	//   name: webSiteName,
	//   hostNames: [webSiteName + hostName],
	//   webSpaceName: webSpaceName,
	//   serverFarm: serverFarm
	// }, function (err, result) {
	//   if (err) {
	//     console.error(err);
	//   } else {
	//     console.info(result);
	//   }
	// });
})

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
			var webSpaceName = result.webSpaces[0].name;
			websiteMgmtClient.webSpaces.listWebSites(webSpaceName,function(err,results){
				if(err){
					console.log(err);
				} else {
					res.send(JSON.stringify({websites: results.webSites}));
				}
			})
		}
	});
})

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

var server = app.listen(3000, function () {
	var host = server.address().address,
  		port = server.address().port;
})