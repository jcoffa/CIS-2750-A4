/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: March 20, 2019        *
 *                                  *
 *  Assignment 3, CIS*2750          *
 *  ffiCalendar.c                   *
 ************************************/

#include "ffiCalendar.h"

/****************************
 * Stub AJAX Call Functions *
 ****************************/

// These functions contribute to returning valid JSON strings for Calendars, Events,
// Alarms, and DateTimes that contain invalid (random) data. They are to be used
// only for testing that AJAX calls are functional.


// It is VERY IMPORTANT to only seed random number generation once, so through the magic
// of static variables, this function guarantees to seed the rand() function exactly once.
void seedrand() {
    static bool notYetSeeded = true;

    if (notYetSeeded) {
        srand(time(NULL));
        notYetSeeded = false;
    }
}

void wordgen(char str[], int length) {
    seedrand();

    int i;
    for (i = 0; i < length; i++) {
        str[i] = (rand() % 26) + 'a';
    }
    str[i] = '\0';
}

char *fakeText(bool spaces, int numWords) {
	seedrand();

    char *toReturn = malloc(1000);
    char temp[100];
    if (numWords <= 0) {
        strcpy(toReturn, "Number of words was <= 0");
        return toReturn;
    }

    strcpy(toReturn, "");

    for (int i = 0; i < numWords; i++) {
        wordgen(temp, (rand() % 8) + 3);
        strcat(toReturn, temp);
        if (spaces) {
            strcat(toReturn, " ");
        }
    }

	// trim the last space
	if (spaces) {
		toReturn[strlen(toReturn)-1] = '\0';
	}

    return toReturn;
}

int randdate() {
    seedrand();

    int toReturn = 201900; // year is 2019 always

    toReturn += rand() % 12; // month
    toReturn *= 100;
    toReturn += rand() % 30; // day

    return toReturn;
}

int randtime() {
    seedrand();

    int toReturn = 0;

    toReturn += rand() % 24; // hour
    toReturn *= 100;
    toReturn += rand() % 60; // minute
    toReturn *= 100;
    toReturn += rand() % 60; // second

    return toReturn;
}

char *fakeDT() {
    seedrand();

    char *toReturn = malloc(200);

    int written = snprintf(toReturn, 200, "{\"date\":\"%08d\",\"time\":\"%06d\",\"isUTC\":%s}", \
                           randdate(), randtime(), (rand() % 2) ? "true" : "false");

    return realloc(toReturn, written+1);
}

char *fakeProperty() {
	seedrand();

	char *toReturn = malloc(3000);

	char *fakeName = fakeText(false, 1);
	char *fakeDescr = fakeText(false, 3);

	int written = snprintf(toReturn, 3000, "{\"propName\":\"%s\",\"propDescr\":\"%s\"}", \
	                       fakeName, fakeDescr);
	free(fakeName);
	free(fakeDescr);

	return realloc(toReturn, written+1);
}

char *fakePropertyList(short int numProps) {
	seedrand();

	char *toReturn = malloc(3);
	int curLen = 1;
	char *temp;

	if (numProps == 0) {
		strcpy(toReturn, "[]");
		return toReturn;
	}

	strcpy(toReturn, "[");

	for (int i = 0; i < numProps; i++) {
		temp = fakeProperty();
		curLen += strlen(temp)+1;	// +1 for comma
		toReturn = realloc(toReturn, curLen+1);	// +1 for null terminator
		strcat(toReturn, temp);
		strcat(toReturn, ",");
		free(temp);
	}

	toReturn[curLen-1] = ']';

	return toReturn;
}

char *fakeAlarm() {
    seedrand();

    char *toReturn = malloc(2000);

    char *fakeAct = fakeText(true, 2);
    char *fakeTrig = fakeText(false, 1);
	int numProps = rand()%4;
	char *fakePropList = fakePropertyList(numProps);

    int written = snprintf(toReturn, 2000, "{\"action\":\"%s\",\"trigger\":\"%s\",\"numProps\":%d,\"properties\":%s}",\
                           fakeAct, fakeTrig, numProps, fakePropList);

    free(fakeAct);
    free(fakeTrig);
	free(fakePropList);

    return realloc(toReturn, written+1);
}

char *fakeAlarmList(short int numAlarms) {
	seedrand();

	char *toReturn = malloc(3);
	int curLen = 1;
	char *temp;

	if (numAlarms == 0) {
		strcpy(toReturn, "[]");
		return toReturn;
	}

	strcpy(toReturn, "[");

	for (int i = 0; i < numAlarms; i++) {
		temp = fakeAlarm();
		curLen += strlen(temp)+1;	// +1 for comma
		toReturn = realloc(toReturn, curLen+1);	// +1 for null terminator
		strcat(toReturn, temp);
		strcat(toReturn, ",");
		free(temp);
	}

	toReturn[curLen-1] = ']';

	return toReturn;
}

char *fakeEvent() {
    seedrand();

    char *toReturn = malloc(4000);

    char *fakeSummary = fakeText(true, 10);
    char *fakeStart = fakeDT();
	int numProps = rand()%4;
	char *fakeProps = fakePropertyList(numProps);
	int numAlarms = rand()%4;
	char *fakeAlarms = fakeAlarmList(numAlarms);

    int written = snprintf(toReturn, 4000, "{\"startDT\":%s,\"numProps\":%d,\"numAlarms\":%d,\"summary\":\"%s\",\"properties\":%s,\"alarms\":%s}", \
                  fakeStart, numProps, numAlarms, fakeSummary, fakeProps, fakeAlarms);

    free(fakeSummary);
    free(fakeStart);
	free(fakeProps);
	free(fakeAlarms);

    return realloc(toReturn, written+1);
}

