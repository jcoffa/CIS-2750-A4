/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  CalendarHelper.h                *
 ************************************/

#ifndef CALENDARHELPER_H
#define CALENDARHELPER_H

/*************
 * Libraries *
 *************/

#include <ctype.h>
#include <stdarg.h>
#include <stdio.h>

#include "CalendarParser.h"
#include "Debug.h"

/**********************
 * Property constants *
 **********************/

#define NUM_CALPROPNAMES 4
extern const char *calPropNames[NUM_CALPROPNAMES];

#define NUM_EVENTPROPNAMES 29
extern const char *eventPropNames[NUM_EVENTPROPNAMES];

#define NUM_ALARMPROPNAMES 5
extern const char *alarmPropNames[NUM_ALARMPROPNAMES];

/***********************
 * Function Signatures *
 ***********************/

ICalErrorCode writeProperties(FILE *fout, List *props);

ICalErrorCode writeEvents(FILE *fout, List *events);

ICalErrorCode writeAlarms(FILE *fout, List *alarms);

ICalErrorCode getDateTimeAsWritable(char *result, DateTime dt);

ICalErrorCode higherPriority(ICalErrorCode currentHighest, ICalErrorCode newErr);

int equalsOneOfStr(const char *toCompare, int numArgs, const char **strings);

int vequalsOneOfStr(const char *toCompare, int numArgs, ...);

ICalErrorCode validateEvents(List *events);

ICalErrorCode validateAlarms(List *alarms);

ICalErrorCode validatePropertiesCal(List *properties);

ICalErrorCode validatePropertiesEv(List *properties);

ICalErrorCode validatePropertiesAl(List *properties);

ICalErrorCode validateDateTime(DateTime dt);

bool propNamesEqual(const void *first, const void *second);

#endif
