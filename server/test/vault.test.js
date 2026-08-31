import assert from "node:assert/strict";
import test, { before, after, beforeEach } from "node:test";
import request from "supertest";

import app from "../src/app.js";
import User from "../src/models/User.js";
import VaultItem from "../src/models/VaultItem.js";
import {
    connectTestDatabase,
    clearDatabase,
    closeTestDatabase,
} from "./setup.js";

const TEST_EMAIL = "vaulttest@example.com";
const TEST_PASSWORD = "Password123!";

// Store the logged-in user's cookie between tests.
let authCookie;

before(async () => {
    // The auth controller needs JWT_SECRET to create/verify tokens.
    process.env.JWT_SECRET = "test-jwt-secret";

    // Start a temporary MongoDB instance for tests.
    await connectTestDatabase();
});

beforeEach(async () => {
    // Start every test with a clean database.
    await clearDatabase();

    // Create a fresh test user.
    await request(app)
        .post("/api/auth/signup")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

    // Login and save the authentication cookie.
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
        });

    assert.equal(loginResponse.statusCode, 200);

    // `set-cookie` contains the httpOnly JWT cookie.
    authCookie = loginResponse.headers["set-cookie"];

    assert.ok(authCookie, "Login should return an authentication cookie");
});

after(async () => {
    // Shut down the temporary MongoDB server.
    await closeTestDatabase();
});


/*
 * ---------------------------------------------------------
 * 1. AUTHENTICATION TEST
 * ---------------------------------------------------------
 */

test("GET /api/vault rejects unauthenticated requests", async () => {
    const response = await request(app)
        .get("/api/vault");

    // authMiddleware should reject requests without a token.
    assert.equal(response.statusCode, 401);

    assert.equal(
        response.body.message,
        "Unauthorized"
    );
});


/*
 * ---------------------------------------------------------
 * 2. BASIC VAULT READ TEST
 * ---------------------------------------------------------
 */

test("GET /api/vault returns only the authenticated user's items", async () => {
    // Create two vault items for the logged-in user.
    await VaultItem.create([
        {
            userId: (await User.findOne({ email: TEST_EMAIL }))._id,
            encryptedData: "encrypted-data-1",
            iv: "iv-1",
        },
        {
            userId: (await User.findOne({ email: TEST_EMAIL }))._id,
            encryptedData: "encrypted-data-2",
            iv: "iv-2",
        },
    ]);

    const response = await request(app)
        .get("/api/vault")
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 200);

    // The current API returns { items, nextCursor }.
    assert.ok(Array.isArray(response.body.items));

    assert.equal(response.body.items.length, 2);

    // Verify the API returns encrypted data + IV.
    assert.ok(response.body.items[0].encryptedData);
    assert.ok(response.body.items[0].iv);

    // Pagination metadata should also be present.
    assert.ok("nextCursor" in response.body);
});


/*
 * ---------------------------------------------------------
 * 3. PAGINATION TEST
 * ---------------------------------------------------------
 */

test("GET /api/vault respects the requested limit", async () => {
    const user = await User.findOne({
        email: TEST_EMAIL,
    });

    // Insert 60 items so that pagination is actually exercised.
    const items = Array.from({ length: 60 }, (_, index) => ({
        userId: user._id,
        encryptedData: `encrypted-data-${index}`,
        iv: `iv-${index}`,
    }));

    await VaultItem.insertMany(items);

    const response = await request(app)
        .get("/api/vault")
        .query({ limit: 50 })
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 200);

    // The first page must contain at most 50 items.
    assert.equal(response.body.items.length, 50);

    // Because 60 items exist, there must be another page.
    assert.ok(response.body.nextCursor);

    assert.equal(
        typeof response.body.nextCursor,
        "string"
    );
});


/*
 * ---------------------------------------------------------
 * 4. CURSOR PAGINATION TEST
 * ---------------------------------------------------------
 */

test("GET /api/vault with nextCursor returns the next page without duplicates", async () => {
    const user = await User.findOne({
        email: TEST_EMAIL,
    });

    // Create 60 records.
    const items = Array.from({ length: 60 }, (_, index) => ({
        userId: user._id,
        encryptedData: `encrypted-data-${index}`,
        iv: `iv-${index}`,
    }));

    await VaultItem.insertMany(items);

    // Fetch page 1.
    const firstResponse = await request(app)
        .get("/api/vault")
        .query({ limit: 50 })
        .set("Cookie", authCookie);

    assert.equal(firstResponse.statusCode, 200);
    assert.equal(firstResponse.body.items.length, 50);

    const nextCursor = firstResponse.body.nextCursor;

    assert.ok(nextCursor);

    // Fetch page 2 using the cursor returned by page 1.
    const secondResponse = await request(app)
        .get("/api/vault")
        .query({
            limit: 50,
            cursor: nextCursor,
        })
        .set("Cookie", authCookie);

    assert.equal(secondResponse.statusCode, 200);

    // Only the remaining 10 records should be returned.
    assert.equal(secondResponse.body.items.length, 10);

    // There should be no next page now.
    assert.equal(secondResponse.body.nextCursor, null);

    // Make a Set of page-1 IDs.
    const firstPageIds = new Set(
        firstResponse.body.items.map((item) => item._id.toString())
    );

    // Ensure page 2 contains no item from page 1.
    for (const item of secondResponse.body.items) {
        assert.equal(
            firstPageIds.has(item._id.toString()),
            false,
            "Page 2 should not contain duplicate items from page 1"
        );
    }
});


