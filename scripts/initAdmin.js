import dns from "dns";
import { MongoClient } from "mongodb";
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}

const MONGO_URI = "mongodb+srv://SalonBook:Ih7RNFeoCjEzxHHY@cluster0.okwqo0n.mongodb.net/salonbook?retryWrites=true&w=majority&appName=Cluster0";

async function fixAdmin() {
  const c = new MongoClient(MONGO_URI);
  await c.connect();
  const db = c.db("salonbook");
  await db.collection("user").deleteOne({ email: "admin@salonbook.com" });
  await db.collection("account").deleteMany({ accountId: "admin@salonbook.com" });
  await c.close();

  const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Origin": "http://localhost:3000" },
    body: JSON.stringify({
      email: "admin@salonbook.com",
      password: "AdminPassword123",
      name: "SalonBook Administrator",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    }),
  });
  console.log("Admin signup status:", res.status);

  await c.connect();
  await db.collection("user").updateOne(
    { email: "admin@salonbook.com" },
    { $set: { role: "admin", isBlocked: false, phone: "+1 (555) 234-5678" } }
  );

  const adminDoc = await db.collection("user").findOne({ email: "admin@salonbook.com" });
  console.log("Admin document verified:", adminDoc.name, "Role:", adminDoc.role);
  await c.close();
}

fixAdmin().catch(console.error);
