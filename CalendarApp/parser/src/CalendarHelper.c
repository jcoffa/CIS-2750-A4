/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  CalendarHelper.c                *
 ************************************/

#include "CalendarHelper.h"
#include "Debug.h"
#include "Parsing.h"

const char *calPropNames[NUM_CALPROPNAMES] = {"CALSCALE", "METHOD", "PRODID", "VERSION"};

const char *eventPropNames[NUM_EVENTPROPNAMES] = {"ATTACH", "ATTENDEE", "CATEGORIES", "CLASS", "COMMENT", \
	"CONTACT", "CREATED", "DESCRIPTION", "DTEND", "DTSTAMP", "DTSTART", "DURATION", "EXDATE", \
	"GEO", "LAST-MODIFIED", "LOCATION", "ORGANIZER", "PRIORITY", "RDATE", "RECURRENCE-ID", "RELATED-TO", \
	"RESOURCES", "RRULE", "SEQUENCE", "STATUS", "SUMMARY", "TRANSP", "UID", "URL"};

const char *alarmPropNames[NUM_ALARMPROPNAMES] = {"ACTION", "ATTACH", "DURATION", "REPEAT", "TRIGGER"};

/* Writes the property list 'props' to the file pointed to by 'fout' in the proper
 * iCalendar syntax.
 */
ICalErrorCode writeProperties(FILE *fout, List *props) {
    if (fout == NULL || props == NULL) {
        return WRITE_ERROR;
    }

    if (getLength(props) == 0) {
        return OK;
    }

    Property *toWrite;
    ListIterator iter = createIterator(props);
    while ((toWrite = (Property *)nextElement(&iter)) != NULL) {
        fprintf(fout, "%s%c%s\r\n", \
                toWrite->propName, \
                // The comparison below is essentially "does toWrite->propDescr contain a ':' character?"
                // If it does, then it contains parameters, and therefore the name and description
                // must be delimited by a semicolon (;) instead of a colon (:)
                (strcspn(toWrite->propDescr, ":") != strlen(toWrite->propDescr)) ? ';' : ':', \
                toWrite->propDescr);
    }

    return OK;
}

/* Writes the event list 'events' to the file pointed to by 'fout' in the proper
 * iCalendar syntax, including opening and closing VEVENT tags.
 */
ICalErrorCode writeEvents(FILE *fout, List *events) {
	debugMsg("\t-----START writeEvents()-----\n");
    if (fout == NULL || events == NULL) {
		errorMsg("\t\tEither the file pointer or the event List is NULL\n");
        return WRITE_ERROR;
    }

    if (getLength(events) == 0) {
		debugMsg("\t\tNo events to write\n");
        return OK;
    }

    ICalErrorCode err;
    Event *toWrite;
    ListIterator iter = createIterator(events);
    char dateTimeData[100];
    while ((toWrite = (Event *)nextElement(&iter)) != NULL) {
        fprintf(fout, "BEGIN:VEVENT\r\n");
        fprintf(fout, "UID:%s\r\n", toWrite->UID);

		debugMsg("\t\tWrote BEGIN:VEVENT and UID\n");

        if ((err = getDateTimeAsWritable(dateTimeData, toWrite->creationDateTime)) != OK) {
			errorMsg("\t\tEncountered error when getting the creationDateTime as a writable string\n");
            return err;
        }
        fprintf(fout, "DTSTAMP:%s\r\n", dateTimeData);

		debugMsg("\t\tWrote DTSTAMP\n");

        if ((err = getDateTimeAsWritable(dateTimeData, toWrite->startDateTime)) != OK) {
			errorMsg("\t\tEncountered error when getting the startDateTime as a writable string\n");
            return err;
        }
        fprintf(fout, "DTSTART:%s\r\n", dateTimeData);

		debugMsg("\t\tWrote DTSTART\n");

        if ((err = writeProperties(fout, toWrite->properties)) != OK) {
			errorMsg("\t\tEncountered error when writing the properties\n");
            return err;
        }
        if ((err = writeAlarms(fout, toWrite->alarms)) != OK) {
			errorMsg("\t\tEncountered error when writing the alarms\n");
            return err;
        }
        fprintf(fout, "END:VEVENT\r\n");
		debugMsg("\t\tWrote END:VEVENT\n");
    }
	successMsg("\t\t-----END writeEvents()-----\n");

    return OK;
}

