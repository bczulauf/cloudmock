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
    fs = require('fs');
    resourceManagement = require("azure-mgmt-resource");
var websiteMgmt = require('azure-mgmt-website');
var adal = require('adal-node');
var AuthenticationContext = adal.AuthenticationContext;
var xml = require('xml2js');
var util = require('util');
var session = require('express-session');
var Client = require('ftp');

app.use(cookieParser('a deep secret'));

app.use(session({
  secret: 'iamthereaper',
  resave: false,
  saveUninitialized: true,
  /*cookie: {secure:true} HTTPS is necessary for secure cookies. 
      If secure is set, and you access your site over HTTP, the cookie will not be set*/
}))

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
var ftpRootPath = '/site/wwwroot/';
var ftpTempPath = './public/ftp/temp/';

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

/* ADAL Client */
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

function turnOnLogging() {
  var log = adal.Logging;
  log.setLoggingOptions({
    level : log.LOGGING_LEVEL.VERBOSE,
    log : function(level, message, error) {
      console.log(message);
      if (error) {
        console.log(error);
      }
    }
  });
}

function getUserSubscriptions(req,res){

  console.log('************Getting User Subscription ID**************');
  var path = '/subscriptions?api-version=2014-04-01-preview'.replace(/'/g, '%27')
  
  var options = {
    host: 'management.core.windows.net',
    port: 443,
    path: path,
    method: 'GET',
    headers: {
     'Authorization': 'Bearer ' + token,
     'content-type': 'application/json; charset=utf-8',
     'x-ms-version':'2014-05-01'
    }  
  };

  https.request(options, function(resp){
    
    resp.setEncoding('utf8');
    var xmlParser = new xml.Parser();

    console.log(resp.statusCode);
    var body = "";
    resp.on('data', function(chunk) {
        body += chunk;
        xmlParser.parseString(chunk, function (err, result) {
          var subscriptions = result.Subscriptions.Subscription;
          var subscriptionId;
          if(subscriptions && subscriptions.length > 0){
            subscriptionId = subscriptions[0].SubscriptionID[0];
          }

          req.session.user.subscriptionId = subscriptionId;
        });
    });
    resp.on('end', function() {
      console.log('SUBSCRIPTIONID: ' + req.session.user.subscriptionId);

      if(!req.session.user.subscriptionId){
        console.log(req.session.user.userId + ' has no subscriptions!');
      } else {
        setUserFtpSessionData(req,res);
        authenticateAdalClient(req.session.user.subscriptionId);
        console.log('************Ready To Go**************');
      }

      //res.redirect('/home');
    })
    resp.on('error', function(e) {
        console.log("Got error: " + e.message);
    });
  }).end();
}

function authenticateAdalClient(subId){
  console.log('************Authenticating ADAL Client**************');

  resourceManagementClient = resourceManagement.createResourceManagementClient(new common.TokenCloudCredentials({
    subscriptionId: subId,
    token: token
  }));
}

function setUserFtpSessionData(req,res){
  var subscriptionId = req.session.user.subscriptionId;

  var websiteMgmtClient = websiteMgmt.createWebSiteManagementClient(new common.TokenCloudCredentials({
      subscriptionId: subscriptionId,
      token: token
    }))

  websiteMgmtClient.webSpaces.list(function(err,result){
    if(err){
      console.log(err);
    } else {
      if(result && result.webSpaces.length > 0){
      var webSpaceName = result.webSpaces[0].name;
        websiteMgmtClient.webSpaces.listWebSites(webSpaceName,function(err,results){
          if(err){
            console.log(err);
          } else {
            for(var i=0;i<results.webSites.length; i++){
              var website = results.webSites[i];
            }

            var websiteName = results.webSites[0].name
            /* Get FTP info */
            websiteMgmtClient.webSites.getPublishProfile(webSpaceName, websiteName, function(err,result){
              if(err){
                console.log(err)
              }else {
                //console.log(result);
                var publishProfiles = result.publishProfiles;
                for(var i=0;i<publishProfiles.length;i++){
                  var profile = publishProfiles[i];

                  if(profile.publishMethod === 'FTP'){
                    console.log('*** Setting FTP Session Info ****');
                    var url = profile.publishUrl;
                    if(url.indexOf('ftp://') !== -1){
                      url = url.slice(6);
                      var stripPath = url.indexOf('/');
                      if(stripPath !== -1){
                        url = url.slice(0,stripPath);
                      }
                    }

                    req.session.ftpInfo = {
                      url: url,
                      userName: profile.userName,
                      password: profile.userPassword
                    };

                    console.log(req.session.ftpInfo);
                    //res.sendStatus(200);
                    res.redirect('/home');
                  }
                }

              }
            })

            //res.send(JSON.stringify({websites: results.webSites}));
          }
        })
      } else {
        res.redirect('/home');
      }
    }
  });
}

turnOnLogging();

app.get('/', function(req, res) {
  res.render('index');
});

app.post('/login', function(req,res){
  console.log(req.body.email);
  console.log(req.body.password);
  res.redirect('/auth');
})

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

    // console.log("******RESPONSE*******");
    // console.log(response);
    token = response.accessToken;

    /* set session user */
    req.session.user = {userId:response.userId,firstName:response.givenName, lastName: response.familyName };

    // Later, if the access token is expired it can be refreshed.
    authenticationContext.acquireTokenWithRefreshToken(response.refreshToken, sampleParameters.clientId, sampleParameters.clientSecret, resource, function(refreshErr, refreshResponse) {
      if (refreshErr) {
        message += 'refreshError: ' + refreshErr.message + '\n';
      }
      message += 'refreshResponse: ' + JSON.stringify(refreshResponse);

      // console.log("******REFRESH RESPONSE*******");
      // console.log(refreshResponse);
      token = refreshResponse.accessToken;

      getUserSubscriptions(req,res);
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
	res.render('home',{userId:req.session.user.userId,hasSubscription: req.session.user.subscriptionId});
});

/* get websites for user and subscription */
app.get('/websites', function(req,res){
	/* 
		to use this client, you have to change the resource at the top to be
		https://management.core.windows.net/
	*/

  var subscriptionId = req.session.user.subscriptionId;

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
            for(var i=0;i<results.webSites.length; i++){
              var website = results.webSites[i];
              console.log(website);
            }

            // var websiteName = results.webSites[0].name
            // /* Get FTP info */
            // websiteMgmtClient.webSites.getPublishProfile(webSpaceName, websiteName, function(err,result){
            //   if(err){
            //     console.log(err)
            //   }else {
            //     //console.log(result);
            //     var publishProfiles = result.publishProfiles;
            //     for(var i=0;i<publishProfiles.length;i++){
            //       var profile = publishProfiles[i];
            //       console.log('Profile: ');
            //       console.log(profile.publishMethod);
            //       if(profile.publishMethod === 'FTP'){
            //         console.log('*** Setting FTP Session Info ****');
            //         var url = profile.publishUrl;
            //         if(url.indexOf('ftp://') !== -1){
            //           url = url.slice(6);
            //           var stripPath = url.indexOf('/');
            //           if(stripPath !== -1){
            //             url = url.slice(0,stripPath);
            //           }
            //         }
            //         req.session.ftpInfo = {
            //           url: url,
            //           userName: profile.userName,
            //           password: profile.userPassword
            //         };

            //         console.log(req.session.ftpInfo);
            //         res.sendStatus(200);
            //       }
            //     }

            //   }
            // })

  					res.send(JSON.stringify({websites: results.webSites}));
  				}
  			})
      } else {
        res.send('no webspaces');
      }
		}
	});
})

