/*********************
 * Utility Functions *
 *********************/

// Clears the text of an element
function clearText(id) {
    $('#' + id).val("");
}

// Adds text to a textarea
function addText(id, message) {
    var textarea = $('#' + id)
    var currentText = textarea.val();

    // Determine how text should be appended (note: .append() method from jquery doesn't work for this)
    // https://stackoverflow.com/a/4723017
    if (currentText === "") {
        textarea.val(message);
    } else {
        // Append text
        textarea.val(currentText + "\n" + message);

        // Scroll to the bottom
        var height1 = textarea[0].scrollHeight;
        var height2 = textarea.height();
        textarea.scrollTop(height1 - height2);
    }
}

// Wrapper for addText() to display to the Status Panel
function statusMsg(text, newline=false) {
    if (newline) {
        addText('statusText', '\n' + text);
    } else {
        addText('statusText', text);
    }
}

// Returns a string that formats the 'date' part of the given DateTime JSON object
// so it can be properly displayed in a table
function formatDate(dt) {
    var toReturn = "";

    toReturn += dt.date.slice(0, 4);    // Year
    toReturn += '/';
    toReturn += dt.date.slice(4, 6);    // Month
    toReturn += '/';
    toReturn += dt.date.slice(6);       // Day

    return toReturn;
}

// Returns a string that formats the 'time' part of the given DateTime JSON object
// so it can be properly displayed in a table
function formatTime(dt) {
    var toReturn = "";

    toReturn += dt.time.slice(0, 2);    // Hour
    toReturn += ':';
    toReturn += dt.time.slice(2, 4);    // Minute
    toReturn += ':';
    toReturn += dt.time.slice(4);       // Second

    if (dt.isUTC) {
        toReturn += ' (UTC)';          // UTC time
    }

    return toReturn;
}

// Adds a new row to the Event List table, given an Event object retrieved from a JSON
function addEventToTable(evt) {
    // Prevent errors if single quotes are present in the summary or other text field
    var sanitized = encodeURIComponent(JSON.stringify(evt));

    var markup = "<tr><td><input type='radio' name='eventSelect' data-obj=\"" + sanitized + "\"></td><td>" + formatDate(evt.startDT) + "</td><td>"
                 + formatTime(evt.startDT) + "</td><td>" + evt.summary + "</td><td><b>" + evt.numProps + " (total)</b><br>" + (evt.numProps-3) + " (optional)</td><td>"
                 + evt.numAlarms + "</td></tr>";

    $('#eventTable').append(markup);
}

// Adds a new row to the File Log Panel table, given a Calendar JSON object and a file name string.
// If a row with the same file name exists already in the File Log Panel, it is
// replaced with the new Calendar passed into the function.
function addCalendarToTable(filename, calendar, printReupload=true) {
    // First, determine if the first row of the table body contains the 'No files in system' text
    var firstRowElement = $('#fileLogBody tr:eq(0) td').filter(function() {
        return $(this).text() == 'No files in system';
    });

    // If the first row was the special 'table empty' row, remove it.
    if (firstRowElement.length !== 0) {
        firstRowElement.parent().remove();
    }


    // The markup for the new row in the table
    var markup = "<tr><td><a href='/uploads/" + filename + "'>" + filename + "</a></td><td>"
                 + calendar.version + "</td><td>" + calendar.prodID + "</td><td>"
                 + calendar.numProps + "</td><td>" + calendar.numEvents + "</td></tr>";


    // Check for duplicate file re-uploading
    var prevRow = $('#fileLogBody td').filter(function() {
        return $(this).text() == filename;
    }).closest('tr');

    // If a row with the fame filename was found, then it is a re-upload
    if (prevRow.length !== 0) {
        if (printReupload) {
            statusMsg('Re-uploaded the file "' + filename + '"');
        }

        // Replace row in File Log Panel
        prevRow.replaceWith(markup);
    } else {
        $('#fileLogBody').append(markup);
    }
}