/* Writes the alarm list 'alarms' to the file pointed to by 'fout' in the proper
 * iCalendar syntax, including opening and closing VALARM tags.
 */
ICalErrorCode writeAlarms(FILE *fout, List *alarms) {
	debugMsg("\t\t-----START writeAlarms()-----\n");
    if (fout == NULL || alarms == NULL) {
		errorMsg("\t\t\tEither the file pointer or alarms List is NULL\n");
        return WRITE_ERROR;
    }

    if (getLength(alarms) == 0) {
		debugMsg("\t\t\tNo alarms to write\n");
        return OK;
    }

    ICalErrorCode err;
    Alarm *toWrite;
    ListIterator iter = createIterator(alarms);
    while ((toWrite = (Alarm *)nextElement(&iter)) != NULL) {
        fprintf(fout, "BEGIN:VALARM\r\n");
        fprintf(fout, "ACTION:%s\r\n", toWrite->action);
        fprintf(fout, "TRIGGER:%s\r\n", toWrite->trigger);

		debugMsg("\t\t\tWrote BEGIN:VALARM, ACTION, and TRIGGER\n");

        if ((err = writeProperties(fout, toWrite->properties)) != OK) {
			errorMsg("\t\t\tEncountered error when writing properties\n");
            return err;
        }
        fprintf(fout, "END:VALARM\r\n");
		debugMsg("\t\t\tWrote END:VALARM\n");
    }
	successMsg("\t\t\t-----END writeAlarms()-----\n");

    return OK;
}

/* Puts the relevent information from the Datetime structure 'dt' into the
 * string 'result' using the proper iCalendar syntax so that it may be written
 * to a file (after it is prepended by the proper DT___ tag).
 */
ICalErrorCode getDateTimeAsWritable(char *result, DateTime dt) {
    if (result == NULL) {
        return OTHER_ERROR;
    }

    snprintf(result, 100, "%sT%s%s", dt.date, dt.time, (dt.UTC) ? "Z" : "");

    return OK;
}

/* Returns the error code with the higher priority out of 'currentHighest' or 'newErr'.
 * The error code heirarchy is as follows:
 * 		Priority lvl 5/5: INV_CAL
 * 		Priority lvl 4/5: INV_EVENT
 * 		Priority lvl 3/5: INV_ALARM
 * 		Priority lvl 2/5: OTHER_ERROR
 * 		Priority lvl 1/5: everything except OK
 * 		Priority lvl 0/5: OK
 */
ICalErrorCode higherPriority(ICalErrorCode currentHighest, ICalErrorCode newErr) {
	ICalErrorCode toReturn = currentHighest;

	char *printCur = printError(currentHighest);
	char *printNew = printError(newErr);
	debugMsg("Current priority error: %s\n", printCur);
	debugMsg("New error: %s\n", printNew);
	free(printCur);
	free(printNew);
	
	switch (newErr) {
		case INV_CAL:
			toReturn = newErr;
			break;

		case INV_EVENT:
			if (currentHighest != INV_CAL) {
				toReturn = newErr;
			}
			break;

		case INV_ALARM:
			if (currentHighest != INV_CAL && currentHighest != INV_EVENT) {
				toReturn = newErr;
			}
			break;

		case OTHER_ERROR:
			if (currentHighest != INV_CAL && currentHighest != INV_EVENT && currentHighest != INV_ALARM) {
				toReturn = newErr;
			}
			break;

		case OK:
			break;

		default:
			if (currentHighest != INV_CAL && currentHighest != INV_EVENT && currentHighest != INV_ALARM \
			    && currentHighest != OTHER_ERROR) {
				toReturn = newErr;
			}
			break;
	}

	char *returnErr = printError(toReturn);
	debugMsg("Returning error: %s\n", returnErr);
	free(returnErr);
	return toReturn;
}