char *fakeEventList(short int numEvents) {
	seedrand();

	char *toReturn = malloc(3);
	int curLen = 1;
	char *temp;

	if (numEvents == 0) {
		strcpy(toReturn, "[]");
		return toReturn;
	}

	strcpy(toReturn, "[");

	for (int i = 0; i < numEvents; i++) {
		temp = fakeEvent();
		curLen += strlen(temp)+1;	// +1 for comma
		toReturn = realloc(toReturn, curLen+1);	// +1 for null terminator
		strcat(toReturn, temp);
		strcat(toReturn, ",");
		free(temp);
	}

	toReturn[curLen-1] = ']';

	return toReturn;
}

char *fakeCal() {
    seedrand();

    char *toReturn = malloc(2000);

    char *fakeProdid = fakeText(false, 4);
	int numProps = rand()%4;
	char *fakeProps = fakePropertyList(numProps);
	int numEvents = (rand()%3)+1;
	char *fakeEvents = fakeEventList(numEvents);

    int written = snprintf(toReturn, 2000, "{\"version\":2,\"prodID\":\"%s\",\"numProps\":%d,\"numEvents\":%d,\"properties\":%s,\"events\":%s}",\
                           fakeProdid, numProps+2, numEvents, fakeProps, fakeEvents);

    free(fakeProdid);

    return realloc(toReturn, written+1);
}




/**********************************
 * Actual AJAX Callback Functions *
 **********************************/

// Takes a filename and returns a JSON string of a Calendar object, or an error code on a fail.
char *createCalendarJSON(const char filepath[]) {
	ICalErrorCode error;
	Calendar *cal;

	if (filepath == NULL) {
		return ferrorCodeToJSON(INV_FILE, "N/A", "File path was not received");
	}

	if ((error = createCalendar((char *)filepath, &cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Could not read in calendar from the file");
	}

	if ((error = validateCalendar(cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "File contains data that is invalid or wrong");
	}

	char *toReturn = calendarToJSON(cal);
	deleteCalendar(cal);

	return toReturn;
}

// Takes a filename and an Event JSON. Adds the Event to the Calendar created from the filename,
// then overwrites the file with the new Calendar containing its shiny new event.
// Returns the JSON of the new calendar.
char *addEventJSON(const char filepath[], const char *eventJSON) {
	ICalErrorCode error;
	Calendar *cal;
	Event *toAdd;
	char *toReturn;

	if (filepath == NULL) {
		return ferrorCodeToJSON(INV_FILE, "N/A", "File path was not received");
	}
	if (eventJSON == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Event JSON was not received");
	}

	//printf("filePath: \"%s\"\n", filepath);
	//printf("event JSON: \"%s\"\n", eventJSON);

	if ((error = createCalendar((char *)filepath, &cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Could not read in calendar from the file in order to modify it");
	}
	//printf("Successfully called createCalendar()\n");

	if ((error = validateCalendar(cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Calendar file contains data that is invalid or wrong");
	}
	//printf("Successfully called validateCalendar()\n");

	if ((toAdd = JSONtoEvent(eventJSON)) == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Could not properly convert Event JSON into Event object");
	}
	//printf("Successfully called JSONtoEvent()\n");

	addEvent(cal, toAdd);

	if ((error = validateCalendar(cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "The Event that was added to the Calendar made it invalid; the added Event was invalid");
	}
	//printf("Successfully called validateCalendar() after adding the new Event\n");

	if ((error = writeCalendar((char *)filepath, cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Could not re-write the new Calendar back to its file; changes may have only partially gone through, or not at all");
	}
	//printf("Successfully called writeCalendar()\n");

	if ((toReturn = calendarToJSON(cal)) == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Could not convert the new Calendar back into a JSON");
	}

	deleteCalendar(cal);
	//printf("Successfully called deleteCalendar()\n");

	return toReturn;
}

// Writes the Calendar JSON to the file path
char *writeCalFromJSON(const char filepath[], const char *calJSON, const char *evtJSON) {
	ICalErrorCode error;
	Calendar *cal;
	Event *event;
	char *toReturn;

	if ((cal = JSONtoCalendar(calJSON)) == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Could not properly convert Calendar JSON into Calendar object");
	}

	if ((event = JSONtoEvent(evtJSON)) == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Could not properly convert Event JSON into Event object");
	}

	addEvent(cal, event);

	if ((error = validateCalendar(cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Calendar file contains data that is invalid or wrong");
	}

	if ((error = writeCalendar((char *)filepath, cal)) != OK) {
		return ferrorCodeToJSON(error, filepath, "Could not write the created Calendar back to the file path; changes may have only partially gone through, or not at all");
	}

	if ((toReturn = calendarToJSON(cal)) == NULL) {
		return ferrorCodeToJSON(OTHER_ERROR, filepath, "Could not convert the new Calendar back into a JSON");
	}

	deleteCalendar(cal);

	return toReturn;
}

