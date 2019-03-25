/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: March 20, 2019        *
 *                                  *
 *  Assignment 3, CIS*2750          *
 *  ffiCalendar.h                   *
 ************************************/

/* A unified header file used in tandem with ffiCalendar.c to create a single library file
 * that can be used with the 'ffi' library API in JavaScript.
 *
 * Note that, since JSON's are being passed, there isn't a super great way to convey the
 * ICalErrorCodes that get returned by the various functions from the backend.
 * In an attempt to solve this, errors will return a JSON string that looks like this:
 *
 * {"error":"Invalid product ID","filename":"errorCal.ics"}
 *
 * Because of how JavaScript handles objects, and since there won't be an 'error' field in
 * the returned JSON of a successful function execution, one can simpley check if the
 * 'error' field is undefined. If it is, then the JSON returned the desired result.
 */


#ifndef FFICALENDAR_H
#define FFICALENDAR_H

#include <time.h>

#include "CalendarParser.h"
#include "CalendarHelper.h"

/****************************
 * Stub AJAX Call Functions *
 ****************************/

char *fakeText(bool spaces, int numWords);

char *fakeDT();

char *fakeProperty();

char *fakePropertyList(short int numProps);

char *fakeAlarm();

char *fakeAlarmList(short int numAlarms);

char *fakeEvent();

char *fakeEventList(short int numEvents);

char *fakeCal();

/**********************************
 * Actual AJAX Callback Functions *
 **********************************/

// Takes a filename and returns a JSON string of a Calendar object, or an error code on a fail.
char *createCalendarJSON(const char filepath[]);

// Takes a filename and an Event JSON. Adds the Event to the Calendar created from the filename,
// then overwrites the file with the new Calendar containing its shiny new event.
// Returns the JSON of the new calendar.
char *addEventJSON(const char filepath[], const char *eventJSON);

// Writes the Calendar JSON to the file path
char *writeCalFromJSON(const char filepath[], const char *calJSON, const char *evtJSON);

#endif