app.post('/websites/:website/files/file', function(req,res){
  console.log(req.session.ftpInfo);

  if(!req.session.ftpInfo){
    console.log('No FTP Info Set');
    return res.sendStatus(400);
  }

  var c = new Client();
  var data = req.body;
  console.log(data);

  /* maybe we just presume localfilename is same as remote to make things easier */
  var localFileName = data.filename;
  var fileData = data.fileData;
  console.log('localfilename: ' + localFileName);
  console.log(fileData);

  c.on('ready', function() {

    fs.writeFile(ftpTempPath + localFileName, fileData, function(err){
      if(err){
        console.log(err);
      } else{
        console.log("File saved successfully");
        c.put(ftpTempPath + localFileName, ftpRootPath + localFileName, function(err) {
          if (err){
            console.log(err);
          }
          console.log("File uploaded successfully.");
          c.end();
        });
      }
    })
  });

  var ftpHost = req.session.ftpInfo.url,
      ftpUsername = req.session.ftpInfo.userName,
      ftpPassword = req.session.ftpInfo.password;
  
  c.connect({
    host:ftpHost,
    user: ftpUsername,
    password: ftpPassword
  });
})

/* get single file from website */
app.get('/websites/:website/files/:filename', function(req,res){

  if(!req.session.ftpInfo){
    console.log('No FTP Info Set');
    return res.sendStatus(400);
  }

  var c = new Client();

  var websiteName = req.params.website;
  var filename = req.params.filename;

  /* download remote file and save it locally */
  c.get(ftpRootPath + filename, function(err, stream) {
    if (err) throw err;
    stream.once('close', function() { c.end(); });

    /* save file locally for edit */
    stream.pipe(fs.createWriteStream(ftpTempPath + filename));
    fs.readFile(ftpTempPath + filename, function(err,data){
      if(err){
        console.log("Error opening file: " + err);
      } else {
        res.render('home', {showEditFile: true, fileData: data});
      }
    })
  });

  var ftpHost = req.session.ftpInfo.url,
      ftpUsername = req.session.ftpInfo.userName,
      ftpPassword = req.session.ftpInfo.password;
  
  c.connect({
    host:ftpHost,
    user: ftpUsername,
    password: ftpPassword
  });
})