/* Returns the index of the string in 'strings' that matches the string 'toCompare'.
 * Returns -1 if 'toCompare' didn't match any of them.
 * This function uses case insensitive string comparison.
 *
 * The number of strings must be known and passed into the function for the variable 'numArgs'.
 */
int equalsOneOfStr(const char *toCompare, int numArgs, const char **strings) {
	char *upper = strUpperCopy(toCompare);

	for (int i = 0; i < numArgs; i++) {
		if (strcmp(upper, strings[i]) == 0) {
			// 'toCompare' matches one of the strings passed
			free(upper);
			return i;
		}
	}

	// 'toCompare' did not match any of the strings passed
	free(upper);
	return -1;
}

/* Returns the index of the string in the variable arguments list that matches the string 'toCompare'.
 * Returns -1 if 'toCompare' didn't match any of them.
 * * This function uses case insensitive string comparison.
 *
 * The number of variable arguments must be known and passed into the function for the variable 'numArgs'.
 */
int vequalsOneOfStr(const char *toCompare, int numArgs, ...) {
	va_list ap;
	char *upper = strUpperCopy(toCompare);

	// initialize 'ap', with 'numArgs' as the last known argument
	va_start(ap, numArgs);

	for (int i = 0; i < numArgs; i++) {
		char *temp = va_arg(ap, char *);
		if (strcmp(upper, temp) == 0) {
			// 'toCompare' matches one of the strings passed
			free(upper);
			va_end(ap);
			return i;
		}
	}

	// 'toCompare' did not match any of the strings passed
	free(upper);
	va_end(ap);
	return -1;
}

/* Validates a list of events to determine whether each event conforms to the iCalendar
 * specification. Returns the highest priority error, or OK if every event in the list
 * conforms to the specification.
 *
 * Highest priority error for this function: INV_EVENT (Priority lvl 4/5)
 */
ICalErrorCode validateEvents(List *events) {
	debugMsg("\t-----START validateEvents()-----\n");
	if (events == NULL) {
		return INV_CAL;
	}

	// Calendars must have at least 1 event
	if (getLength(events) < 1) {
		errorMsg("\t\tEvent List is empty\n");
		return INV_CAL;
	}

	Event *ev;
	ICalErrorCode err, highestPriority;
	highestPriority = OK;
	ListIterator iter = createIterator(events);

	while ((ev = (Event *)nextElement(&iter)) != NULL) {
		// check for NULL event members
		if (ev->properties == NULL || ev->alarms == NULL || ev->UID == NULL) {
			errorMsg("\t\tfound NULL event member: properties:%p, alarms:%p, UID:%p\n", \
			         (void *)(ev->properties), (void *)(ev->alarms), (void *)(ev->UID));
			return INV_EVENT;
		}

		// UID can't be empty
		if ((ev->UID)[0] == '\0') {
			errorMsg("\t\tUID empty string\n");
			return INV_EVENT;
		}

		// UID can't be longer than 1000 characters (including '\0')
		bool terminator = false;
		for (int i = 0; i <= 999; i++) {
			if ((ev->UID)[i] == '\0') {
				terminator = true;
				break;
			}
		}
		if (!terminator) {
			errorMsg("\t\tUID had no '\\0' within the first 1000 characters\n");
			return INV_EVENT;
		}

		// validate creation and start DateTimes
		if ((err = validateDateTime(ev->creationDateTime)) != OK) {
			errorMsg("\t\tCreation DateTime invalid\n");
			if (err == INV_DT) {
				return INV_EVENT;
			}
			highestPriority = higherPriority(highestPriority, err);
		}
		if ((err = validateDateTime(ev->startDateTime)) != OK) {
			errorMsg("\t\tStart DateTime invalid\n");
			if (err == INV_DT) {
				return INV_EVENT;
			}
			highestPriority = higherPriority(highestPriority, err);
		}

		// validate event properties
		if ((err = validatePropertiesEv(ev->properties)) != OK) {
			errorMsg("\t\tProperties List encountered error\n");
			highestPriority = higherPriority(highestPriority, err);
		}

		// validate event alarms
		if ((err = validateAlarms(ev->alarms)) != OK) {
			errorMsg("\t\tAlarms List encountered error\n");
			highestPriority = higherPriority(highestPriority, err);
		}

		// a check to fail faster in the case where the highest priority error has already been reached
		if (highestPriority == INV_EVENT) {
			errorMsg("\t\tCurrent error is INV_EVENT: Function can terminate early\n");
			return INV_EVENT;
		}
	}

	notifyMsg("\t\t-----END validateEvents()-----\n");
	return highestPriority;
}