// Adds a new option to the Calendar File Selector, given a Calendar JSON object and a file name string.
// If a row with the same file name exists already in the File Log Panel, it is
// replaced with the new Calendar passed into the function.
function addCalendarToFileSelector(filename, calendar) {
    // The option object that will be added to the file selector
    var option = new Option(filename, filename);
    $(option).data('obj', calendar);

    // Check for duplicate file re-uploading
    var prevOption = $('#fileSelector option').filter(function() {
        return $(this).val() == filename;
    });

    // If an option with the same filename was found, then it is a re-upload
    if (prevOption.length !== 0) {
        // Replace entry in the 'Calendar File to View:' <select> element
        prevOption.replaceWith(option);
    } else {
        // Brand new Calendar upload: add it to the file selector
        $('#fileSelector').append(option);
    }

    // Select the new file
    $('#fileSelector option[value="' + filename + '"]').attr('selected', 'selected');
    $('#fileSelector').change();
}

function addAlarmToTable(alarm) {
    // Markup the entire table row, which itself contains a table of properties
    var markup = "<tr><td>" + alarm.action + "</td><td>" + alarm.trigger + "</td><td>"
                 + "<table width='100%'><thead><tr><th width='25%'>Prop Name</th><th>Prop Descr</th></tr></thead><tbody>";

    // Add alarm properties to the inner table
    if (alarm.properties.length === 0) {
        // Alarm contains no additional properties
        markup += "<tr><td></td><td>No properties</td></tr>"
    } else {
        for (var prop of alarm.properties) {
            markup += "<tr><td>" + prop.propName + "</td><td>" + prop.propDescr + "</td></tr>";
        }
    }
    // finishing closing tags for the property table (and ending the row)
    markup += "</tbody></table></tr>";

    $('#eventAlarmBody').append(markup);
}

function addPropertyToTable(prop) {
    // Markup for the row to add
    var markup = "<tr><td>" + prop.propName + "</td><td>" + prop.propDescr + "</tr>"

    $('#eventPropertyBody').append(markup);
}

function getFormData(form) {
    var formDataArray = form.serializeArray();
    var formData = {};

    $.map(formDataArray, function(key, val) {
        formData[key['name']] = key['value'];
    });

    return formData;
}

// Outputs a reasonable error message to the Status Panel
function errorMsg(message, error) {
    statusMsg('\n' + message + ': ' + error.responseText + ' (' + error.status + ': ' + error.statusText + ')');
}

function loadFile(file) {
    $.ajax({
        type: "GET",
        dataType: "json",
        url: "/getCal/" + file.name,
        success: function(cal) {
            // In this case, 'success' just means the callback itself didn't encounter
            // an error; the function itself could have still failed.
            // Error code JSON's have the format of {"error":"Error code","filename":"file name"},
            // for example {"error":"Invalid Alarm","filename":"testCalendar5.ics"}

            if (cal.error != undefined) {
                // XXX the assignment description has been updated. Now, invalid files are ignored.
                statusMsg('Error when trying to create calendar from "' + cal.filename + '": ' + cal.error + ': ' + cal.message);
            } else {
                statusMsg('Loaded "' + cal.filename + '" successfully');
                addCalendarToTable(cal.filename, cal.obj);
                addCalendarToFileSelector(cal.filename, cal.obj);
            }
        },
        error: function(error) {
            errorMsg('Encountered an error when attempting to load the file "' + file.name + '"', error);
        }
    });
}

// Returns true if all required input fields have been filled, and false otherwise.
// Highlights the border of the input field red if it is both required and empty.
function formHasAllRequired(formID) {
    var allRequired = true;

    $('#' + formID + ' input').each(function() {
        if ($(this).prop('required') && $(this).val() === '') {
            $(this).css('border-color', 'red');
            allRequired = false;
        } else {
            $(this).css('border-color', '');
        }
    });

    return allRequired;
}

