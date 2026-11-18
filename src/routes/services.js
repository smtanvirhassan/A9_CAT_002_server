import express from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../config/db.js";
import { verifyToken, verifyAdmin, verifyNotBlocked } from "../middleware/auth.js";

const router = express.Router();

// GET /api/services - Public with search, category filter, and price sort
router.get("/", async (req, res) => {
  try {
    const { servicesCollection } = await connectToMongoDB();
    const { search, category, sort, status } = req.query;

    const query = {};

    // Filter by active status by default unless specified
    if (status) {
      if (status !== "all") query.status = status;
    } else {
      query.status = "active";
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Search filter
    if (search && search.trim() !== "") {
      query.$or = [
        { serviceName: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Sorting
    let sortOption = { createdAt: -1 };
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    } else if (sort === "duration-asc") {
      sortOption = { duration: 1 };
    }

    const services = await servicesCollection.find(query).sort(sortOption).toArray();
    res.json(services);
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ msg: "Failed to fetch services" });
  }
});

// GET /api/services/featured - 6 active services for homepage
router.get("/featured", async (req, res) => {
  try {
    const { servicesCollection } = await connectToMongoDB();
    const featured = await servicesCollection
      .find({ status: "active" })
      .limit(6)
      .toArray();
    res.json(featured);
  } catch (err) {
    console.error("Error fetching featured services:", err);
    res.status(500).json({ msg: "Failed to fetch featured services" });
  }
});

// GET /api/services/categories - List unique categories
router.get("/categories", async (req, res) => {
  try {
    const { servicesCollection } = await connectToMongoDB();
    const categories = await servicesCollection.distinct("category", { status: "active" });
    res.json(categories);
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ msg: "Failed to fetch categories" });
  }
});

// GET /api/services/:id - Protected service details
router.get("/:id", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid service ID" });
    }

    const { servicesCollection } = await connectToMongoDB();
    const service = await servicesCollection.findOne({ _id: new ObjectId(id) });

    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json(service);
  } catch (err) {
    console.error("Error fetching service details:", err);
    res.status(500).json({ msg: "Failed to fetch service details" });
  }
});

// POST /api/services - Admin creates new service
router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { serviceName, category, description, price, duration, image, status } = req.body;

    if (!serviceName || !category || !description || price === undefined || duration === undefined || !image) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const numPrice = Number(price);
    const numDuration = Number(duration);

    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ msg: "Price must be a positive number" });
    }

    if (isNaN(numDuration) || numDuration <= 0) {
      return res.status(400).json({ msg: "Duration must be a positive number in minutes" });
    }

    const newService = {
      serviceName: serviceName.trim(),
      category: category.trim(),
      description: description.trim(),
      price: numPrice,
      duration: numDuration,
      image: image.trim(),
      status: status === "inactive" ? "inactive" : "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const { servicesCollection } = await connectToMongoDB();
    const result = await servicesCollection.insertOne(newService);

    res.status(201).json({ ...newService, _id: result.insertedId });
  } catch (err) {
    console.error("Error creating service:", err);
    res.status(500).json({ msg: "Failed to create service" });
  }
});

// PATCH /api/services/:id - Admin updates service
router.patch("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid service ID" });
    }

    const updates = { ...req.body };
    delete updates._id;

    if (updates.price !== undefined) {
      const numPrice = Number(updates.price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({ msg: "Price must be a positive number" });
      }
      updates.price = numPrice;
    }

    if (updates.duration !== undefined) {
      const numDuration = Number(updates.duration);
      if (isNaN(numDuration) || numDuration <= 0) {
        return res.status(400).json({ msg: "Duration must be a positive number in minutes" });
      }
      updates.duration = numDuration;
    }

    updates.updatedAt = new Date();

    const { servicesCollection } = await connectToMongoDB();
    const result = await servicesCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("Error updating service:", err);
    res.status(500).json({ msg: "Failed to update service" });
  }
});

// DELETE /api/services/:id - Admin deletes service
router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid service ID" });
    }

    const { servicesCollection } = await connectToMongoDB();
    const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: "Service not found" });
    }

    res.json({ msg: "Service deleted successfully" });
  } catch (err) {
    console.error("Error deleting service:", err);
    res.status(500).json({ msg: "Failed to delete service" });
  }
});

export default router;
