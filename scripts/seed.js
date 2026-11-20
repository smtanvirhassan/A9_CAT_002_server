import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";
import "dotenv/config";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const initialServices = [
  {
    serviceName: "Signature Haircut & Blowdry",
    category: "Haircut & Styling",
    description: "Personalized consultation followed by a precision cut, relaxing shampoo massage, and signature blowout styling.",
    price: 65,
    duration: 60,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Balayage & Glaze Color",
    category: "Hair Coloring",
    description: "Custom hand-painted highlighting technique creating sun-kissed, dimensional natural color finished with a gloss glaze.",
    price: 180,
    duration: 150,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Keratin Smooth Treatment",
    category: "Hair Treatment",
    description: "Advanced smoothing treatment to eliminate frizz, restore shine, and protect hair against humidity for up to 12 weeks.",
    price: 150,
    duration: 120,
    image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Hydra-Luxe Facial",
    category: "Facial & Skincare",
    description: "Deep cleansing, gentle exfoliation, pore extractions, and intense peptide hydration for a youthful, radiant complexion.",
    price: 95,
    duration: 75,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Bridal & Glamour Makeup",
    category: "Makeup",
    description: "Camera-ready full glamour makeup application including false lash application and waterproof setting mist.",
    price: 110,
    duration: 90,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Deluxe Gel Manicure & Pedicure",
    category: "Manicure & Pedicure",
    description: "Complete nail shaping, cuticle care, soothing sugar scrub, hot towel wrap, and chip-free gel polish lasting 2+ weeks.",
    price: 85,
    duration: 90,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Aromatherapy Deep Tissue Massage",
    category: "Spa & Massage",
    description: "Therapeutic full body massage utilizing organic essential oils to release chronic muscle tension and promote deep tranquility.",
    price: 120,
    duration: 60,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    serviceName: "Men's Executive Grooming",
    category: "Haircut & Styling",
    description: "Tailored haircut, beard trimming, neck shave with hot lather, hot towel treatment, and scalp massage.",
    price: 55,
    duration: 45,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  }
];

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const db = client.db("salonbook");

    const services = db.collection("services");
    const users = db.collection("user");
    const appointments = db.collection("appointments");
    const transactions = db.collection("transactions");

    // Create Indexes
    await services.createIndex({ category: 1, status: 1 });
    await services.createIndex({ serviceName: "text" });
    await appointments.createIndex({ customerId: 1 });
    await appointments.createIndex({ appointmentDate: 1, timeSlot: 1, serviceId: 1 });
    await transactions.createIndex({ appointmentId: 1 });
    await users.createIndex({ email: 1 }, { unique: true });

    // Seed services if collection is empty
    const count = await services.countDocuments();
    if (count === 0) {
      await services.insertMany(initialServices);
      console.log(`Successfully seeded ${initialServices.length} salon services!`);
    } else {
      console.log(`Services collection already has ${count} items.`);
    }

    // Ensure admin user role is admin
    const adminEmail = process.env.ADMIN_EMAIL || "admin@salonbook.com";
    await users.updateOne(
      { email: adminEmail },
      { $set: { role: "admin", isBlocked: false, phone: "+1 (555) 234-5678" } }
    );
    console.log(`Ensured administrator privileges for: ${adminEmail}`);

    console.log("Database seed completed successfully!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