// Converts a date string ("YYYY-MM-DD") and time string ("HH:MM") into a DateTime object
// in JSON format, to be used in the C backend
function dtStrToJSON(date, time, isUTC) {
    var toReturn = {};

    var dateToAdd = date.slice(0,4) + date.slice(5, 7) + date.slice(8);

    // We will assume every DateTime is created on the turn of the minute,
    // since the <input type=time> tag does not allow for seconds to be entered
    var timeToAdd = time.slice(0, 2) + time.slice(3, 5) + '00';

    toReturn.date = dateToAdd;
    toReturn.time = timeToAdd;
    toReturn.isUTC = isUTC;

    return toReturn;
}

// Pads the string "str" with up to "num" 0's
function padNumStr(str, num) {
    var zeros = '';
    for (var i = 0; i < num; i++) {
        zeros += '0';
    }

    return (zeros + str).slice(-num);
}

// Creates an Event JSON from form data
function createEvent(formData) {
    var today = new Date();

    var dtStart = dtStrToJSON(formData.startDate, formData.startTime, formData.utc === 'on');

    var dtStamp = {
        "date": '' + padNumStr(today.getFullYear(), 4) + padNumStr(today.getMonth() + 1, 2) + padNumStr(today.getDate(), 2),
        "time": '' + padNumStr(today.getHours(), 2) + padNumStr(today.getMinutes(), 2) + padNumStr(today.getSeconds(), 2),
        "isUTC": false
    };

    // Construct the Event JSON
    var toReturn = {
        "startDT": dtStart,
        "createDT": dtStamp,
        "UID": "NULL",  // To be filled in by the backend
        "numProps": (formData.summary == undefined ? 3 : 4),
        "numAlarms": 0,
        "summary": (formData.summary == undefined || formData.summary == "" ? "NULL" : formData.summary),
        "properties": [],
        "alarms": []
    };

    return toReturn;
}

// Creates a Calendar JSON from form data
function createCalendar(formData) {
    var toReturn = {
        "version": 2,
        "prodID": (formData.productID == undefined || formData.productID == "") ? "-//Joseph Coffa/CIS*2750 iCalendar File Manager V1.1//EN" : formData.productID,
        "numProps": 2,
        "numEvents": 1,
        "properties": [],
        "events": []
    };

    return toReturn;
}





/********************************************
 * Onload AJAX calls, Event Listeners, etc. *
 ********************************************/
