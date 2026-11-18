import express from "express";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../config/db.js";
import { verifyToken, verifyAdmin, verifyNotBlocked } from "../middleware/auth.js";

const router = express.Router();

// POST /api/appointments - Customer creates an appointment
router.get("/slots", async (req, res) => {
  // Predefined time slots for appointments
  const slots = [
    "09:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "01:00 PM - 02:00 PM",
    "02:00 PM - 03:00 PM",
    "03:00 PM - 04:00 PM",
    "04:00 PM - 05:00 PM",
    "05:00 PM - 06:00 PM",
  ];
  res.json(slots);
});

router.post("/", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    // Admins cannot submit customer appointment requests
    if (req.user.role === "admin") {
      return res.status(403).json({ msg: "Admins cannot submit customer appointment requests" });
    }

    const { serviceId, appointmentDate, timeSlot, message } = req.body;

    if (!serviceId || !appointmentDate || !timeSlot) {
      return res.status(400).json({ msg: "Service, appointment date, and time slot are required" });
    }

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({ msg: "Invalid service ID" });
    }

    const { servicesCollection, appointmentsCollection } = await connectToMongoDB();

    // Check service existence and status
    const service = await servicesCollection.findOne({ _id: new ObjectId(serviceId) });
    if (!service) {
      return res.status(404).json({ msg: "Service not found" });
    }

    if (service.status !== "active") {
      return res.status(400).json({ msg: "This service is currently inactive and cannot be booked" });
    }

    // Prevent duplicate active appointments for the same service, date, and time slot
    const existingConflict = await appointmentsCollection.findOne({
      serviceId: new ObjectId(serviceId),
      appointmentDate: appointmentDate,
      timeSlot: timeSlot,
      status: { $in: ["pending", "confirmed"] },
    });

    if (existingConflict) {
      return res.status(409).json({
        msg: "This time slot is already booked for this service. Please choose another date or time slot.",
      });
    }

    const newAppointment = {
      serviceId: new ObjectId(serviceId),
      serviceName: service.serviceName,
      serviceImage: service.image,
      serviceCategory: service.category,
      servicePrice: service.price,
      serviceDuration: service.duration,
      customerId: req.user.id,
      customerName: req.user.name || "Customer",
      customerEmail: req.user.email,
      appointmentDate: appointmentDate,
      timeSlot: timeSlot,
      message: message ? message.trim() : "",
      status: "pending",
      paymentStatus: "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await appointmentsCollection.insertOne(newAppointment);

    res.status(201).json({ ...newAppointment, _id: result.insertedId });
  } catch (err) {
    console.error("Error creating appointment:", err);
    res.status(500).json({ msg: "Failed to create appointment request" });
  }
});

// GET /api/appointments/my - Customer views their own appointments
router.get("/my", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { appointmentsCollection } = await connectToMongoDB();

    const query = {
      $or: [
        { customerId: req.user.id },
        { customerEmail: req.user.email },
      ],
    };

    const appointments = await appointmentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(appointments);
  } catch (err) {
    console.error("Error fetching customer appointments:", err);
    res.status(500).json({ msg: "Failed to fetch appointments" });
  }
});

// PATCH /api/appointments/:id/cancel - Customer cancels own pending appointment
router.patch("/:id/cancel", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid appointment ID" });
    }

    const { appointmentsCollection } = await connectToMongoDB();
    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    // Verify ownership
    const isOwner =
      appointment.customerId === req.user.id ||
      appointment.customerEmail === req.user.email;

    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ msg: "You can only cancel your own appointments" });
    }

    // Customer can only cancel pending appointments
    if (req.user.role !== "admin" && appointment.status !== "pending") {
      return res.status(400).json({
        msg: "You cannot cancel an already confirmed or cancelled appointment",
      });
    }

    const result = await appointmentsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status: "cancelled", updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json(result);
  } catch (err) {
    console.error("Error cancelling appointment:", err);
    res.status(500).json({ msg: "Failed to cancel appointment" });
  }
});

// GET /api/appointments/admin - Admin views all appointments
router.get("/admin", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { appointmentsCollection } = await connectToMongoDB();
    const appointments = await appointmentsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(appointments);
  } catch (err) {
    console.error("Error fetching all appointments:", err);
    res.status(500).json({ msg: "Failed to fetch appointments" });
  }
});

// PATCH /api/appointments/:id/status - Admin confirms or cancels appointment
router.patch("/:id/status", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid appointment ID" });
    }

    if (!["confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ msg: "Status must be either 'confirmed' or 'cancelled'" });
    }

    const { appointmentsCollection } = await connectToMongoDB();
    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(id) });

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    // Rule: Only pending appointments can be confirmed
    if (status === "confirmed" && appointment.status !== "pending") {
      return res.status(400).json({ msg: "Only pending appointments can be confirmed" });
    }

    // Rule: Admin can cancel pending or confirmed appointments
    if (status === "cancelled" && !["pending", "confirmed"].includes(appointment.status)) {
      return res.status(400).json({ msg: "Appointment is already cancelled" });
    }

    const result = await appointmentsCollection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
      { returnDocument: "after" }
    );

    res.json(result);
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ msg: "Failed to update appointment status" });
  }
});

export default router;