/* Validates a list of alarms to determine whether each alarm conforms to the iCalendar
 * specification. Returns the highest priority error, or OK if every alarm in the list
 * conforms to the specification.
 *
 * Highest priority error for this function: INV_ALARM (Priority lvl 3/5)
 */
ICalErrorCode validateAlarms(List *alarms) {
	debugMsg("\t\t-----START validateAlarms()-----\n");
	if (alarms == NULL) {
		errorMsg("\t\t\tAlarm List passed was NULL\n");
		return INV_CAL;
	}

	Alarm *alm;
	char *upper;
	ICalErrorCode err, highestPriority;
	highestPriority = OK;
	ListIterator iter = createIterator(alarms);

	while ((alm = (Alarm *)nextElement(&iter)) != NULL) {
		// validate NULL alarm members
		if (alm->action == NULL || alm->trigger == NULL || alm->properties == NULL) {
			errorMsg("\t\t\tfound NULL alarm member: action:%p, trigger:%p, properties:%p\n", \
			         (void *)(alm->action), (void *)(alm->trigger), (void *)(alm->properties));
			return INV_ALARM;
		}

		// action can't be empty
		if ((alm->action)[0] == '\0') {
			errorMsg("\t\t\tACTION empty string\n");
			return INV_ALARM;
		}

		// action can't be longer than 200 characters (including '\0')
		bool terminator = false;
		for (int i = 0; i <= 199; i++) {
			if ((alm->action)[i] == '\0') {
				terminator = true;
				break;
			}
		}
		if (!terminator) {
			errorMsg("\t\t\tAlarm ACTION had no '\\0' in the first 200 characters\n");
			return INV_ALARM;
		}

		// The type of action must be known when validating the properties of an alarm
		upper = strUpperCopy(alm->action);
		if (strstr(upper, "AUDIO") != NULL) {
			debugMsg("\t\t\tAlarm type is AUDIO\n");
		} else {
			errorMsg("\t\t\tAlarm type is invalid\n");
			free(upper);
			return INV_ALARM;
		}
		free(upper);

		// trigger can't be an empty string
		if (strcmp("", alm->trigger) == 0) {
			errorMsg("\t\t\tAlarm TRIGGER is empty\n");
			return INV_ALARM;
		}

		// validate alarm properties
		if ((err = validatePropertiesAl(alm->properties)) != OK) {
			errorMsg("\t\t\tAlarm Properties encountered an error\n");
			highestPriority = higherPriority(highestPriority, err);
		}

		// a check to fail faster in the case where the highest priority error has already been reached
		if (highestPriority == INV_ALARM) {
			errorMsg("\t\t\tCurrent error is INV_ALARM: Function can terminate early\n");
			return INV_ALARM;
		}
	}
	
	notifyMsg("\t\t\t-----END validateAlarms()-----\n");
	return highestPriority;
}