/* get all files and directories under website */
app.get('/websites/:website/files', function(req,res){
  console.log(req.session.ftpInfo);

  if(!req.session.ftpInfo){
    console.log('No FTP Info Set');
    return res.sendStatus(400);
  }

  var c = new Client();

  c.on('ready', function() {

    /* list all files and directories under webroot */
    c.list(ftpRootPath,function(err, list) {
      if (err) throw err;

      var fileObjs = [];

      for(var i=0; i < list.length; i++){
        var fileObj = list[i];
        console.log('Filename: ' + fileObj.name);
        console.log('File type: ' + fileObj.type); // d for directory and - for file
        console.log('File size: ' + fileObj.size);
        fileObj.path = ftpRootPath +'/';
        fileObjs.push(fileObj);
      }

      console.dir(fileObjs);
      res.send(JSON.stringify({files: fileObjs}));

      c.end();
    });
  });

  var ftpHost = req.session.ftpInfo.url,
      ftpUsername = req.session.ftpInfo.userName,
      ftpPassword = req.session.ftpInfo.password;
  
  c.connect({
    host:ftpHost,
    user: ftpUsername,
    password: ftpPassword
  });
})

/* Get resources under a subscription */
app.get('/subscriptions/:subscriptionId/resources', function(req,res){

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
app.post('/subscriptions/:subscriptionId/resourcegroups', function(req,res){
  
  var resourceGroupName = req.body.appName;
  var subscriptionId = req.session.user.subscriptionId;

  if(!resourceGroupName || resourceGroupName === '' || !subscriptionId){
    return res.sendStatus(400);
  }

  var parameters = {
    location: 'westus'};

  resourceManagementClient.resourceGroups.createOrUpdate(resourceGroupName,parameters,function(err,data){
    if(err){
      console.log(err);
    } else {
      console.log(data);
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
  var subscriptionId = req.session.user.subscriptionId;

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

