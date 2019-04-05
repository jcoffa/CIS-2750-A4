#####################################
#   Name: Joseph Coffa              #
#   Student #: 1007320              #
#   Due Date: February 27, 2019     #
#                                   #
#   Assignment 2, CIS*2750          #
#   Makefile                        #
#####################################

#############
# Variables #
#############

# files
LIBS = CalendarParser.h LinkedListAPI.h Parsing.h Initialize.h CalendarHelper.h Debug.h ffiCalendar.h
OBJS := $(LIBS:.h=.o)
SHARED = list cal parsing init calhelp debug

# update VPATH to search directories for files specified in rule preqrequisites
SRC = src
OUT = bin
INCL = include
VPATH = $(SRC):$(INCL):$(OUT)

# compilation options
CC = gcc
CFLAGS := -std=c11 -Wall -Wpedantic $(addprefix -I,$(INCL)) -g
LDFLAGS := -L. -L$(OUT) $(addprefix -l,$(SHARED))


##############
# Make Rules #
##############

all: libcalendar.so

#all: list parser libparsing.so libinit.so libcalhelp.so libdebug.so
#
#list: liblist.so
#
#parser: libcal.so
#
#liblist.so: LinkedListAPI.o
#	$(CC) -shared $(OUT)/LinkedListAPI.o -o $(OUT)/liblist.so
#
#libcal.so: CalendarParser.o
#	$(CC) -shared $(OUT)/CalendarParser.o -o $(OUT)/libcal.so
#
#libparsing.so: Parsing.o
#	$(CC) -shared $(OUT)/Parsing.o -o $(OUT)/libparsing.so
#
#libinit.so: Initialize.o
#	$(CC) -shared $(OUT)/Initialize.o -o $(OUT)/libinit.so
#
#libcalhelp.so: CalendarHelper.o
#	$(CC) -shared $(OUT)/CalendarHelper.o -o $(OUT)/libcalhelp.so
#
#libdebug.so: Debug.o
#	$(CC) -shared $(OUT)/Debug.o -o $(OUT)/libdebug.so

# Unified library
libcalendar.so: $(OBJS)
	$(CC) -shared $(addprefix $(OUT)/,$(OBJS)) -o ../$@

debugmode: Debug.c Debug.h
	$(CC) $(CFLAGS) -c -fpic -D DEBUG_MODE $< -o $(OUT)/Debug.o

debug: $(OBJS)
	$(MAKE) debugmode
	$(MAKE) libcalendar.so

# % = pattern match to any string (it stays consistent, so using it in multiple places
#     will use the same string)
# $< = the first prerequsiite of the rule (in this case, the .c source file)
# $@ = the target of the rule (in this case, the .o object file)
#
# Because the VPATH variable is set, which tells make where to look for files,
# you don't have to prefix the '$<' with '$(SRC)/' since it will already be baked into the prerequisite
%.o: %.c %.h
	$(CC) $(CFLAGS) -c -fpic $< -o $(OUT)/$@

#############
# Utilities #
#############

# removes all .o and .so files
clean:
	rm -f -r $(OUT)/*.o $(OUT)/*.so ../libcalendar.so

