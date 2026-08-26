import assert from "node:assert/strict";
import test, { before, after, beforeEach } from "node:test";
import request from "supertest";

import app from "../src/app.js";
import {
    connectTestDatabase,
    clearDatabase,
    closeTestDatabase,
} from "./setup.js";

before(async () => {
    process.env.JWT_SECRET = "test-secret";
    process.env.CLIENT_ORIGIN = "http://localhost:5173";

    await connectTestDatabase();
});

beforeEach(async () => {
    await clearDatabase();
});

after(async () => {
    await closeTestDatabase();
});

test("signup creates a user", async () => {
    const response = await request(app)
        .post("/api/auth/signup")
        .send({
            email: "test@example.com",
            password: "StrongPassword123!",
        });

    assert.equal(response.statusCode, 201);
});

test("duplicate signup is rejected", async () => {
    const payload = {
        email: "duplicate@example.com",
        password: "StrongPassword123!",
    };

    await request(app)
        .post("/api/auth/signup")
        .send(payload);

    const response = await request(app)
        .post("/api/auth/signup")
        .send(payload);

    assert.ok(response.statusCode >= 400);
});

test("invalid login is rejected", async () => {
    const response = await request(app)
        .post("/api/auth/login")
        .send({
            email: "doesnotexist@example.com",
            password: "wrong-password",
        });

    assert.equal(response.statusCode, 401);
});