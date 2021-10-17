# Database Component Interface

This describes the interface from the database component to the backend server functionality.

## Summary

- The database component exports a function that starts an external database server and returns a promise to a Database object that allows the server access the database.
- The backend server accesses the 'startDatabase' function by importing the startDatabase.ts module.
- The backend server calls the startDatabase function with parameters that set whether a local or external database server is used and what database to access on the server.  A dump error utility can also be passed in.

The returned Datbase object has the following properties and methods:

### Properties

- dbConnection: Contains a Mongoose connection object that encapsulates a connection to a MongoDB server - see <https://mongoosejs.com/docs/api/connection.html#connection_Connection>

This is used by the backend server to implement required database management and database calls.

### Methods

- closeConnection: Closes the connection associated with a supplied dbConnection object.

- createModel: Returns a pre-existing, or creates, a Mongoose model (which is an object that allows access to a collection on a MongoDB database).  This is called when setting up the schemas used to model the data stored in the database.
