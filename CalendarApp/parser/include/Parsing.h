/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  Parsing.h                       *
 ************************************/

#ifndef PARSING_H
#define PARSING_H

#include <ctype.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "CalendarParser.h"
#include "Debug.h"
#include "Initialize.h"


/*
 * To be used during createCalendar when something goes wrong or if the calendar
 * is determined to be invalid. Memory needs to be freed, files need to be closed,
 * and structures set to NULL.
 */
void cleanup(Calendar **toDelete, char *upperCopy, FILE *toClose);

/*
 * Removes all leading and trailing whitespace from the given string.
 * Returns the updated string.
 */
char *trimWhitespace(char *string);

/*
 *
 */
char *concat(char *dest, const char *src);

/*
 * Unfolds a single string containing the (CRLF)(single whitespace) sequence.
 * The string must contain only 1 null-terminator, and it must be at
 * the very end of the fold.
 *
 * Refer to page 9 of the RFC5545 iCal specification for more information on
 * folding and unfolding.
 */
void unfold(char *foldedString);

bool startsWith(const char *string, const char *start);

bool endsWith(const char *string, const char *end);

/*
 * Converts every character in string to uppercase
 */
void strUpper(char *string);

/*
 * Creates a dynamically allocated copy of string, and converts every character in the copy
 * to uppercase before returning a pointer to the new copy. It must be freed by the caller.
 */
char *strUpperCopy(const char *string);


/*
 * Reads in at most 'size' bytes from 'fp' and stores it in the buffer pointed to by 'unfolded'.
 * Continually reads lines as long as folded lines are encountered. Stops when a line
 * without a fold is read, or if the end of the file is reached.
 * Folded lines are concatenated together, and then unfolded to make one single line with no
 * CRLF(whitesapce) sequences.
 * 'unfold' must be large enough to hold the entire string.
 *
 * Returns OK on a success, INV_FILE if imvalid line endings are found, and any other
 * relevant error if an error is found (for example, INV_CAL if an empty line is found)
 */
ICalErrorCode readFold(char *unfolded, int size, FILE *fp);


ICalErrorCode getEvent(FILE *fp, Event **event);

ICalErrorCode getAlarm(FILE *fp, Alarm **alarm);


#endif // PARSING_H
