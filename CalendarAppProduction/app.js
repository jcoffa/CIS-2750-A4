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
var database;


// Async
const async = require('async');


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
        res.status(500).send(e.message);
        return;
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

    res.status(200).send(toReturn);
});

//Given a file name, and an Event JSON, adds the Event provided by the JSON
//to the specified calendar file
app.post('/addEvent', function(req, res) {
    if (req.body.filename == undefined && req.body.evt == undefined) {
        res.status(400).send('No parameters given');
        return;
    } else if (req.body.filename == undefined) {
        res.status(400).send('Missing filename parameter');
        return;
    } else if (req.body.evt == undefined) {
        res.status(400).send('Missing evt (Event object) parameter');
        return;
    }

    var newCalJSON = lib.addEventJSON(__dirname + '/uploads/' + req.body.filename, req.body.evt);

    console.log('\n/addEvent: Received calendar JSON (with a new event): "' + newCalJSON + '"');

    res.status(200).send(newCalJSON);
});

// Writes the given Calendar JSON object to the provided file path
app.post('/writeCalendarJSON', function(req, res) {
    if (req.body.filename == undefined && req.body.cal == undefined && req.body.evt == undefined) {
        res.status(400).send('No parameters given');
        return;
    } else if (req.body.filename == undefined) {
        res.status(400).send('Missing filename parameter');
        return;
    } else if (req.body.cal == undefined) {
        res.status(400).send('Missing cal (Calendar object) parameter');
        return;
    } else if (req.body.evt == undefined) {
        res.status(400).send('Missing evt (Event object) parameter');
        return;
    }

    //var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.query.filename, JSON.stringify(req.query.cal), JSON.stringify(req.query.evt));
    var newCalJSON = lib.writeCalFromJSON(__dirname + '/uploads/' + req.body.filename, req.body.cal, req.body.evt);

    console.log('\n/writeCalendarJSON: returned ' + newCalJSON);

    res.status(200).send(newCalJSON);
});



//******************** Assignment 4 SQL Functionality ******************** 

// Sets up the connection variable to the MySQL database
app.post('/databaseLogin', function(req, res) {
    connection = mysql.createConnection({
        host     : 'dursley.socs.uoguelph.ca',
        user     : req.body.username,
        password : req.body.password,
        database : req.body.databaseName
    });
    database = req.body.databaseName;

    connection.connect(function(err) {
        if (err) {
            console.log('Encountered error when logging into database with credentials (yes, I know this isnt "secure", but whatever): "' + JSON.stringify(req.body) + '"');
            res.status(400).send(err.sqlMessage);
            return;
        }

        res.status(200).send('Connected to database with the following credentials: "' + JSON.stringify(req.body) + '"');
    });
});


// Checks if the tables have been created in the database. If they haven't, they are created.
app.get('/createTables', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    // Determine whether the FILE table has been created already
    connection.query("SELECT * FROM information_schema.tables WHERE table_schema='" + database + "' AND table_name='FILE' LIMIT 1", function(err, results, fields) {
        if (err) {
            console.log('Encountered error when checking if the FILE table exists');
            res.status(500).send(err.sqlMessage);
            return;
        }

        if (results.length == 0) {
            // The FILE table has not been created, so create it!
            connection.query("create table FILE (cal_id INT AUTO_INCREMENT NOT NULL,file_Name VARCHAR(60) NOT NULL,version INT NOT NULL,prod_id VARCHAR(256) NOT NULL,PRIMARY KEY (cal_id))", function(err, results, fields) {
                if (err) {
                    console.log('Encountered error when creating the FILE table: ' + err);
                    res.status(500).send(err.sqlMessage);
                    return;
                }

                console.log('Created FILE table successfully');
            });
        }
    });

    // Determine whether the EVENT table has been created already
    connection.query("SELECT * FROM information_schema.tables WHERE table_schema='" + database + "' AND table_name='EVENT' LIMIT 1", function(err, results, fields) {
        if (err) {
            console.log('Encountered error when checking if the EVENT table exists');
            res.status(500).send(err.sqlMessage);
            return;
        }

        if (results.length === 0) {
            // The EVENT table has not been created, so create it!
            connection.query("create table EVENT (event_id INT AUTO_INCREMENT NOT NULL,summary VARCHAR(1024),start_time DATETIME NOT NULL,location VARCHAR(60),organizer VARCHAR(256),cal_file INT NOT NULL,PRIMARY KEY (event_id),FOREIGN KEY (cal_file) REFERENCES FILE (cal_id) ON DELETE CASCADE)", function(err, results, fields) {
                if (err) {
                    console.log('Encountered error when creating the EVENT table: ' + err);
                    res.status(500).send(err.sqlMessage);
                    return;
                }

                console.log('Created EVENT table successfully');
            });
        }
    });

    // Determine whether the ALARM table has been created already
    connection.query("SELECT * FROM information_schema.tables WHERE table_schema='" + database + "' AND table_name='ALARM' LIMIT 1", function(err, results, fields) {
        if (err) {
            console.log('Encountered error when checking if the ALARM table exists');
            res.status(500).send(err.sqlMessage);
            return;
        }

        if (results.length === 0) {
            // The ALARM table has not been created, so create it!
            connection.query("create table ALARM (alarm_id INT AUTO_INCREMENT NOT NULL,action VARCHAR(256) NOT NULL,`trigger` VARCHAR(256) NOT NULL,event INT NOT NULL,PRIMARY KEY (alarm_id),FOREIGN KEY (event) REFERENCES EVENT (event_id) ON DELETE CASCADE)", function(err, results, fields) {
                if (err) {
                    console.log('Encountered error when creating the EVENT table: ' + err);
                    res.status(500).send(err.sqlMessage);
                    return;
                }

                console.log('Created ALARM table successfully');
            });
        }
    });

    res.status(200).send('All tables are constructed');
});


