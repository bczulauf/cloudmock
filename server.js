var express = require('express'),
	app = express(),
	path = require('path'),
	bodyParser = require('body-parser'),
	swig = require('swig'),
	fs = require('fs'),
	webSiteManagement = require('azure-mgmt-website');


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
	webSiteManagementClient;

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

app.get('/home', function(req,res){
	webSiteManagementClient.webSpaces.list(function (err, result) {
	    if (err) {
		    console.error(err);
		} else {
		    var webSpaceName = result.webSpaces[0].name;

		    webSiteManagementClient.webSpaces.listWebSites(webSpaceName,function(err,results){
				if(err){
					console.log(err);
				} else {
					console.log(results.webSites[0].uri);

					res.render('home', {websites: results.webSites});
				}
		    })
		}
	});
})

var server = app.listen(3000, function () {
	var host = server.address().address,
  		port = server.address().port;

  AuthenticateServerUser();
})