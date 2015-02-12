var express = require('express')
var app = express()
var path 		= require('path');
var bodyParser  = require('body-parser');
var swig = require('swig');
var fs = require('fs');
var webSiteManagement = require('azure-mgmt-website');


// azure sub id: 3baf7cce-0610-43bc-b384-5105b8e71ab2


app.use(express.static(path.join(__dirname, '/public')));


// This is where all the magic happens!
app.engine('html', swig.renderFile);

app.set('view engine', 'html');
app.set('views', __dirname + '/');

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

// Swig will cache templates for you, but you can disable
// that and use Express's caching instead, if you like:
app.set('view cache', false);
// To disable Swig's cache, do the following:
swig.setDefaults({ cache: false });
// NOTE: You should always cache templates in a production environment.
// Don't leave both of these to `false` in production!

var hostName = '.azurewebsites.net';
var webSpaceName = 'westuswebspace';
var serverFarm = 'Default1';

var webSiteManagementClient;

function AuthenticateServerUser(){
	webSiteManagementClient = webSiteManagement.createWebSiteManagementClient(webSiteManagement.createCertificateCloudCredentials({
	  subscriptionId: '3baf7cce-0610-43bc-b384-5105b8e71ab2',
	  pem: fs.readFileSync(__dirname + '/' + '3baf7cce-0610-43bc-b384-5105b8e71ab2.pem')
	}));
}

app.get('/', function (req, res) {
	res.render('index')
})

app.post('/auth', function(req,res){
})

app.get('/websites/create', function(req,res){
	res.render('website');
})

app.post('/websites/create', function(req,res){
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

app.get('/dashboard', function(req,res){
	webSiteManagementClient.webSpaces.list(function (err, result) {
    if (err) {
	    console.error(err);
	  } else {
	    console.info(result.webSpaces[0].name);
	    var webSpaceName = result.webSpaces[0].name;
	    webSiteManagementClient.webSpaces.listWebSites(webSpaceName,function(err,results){
				if(err){
					console.log(err);
				} else {
					console.log(results.webSites[0].uri);

					res.render('dashboard', {websites: results.webSites});
				}
	    })
	  }
	});
})

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  AuthenticateServerUser();

  console.log('Example app listening at http://%s:%s', host, port)

})