/* Validates a list of properties to determine whether each property conforms to the iCalendar
 * specification with respect to the valid properties of the Calendar itself.
 * Returns the highest priority error, or OK if every property in the list conforms to the specification.
 *
 * For the purposes of this assignment, propDescr is valid as long as it is not NULL or empty.
 * Therefore, the only things that must be validated are whether the propName is valid for the
 * current scope, and occurs a valid number of times (i.e. VERSION occurs exactly once, etc.)
 *
 * Highest priority error for this function: INV_CAL (Priority lvl 5/5)
 */
ICalErrorCode validatePropertiesCal(List *properties) {
	if (properties == NULL) {
		return OTHER_ERROR;
	}

	bool calscale, method;
	calscale = method = false;
	Property *prop;
	ListIterator iter = createIterator(properties);

	debugMsg("\t-----START validatePropertiesCal()-----\n");

	// TODO maybe make an array of bool's, and just check if the index is true or false instead
	// of using big switch statements with if/else's

	while ((prop = (Property *)nextElement(&iter)) != NULL) {
		char *printProp = printProperty(prop);
		notifyMsg("\t\t\"%s\"\n", printProp);
		free(printProp);

		// validate that property description is not empty
		if (prop->propDescr == NULL || (prop->propDescr)[0] == '\0') {
			errorMsg("\t\tProperty description is NULL or empty\n");
			return INV_CAL;
		}

		switch (equalsOneOfStr(prop->propName, NUM_CALPROPNAMES, calPropNames)) {
			case -1:
				// the property name did not match any valid Calendar property names
				errorMsg("\t\tfound non-valid propName: \"%s\"\n", prop->propName);
				return INV_CAL;

			case 0:
				debugMsg("\t\tValidate CALSCALE\n");
				if (calscale) {
					errorMsg("\t\tDuplicate CALSCALE\n");
					return INV_CAL;
				}
				calscale = true;
				break;

			case 1:
				debugMsg("\t\tValidate METHOD\n");
				if (method) {
					errorMsg("\t\tDuplicate METHOD\n");
					return INV_CAL;
				}
				method = true;
				break;

			case 2:
			case 3:
				// This should never happen for a valid calendar: Calendar structs have a unique
				// variable to store the PRODID and it should never be in the property list.
				errorMsg("\t\tFound a PRODID or VERSION property inside the Property List\n");
				return INV_CAL;
		}
	}

	successMsg("\t\t-----END validatePropertiesCal()-----\n");
	return OK;
}

/* Validates a list of properties to determine whether each property conforms to the iCalendar
 * specification with respect to the valid properties of an Event.
 * Returns the highest priority error, or OK if every property in the list conforms to the specification.
 *
 * For the purposes of this assignment, propDescr is valid as long as it is not NULL or empty.
 * Therefore, the only things that must be validated are whether the propName is valid for the
 * current scope, and occurs a valid number of times (i.e. UID occurs exactly once, etc.)
 *
 * Highest priority error for this function: INV_EVENT (Priority lvl 4/5)
 */
