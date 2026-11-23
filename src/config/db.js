import dns from "dns";
import { MongoClient } from "mongodb";
import "dotenv/config";

if (process.platform === "win32" && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (err) {}
}

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI in environment variables!");
}

let client = null;
let db = null;
let servicesCollection = null;
let appointmentsCollection = null;
let transactionsCollection = null;
let usersCollection = null;

export async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
    }
    if (!db) {
      await client.connect();
      console.log("Successfully connected to MongoDB!");
      db = client.db("salonbook");
      servicesCollection = db.collection("services");
      appointmentsCollection = db.collection("appointments");
      transactionsCollection = db.collection("transactions");
      usersCollection = db.collection("user");
    }
    return {
      client,
      db,
      servicesCollection,
      appointmentsCollection,
      transactionsCollection,
      usersCollection,
    };
  } catch (err) {
    console.error("MongoDB connection error:", err);
    throw err;
  }
}

export {
  client,
  db,
  servicesCollection,
  appointmentsCollection,
  transactionsCollection,
  usersCollection,
};
