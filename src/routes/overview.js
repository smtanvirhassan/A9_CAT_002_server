import express from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../config/db.js";
import { verifyToken, verifyAdmin, verifyNotBlocked } from "../middleware/auth.js";

const router = express.Router();

router.get("/customer", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { appointmentsCollection } = await connectToMongoDB();

    const customerQuery = {
      $or: [
        { customerId: req.user.id },
        { customerEmail: req.user.email },
      ],
    };

    const [totalRequests, pending, confirmed, cancelled, paid] = await Promise.all([
      appointmentsCollection.countDocuments(customerQuery),
      appointmentsCollection.countDocuments({ ...customerQuery, status: "pending" }),
      appointmentsCollection.countDocuments({ ...customerQuery, status: "confirmed" }),
      appointmentsCollection.countDocuments({ ...customerQuery, status: "cancelled" }),
      appointmentsCollection.countDocuments({ ...customerQuery, paymentStatus: "paid" }),
    ]);

    res.json({
      totalRequests,
      pending,
      confirmed,
      cancelled,
      paid,
    });
  } catch (err) {
    console.error("Error fetching customer stats:", err);
    res.status(500).json({ msg: "Failed to fetch overview metrics" });
  }
});

router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const {
      usersCollection,
      servicesCollection,
      appointmentsCollection,
      transactionsCollection,
    } = await connectToMongoDB();

    const [
      totalCustomers,
      totalActiveServices,
      totalAppointmentRequests,
      pendingAppointments,
      confirmedAppointments,
      paymentAggregate,
    ] = await Promise.all([
      usersCollection.countDocuments({ role: { $ne: "admin" } }),
      servicesCollection.countDocuments({ status: "active" }),
      appointmentsCollection.countDocuments(),
      appointmentsCollection.countDocuments({ status: "pending" }),
      appointmentsCollection.countDocuments({ status: "confirmed" }),
      transactionsCollection
        .aggregate([
          { $match: { status: "paid" } },
          {
            $group: {
              _id: null,
              totalAmount: { $sum: "$amount" },
              totalCount: { $sum: 1 },
            },
          },
        ])
        .toArray(),
    ]);

    const totalSuccessfulPayments = {
      count: paymentAggregate[0]?.totalCount || 0,
      amount: paymentAggregate[0]?.totalAmount || 0,
    };

    res.json({
      totalCustomers,
      totalActiveServices,
      totalAppointmentRequests,
      pendingAppointments,
      confirmedAppointments,
      totalSuccessfulPayments,
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    res.status(500).json({ msg: "Failed to fetch admin overview metrics" });
  }
});

export default router;