/*
 * ---------------------------------------------------------
 * 5. CREATE VAULT ITEM
 * ---------------------------------------------------------
 */

test("POST /api/vault creates a new vault item", async () => {
    const response = await request(app)
        .post("/api/vault")
        .set("Cookie", authCookie)
        .send({
            encryptedData: "encrypted-password",
            iv: "random-iv",
        });

    assert.equal(response.statusCode, 201);

    // API should return the newly created item's ID.
    assert.ok(response.body.id);

    // Verify it really exists in MongoDB.
    const createdItem = await VaultItem.findById(
        response.body.id
    );

    assert.ok(createdItem);

    assert.equal(
        createdItem.encryptedData,
        "encrypted-password"
    );

    assert.equal(
        createdItem.iv,
        "random-iv"
    );
});


/*
 * ---------------------------------------------------------
 * 6. UPDATE VAULT ITEM
 * ---------------------------------------------------------
 */

test("PUT /api/vault/:id updates the user's own vault item", async () => {
    const user = await User.findOne({
        email: TEST_EMAIL,
    });

    const item = await VaultItem.create({
        userId: user._id,
        encryptedData: "old-encrypted-data",
        iv: "old-iv",
    });

    const response = await request(app)
        .put(`/api/vault/${item._id}`)
        .set("Cookie", authCookie)
        .send({
            encryptedData: "new-encrypted-data",
            iv: "new-iv",
        });

    assert.equal(response.statusCode, 200);

    assert.equal(
        response.body.message,
        "Vault item updated"
    );

    // Read the item directly from MongoDB.
    const updatedItem = await VaultItem.findById(item._id);

    assert.equal(
        updatedItem.encryptedData,
        "new-encrypted-data"
    );

    assert.equal(
        updatedItem.iv,
        "new-iv"
    );
});


/*
 * ---------------------------------------------------------
 * 7. DELETE VAULT ITEM
 * ---------------------------------------------------------
 */

test("DELETE /api/vault/:id deletes the user's own vault item", async () => {
    const user = await User.findOne({
        email: TEST_EMAIL,
    });

    const item = await VaultItem.create({
        userId: user._id,
        encryptedData: "encrypted-data",
        iv: "iv",
    });

    const response = await request(app)
        .delete(`/api/vault/${item._id}`)
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 200);

    assert.equal(
        response.body.message,
        "Vault item deleted"
    );

    // Confirm the record is actually gone.
    const deletedItem = await VaultItem.findById(item._id);

    assert.equal(deletedItem, null);
});


/*
 * ---------------------------------------------------------
 * 8. CREATE VALIDATION
 * ---------------------------------------------------------
 */

test("POST /api/vault rejects missing encrypted data", async () => {
    const response = await request(app)
        .post("/api/vault")
        .set("Cookie", authCookie)
        .send({
            iv: "iv",
        });

    assert.equal(response.statusCode, 400);

    assert.equal(
        response.body.message,
        "Encrypted data required"
    );
});


/*
 * ---------------------------------------------------------
 * 9. UPDATE VALIDATION
 * ---------------------------------------------------------
 */

test("PUT /api/vault/:id rejects missing encrypted data", async () => {
    const user = await User.findOne({
        email: TEST_EMAIL,
    });

    const item = await VaultItem.create({
        userId: user._id,
        encryptedData: "encrypted-data",
        iv: "iv",
    });

    const response = await request(app)
        .put(`/api/vault/${item._id}`)
        .set("Cookie", authCookie)
        .send({
            iv: "new-iv",
        });

    assert.equal(response.statusCode, 400);

    assert.equal(
        response.body.message,
        "Encrypted data required"
    );
});


/*
 * ---------------------------------------------------------
 * 10. OWNERSHIP TEST — UPDATE
 * ---------------------------------------------------------
 */

