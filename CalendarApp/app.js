'use strict'

// C library API
const ffi = require('ffi');

// Express App (Routes)
// https://expressjs.com/en/4x/api.html
const express = require("express");
const app     = express();
const path    = require("path");
const fileUpload = require('express-fileupload');

app.use(fileUpload());

// Allows for app.post requests to access the data sent by the AJAX call
// https://expressjs.com/en/4x/api.html#req.body
// https://www.npmjs.com/package/body-parser#express-route-specific
const bodyParser = require('body-parser');
const qs = require('qs');   // required for when bodyParser.urlencoded extend option is true

app.use(bodyParser.json()); // parse JSONs sent to a POST request
app.use(bodyParser.urlencoded({extended: true}));   // https://www.npmjs.com/package/body-parser#bodyparserurlencodedoptions


// MySQL connection
const mysql = require('mysql');
// Variable to represent the mysql connection that will be usued in all the query endpoints.
// The user must login before using any of the other query endpoints.
var connection;


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
app.post('/addEvent', function(req, res) {
    if (req.body.filename == undefined && req.body.evt == undefined) {
        return res.status(400).send('No parameters given');
    } else if (req.body.filename == undefined) {
        return res.status(400).send('Missing filename parameter');
    } else if (req.body.evt == undefined) {
        return res.status(400).send('Missing evt (Event object) parameter');
    }

    var newCalJSON = lib.addEventJSON(__dirname + '/uploads/' + req.body.filename, req.body.evt);

    console.log('\n/addEvent: Received calendar JSON (with a new event): "' + newCalJSON + '"');

    res.send(newCalJSON);
});

// Writes the given Calendar JSON object to the provided file path
app.post('/writeCalendarJSON', function(req, res) {
    if (req.body.filename == undefined && req.body.cal == undefined && req.body.evt == undefined) {
        return res.status(400).send('No parameters given');
    } else if (req.body.filename == undefined) {
        return res.status(400).send('Missing filename parameter');
    } else if (req.body.cal == undefined) {
        return res.status(400).send('Missing cal (Calendar object) parameter');
    } else if (req.body.evt == undefined) {
        return res.status(400).send('Missing evt (Event object) parameter');
    }

    //var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.query.filename, JSON.stringify(req.query.cal), JSON.stringify(req.query.evt));
    var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.body.filename, req.body.cal, req.body.evt);

    console.log('\n/writeCalendarJSON: returned ' + newCalJSON);

    res.send(newCalJSON);
});



//******************** Assignment 4 SQL Functionality ******************** 
app.post('/databaseLogin', function(req, res) {
    connection = mysql.createConnection({
        host     : 'dursley.socs.uoguelph.ca',
        user     : req.body.username,
        password : req.body.password,
        database : req.body.databaseName
    });

    connection.connect(function(err) {
        if (err) {
            console.log('Encountered error when logging into database with creedentials: "' + JSON.stringify(req.body) + '"');
            res.status(400).send(err);
            return;
        } else {
            res.status(200).send('Connected to database with the following credentials: "' + JSON.stringify(req.body) + '"');
        }
    });
});


