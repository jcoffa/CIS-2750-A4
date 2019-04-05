/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  Initialize.h                    *
 ************************************/

#ifndef INITIALIZE_H
#define INITIALIZE_H

#include <stdlib.h>
#include <string.h>

#include "CalendarParser.h"
#include "LinkedListAPI.h"

/*
 */
ICalErrorCode initializeDateTime(const char *line, DateTime *dt);

/*
 * Allocates memory for a Property structure and populates it with data retrieved from the
 * string 'line', which should come from an iCalendar file.
 * Everything leading up to the first ':' or ';' becomes the propName, and everything after
 * becomes the propDescr.
 * Returns NULL if the line contains no ':' or ';' characters.
 */
ICalErrorCode initializeProperty(const char *line, Property **prop);

/*
 * Allocates memory for an Alarm structure, and initializes its Property List.
 * Alarms have multiple properties across multiple lines, so their data
 * must be entered manually.
 * Memory is not allocated for its 'trigger', as it is dynamically allocated
 * to perfectly fir the length of its string.
 */
ICalErrorCode initializeAlarm(Alarm **alm);

/*
 * Allocates memory for an Event structure, and initializes its Property List.
 * Events have mutliple properties across multiple lines, so their data
 * must be entered manually.
 */
ICalErrorCode initializeEvent(Event **evt);

/*
 * Allocates memory for a Calendar structure, and initializes all of its Lists.
 * Calendar's have multiple properties across multiple lines, so their data
 * must be entered manually.
 */
ICalErrorCode initializeCalendar(Calendar **cal);

#endif
