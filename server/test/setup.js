import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

export async function connectTestDatabase() {
    mongoServer = await MongoMemoryServer.create();

    await mongoose.connect(mongoServer.getUri());
}

export async function clearDatabase() {
    const collections = mongoose.connection.collections;

    for (const key of Object.keys(collections)) {
        await collections[key].deleteMany({});
    }
}

export async function closeTestDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();

    if (mongoServer) {
        await mongoServer.stop();
    }
}