ICalErrorCode validatePropertiesEv(List *properties) {
	if (properties == NULL) {
		return OTHER_ERROR;
	}

	// TODO maybe make an array of bool's, and just check if the index is true or false instead
	// of using big switch statements with if/else's

	debugMsg("\t\t----START validatePropertiesEv()-----\n");
	// The following properties MUST NOT occur more than once:
	bool class, created, description, geo, last_mod, location, organizer, \
	     priority, seq, status, summary, transp, url, recurid;
	class = created = description = geo = last_mod = location = organizer = priority = seq = status = \
		summary = transp = url = recurid = false;

	// The 'duration' property and 'dtend' property can't show up together in the same event
	bool dtend, duration;
	dtend = duration = false;

	Property *prop;
	ListIterator iter = createIterator(properties);
	while ((prop = (Property *)nextElement(&iter)) != NULL) {
		char *printProp = printProperty(prop);
		notifyMsg("\t\t\t\"%s\"\n", printProp);
		free(printProp);

		// validate that property description is not empty
		if (prop->propDescr == NULL || (prop->propDescr)[0] == '\0') {
			errorMsg("\t\t\tProperty description is NULL or empty\n");
			return INV_EVENT;
		}

		switch (equalsOneOfStr(prop->propName, NUM_EVENTPROPNAMES, eventPropNames)) {
			case -1:
				// the property name did not match any valid Event property names
				errorMsg("\t\t\tfound non-valid propName: \"%s\"\n", prop->propName);
				return INV_EVENT;

			case 0:
				debugMsg("\t\t\tATTACH\n");
				break;

			case 1:
				debugMsg("\t\t\tATTENDEE\n");
				break;

			case 2:
				debugMsg("\t\t\tCATEGORIES\n");
				break;

			case 3:
				debugMsg("\t\t\tCLASS\n");
				if (class) {
					errorMsg("\t\t\tDuplicate CLASS\n");
					return INV_EVENT;
				}
				class = true;
				break;

			case 4:
				debugMsg("\t\t\tCOMMENT\n");
				break;

			case 5:
				debugMsg("\t\t\tCONTACT\n");
				break;

			case 6:
				debugMsg("\t\t\tCREATED\n");
				if (created) {
					errorMsg("\t\t\tDuplicate CREATED\n");
					return INV_EVENT;
				}
				created = true;
				break;

			case 7:
				debugMsg("\t\t\tDESCRIPTION\n");
				if (description) {
					errorMsg("\t\t\tDuplicate DESCRIPTION\n");
					return INV_EVENT;
				}
				description = true;
				break;

			case 8:
				debugMsg("\t\t\tDTEND\n");
				if (dtend || duration) {
					errorMsg("\t\t\tDuplicate DTEND, or DURATION is present\n");
					return INV_EVENT;
				}
				dtend = true;
				break;

			case 9:
				// This property is already accounted for in the Event structure definition.
				// If it showss up in the property List, then something has gone wrong
				// in createCalendar() as this error should have been caught there.
				errorMsg("\t\t\tDTSTAMP found in property List\n");
				return INV_EVENT;

			case 10:
				// This property is already accounted for in the Event structure definition.
				// If it shows up in the property List, then something has gone wrong
				// in createCalendar() as this error should have been caught there.
				errorMsg("\t\t\tDTSTART found in property List\n");
				return INV_EVENT;

			case 11:
				debugMsg("\t\t\tDURATION\n");
				if (dtend || duration) {
					errorMsg("\t\t\tDuplicate DURATION, or DTEND is present\n");
					return INV_EVENT;
				}
				duration = true;
				break;

			case 12:
				debugMsg("\t\t\tEXDATE\n");
				break;

			case 13:
				debugMsg("\t\t\tGEO\n");
				if (geo) {
					errorMsg("\t\t\tDuplicate GEO\n");
					return INV_EVENT;
				}
				geo = true;
				break;

			case 14:
				debugMsg("\t\t\tLAST-MODIFIED\n");
				if (last_mod) {
					errorMsg("\t\t\tDuplicate LAST-MODIFIED\n");
					return INV_EVENT;
				}
				last_mod = true;
				break;

			case 15:
				debugMsg("\t\t\tLOCATION\n");
				if (location){
					errorMsg("\t\t\tDuplicate LOCATION\n");
					return INV_EVENT;
				}
				location = true;
				break;

			case 16:
				debugMsg("\t\t\tORGANIZER\n");
				if (organizer) {
					errorMsg("\t\t\tDuplicate ORGANIZER\n");
					return INV_EVENT;
				}
				organizer = true;
				break;

			case 17:
				debugMsg("\t\t\tPRIORITY\n");
				if (priority) {
					errorMsg("\t\t\tDuplicate PRIORITY\n");
					return INV_EVENT;
				}
				priority = true;
				break;

			case 18:
				debugMsg("\t\t\tRDATE\n");
				break;

			case 19:
				debugMsg("\t\t\tRECURRENCE-ID\n");
				if (recurid) {
					errorMsg("\t\t\tDuplicate RECURRENCE-ID\n");
					return INV_EVENT;
				}
				recurid = true;
				break;

			case 20:
				debugMsg("\t\t\tRELATED-TO\n");
				break;

			case 21:
				debugMsg("\t\t\tRESOURCES\n");
				break;

			case 22:
				debugMsg("\t\t\tRRULE\n");
				break;

			case 23:
				debugMsg("\t\t\tSEQUENCE\n");
				if (seq) {
					errorMsg("\t\t\tDuplicate SEQUENCE\n");
					return INV_EVENT;
				}
				seq = true;
				break;

			case 24:
				debugMsg("\t\t\tSTATUS\n");
				if (status) {
					errorMsg("\t\t\tDuplicate STATUS\n");
					return INV_EVENT;
				}
				status = true;
				break;

			case 25:
				debugMsg("\t\t\tSUMMARY\n");
				if (summary) {
					errorMsg("\t\t\tDuplicate SUMMARY\n");
					return INV_EVENT;
				}
				summary = true;
				break;

			case 26:
				debugMsg("\t\t\tTRANSP\n");
				if (transp) {
					errorMsg("\t\t\tDuplicate TRANSP\n");
					return INV_EVENT;
				}
				transp = true;
				break;

			case 27:
				debugMsg("\t\t\tUID\n");
				// This property is already accounted for in the Event structure definition.
				// If it showss up in the property List, then something has gone wrong
				// in createCalendar() as this error should have been caught there.
				errorMsg("\t\t\tUID found in property List\n");
				return INV_EVENT;

			case 28:
				debugMsg("\t\t\tURL\n");
				if (url) {
					errorMsg("\t\t\tDuplicate URL\n");
					return INV_EVENT;
				}
				url = true;
				break;
		}
	}

	notifyMsg("\t\t\t-----END validatePropertiesEv()-----\n");
	return OK;
}

