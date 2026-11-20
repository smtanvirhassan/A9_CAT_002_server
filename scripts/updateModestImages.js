import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { MongoClient } from "mongodb";

const uri = "mongodb+srv://SalonBook:Ih7RNFeoCjEzxHHY@cluster0.okwqo0n.mongodb.net/salonbook?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

async function updateImages() {
  try {
    await client.connect();
    console.log("Connected to MongoDB...");
    const db = client.db("salonbook");
    const services = db.collection("services");

    const updates = [
      {
        name: "Aromatherapy Deep Tissue Massage",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Warm Himalayan Salt Stone Massage",
        image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Targeted Neck & Scalp Acupressure",
        image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80"
      },
      {
        name: "Moroccan Detox Scrub & Mud Wrap",
        image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
      }
    ];

    for (const item of updates) {
      const result = await services.updateMany(
        { serviceName: item.name },
        { $set: { image: item.image, updatedAt: new Date() } }
      );
      console.log(`Updated "${item.name}": matched ${result.matchedCount}, modified ${result.modifiedCount}`);
    }

    // Also check if any remaining service in the DB has the 3 old flagged images
    const oldFlagged = [
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=800&q=80"
    ];

    const remaining = await services.find({ image: { $in: oldFlagged } }).toArray();
    console.log("Remaining services with old flagged images:", remaining.length);

  } catch (err) {
    console.error("Error updating services:", err);
  } finally {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

updateImages();
