import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://SalonBook:Ih7RNFeoCjEzxHHY@cluster0.okwqo0n.mongodb.net/salonbook?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

const distinctUpdates = [
  {
    name: "Gloss Toner & Root Melt",
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Organic Scalp Detox Therapy",
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "24K Gold Collagen Firming Facial",
    image: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Clarifying Acne & Blue Light Therapy",
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Couples Oasis Escape",
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80"
  },
  {
    name: "Gentleman's Head-to-Toe Restoration",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80"
  }
];

async function applyDistinctImages() {
  try {
    await client.connect();
    console.log("Connected to MongoDB...");
    const db = client.db("salonbook");
    const services = db.collection("services");

    for (const item of distinctUpdates) {
      const res = await services.updateMany(
        { serviceName: item.name },
        { $set: { image: item.image, updatedAt: new Date() } }
      );
      console.log(`Updated "${item.name}": matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    }

    const all = await services.find({}).toArray();
    console.log(`Checking uniqueness among all ${all.length} services...`);
    const map = {};
    all.forEach(s => {
      const base = s.image ? s.image.split('?')[0] : 'none';
      if (!map[base]) map[base] = [];
      map[base].push({ name: s.serviceName, cat: s.category });
    });

    let dupCount = 0;
    for (const [img, list] of Object.entries(map)) {
      if (list.length > 1) {
        dupCount++;
        console.warn(`DUPLICATE DETECTED (${img}):`);
        list.forEach(l => console.warn(`   -> ${l.cat}: ${l.name}`));
      }
    }

    if (dupCount === 0) {
      console.log("SUCCESS: 100% of all services have unique distinct images! No duplicates found.");
    }

  } catch (err) {
    console.error("Error updating services:", err);
  } finally {
    await client.close();
  }
}

applyDistinctImages();