/* Validates a list of properties to determine whether each property conforms to the iCalendar
 * specification with respect to the valid properties of an Alarm.
 * Returns the highest priority error, or OK if every property in the list conforms to the specification.
 *
 * For the purposes of this assignment, propDescr is valid as long as it is not NULL or empty.
 * Therefore, the only things that must be validated are whether the propName is valid for the
 * current scope, and occurs a valid number of times (i.e. ACTION occurs exactly once, etc.)
 *
 * Highest priority error for this function: INV_ALARM (Priority lvl 3/5)
 */
ICalErrorCode validatePropertiesAl(List *properties) {
	if (properties == NULL) {
		return OTHER_ERROR;
	}

	// TODO maybe make an array of bool's, and just check if the index is true or false instead
	// of using big switch statements with if/else's

	debugMsg("\t\t\t-----START validtePropertiesAl()-----\n");
	// The following are required as long as at least one of them is present
	// (i.e. they are optional, but if one is present than the other must be present as well)
	bool duration, repeat;
	duration = repeat = false;

	// Misc. that can't be declared more than once
	bool attach = false;

	Property *prop;
	ListIterator iter = createIterator(properties);
	while ((prop = (Property *)nextElement(&iter)) != NULL) {
		char *printProp = printProperty(prop);
		notifyMsg("\t\t\t\t\"%s\"\n", printProp);
		free(printProp);

		// validate that property description is not empty
		if (prop->propDescr == NULL || (prop->propDescr)[0] == '\0') {
			errorMsg("\t\t\t\tProperty description is NULL or empty\n");
			return INV_ALARM;
		}

		switch (equalsOneOfStr(prop->propName, NUM_ALARMPROPNAMES, alarmPropNames)) {
			case -1:
				errorMsg("\t\t\t\tfound non-valid propName: \"%s\"\n", prop->propName);
				return INV_ALARM;

			case 0:
				// This property is already accounted for in the Alarm structure definition.
				// If it showss up in the property List, then something has gone wrong
				// in createCalendar() as this error should have been caught there.
				errorMsg("\t\t\t\tan extra ACTION wiggled through createCalendar()\n");
				return INV_ALARM;

			case 1:
				debugMsg("\t\t\t\tValidate ATTACH\n");
				if (attach) {
					errorMsg("\t\t\t\tduplicate ATTACH\n");
					return INV_ALARM;
				}
				attach = true;
				break;

			case 2:
				debugMsg("\t\t\t\tValidate DURATION\n");
				if (duration) {
					errorMsg("\t\t\t\tduplicate DURATION property found\n");
					return INV_ALARM;
				}
				duration = true;
				break;

			case 3:
				debugMsg("\t\t\t\tValidate REPEAT\n");
				if (repeat) {
					errorMsg("\t\t\t\tduplicate REPEAT property found\n");
					return INV_ALARM;
				}
				repeat = true;
				break;

			case 4:
				// This property is already accounted for in the Alarm structure definition.
				// If it showss up in the property List, then something has gone wrong
				// in createCalendar() as this error should have been caught there.
				debugMsg("\t\t\t\tValidate TRIGGER\n");
				return INV_ALARM;
		}
	}

	// duration and repeat properties must either be both present, or neither are present
	if (duration != repeat) {
		errorMsg("\t\t\t\tduration != repeat (%d and %d respectively)\n", \
			   duration, repeat);
		return INV_ALARM;
	}

	notifyMsg("\t\t\t\t-----END validatePropertiesAl()-----\n");
	return OK;
}

