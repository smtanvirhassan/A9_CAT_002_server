import { MongoClient, ObjectId } from "mongodb";
import dns from "dns";
import "dotenv/config";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const fullServicesList = [

  {
    serviceName: "Signature Haircut & Blowdry",
    category: "Haircut & Styling",
    description: "Personalized consultation followed by a precision cut, relaxing shampoo massage, and signature blowout styling.",
    price: 65,
    duration: 60,
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Men's Executive Grooming",
    category: "Haircut & Styling",
    description: "Tailored haircut, beard trimming, neck shave with hot lather, hot towel treatment, and stimulating scalp massage.",
    price: 55,
    duration: 45,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Red Carpet Couture Blowout",
    category: "Haircut & Styling",
    description: "Volumizing wash, heat-activated peptide infusion, and celebrity-level round-brush styling with soft cascading waves.",
    price: 75,
    duration: 50,
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Children's Gentle Cut & Style",
    category: "Haircut & Styling",
    description: "Gentle, stress-free haircutting for kids up to 12 years with organic tear-free cleansing and light styling.",
    price: 40,
    duration: 35,
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Balayage & Glaze Color",
    category: "Hair Coloring",
    description: "Custom hand-painted highlighting technique creating sun-kissed, dimensional natural color finished with a gloss glaze.",
    price: 180,
    duration: 150,
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Full Foil Platinum Highlights",
    category: "Hair Coloring",
    description: "Maximum blonde brightness from root to ends using gentle bond-protecting lightener and custom neutralizing toner.",
    price: 195,
    duration: 160,
    image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Gloss Toner & Root Melt",
    category: "Hair Coloring",
    description: "Seamless grey blending or shade enrichment between major color appointments for lustrous mirror-like shine.",
    price: 90,
    duration: 75,
    image: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Creative Pastel & Vivid Color",
    category: "Hair Coloring",
    description: "Artistic direct dye application in rose gold, amethyst, or mermaid ocean hues with deep color-locking seal.",
    price: 220,
    duration: 180,
    image: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Keratin Smooth Treatment",
    category: "Hair Treatment",
    description: "Advanced smoothing treatment to eliminate frizz, restore shine, and protect hair against humidity for up to 12 weeks.",
    price: 150,
    duration: 120,
    image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Olaplex Bond Repair Intensive",
    category: "Hair Treatment",
    description: "Two-step salon exclusive disulfide bond rebuilding therapy to dramatically restore compromised, chemical-damaged hair.",
    price: 85,
    duration: 50,
    image: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Japanese Hair Straightening",
    category: "Hair Treatment",
    description: "Permanent thermal reconditioning method transforming coarse wavy or curly hair into sleek, pin-straight silk.",
    price: 260,
    duration: 210,
    image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Organic Scalp Detox Therapy",
    category: "Hair Treatment",
    description: "Deep clarifying scalp exfoliation with tea tree micro-beads, lymphatic drainage, and cold steam hydration.",
    price: 70,
    duration: 45,
    image: "https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Hydra-Luxe Facial",
    category: "Facial & Skincare",
    description: "Deep cleansing, gentle exfoliation, pore extractions, and intense peptide hydration for a youthful, radiant complexion.",
    price: 95,
    duration: 75,
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "24K Gold Collagen Firming Facial",
    category: "Facial & Skincare",
    description: "Opulent anti-aging ritual with pure colloidal gold sheets, ultrasonic lifting, and marine collagen peptide infusion.",
    price: 140,
    duration: 90,
    image: "https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Clarifying Acne & Blue Light Therapy",
    category: "Facial & Skincare",
    description: "Targeted salicylic peel, gentle sonic comedone extractions, high frequency bactericidal wand, and medical LED blue light.",
    price: 85,
    duration: 60,
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Diamond Microdermabrasion Glow",
    category: "Facial & Skincare",
    description: "Precision diamond-tip dead skin resurfacing paired with antioxidant vitamin C mist and soothing hyaluronic hydrojelly mask.",
    price: 110,
    duration: 65,
    image: "https://images.unsplash.com/photo-1505944270255-72b8c68c6a70?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Bridal & Glamour Makeup",
    category: "Makeup",
    description: "Camera-ready full glamour makeup application including false lash application and waterproof setting mist.",
    price: 110,
    duration: 90,
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Natural Day Glow & Soft Glam",
    category: "Makeup",
    description: "Dewy skin perfection, soft contouring, subtle neutral eyeshadow wash, and custom lip tint for polished daily beauty.",
    price: 70,
    duration: 50,
    image: "https://images.unsplash.com/photo-1516914943479-89db7d9ae7f2?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Keratin Lash Lift & Tint",
    category: "Makeup",
    description: "Natural semi-permanent curling of your own eyelashes infused with keratin protein and midnight black conditioning tint.",
    price: 90,
    duration: 60,
    image: "https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Editorial & Red Carpet Artistry",
    category: "Makeup",
    description: "High-definition sculpting, airbrush foundation, bespoke cut-crease eye art, and individualized silk lash clusters.",
    price: 145,
    duration: 80,
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Deluxe Gel Manicure & Pedicure",
    category: "Manicure & Pedicure",
    description: "Complete nail shaping, cuticle care, soothing sugar scrub, hot towel wrap, and chip-free gel polish lasting 2+ weeks.",
    price: 85,
    duration: 90,
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Russian Dry Precision Manicure",
    category: "Manicure & Pedicure",
    description: "Specialized electronic filing apparatus removing dead eponychium tissue for ultra-clean, flush cuticle gel polish.",
    price: 80,
    duration: 75,
    image: "https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Lavender Herbal Spa Pedicure",
    category: "Manicure & Pedicure",
    description: "Dead sea salt soak, lavender callus buffing, volcanic hot stone calf massage, and paraffin hydration boot treatment.",
    price: 70,
    duration: 65,
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Aprés Gel-X Artisan Extensions",
    category: "Manicure & Pedicure",
    description: "Zero odor, damage-free soft gel extension system with custom hand-painted French chrome or minimalist nail art.",
    price: 115,
    duration: 100,
    image: "https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Aromatherapy Deep Tissue Massage",
    category: "Spa & Massage",
    description: "Therapeutic full body massage utilizing organic essential oils to release chronic muscle tension and promote deep tranquility.",
    price: 120,
    duration: 60,
    image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Warm Himalayan Salt Stone Massage",
    category: "Spa & Massage",
    description: "Heated hand-carved pink salt crystal stones infused with 84 minerals to melt stress and gently balance negative ions.",
    price: 140,
    duration: 75,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Moroccan Detox Scrub & Mud Wrap",
    category: "Spa & Massage",
    description: "Traditional eucalyptus black soap exfoliation with Kessa glove, Atlas rhassoul clay wrap, and warm floral misting.",
    price: 130,
    duration: 70,
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Targeted Neck & Scalp Acupressure",
    category: "Spa & Massage",
    description: "Fast-acting tension dissolving session focusing on cervical vertebrae, temples, and cranial pressure release points.",
    price: 65,
    duration: 40,
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },

  {
    serviceName: "Ultimate Royal Bridal Sanctuary",
    category: "Bridal & Packages",
    description: "Comprehensive pre-wedding day journey: couture bridal up-do, trial run, luxury Hydra-Luxe facial, champagne gel mani-pedi.",
    price: 360,
    duration: 240,
    image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Couples Oasis Escape",
    category: "Bridal & Packages",
    description: "Side-by-side heated stone massages in our private VIP duo suite followed by artisan tea, chocolates, and scalp elixirs.",
    price: 260,
    duration: 120,
    image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80",
    status: "active",
  },
  {
    serviceName: "Gentleman's Head-to-Toe Restoration",
    category: "Bridal & Packages",
    description: "Executive precision cut, straight razor beard sculpt, express clarifying facial, and deep hand grooming.",
    price: 155,
    duration: 105,
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80",
    status: "active",
  }
];

async function seedMore() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for updating data catalog...");
    const db = client.db("salonbook");
    const services = db.collection("services");

    const now = new Date();

    for (const item of fullServicesList) {
      await services.updateOne(
        { serviceName: item.serviceName },
        {
          $set: {
            ...item,
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true }
      );
    }

    const totalCount = await services.countDocuments();
    const categories = await services.distinct("category");
    console.log(`Success! Total services in database is now: ${totalCount}`);
    console.log(`Categories count: ${categories.length} ->`, categories);

  } catch (err) {
    console.error("Error expanding service catalog:", err);
  } finally {
    await client.close();
  }
}

seedMore();