// Load a single calendar file into the MySQL database
app.get('/insertIntoDB/:filename', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    if (req.params.filename === undefined) {
        res.status(400).send('Missing filename (File name relative to uploads/ directory of .ics file) parameter');
        return;
    }

    let calJSON = lib.createCalendarJSON(__dirname + '/uploads/' + req.params.filename);
    //console.log("\nIn /insertIntoDB/" + req.params.filename + ", received Calendar JSON: \n\"" + calJSON + "\"\n");

    if (calJSON === undefined) {
        res.status(500).send('calJSON was undefined');
        return;
    }

    // Parse the calendar received from the backend
    let cal;
    try {
        cal = JSON.parse(calJSON);
    } catch (e) {
        console.log('\nFatal error in JSON.parse(): the JSON that broke it: ' + retStr);
        res.status(500).send('Fatal error when parsing JSON created from "' + req.params.filename + '"');
        return;
    }


    // A regex to match every single quote
    var sQuote = RegExp("'", "g");


    // First, see if the calendar file is already in the table. If it is, then replace it
    connection.query("SELECT cal_id FROM FILE WHERE file_Name='" + req.params.filename.replace(sQuote, "''") + "'", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when trying to see if FILE row with file_Name="' + req.params.filename + '" exists: ' + err);
            res.status(500).send(err.sqlMessage);
            return;
        }

        if (rows.length !== 0) {
            // The calendar file is already in the database
            console.log('The calendar "' + req.params.filename + '" is already in the database');
            res.status(200).send({'alreadyContained':true, 'message':'The Calendar "' + req.params.filename + '" is already in the databse. It was not reuploaded'});
            return;
        }

        // Insert the calendar into the FILE table
        connection.query("INSERT INTO FILE (file_Name,version,prod_id) VALUES ('" + req.params.filename.replace(sQuote, "''") + "'," + cal.version + ",'" + cal.prodID.replace(sQuote, "''") + "')", function(err, rows, fields) {
            if (err) {
                console.log('error when inserting calendar into FILE table: ' + err);
                res.status(500).send(err.sqlMessage);
                return;
            }
            //console.log("Successfully added calendar \"" + req.params.filename + "\" to FILE table in database\n");

            // Add all the events from the current calendar into the EVENT table
            for (let calEvent of cal.events) {
                //console.log('Current working event (from ' + req.params.filename + '): ' + JSON.stringify(calEvent) + '\n');

                // Find the location and organizer properties, if they exist
                let evtLocation = calEvent.properties.find(prop => prop.propName.toLowerCase() === 'location');
                let evtOrganizer = calEvent.properties.find(prop => prop.propName.toLowerCase() === 'organizer');

                // This query is quite long, so I'm building the string from scratch in an attempt to improve readability
                let evtQuery = "INSERT INTO EVENT (summary,start_time,location,organizer,cal_file) VALUES ";
                evtQuery += "(" + (calEvent.summary === undefined || calEvent.summary === "" ? 'NULL' : "'" + calEvent.summary.replace(sQuote, "''") + "'");
                evtQuery += ',';
                evtQuery += "'" + calEvent.startDT.date.slice(0, 4) + '-' + calEvent.startDT.date.slice(4, 6) + '-' + calEvent.startDT.date.slice(6);
                evtQuery += ' ' + calEvent.startDT.time.slice(0, 2) + ':' + calEvent.startDT.time.slice(2, 4) + ':' + calEvent.startDT.time.slice(4) + "'";
                evtQuery += ',';
                evtQuery += (evtLocation === undefined ? 'NULL' : "'" + evtLocation.propDescr.replace(sQuote, "''") + "'");
                evtQuery += ',';
                evtQuery += (evtOrganizer === undefined ? 'NULL' : "'" + evtOrganizer.propDescr.replace(sQuote, "''") + "'");
                evtQuery += ',';
                evtQuery += rows.insertId;
                evtQuery += ")";

                //console.log("\nquery to add event: " + evtQuery);

                connection.query(evtQuery, function(err, rows, fields) {
                    if (err) {
                        console.log('error when inserting event into EVENT table: ' + err);
                        res.status(500).send(err.sqlMessage);
                        return;
                    }
                    //console.log("Successfully added event from file \"" + req.params.filename + "\" to EVENT table in database\n");

                    // Add all the alarms from the current event into the ALARM table.
                    for (let alarm of calEvent.alarms) {
                        connection.query("INSERT INTO ALARM (action,`trigger`,event) VALUES ('" + alarm.action.replace(sQuote, "''") + "','" + alarm.trigger.replace(sQuote, "''") + "'," + rows.insertId + ")", function(err, rows, fields) {
                            if (err) {
                                console.log('error when inserting into ALARM table: ' + err);
                                res.status(500).send(err.sqlMessage);
                                return;
                            }
                            //console.log('Successfully added alarm from file "' + req.params.filename + '" to ALARM table in database\n');

                        }); // End of insert Alarm into ALARM table
                    } // End of for..of loop iterating over Alarms in the current Event
                }); // End of insert Event into EVENT table
            } // End of for..of loop iterating over Events in Calendar
        }); // End of insert Calendar into FILE table

        // If the function gets to this point, then everything went ok!
        res.status(200).send(req.params.filename);
    }); // End of select query to determine if the Calendar was already in the FILE table
});