// Load a single calendar file into the MySQL database
app.get('/insertIntoDB/:filename', function(req, res) {
    if (connection === undefined) {
        return res.status(401).send('Not logged in to database: connection failed');
    }

    if (req.params.filename === undefined) {
        return res.status(400).send('Missing filename (File name relative to uploads/ directory of .ics file) parameter');
    }

    let calJSON = lib.createCalendarJSON(__dirname + '/uploads/' + req.params.filename);
    //console.log("\nIn /insertIntoDB/" + req.params.filename + ", received Calendar JSON: \n\"" + calJSON + "\"\n");

    if (calJSON === undefined) {
        return res.status(500).send('calJSON was undefined');
    }

    let cal;
    try {
        cal = JSON.parse(calJSON);
    } catch (e) {
        console.log('\nFatal error in JSON.parse(): the JSON that broke it: ' + retStr);
        return res.status(500).send('Fatal error when parsing JSON created from "' + req.params.filename + '"');
    }

    // Insert the calendar into the FILE table
    connection.query("INSERT INTO FILE (file_Name,version,prod_id) VALUES ('" + req.params.filename + "'," + cal.version + ",'" + cal.prodID + "')", function(err, rows, fields) {
        if (err) {
            console.log('error when inserting calendar into FILE table: ' + err);
            return res.status(500).send(err);
        }
        //console.log("Successfully added calendar \"" + req.params.filename + "\" to FILE table in database\n");

        // Add all the events from the calendar into the EVENT table
        for (let calEvent of cal.events) {
            //console.log('Current working event (from ' + req.params.filename + '): ' + JSON.stringify(calEvent) + '\n');

            // This query is quite long, so I'm building the string from scratch in an attempt to improve readability
            let evtQuery = "INSERT INTO EVENT (summary,start_time,location,organizer,cal_file) VALUES ";
            evtQuery += "(" + (calEvent.summary === undefined || calEvent.summary === "" ? 'NULL' : "'" + calEvent.summary.replace("'", "''") + "'");
            evtQuery += ',';
            evtQuery += "'" + calEvent.startDT.date.slice(0, 4) + '-' + calEvent.startDT.date.slice(4, 6) + '-' + calEvent.startDT.date.slice(6);
            evtQuery += ' ' + calEvent.startDT.time.slice(0, 2) + ':' + calEvent.startDT.time.slice(2, 4) + ':' + calEvent.startDT.time.slice(4) + "'";
            evtQuery += ',';
            evtQuery += (calEvent.location === undefined ? 'NULL' : "'" + calEvent.location.replace("'", "''") + "'");
            evtQuery += ',';
            evtQuery += (calEvent.organizer === undefined ? 'NULL' : "'" + calEvent.organizer.replace("'", "''") + "'");
            evtQuery += ',';
            evtQuery += rows.insertId;
            evtQuery += "),";
            // Chop off the trailing comma
            evtQuery = evtQuery.substring(0, evtQuery.length - 1);

            //console.log("\nquery to add event: " + evtQuery);

            // For some reason, the "alarms" array is ALWAYS empty after entering this next query,
            // so we have to build the alarm insertion query ahead of time. It is very annoying and inefficient.
            let alarmQuery;
            if (calEvent.alarms.length !== 0) {
                alarmQuery = "INSERT INTO ALARM (action,`trigger`,event) VALUES "
                let toAdd = "";
                for (let alarm of calEvent.alarms) {
                    toAdd += "(" + "'" + alarm.action + "'";
                    toAdd += ',';
                    toAdd += "'" + alarm.trigger + "'";
                    toAdd += ',';
                    toAdd += '____REPLACEWITHID____';   // we won't know the insertId until afer entering the query, so we have to flag it somehow
                    toAdd += "),";
                }
                // remove trailing comma and add to query, if it exists
                if (toAdd !== "") {
                    toAdd = toAdd.substring(0, toAdd.length - 1);
                    alarmQuery += toAdd;
                }
            }

            //console.log("Event JSON right before for connection.query (from " + req.params.filename + "): " + JSON.stringify(calEvent) + '\n');
            connection.query(evtQuery, function(err, rows, fields) {
                if (err) {
                    console.log('error when inserting event into EVENT table: ' + err);
                    return res.status(500).send(err);
                }
                //console.log("Successfully added event from file \"" + req.params.filename + "\" to EVENT table in database\n");

                // Add all the alarms from the event into the ALARM table.
                // If the event had no alarms, then the alarmQuery string was never defined.
                if (alarmQuery !== undefined) {
                    // Replace the flag token with the primary key of this event
                    alarmQuery = alarmQuery.replace(RegExp('____REPLACEWITHID____', "g"), rows.insertId);

                    //console.log('Alarm query for the event ' + JSON.stringify(calEvent) + '\n' + alarmQuery + '\n');

                    connection.query(alarmQuery, function(err, rows, fields) {
                        if (err) {
                            console.log('error when inserting alarm into ALARM table: ' + err);
                            return res.status(500).send(err);
                        }

                        //console.log("Successfully added alarm from file \"" + req.params.filename + "\" to ALARM table in database\n");
                    }); // End of insert Alarm into ALARM table
                } // End of if statement determining whether the current working Event had any Alarms
            }); // End of insert Event into EVENT table
        } // End of for..of loop iterating over Events in Calendar
    }); // End of insert Calendar into FILE table

    // If the function gets to this point, then everything went ok!
    return res.status(200).send(req.params.filename);
});


app.get('/clearDB', function(req, res) {
    if (connection === undefined) {
        return res.status(401).send('Not logged in to database: connection failed');
    }

    connection.query("DELETE FROM ALARM", function(err, rows, fields) {
        if (err) {
            console.log('Error when clearing the ALARM table: ' + err);
            return res.status(500).send(err);
        }
    });

    connection.query("DELETE FROM EVENT", function(err, rows, fields) {
        if (err) {
            console.log('Error when clearing the EVENT table: ' + err);
            return res.status(500).send(err);
        }
    });

    connection.query("DELETE FROM FILE", function(err, rows, fields) {
        if (err) {
            console.log('Error when clearing the EVENT table: ' + err);
            return res.status(500).send(err);
        }
    });

    res.status(200).send('Cleared database');
});






// Disconnects from the database
app.get('/disconnectDB', function(req, res) {
    connection.end();
    console.log('Disconnected from database in /disconnectDB');
    res.status(200).send('Disconnected database');
});


app.listen(portNum);
console.log('Running app at localhost: ' + portNum);
