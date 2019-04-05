/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  Debug.h                         *
 ************************************/

#ifndef DEBUG_H
#define DEBUG_H

#include <stdarg.h>
#include <stdio.h>

// Cyan ANSI escape code
#define CYAN	"\x1b[36m"

// Bright Red ANSI escape code
#define BR_RED	"\x1b[91m"

// Bright Green ANSI escape code
#define BR_GREEN	"\x1b[92m"

// Bright Yellow ANSI escape code
#define BR_YELLOW	"\x1b[93m"

// Reset ANSI escape code colours
#define RESET	"\x1b[0m"

// Takes a string which is the name of the calling function, and an arguments list
// containing a printf-like string with potential arguments to accompany format specifiers.
// Prints to stdout.
// Expanded using a function macro to automatically include the calling function.
void debugMsg_(const char *caller, ...);
#define debugMsg(...) debugMsg_(__func__, __VA_ARGS__)

// Takes a string which is the name of the calling function, and an arguments list
// containing a printf-like string with potential arguments to accompany format specifiers.
// Prints the message in cyan text to stdout.
// Expanded using a function macro to automatically include the calling function.
void notifyMsg_(const char *caller, ...);
#define notifyMsg(...) notifyMsg_(__func__, __VA_ARGS__)

// Takes a string which is the name of the calling function, and an arguments list
// containing a printf-like string with potential arguments to accompany format specifiers.
// Prints the message in bright green text to stdout.
// Expanded using a function macro to automatically include the calling function.
void successMsg_(const char *caller, ...);
#define successMsg(...) successMsg_(__func__, __VA_ARGS__)

// Takes a string which is the name of the calling function, and an arguments list
// containing a printf-like string with potential arguments to accompany format specifiers.
// Prints the message in bright red text to stderr.
// Expanded using a function macro to automatically include the calling function.
void errorMsg_(const char *caller, ...);
#define errorMsg(...) errorMsg_(__func__, __VA_ARGS__)

#endif