$(document).ready(function() {

    /******************************
     * Load all files in /uploads *
     ******************************/
    $.ajax({
        type: "GET",
        url: "/uploadsContents",
        dataType: "json",
        success: function(files) {
            for (var file of files) {
                // Get a JSON of the calendar, and add it to the necessary HTML elements
                loadFile({"name": file});
            }
        }, error: function(error) {
            errorMsg('Encountered an error while loading saved .ics files', error);
        }
    }); 





    /************************************
     * Require a log in to the database *
     ************************************/
    if (!($('#loginButton').hasClass('standOut'))) {
       $('#loginButton').addClass('standOut')
    }
    $('#storeFilesButton').prop('disabled', true);
    $('#clearDatabaseButton').prop('disabled', true);
    $('#displayDBStatusButton').prop('disabled', true);
    $('#executeQueryButton').prop('disabled', true);





    /************************************************
     * Event Listeners Relating to the Status Panel *
     ************************************************/
    $('#clearStatusButton').click(function() {
        $(this).blur();
        clearText('statusText');
    });





    /**************************************************
     * Event Listeners Relating to the File Log Panel *
     **************************************************/

    // Event listener for the <input type='file'...> element
    // The function executes after the user hits 'Browse' and selects a file
    $('#uploadFile').on('change', function() {
        var file = this.files[0];
        // If the file does not end with .ics, it is invalid
        if (!file.name.endsWith('.ics')) {
            alert("File uploads must be iCalendar files, which have the .ics file extension.\n" +
                  "Please choose a different file.");
            $('#uploadForm').trigger('reset'); // resets the entire uploading process
        }
    });

    // Event listener for the 'Upload' button for uploading files
    $('#uploadButton').click(function(e) {
        // Submitting an HTML form has a default action of redirecting to another page.
        // This statement overrides that lets us make an AJAX request and do other things
        // if we want.
        e.preventDefault();
        $(this).blur();

        // AJAX request
        $.ajax({
            url: "/upload",
            type: "POST",
            data: new FormData($("#uploadForm")[0]),
            cache: false,
            contentType: false,
            processData: false,
            // Simply putting xhr: $.ajaxSettings.xhr() does not work, so I have to do this function nonsense
            xhr: function() {
                return $.ajaxSettings.xhr();
            },
            success: function(file) {
                // Errors with the file are handled inside the loadFile() function,
                // so they do not need to be handled here.
                loadFile(file);
            },
            error: function(error) {
                errorMsg('Encountered an error when attempting to upload a file', error);
            }
        });
    });





    /*******************************************************
     * Event Listeners Relating to the Calendar View Panel *
     *******************************************************/

    // Event listener for the <select..> tag where users can choose which Calendar in the
    // File Log Panel to view the Events of
    $('#fileSelector').change(function() {
        // First, empty the Event Table body
        $('#eventTable tbody').empty();

        // Now add all the Events from the currently selected Calendar to the (now empty) Event Table tbody
        var selected = $(this).find(':selected');

        if (selected.data('obj').events.length === 0) {
            var markup = '<tr><td></td><td></td><td></td><td>No Events in this Calendar! Calendars must have at least 1 Event in them</td><td></td><td></td></tr>';
            return;
        }

        for (var i = 0; i < selected.data('obj').events.length; i++) {
            var ev = selected.data('obj').events[i];
            addEventToTable(ev);
        }
    });

    // ========== Modals ==========
    //  - Add Event to existing Calendar
    //  - Create new Calendar
    //  - Show Alarms for selected Event
    //  - Show Properties for selected Event
    
    // Create New Calendar
    $('#createCalendarButton').click(function() {
        $(this).blur();
        $('#createCalendarModal').css("display", "block");
    });
    $('#closeModalCalendar').click(function() {
        $(this).blur();
        $('#createCalendarModal').css("display", "none");
        $('#calendarForm').trigger('reset');
    });

    // Submit the Calendar created in the Create New Calendar modal
    $('#submitCalendar').click(function(e) {
        e.preventDefault();
        $(this).blur();

        if (!formHasAllRequired('calendarForm')) {
            return;
        }

        var formData = getFormData($('#calendarForm'));

        // Verify a legal filename
        var filename;
        var split = formData.fileName.split('.');

        // Filename contains no extension: the .ics extension can be safely added
        if (split.length === 1) {
            filename = split[0] + '.ics';
            $('#calendarForm input[name="fileName"]').css('border-color', '');
        } else {
            // Filename contains an extension, but it is not the .ics extension
            if (split.pop() !== 'ics') {
                $('#calendarForm input[name="fileName"]').css('border-color', 'red');
                alert('Files can only end with the .ics file extension. Please change the file name of the new calendar.');
                return;
            }

            // Filename already ends with the .ics extension
            $('#calendarForm input[name="fileName"]').css('border-color', '');
            filename = formData.fileName;
        }

        var calendar = createCalendar(formData);
        var eventJ = createEvent(formData);

        $.ajax({
            type: "POST",
            url: "/writeCalendarJSON",
            data: {
                "filename": filename,
                "cal": JSON.stringify(calendar),
                "evt": JSON.stringify(eventJ)
            },
            dataType: "json",
            success: function(cal) {
                if (cal.error != undefined) {
                    statusMsg('Encountered an error when creating a new Calendar file: "' + filename + '": ' + cal.message);
                   return;
                }

                statusMsg("Successfully created a new Calendar file: \"" + filename + "\"");
                addCalendarToTable(filename, cal);
                addCalendarToFileSelector(filename, cal);
            },
            error: function(error) {
                errorMsg('Encountered an error when creating a new calendar for "' + filename + '"', error);
            }
        });

        $('#closeModalCalendar').click();
    });

    // Add Event to Existing Calendar
    $('#addEventButton').click(function() {
        if ($('#fileSelector').find(':selected').length == 0) {
            statusMsg('Please select a calendar in the dropdown menu before trying to add an event to it');
            $(this).blur();
            return;
        }
        $('#addEventModal').css("display", "block");
        $(this).blur();
    });
    $('#closeModalEvent').click(function() {
        $(this).blur();
        $('#addEventModal').css("display", "none");
        $('#eventForm').trigger('reset');
    });

    // Submit the Event created in the Add Event To Calendar modal
    $('#submitEvent').click(function(e) {
        e.preventDefault();
        $(this).blur();

        if (!formHasAllRequired('eventForm')) {
            return;
        }

        var formData = getFormData($('#eventForm'));

        var eventJSON = createEvent(formData);
        
        var filename = $('#fileSelector').find(':selected').val();

        $.ajax({
            type: "POST",
            url: "/addEvent",
            data: {
                "filename": filename,
                "evt": JSON.stringify(eventJSON)
            },
            dataType: "json",
            success: function(cal) {
                if (cal.error != undefined) {
                    statusMsg('Encountered an error when adding an event to the saved calendar "' + filename + '": ' + cal.message);
                    return;
                }
                statusMsg('Added a new Event to "' + filename + '"');
                addCalendarToTable(filename, cal, false);
                addCalendarToFileSelector(filename, cal);
            },
            error: function(error) {
                errorMsg('Encountered fatal error when adding an event to the saved calendar "' + filename + '"', error);
            }
        });

        $('#closeModalEvent').click();
    }); 


    // Show Properties For Selected Event
    $('#showPropertiesButton').click(function() {
        $(this).blur();

        var selectedEvent = $('#eventBody input[type="radio"]:checked').data('obj');
        if (selectedEvent === undefined) {
            alert("You must select an Event using the radio buttons in the 'Select' column of the table in order to view its optional Properties");
            return;
        }
        selectedEvent = JSON.parse(decodeURIComponent(selectedEvent));

        // Add all the properties to the table in the modal
        if (selectedEvent.properties.length === 0) {
            var markup = "<tr><td></td><td>This event doesn't have any optional properties</td><tr>";
            $('#eventPropertyBody').append(markup);
        } else {
            for (var prop of selectedEvent.properties) {
                addPropertyToTable(prop);
            }
        }

        // The modal can now be displayed, since all the data has been retrieved
        $('#viewPropertiesModal').css('display', 'block');
    });
    $('#closeModalProperties').click(function() {
        $(this).blur();
        $('#viewPropertiesModal').css('display', 'none');
        $('#eventPropertyBody').empty();
    });


    // Show Alarms For Selected Event
    $('#showAlarmsButton').click(function() {
        $(this).blur();

        var selectedEvent = $('#eventBody input[type="radio"]:checked').data('obj');
        if (selectedEvent === undefined) {
            alert("You must select an Event using the radio buttons in the 'Select' column of the table in order to view its Alarms");
            return;
        }
        selectedEvent = JSON.parse(decodeURIComponent(selectedEvent));

        // Add all the alarms to the table in the modal
        if (selectedEvent.alarms.length === 0) {
            var markup = "<tr><td></td><td></td><td>This event doesn't have any alarms</td><tr>";
            $('#eventAlarmBody').append(markup);
        } else {
            for (var alarm of selectedEvent.alarms) {
                addAlarmToTable(alarm);
            }
        }
        $('#viewAlarmsModal').css('display', 'block');
    });
    $('#closeModalAlarms').click(function() {
        $(this).blur();
        $('#viewAlarmsModal').css('display', 'none');
        $('#eventAlarmBody').empty();
    });





    /*****************************************************
     * Assignment 4 Functionality : Database Integration *
     *****************************************************/

    // Login to the MySQL Database
    $('#loginButton').click(function() {
        $(this).blur();
        $('#databaseLoginModal').css('display', 'block');
    });
    $('#closeModalLogin').click(function() {
        $(this).blur();
        $('#databaseLoginModal').css('display', 'none');
    });


    // Login button
    $('#submitLogin').click(function(e) {
        e.preventDefault();
        $(this).blur();

        var formData = getFormData($('#loginForm'));

        $.ajax({
            url: '/databaseLogin',
            type: 'POST',
            data: formData,
            success: function() {
                console.log("Successfully logged into database using endpoint '/databaseLogin'!");
                $('#databaseLoginModal').css('display', 'none');

                // Remove the standout style from the login button
                if ($('#loginButton').hasClass('standOut')) {
                    $('#loginButton').removeClass('standOut');
                }

                // Disable the login button
                $('#loginButton').prop('disabled', true);

                // enable all the database buttons
                $('#storeFilesButton').prop('disabled', false);
                $('#clearDatabaseButton').prop('disabled', false);
                $('#displayDBStatusButton').prop('disabled', false);
                $('#executeQueryButton').prop('disabled', false);
            },
            error: function(err) {
                alert('Could not login to database with those credentials.\nPlease ensure that you have correctly entered your username, password, and database name, and try again.');
            }
        });
    });


    // Load all files stored locally in /uploads/ dir into the database
    $('#storeFilesButton').click(function() {
        $(this).blur();
        // Get list of every file from the /uploads/ directory
        $.ajax({
            url: '/uploadsContents',
            type: 'GET',
            success: function(fileNames) {
                fileNames.forEach(function(filename) {
                    $.ajax({
                        url: '/insertIntoDB/' + filename,
                        type: 'GET',
                        success: function(successFilename) {
                            statusMsg('Successfully added ' + successFilename + ' to the database');
                        },
                        error: function(err) {
                            errorMsg('Encountered error while putting a file into the database', err);
                        }
                    });
                });
            },
            error: function(err) {
                errorMsg('Encountered error while loading all saved .ics files', err);
            }
        });
    });


    // Clear database
    $('#clearDatabaseButton').click(function() {
        $(this).blur();
        if (!confirm('Are you SURE you want to delete everything in the database?')) {
            return;
        }

        $.ajax({
            url: '/clearDB',
            type: 'GET',
            success: function() {
                statusMsg('Successfully cleared the database');
            },
            error: function(err) {
                errorMsg('Encountered error when trying to clear the database', err);
            }
        });
    });


    // Display DB status
    $('#displayDBStatusButton').click(function() {
        $(this).blur();
        $.ajax({
            url: '/DBstatus',
            type: 'GET',
            dataType: 'text',
            success: function(data) {
                statusMsg(data);
            },
            error: function(err) {
                errorMsg('Encountered error when getting the status of the database', err);
            }
        });
    });


    // Execute query (open a modal)
    $('#executeQueryButton').click(function() {
        $(this).blur();
        $('#executeQueryModal').css('display', 'block');
    });
    $('#closeModalQuery').click(function() {
        (this).blur();
        $('#executeQueryModal').css('display', 'none');
    });





    /***************************************
     * Close database connection on unload *
     ***************************************/
     window.addEventListener('beforeunload', function() {
        $.ajax({
            url: '/disconnectDB',
            type: 'GET',
            success: function() {
                console.log('Successfully closed database connection');
            }
        });
     });
});