// Clears the FILE table, which in turn cascades into deleting the EVENT and ALARM table
app.get('/clearDB', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    connection.query("DELETE FROM FILE", function(err, rows, fields) {
        if (err) {
            console.log('Error when cascade-deleting the FILE table: ' + err);
            res.status(500).send(err.sqlMessage);
            return;
        }
    });

    res.status(200).send('Cleared database');
});


// Returns the number of files, events, and alarms in the database
app.get('/DBstatus', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    var toReturn = "Database has ";
    connection.query("SELECT count(file_Name) AS count FROM FILE", function(err, results, fields) {
        if (err) {
            console.log('Encountered error when counting file_Name fields in the FILE table: ' + err)
            res.status(500).send(err.sqlMessage);
            return;
        }

        toReturn += results[0].count + " files, ";

        connection.query("SELECT count(event_id) AS count FROM EVENT", function(err, results, fields) {
            if (err) {
                console.log('Encountered error when counting event_id fields in the EVENT table: ' + err);
                res.status(500).send(err.sqlMessage);
                return;
            }

            toReturn += results[0].count + " events, and ";

                connection.query("SELECT count(alarm_id) AS count FROM ALARM", function(err, results, fields) {
                if (err) {
                    console.log('Encountered error when counting alarm_id fields in the ALARM table: ' + err);
                    res.status(500).send(err.sqlMessage);
                    return;
                }

                toReturn += results[0].count + " alarms";
                res.status(200).send(toReturn);
            });
        }); 
    }); 
});


app.get('/getEventsSorted', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged into database: connection failed');
        return;
    }

    connection.query("SELECT * FROM EVENT ORDER BY start_time", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when attempting to select every row in the table ' + req.params.tableName);
            res.status(500).send(err.sqlMessage);
            return;
        }

        res.status(200).send(rows);
    });
});


// Gets every event with the file_Name row entry equal to the filename passed to the endpoint
app.get('/getEventsFromFile/:filename', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    if (req.params.filename === undefined || req.params.filename === '') {
        res.status(500).send('Missing required filename parameter');
        return;
    }

    connection.query("SELECT cal_id FROM FILE WHERE file_Name='" + req.params.filename + "'", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when getting FILE entry "' + req.params.filename + "': " + err);
            res.status(500).send(err.sqlMessage);
            return;
        }

        connection.query("SELECT start_time,summary FROM EVENT WHERE cal_file=" + rows[0].cal_id + " ORDER BY start_time", function(err, rows, fields) {
            if (err) {
                console.log('Encountered error when getting EVENT entries from "' + req.params.filename + "': " + err);
                res.status(500).send(err.sqlMessage);
                return;
            }

            res.status(200).send(rows);
        });
    });
});


