'use strict'

// C library API
const ffi = require('ffi');

// Express App (Routes)
const express = require("express");
const app     = express();
const path    = require("path");
const fileUpload = require('express-fileupload');

app.use(fileUpload());

// Minimization
const fs = require('fs');
const JavaScriptObfuscator = require('javascript-obfuscator');

// Important, pass in port as in `npm run dev 32432`, do not change
const portNum = process.argv[2];

// Send HTML at root, do not change
app.get('/',function(req,res){
  res.sendFile(path.join(__dirname+'/public/index.html'));
});

// Send Style, do not change
app.get('/style.css',function(req,res){
  //Feel free to change the contents of style.css to prettify your Web app
  res.sendFile(path.join(__dirname+'/public/style.css'));
});

// Send obfuscated JS, do not change
app.get('/index.js',function(req,res){
  fs.readFile(path.join(__dirname+'/public/index.js'), 'utf8', function(err, contents) {
    const minimizedContents = JavaScriptObfuscator.obfuscate(contents, {compact: true, controlFlowFlattening: true});
    res.contentType('application/javascript');
    res.send(minimizedContents._obfuscatedCode);
  });
});

//Respond to POST requests that upload files to uploads/ directory
app.post('/upload', function(req, res) {
  if(Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
 
  let uploadFile = req.files.uploadFile;
 
  // Use the mv() method to place the file somewhere on your server
  uploadFile.mv('uploads/' + uploadFile.name, function(err) {
    if(err) {
      return res.status(500).send(err);
    }

    // XXX I added this next res.send() thing, and commented out the res.redirect part
    res.send(uploadFile);
    //res.redirect('/');
  });
});

//Respond to GET requests for files in the uploads/ directory
app.get('/uploads/:name', function(req , res){
  fs.stat('uploads/' + req.params.name, function(err, stat) {
    console.log(err);
    if(err == null) {
      res.sendFile(path.join(__dirname+'/uploads/' + req.params.name));
    } else {
      res.send('');
    }
  });
});

//******************** Your code goes here ******************** 

// Get an array of the absolute path of every file in the /uploads directory
app.get('/uploadsContents', function(req, res) {
    res.send(fs.readdirSync(__dirname + '/uploads/'));
});


// FFI library to use the backend written in C. All functions return JSON strings of the new Calendar.
let lib = ffi.Library('./libcalendar', {
    'createCalendarJSON'    : ['string', ['string']],   // filename
    'addEventJSON'          : ['string', ['string', 'string']], // filename, Event JSON string
    'writeCalFromJSON'      : ['string', ['string', 'string', 'string']],   // filename, Calendar JSON string, Event JSON string
});


// Given a file name (which will be appended to the path to the /uploads/ dir),
// returns the Calendar JSON created from that file, or an error code JSON on a failure.
app.get('/getCal/:name', function(req, res) {
    var path = __dirname + '/uploads/' + req.params.name;
    console.log('\nCreating calendar from "' + path + '"');
    var retStr = lib.createCalendarJSON(path);

    try {
        var obj = JSON.parse(retStr);
    } catch (e) {
        console.log('Fatal error in JSON.parse(): the JSON that broke it: ' + retStr);
        return res.status(500).send(e.message);
    }
    var toReturn;

    if (obj.error != undefined) {
        // An error occurred
        toReturn = obj;
        console.log('Error occurred when creating calendar from "' + path + '": ' + toReturn.error + '; ' + toReturn.message);
    } else {
        // Calendar was created successfully
        console.log('Successfully created calendar from "' + path + '"');
        toReturn = {
            'filename': req.params.name,
            'obj': obj
        };
    }

    res.send(toReturn);
});

//Given a file name, and an Event JSON, adds the Event provided by the JSON
//to the specified calendar file
app.get('/addEvent', function(req, res) {
    //console.log('\nraw req.query: ' + JSON.stringify(req.query));
    //console.log('\nfilename: ' + req.query.filename);
    //console.log('\nevt: ' + req.query.evt);

    if (req.query.filename == undefined && req.query.evt == undefined) {
        return res.status(400).send('No parameters given');
    } else if (req.query.filename == undefined) {
        return res.status(400).send('Missing filename parameter');
    } else if (req.query.evt == undefined) {
        return res.status(400).send('Missing evt (Event object) parameter');
    }

    var newCalJSON = lib.addEventJSON(__dirname + '/uploads/' + req.query.filename, req.query.evt);

    console.log('\n/addEvent: Received calendar JSON (with a new event): "' + newCalJSON + '"');

    res.send(newCalJSON);
});

// Writes the given Calendar JSON object to the provided file path
app.get('/writeCalendarJSON', function(req, res) {
    //console.log('\nraw req.query: ' + JSON.stringify(req.query));
    //console.log('\nfilename: ' + req.query.filename);
    //console.log('\ncal: ' + req.query.cal);
    //console.log('\nevt: ' + req.query.evt);

    if (req.query.filename == undefined && req.query.cal == undefined && req.query.evt == undefined) {
        return res.status(400).send('No parameters given');
    } else if (req.query.filename == undefined) {
        return res.status(400).send('Missing filename parameter');
    } else if (req.query.cal == undefined) {
        return res.status(400).send('Missing cal (Calendar object) parameter');
    } else if (req.query.evt == undefined) {
        return res.status(400).send('Missing evt (Event object) parameter');
    }

    //var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.query.filename, JSON.stringify(req.query.cal), JSON.stringify(req.query.evt));
    var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.query.filename, req.query.cal, req.query.evt);

    console.log('\n/writeCalendarJSON: returned ' + newCalJSON);

    res.send(newCalJSON);
});


app.listen(portNum);
console.log('Running app at localhost: ' + portNum);
