# Date Handling

This file explains how dates are handled in the frontend and backend.

## Material Datepicker supplied date

Datepicker supplies the chosen date as a Date object set to 00:00 local time on the chosen date, e.g. 21st June is entered as 00:00 local time on 21st June. But it is stored in the Javascript date object as a UTC date-time. UTC might be different from local time, e.g. one hour behind, which means that an entered date of 21st June would be converted to a UTC date of 23.00 on 20th June. This causes problems if you then use the UTC value to calculate the date (by ignoring the time), i.e. you get a different day!

To avoid this, modify the date returned by the datepicker so it becomes 00:00 UTC time on the same date. This is accomplished by subtracting the local UTC offset from the datepicker date before storing.

E.G.: If IST is 60min ahead of UTC then, with no intervention, 21st June 00:00 IST would be stored as 20th June 23:00 UTC. The getTimezoneOffset function returns UTC - IST, i.e. -60 min for Irish Summer time. Subtracting -60min from, (which is equivalent to adding 60min), the local value before storage, results in the stored value being 21st June 00:00 UTC. If it is now used to calculate the date of the session it will return the correct date of 21st June.

Note: This means the manipulated date will always be of the format 'yyyy-mm-ddT00:00:00.000Z'.

## A note on OpenApi validation checking

The body of a request sent from the front end is checked when it reaches the backend, i.e. the body is serialized before it is checked against the OpenApi request specification.

The body of a response sent from the backend is checked before it is serialized by the res.json() method. Therefore the OpenAPi specification refers to the pre-serialized body object.

## Sending a date from the frontend in a Request body

An object is created with a property (typically called 'date') and this is set equal to the Date object. The http method serializes the body to JSON and the JSON serialization of a Date object is an ISO date string, so the date is actually sent as an object like:
{ date: 'yyyy-mm-ddT00:00:00.000Z' }. The OpenApi request body is be set to match this object.

## Sending a Scores or Sessions object that has a date field, from the front end, in a Request body

The scores or sessions object is sent with the date field set to a Date object.  This is serialized by the http method to an ISO date string. The date field is represented as by a date-string in OpenApi. The date is sent unmodified in a find() command to MongoDB.

## Sending a Scores or Sessions object that has a date field, from the backend, in a Response body

The date field is represented as a Date object in the Scores or Sessions object.  It is checked before serialization in res.json() (and I do not convert it), and therefore it is represented as an 'object' in the OpenApi specification. The date is serializzed to a date string by res.json().  It is converted to a Date object on reception in the front end.

## Sending a summary table which is an array of objects with date fields in a Response field

The Summary object consists of an array of objects. The date field in each element in the array is a Date object. This is what gets checked against the OpenApi specification (as the OpenApi validation is done before the body is serialized) and therefore I represent this date field as an 'object' in OpenApi.  It is serialized by res.json() before being sent.