test("PUT /api/vault/:id rejects access to another user's item", async () => {
    // Create a second user.
    const secondUserEmail = "other-user@example.com";
    const secondUserPassword = "Password123!";

    await request(app)
        .post("/api/auth/signup")
        .send({
            email: secondUserEmail,
            password: secondUserPassword,
        });

    const secondUser = await User.findOne({
        email: secondUserEmail,
    });

    // Create a vault item belonging to User B.
    const otherUsersItem = await VaultItem.create({
        userId: secondUser._id,
        encryptedData: "user-b-encrypted-data",
        iv: "user-b-iv",
    });

    // User A tries to update User B's item.
    const response = await request(app)
        .put(`/api/vault/${otherUsersItem._id}`)
        .set("Cookie", authCookie)
        .send({
            encryptedData: "attacker-data",
            iv: "attacker-iv",
        });

    // Your controller should return 404 because the query
    // requires BOTH matching _id AND matching userId.
    assert.equal(response.statusCode, 404);

    assert.equal(
        response.body.message,
        "Vault item not found"
    );

    // Verify User B's data was not changed.
    const unchangedItem = await VaultItem.findById(
        otherUsersItem._id
    );

    assert.equal(
        unchangedItem.encryptedData,
        "user-b-encrypted-data"
    );

    assert.equal(
        unchangedItem.iv,
        "user-b-iv"
    );
});


/*
 * ---------------------------------------------------------
 * 11. OWNERSHIP TEST — DELETE
 * ---------------------------------------------------------
 */

test("DELETE /api/vault/:id rejects deleting another user's item", async () => {
    // Create a second user.
    const secondUserEmail = "delete-test-user@example.com";
    const secondUserPassword = "Password123!";

    await request(app)
        .post("/api/auth/signup")
        .send({
            email: secondUserEmail,
            password: secondUserPassword,
        });

    const secondUser = await User.findOne({
        email: secondUserEmail,
    });

    // Create an item owned by User B.
    const otherUsersItem = await VaultItem.create({
        userId: secondUser._id,
        encryptedData: "protected-data",
        iv: "protected-iv",
    });

    // User A attempts to delete User B's item.
    const response = await request(app)
        .delete(`/api/vault/${otherUsersItem._id}`)
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 404);

    assert.equal(
        response.body.message,
        "Vault item not found"
    );

    // The item must still exist.
    const stillExistingItem = await VaultItem.findById(
        otherUsersItem._id
    );

    assert.ok(stillExistingItem);

    assert.equal(
        stillExistingItem.encryptedData,
        "protected-data"
    );
});


/*
 * ---------------------------------------------------------
 * 12. OWNERSHIP TEST — READ
 * ---------------------------------------------------------
 */

test("GET /api/vault returns only the authenticated user's vault items", async () => {
    // Get User A.
    const userA = await User.findOne({
        email: TEST_EMAIL,
    });

    // Create User B.
    const secondUserEmail = "read-test-user@example.com";
    const secondUserPassword = "Password123!";

    await request(app)
        .post("/api/auth/signup")
        .send({
            email: secondUserEmail,
            password: secondUserPassword,
        });

    const userB = await User.findOne({
        email: secondUserEmail,
    });

    // Create one item for User A.
    await VaultItem.create({
        userId: userA._id,
        encryptedData: "user-a-data",
        iv: "user-a-iv",
    });

    // Create one item for User B.
    await VaultItem.create({
        userId: userB._id,
        encryptedData: "user-b-data",
        iv: "user-b-iv",
    });

    // User A requests their vault.
    const response = await request(app)
        .get("/api/vault")
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 200);

    assert.equal(response.body.items.length, 1);

    // Only User A's encrypted data should be returned.
    assert.equal(
        response.body.items[0].encryptedData,
        "user-a-data"
    );

    assert.equal(
        response.body.items[0].iv,
        "user-a-iv"
    );
});

test("GET /api/vault rejects an invalid limit", async () => {
    const response = await request(app)
        .get("/api/vault")
        .query({ limit: "invalid" })
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 400);
});

test("GET /api/vault rejects an invalid cursor", async () => {
    const response = await request(app)
        .get("/api/vault")
        .query({ cursor: "not-a-valid-object-id" })
        .set("Cookie", authCookie);

    assert.equal(response.statusCode, 400);
});

test("POST /api/vault rejects oversized encrypted payloads", async () => {
    const response = await request(app)
        .post("/api/vault")
        .set("Cookie", authCookie)
        .send({
            encryptedData: "x".repeat(100_001),
            iv: "some-iv",
        });

    assert.equal(response.statusCode, 400);
});

test("POST /api/vault rejects missing fields", async () => {
    const response = await request(app)
        .post("/api/vault")
        .set("Cookie", authCookie)
        .send({
            encryptedData: "encrypted-data",
        });

    assert.equal(response.statusCode, 400);
});