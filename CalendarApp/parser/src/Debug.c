/************************************
 *  Name: Joseph Coffa              *
 *  Student #: 1007320              *
 *  Due Date: February 27, 2019     *
 *                                  *
 *  Assignment 2, CIS*2750          *
 *  Debug.c                         *
 ************************************/

#include "Debug.h"

void debugMsg_(const char *caller, ...) {
#ifdef DEBUG_MODE
	va_list ap;

	va_start(ap, caller);

	// The first variable argument is a string, just like when using the printf family of functions
	char *format = va_arg(ap, char *);

	// Print the calling function in yellow
	fprintf(stdout, BR_YELLOW "%-25s" RESET, caller);
	fprintf(stdout, ": ");

	// The remaining variable arguments are the arguments that accompany the format specifiers in the
	// initial format string
	vfprintf(stdout, format, ap);
	
	va_end(ap);
#endif
}

void notifyMsg_(const char *caller, ...) {
#ifdef DEBUG_MODE
	va_list ap;

	va_start(ap, caller);

	// The first variable argument is a string, just like when using the printf family of functions
	char *format = va_arg(ap, char *);

	// Print the calling function in yellow, then set up the colour for the main message
	// (which in this case is Cyan)
	fprintf(stdout, BR_YELLOW "%-25s" RESET, caller);
	fprintf(stdout, ": " CYAN);

	// The remaining variable arguments are the arguments that accompany the format specifiers in the
	// initial format string
	vfprintf(stdout, format, ap);
	fprintf(stdout, RESET);

	va_end(ap);
#endif
}

void successMsg_(const char *caller, ...) {
#ifdef DEBUG_MODE
	va_list ap;

	va_start(ap, caller);

	// The first variable argument is a string, just like when using the printf family of functions
	char *format = va_arg(ap, char *);

	// Print the calling function in yellow, then set up the colour for the main message
	// (which in this case is Bright Green)
	fprintf(stdout, BR_YELLOW "%-25s" RESET, caller);
	fprintf(stdout, ": " BR_GREEN);

	// The remaining variable arguments are the arguments that accompany the format specifiers in the
	// initial format string
	vfprintf(stdout, format, ap);
	fprintf(stdout, RESET);

	va_end(ap);
#endif
}

void errorMsg_(const char *caller, ...) {
#ifdef DEBUG_MODE
	va_list ap;

	va_start(ap, caller);

	// The first variable argument is a string, just like when using the printf family of functions
	char *format = va_arg(ap, char *);

	// Print the calling function in yellow, then set up the colour for the main message
	// (which in this case is Bright Red)
	fprintf(stderr, BR_YELLOW "%-25s" RESET, caller);
	fprintf(stderr, ": " BR_RED);

	// The remaining variable arguments are the arguments that accompany the format specifiers in the
	// initial format string
	vfprintf(stderr, format, ap);
	fprintf(stderr, RESET);
	
	va_end(ap);
#endif
}
