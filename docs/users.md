# Application Users

As at 17th November 2021...

## Roles

When a user is added in the OAuth database you set it's role to either Admin or Member.  ONly an Admin user can access the members list and see other member's data.  A member can only see their own data.

## Adding a user

1. Log in as an admin user
2. Add a new member on the members list page with the correct name.
3. Note the id automatically assigned to the member
4. Log in to the 0Auth website and add a user filling in their name, email and a password.
5. NB: Add { member id } to the app metadata under the user - look at another user to see exactly what is required.  This is needed so when a user login in they are routed to their data.
6. Log in with the new n=user email and password and check operation.
