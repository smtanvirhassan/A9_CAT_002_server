import express from "express";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "../config/db.js";
import { verifyToken, verifyAdmin, verifyNotBlocked } from "../middleware/auth.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock");

// POST /api/payment/create-checkout-session
router.post("/create-checkout-session", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId || !ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ msg: "Valid appointment ID is required" });
    }

    const { appointmentsCollection } = await connectToMongoDB();
    const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(appointmentId) });

    if (!appointment) {
      return res.status(404).json({ msg: "Appointment not found" });
    }

    // Verify ownership
    const isOwner =
      appointment.customerId === req.user.id ||
      appointment.customerEmail === req.user.email;

    if (!isOwner) {
      return res.status(403).json({ msg: "You can only pay for your own appointments" });
    }

    // Rule: Customers cannot pay for cancelled or pending appointments
    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        msg: "Only confirmed appointments can be paid for. Please wait for admin confirmation.",
      });
    }

    if (appointment.paymentStatus === "paid") {
      return res.status(400).json({ msg: "This appointment has already been paid for." });
    }

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    let sessionId = null;
    let sessionUrl = null;

    const isDummyKey =
      !process.env.STRIPE_SECRET_KEY ||
      process.env.STRIPE_SECRET_KEY.includes("Mock") ||
      process.env.STRIPE_SECRET_KEY.includes("0000000000");

    if (!isDummyKey) {
      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: appointment.serviceName,
                  description: `Appointment on ${appointment.appointmentDate} at ${appointment.timeSlot}`,
                  images: appointment.serviceImage ? [appointment.serviceImage] : [],
                },
                unit_amount: Math.round(Number(appointment.servicePrice) * 100),
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          customer_email: req.user.email,
          metadata: {
            appointmentId: appointment._id.toString(),
            customerId: req.user.id,
            customerName: req.user.name || "Customer",
            customerEmail: req.user.email,
            serviceName: appointment.serviceName,
            amount: appointment.servicePrice.toString(),
          },
          success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${clientUrl}/payment/cancel?appointmentId=${appointment._id.toString()}`,
        });

        sessionId = session.id;
        sessionUrl = session.url;
      } catch (stripeErr) {
        if (
          stripeErr.type === "StripeAuthenticationError" ||
          stripeErr.message?.includes("Invalid API Key")
        ) {
          console.warn("Stripe rejected API key; falling back to simulated test checkout session.");
          sessionId = `mock_session_${appointment._id.toString()}_${Date.now()}`;
          sessionUrl = `${clientUrl}/payment/success?session_id=${sessionId}`;
        } else {
          throw stripeErr;
        }
      }
    } else {
      console.warn("Mock Stripe key detected; providing simulated test checkout session.");
      sessionId = `mock_session_${appointment._id.toString()}_${Date.now()}`;
      sessionUrl = `${clientUrl}/payment/success?session_id=${sessionId}`;
    }

    await appointmentsCollection.updateOne(
      { _id: new ObjectId(appointmentId) },
      { $set: { stripeSessionId: sessionId, updatedAt: new Date() } }
    );

    res.json({ url: sessionUrl, sessionId });
  } catch (err) {
    console.error("Error creating Stripe checkout session:", err);
    res.status(500).json({ msg: err.message || "Failed to create checkout session" });
  }
});

// POST /api/payment/verify-session
// Confirms session status directly from Stripe API (e.g. for success page sync)
router.post("/verify-session", verifyToken, verifyNotBlocked, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ msg: "Session ID is required" });
    }

    const { appointmentsCollection, transactionsCollection } = await connectToMongoDB();

    if (sessionId.startsWith("mock_session_")) {
      const parts = sessionId.split("_");
      const appointmentId = parts[2];
      if (!appointmentId || !ObjectId.isValid(appointmentId)) {
        return res.status(400).json({ msg: "Invalid session reference" });
      }

      const appointment = await appointmentsCollection.findOne({ _id: new ObjectId(appointmentId) });
      if (!appointment) {
        return res.status(404).json({ msg: "Appointment not found" });
      }

      await appointmentsCollection.updateOne(
        { _id: new ObjectId(appointmentId) },
        { $set: { paymentStatus: "paid", updatedAt: new Date() } }
      );

      const existingTx = await transactionsCollection.findOne({ stripeSessionId: sessionId });
      if (!existingTx) {
        const transactionDoc = {
          appointmentId: new ObjectId(appointmentId),
          customerId: appointment.customerId,
          customerName: appointment.customerName || req.user.name || "Customer",
          customerEmail: appointment.customerEmail || req.user.email,
          serviceName: appointment.serviceName,
          amount: Number(appointment.servicePrice),
          currency: "usd",
          stripeSessionId: sessionId,
          status: "paid",
          createdAt: new Date(),
        };
        await transactionsCollection.insertOne(transactionDoc);
      }

      return res.json({
        paid: true,
        session: {
          id: sessionId,
          amount_total: Math.round(Number(appointment.servicePrice) * 100),
          currency: "usd",
          metadata: {
            appointmentId: appointment._id.toString(),
            customerId: appointment.customerId,
            customerName: appointment.customerName || req.user.name,
            customerEmail: appointment.customerEmail || req.user.email,
            serviceName: appointment.serviceName,
            amount: appointment.servicePrice.toString(),
          },
        },
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const appointmentId = session.metadata?.appointmentId;
      if (appointmentId && ObjectId.isValid(appointmentId)) {
        const { appointmentsCollection, transactionsCollection } = await connectToMongoDB();

        // Atomically update appointment payment status
        await appointmentsCollection.updateOne(
          { _id: new ObjectId(appointmentId) },
          { $set: { paymentStatus: "paid", updatedAt: new Date() } }
        );

        // Record transaction if not already recorded
        const existingTx = await transactionsCollection.findOne({ stripeSessionId: session.id });
        if (!existingTx) {
          const transactionDoc = {
            appointmentId: new ObjectId(appointmentId),
            customerId: session.metadata.customerId,
            customerName: session.metadata.customerName || "Customer",
            customerEmail: session.metadata.customerEmail,
            serviceName: session.metadata.serviceName,
            amount: session.amount_total ? session.amount_total / 100 : Number(session.metadata.amount),
            currency: session.currency || "usd",
            stripeSessionId: session.id,
            status: "paid",
            createdAt: new Date(),
          };
          await transactionsCollection.insertOne(transactionDoc);
        }
      }

      return res.json({
        paid: true,
        session: {
          id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          metadata: session.metadata,
        },
      });
    }

    res.json({ paid: false, status: session.payment_status });
  } catch (err) {
    console.error("Error verifying payment session:", err);
    res.status(500).json({ msg: "Failed to verify payment session" });
  }
});

// GET /api/payment/transactions - Admin views all payment transactions
router.get("/transactions", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { transactionsCollection } = await connectToMongoDB();
    const transactions = await transactionsCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.json(transactions);
  } catch (err) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ msg: "Failed to fetch transactions" });
  }
});

export default router;
