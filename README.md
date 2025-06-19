# desileetcode

# Prisma Singleton Pattern for Node.js Applications

This repository (or code snippet) demonstrates a robust pattern for managing a single instance of `PrismaClient` in a Node.js application. This approach is crucial for preventing common issues like excessive database connections, especially during development with features like hot-reloading.

## The Problem: Multiple PrismaClient Instances

Without careful management, your Node.js application, particularly in a development environment that might use hot-reloading or re-evaluate modules multiple times, can inadvertently create numerous `PrismaClient` instances. Each `PrismaClient` instance maintains its own connection pool to your database. Creating too many can lead to:

- **Resource Exhaustion:** Quickly hitting your database's connection limits.
- **Performance Degradation:** Overheads from establishing and managing many connections.
- **Unexpected Behavior:** Inconsistent state or errors due to multiple clients interacting with the database.

## The Solution: Global Singleton Pattern

The provided code implements a singleton pattern using the Node.js global object (`globalThis`) to ensure that only a single `PrismaClient` instance is created and reused throughout the application's lifecycle.

## The Code Explained

Let's break down the code snippet:

```javascript
import { PrismaClient } from "../generated/prisma/index.js";

const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

authMiddleware Function Breakdown
Purpose: To verify the authenticity of a user based on a JWT, and to make the authenticated user's data available for subsequent request handlers.

Location: This middleware would typically be applied to routes that require user authentication (e.g., creating a post, accessing a user profile, updating data).

1. Imports and Function Definition
   JavaScript

import jwt from "jsonwebtoken"; // Library for handling JSON Web Tokens
import { db } from "../libs/db.js"; // Our Prisma Client instance for database interaction

export const authMiddleware = async (req, res, next) => {
// `req`: The request object
// `res`: The response object
// `next`: A function to pass control to the next middleware/route handler
// `async`: Indicates this function performs asynchronous operations (like database queries)
import jwt from "jsonwebtoken";: Imports the jsonwebtoken library, which provides methods for signing, verifying, and decoding JWTs.
import { db } from "../libs/db.js";: Imports our single PrismaClient instance (named db as per our previous setup). This db object is how our application will interact with the database.
export const authMiddleware = async (req, res, next) => { ... };: Defines an asynchronous function named authMiddleware.
As an Express.js middleware, it takes three arguments: req (request), res (response), and next (a function to call the next middleware).
The async keyword is used because it will perform asynchronous operations, primarily database lookups and jwt.verify (though jwt.verify itself can be synchronous unless async options are used, it's good practice to mark middlewares as async if they contain await). 2. Error Handling (Outer try...catch)
JavaScript

try {
// ... main logic ...
} catch (error) {
console.error("Error authenticating user:", error); // Log the full error for debugging
res.status(500).json({ message: "Error auththenticating user" }); // Send a generic error response to the client
}
The entire middleware logic is wrapped in a try...catch block.
Purpose: To gracefully handle any unexpected errors that might occur during the authentication process (e.g., database connection issues, unexpected data formats).
If an error occurs, it's logged to the console (for developer debugging) and a generic 500 Internal Server Error response is sent back to the client, preventing the server from crashing and avoiding exposing sensitive error details. 3. Extracting the JWT from Cookies
JavaScript

    const token = req.cookies.jwt;

req.cookies.jwt: This line attempts to retrieve the JWT from the incoming request's cookies.
Prerequisite: For req.cookies to be available, you must have a cookie-parsing middleware installed and used in your Express app (e.g., cookie-parser). If not, req.cookies will be undefined, and this line will also result in token being undefined.
const token: The extracted token string (or undefined if not found) is stored in this variable. 4. Checking for Token Presence
JavaScript

    if (!token) {
      return res.status(401).json({
        message: "Unauthorised - No token provided",
      });
    }

if (!token): Checks if the token variable is falsy (i.e., null, undefined, or an empty string).
return res.status(401).json(...): If no token is found, the middleware immediately sends a 401 Unauthorized HTTP status code along with a JSON error message.
return: The return keyword is crucial here. It stops the execution of the middleware immediately, preventing next() or any further processing. 5. Verifying the JWT
JavaScript

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        message: "Unauthorised - Invalid Token",
      });
    }

let decoded;: Declares a variable decoded to hold the payload of the JWT if verification is successful.
try...catch (Inner): This nested try...catch specifically handles errors that might occur during the jwt.verify process.
jwt.verify(token, process.env.JWT_SECRET): This is the core JWT verification step.
token: The JWT string extracted from the cookie.
process.env.JWT_SECRET: The secret key that was used to sign the JWT when it was originally created (during user login/registration). This secret must be the exact same for verification to succeed. It's retrieved from environment variables (requires dotenv configured).
catch (error): If jwt.verify fails (e.g., the token is expired, tampered with, or the secret doesn't match), it throws an error. This catch block intercepts that error.
return res.status(401).json(...): If verification fails, a 401 Unauthorized status is sent with an "Invalid Token" message. Again, return stops execution.
decoded payload: If jwt.verify succeeds, decoded will contain the original payload that was embedded in the JWT (e.g., { id: 'user_id_123', email: 'user@example.com' }). 6. Fetching User Data from the Database
JavaScript

    const user = await db.user.findUnique({
      where: {
        id: decoded.id, // Use the user ID from the decoded JWT payload
      },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
        role: true,
      },
    });

await db.user.findUnique(...): This line uses Prisma (db instance) to query the database for a user.
db.user: Accesses the user model defined in your schema.prisma.
findUnique: A Prisma method to find a single record based on a unique field.
where: { id: decoded.id }: Specifies the lookup condition. It uses the id extracted from the decoded JWT payload to find the corresponding user in the database.
select: { ... }: This is a Prisma feature for projection. It specifies which fields of the user object should be retrieved from the database. This is a good security practice to avoid fetching sensitive data (like the hashed password) unnecessarily. 7. Checking for User Existence
JavaScript

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

if (!user): Checks if the database query returned no user (i.e., user is null). This could happen if a user was deleted after their token was issued, or if a tampered token contained a non-existent id.
return res.status(404).json(...): If no user is found in the database corresponding to the token's ID, a 404 Not Found status is returned with an appropriate message. While technically a "user not found," returning 401 Unauthorized in some cases (e.g., invalid ID from token) might be preferred for security to avoid leaking information about existing/non-existing IDs. 404 indicates the resource (user) doesn't exist, which is accurate here. 8. Attaching User Data to the Request and Passing Control
JavaScript

    req.user = user; // Attach the fetched user object to the request
    next(); // Pass control to the next middleware or the route handler

req.user = user;: This is a common and powerful pattern in Express.js middleware. The user object (containing id, image, name, email, role) fetched from the database is attached as a property named user to the req (request) object.
Purpose: This makes the authenticated user's data readily available to any subsequent middleware or the final route handler that receives this request, without needing to re-fetch it from the database.
next();: This is a critical call. It signals to Express that this middleware has completed its work and that processing should continue to the next middleware in the stack or, if this is the last middleware, to the final route handler for the requested endpoint. If next() is not called, the request will hang.
Flow Summary:
Request arrives.
Middleware starts: Outer try block.
Token extraction: Tries to get JWT from req.cookies.jwt.
Token check: If no token, sends 401 and stops.
Token verification:
Inner try block.
jwt.verify uses token and JWT_SECRET.
If invalid/expired, inner catch activates, sends 401 and stops.
If valid, decoded payload is available.
Database lookup: Uses decoded.id to find user in db.user table, selecting specific fields.
User check: If user not found, sends 404 and stops.
Success:
user object is attached to req.user.
next() is called, allowing the request to proceed to the intended route handler (e.g., a function that fetches posts, knowing the user is authenticated and their id is available via req.user.id).
Unexpected errors: Outer catch handles any other unhandled errors, logs them, and sends 500.