// Returns every Event from the database that start at the same time
app.get('/getEventConflicts', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    // Use an inner self-join with the EVENT table to find all events with the same start time (without duplicating itself)
    connection.query("SELECT DISTINCT a.start_time,a.summary,a.organizer FROM EVENT AS a, EVENT AS b WHERE a.start_time=b.start_time AND a.event_id<>b.event_id ORDER BY start_time", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when performing self-join to find duplicate start_time properties in the EVENT table');
            res.status(500).send(err.sqlMessage);
            return;
        }

        res.status(200).send(rows);
    });
});


// Returns every Alarm from the database from the specified file
app.get('/getAlarms/:filename', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    if (req.params.filename === undefined || req.params.filename === "") {
        res.status(500).send('Missing required filename parameter');
        return;
    }

    console.log("In /getAlarms, filename='" + req.params.filename + "'");

    connection.query("SELECT cal_id FROM FILE WHERE file_Name='" + req.params.filename + "'", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when getting FILE entry: ' + err.sqlMessage);
            res.status(500).send(err.sqlMessage);
            return;
        }

        connection.query("SELECT event_id FROM EVENT WHERE cal_file='" + rows[0].cal_id + "'", function(err, rows, fields) {
            if (err) {
                console.log('Encountered error when getting EVENT entry: ' + err.sqlMessage);
                res.status(500).send(err.sqlMessage);
                return;
            }

            // Construct a query to get every alarm given (potentially) more than one event_id
            var eventIDs = '(';
            rows.forEach(row => eventIDs += row.event_id + ',');

            // Chop off the trailing ','
            eventIDs = eventIDs.substring(0, eventIDs.length - 1);
            eventIDs += ')'

            connection.query("SELECT DISTINCT * FROM ALARM WHERE event IN " + eventIDs, function(err, rows, fields) {
                if (err) {
                    console.log('Encountered error when getting ALARM entry: ' + err.sqlMessage);
                    res.status(500).send(err.sqlMessage);
                    return;
                }

                res.status(200).send(rows);
            });
        });
    });
});


// Gets all the calendars from the database with at least a certain number of events
app.get('/getCalsWithNumEvents/:number', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    const numEv = req.params.number;
    if (numEv === undefined || numEv === 'undefined') {
        res.status(500).send('Missing "number" (minimum number of Events in a Calendar) parameter');
        return;
    }

    var toReturn = [];

    //connection.query("SELECT * FROM FILE WHERE (SELECT COUNT() FROM ?) >= " + numEv, function(err, rows, fields) {
    connection.query("SELECT * FROM FILE", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when getting the cal_id of all calendars in FILE table: ' + err);
            res.status(500).send(err.sqlMessage);
            return;
        }

        async.forEachOf(rows, function(row, key, callback) {
            connection.query("SELECT COUNT(*) from EVENT WHERE cal_file=" + row.cal_id, function(err, rows, fields) {
                if (err) {
                    console.log('Encountered error when getting the count of event rows from EVENT table with cal_file=' + row.cal_id + ': ' + err);
                    //res.status(500).send(err.sqlMessage);
                    callback(err.sqlMessage);
                    //return;
                }

                console.log('The file with cal_id of ' + row.cal_id + ' has ' + rows[0]['COUNT(*)'] + ' events in it');
                if (rows[0]['COUNT(*)'] >= numEv) {
                    console.log('The file with cal_id ' + row.cal_id + ' had at least ' + numEv + ' events, and was pushed onto the array');
                    toReturn.push(row);
                }
                callback();
            });
        }, function(err) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(toReturn);
            }
        });
    });
});

// Given a form object containing a date field, return all events occurring on that date
app.post('/getEventsOnDate', function(req, res) {
    if (connection === undefined) {
        res.status(401).send('Not logged in to database: connection failed');
        return;
    }

    const date = req.body.date;
    if (date === undefined) {
        res.status(500).send('Missing POST payload "date" parameter');
        return;
    }

    connection.query("SELECT start_time,summary,location,organizer FROM EVENT WHERE DATE(start_time)='" + date + "'", function(err, rows, fields) {
        if (err) {
            console.log('Encountered error when getting all Events from EVENT with DATE(start_time) of ' + date);
            res.status(500).send(err.sqlMessage);
            return;
        }

        res.status(200).send(rows);
    });
});


app.listen(portNum);
console.log('Running app at localhost: ' + portNum);
