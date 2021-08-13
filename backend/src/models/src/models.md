# Models

Mongoose model notes.

## Indices

Create a compound index on the scores memberId and date fields as you GET using this combination.

I tried creating a compond index using Mongoose but failed so create a compound index manually in mongosh with the command 'test> db.getCollection('darren.young22@outlook.com_scores').createIndex({memberId: 1, date: 1}, {unique: true})'.  The index persists until you drop the index or collection.

Note:  The option 'autoIndex' is set on mongodb connection set up which creates the indexes in the defined Mongoose models. This could be dangerous if you have a large database in production and you change indices asthat could take a long time on start up.  This should not be a problem for me so I'm using the option 'autoIndex; to set up the single field indices and manually setting up the one compound index.
