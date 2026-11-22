import express from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../config/db.js";
import { verifyToken, verifyAdmin, verifyNotBlocked } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { usersCollection } = await connectToMongoDB();
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ msg: "Failed to fetch users" });
  }
});

router.patch("/:id/block", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ msg: "isBlocked must be a boolean" });
    }

    const { usersCollection } = await connectToMongoDB();

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { id: id }] };
    } else {
      query = { id: id };
    }

    const user = await usersCollection.findOne(query);
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role === "admin") {
      return res.status(400).json({ msg: "Admin accounts cannot be blocked" });
    }

    const result = await usersCollection.findOneAndUpdate(
      query,
      { $set: { isBlocked, updatedAt: new Date() } },
      { returnDocument: "after", projection: { password: 0 } }
    );

    res.json(result);
  } catch (err) {
    console.error("Error updating user block status:", err);
    res.status(500).json({ msg: "Failed to update block status" });
  }
});

router.get("/profile", verifyToken, async (req, res) => {
  try {
    const { usersCollection } = await connectToMongoDB();
    let query = {};
    if (ObjectId.isValid(req.user.id)) {
      query = { $or: [{ _id: new ObjectId(req.user.id) }, { id: req.user.id }] };
    } else {
      query = { $or: [{ id: req.user.id }, { email: req.user.email }] };
    }

    const user = await usersCollection.findOne(query, { projection: { password: 0 } });
    if (!user) {
      return res.status(404).json({ msg: "Profile not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ msg: "Failed to fetch profile" });
  }
});

router.patch("/profile", verifyToken, async (req, res) => {
  try {
    const { name, image, phone } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (image !== undefined) updates.image = String(image).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    updates.updatedAt = new Date();

    const { usersCollection } = await connectToMongoDB();
    let query = {};
    if (ObjectId.isValid(req.user.id)) {
      query = { $or: [{ _id: new ObjectId(req.user.id) }, { id: req.user.id }] };
    } else {
      query = { $or: [{ id: req.user.id }, { email: req.user.email }] };
    }

    const result = await usersCollection.findOneAndUpdate(
      query,
      { $set: updates },
      { returnDocument: "after", projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ msg: "User profile not found" });
    }

    res.json(result);
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ msg: "Failed to update profile" });
  }
});

export default router;