/* Validates a single DateTime to determine whether it conforms to the iCalendar
 * specification. Returns the highest priority error, or OK if the DateTime
 * conforms to the specification.
 *
 * Highest priority error for this function: INV_DT (Priority lvl 1/5)
 */
ICalErrorCode validateDateTime(DateTime dt) {
	debugMsg("\t\t-----START validateDateTime()-----\n");
	debugMsg("\t\t\tDate: %s, Time: %s, UTC? %s\n", dt.date, dt.time, (dt.UTC) ? "Yes" : "No");

	// date must be of the form YYYYMMDD = 8 characters
	bool terminator = false;
	for (int i = 0; i <= 8; i++) {
		if ((dt.date)[i] == '\0') {
			terminator = true;
			break;
		}
	}
	if (!terminator) {
		errorMsg("\t\t\tdate did not have a '\\0' within the first 9 characters\n");
		return INV_DT;
	}

	// time must be of the form HHMMSS = 6 characters
	terminator = false;
	for (int i = 0; i <= 6; i++) {
		if ((dt.time)[i] == '\0') {
			terminator = true;
			break;
		}
	}
	if (!terminator) {
		errorMsg("\t\t\ttime did not have a '\\0' within the first 7 characters\n");
		return INV_DT;
	}

	// check if the date contains only numbers
	for (int i = 0; i < 8; i++) {
		if (!isdigit((dt.date)[i])) {
			errorMsg("\t\t\tdate contained non-number character\n");
			return INV_DT;
		}
	}

	// check if the time contains only numbers
	for (int i = 0; i < 6; i++) {
		if (!isdigit((dt.time)[i])) {
			errorMsg("\t\t\ttime contained non-number character\n");
			return INV_DT;
		}
	}

	notifyMsg("\t\t\t-----END validateDateTime()-----\n");
	return OK;
}

bool propNamesEqual(const void *first, const void *second) {
	Property *p1 = (Property *)first;
	Property *p2 = (Property *)second;

	return strcmp(p1->propName, p2->propName) == 0;
}

