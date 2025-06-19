Sure! Here's your structured documentation in `README.md` format, ready to copy-paste:

````markdown
# 🧠 DesiLeetCode

A Node.js codebase showcasing best practices for Prisma ORM usage and JWT-based authentication middleware.

---

## 📌 Overview

This repository demonstrates:

- ✅ **Singleton Pattern for PrismaClient** – to prevent connection overload during development (e.g., hot reloading).
- 🔐 **JWT Authentication Middleware** – to secure routes and validate user sessions with a robust flow.

---

## 📦 Tech Stack

- **Node.js**
- **Express.js**
- **Prisma ORM**
- **JWT (`jsonwebtoken`)**
- **Cookie-based Auth**

---

## 🧩 Problem: Multiple PrismaClient Instances

During development, hot-reloading or module re-evaluation may lead to **multiple `PrismaClient` instances**, which results in:

- 🧨 **Database Connection Exhaustion**
- 🐢 **Performance Issues**
- 🧟 **Unpredictable State**

---

## ✅ Solution: Prisma Singleton Pattern

Using the `globalThis` object to maintain a single shared `PrismaClient` instance across reloads.

### 📄 Code: `libs/db.js`

```js
import { PrismaClient } from "../generated/prisma/index.js";

const globalForPrisma = globalThis;

export const db = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```
````

🔁 **Key Idea:** Reuse the Prisma client in development by storing it on the global object to avoid re-instantiation.

---

## 🔐 Authentication Middleware

### 🧠 Purpose

To protect authenticated routes by validating JWTs from cookies and attaching the corresponding user to `req.user`.

### 📄 Code: `middlewares/authMiddleware.js`

```js
import jwt from "jsonwebtoken";
import { db } from "../libs/db.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorised - No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Unauthorised - Invalid Token" });
    }

    const user = await db.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        image: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error authenticating user:", error);
    res.status(500).json({ message: "Error authenticating user" });
  }
};
```

---

## 🧭 Middleware Flow

1. 🔍 **Extract JWT** from `req.cookies.jwt`
2. ❌ If missing → `401 Unauthorized`
3. ✅ **Verify Token** using `jwt.verify(token, secret)`
4. ❌ If invalid/expired → `401 Unauthorized`
5. 🔄 **Fetch User** from DB using `decoded.id`
6. ❌ If not found → `404 Not Found`
7. 📎 **Attach user** to `req.user`
8. 🔁 **Call `next()`** to proceed to the route handler

---

## ✅ Requirements

- `cookie-parser` middleware enabled in your Express app.
- `.env` file with `JWT_SECRET` defined.

---

## 🧪 Example Usage

### Protecting a Route

```js
import express from "express";
import { authMiddleware } from "./middlewares/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: "Welcome", user: req.user });
});
```

---

## 🛠 Setup

```bash
npm install
npm install prisma --save-dev
npx prisma generate
```

---

## 📁 Project Structure

```
📦 desileetcode
├── 📁 libs
│   └── db.js            # Prisma singleton instance
├── 📁 middlewares
│   └── authMiddleware.js
├── 📁 generated
│   └── prisma           # Prisma-generated client
├── .env
└── app.js / index.js    # Entry point
```

---

## 💡 Tips

- Avoid storing sensitive fields (e.g., password hashes) in JWT payloads.
- Always use `select` in Prisma queries to minimize data exposure.
- For production, consider secure cookie settings (`httpOnly`, `secure`, etc.).

---

## 🧾 License

MIT License © 2025 \[DesiLeetCode Team]

```

Let me know if you want this as a downloadable file or with GitHub badge integration.
```
