import express from "express";
import cors from "cors";
import "dotenv/config";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { connectToMongoDB } from "./src/config/db.js";

import servicesRoutes from "./src/routes/services.js";
import appointmentsRoutes from "./src/routes/appointments.js";
import paymentRoutes from "./src/routes/payment.js";
import usersRoutes from "./src/routes/users.js";
import overviewRoutes from "./src/routes/overview.js";

const app = express();
const PORT = process.env.PORT || 8000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.post(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret || !sig) {
      console.warn("Stripe webhook invoked without secret or signature header");
      return res.status(400).send("Webhook secret or signature missing");
    }

    let event;
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error(`Webhook signature verification failed:`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const appointmentId = session.metadata?.appointmentId;

      if (appointmentId && ObjectId.isValid(appointmentId)) {
        try {
          const { appointmentsCollection, transactionsCollection } = await connectToMongoDB();

          await appointmentsCollection.updateOne(
            { _id: new ObjectId(appointmentId) },
            { $set: { paymentStatus: "paid", updatedAt: new Date() } }
          );

          const existingTx = await transactionsCollection.findOne({
            stripeSessionId: session.id,
          });

          if (!existingTx) {
            await transactionsCollection.insertOne({
              appointmentId: new ObjectId(appointmentId),
              customerId: session.metadata.customerId,
              customerName: session.metadata.customerName || "Customer",
              customerEmail: session.metadata.customerEmail,
              serviceName: session.metadata.serviceName,
              amount: session.amount_total
                ? session.amount_total / 100
                : Number(session.metadata.amount),
              currency: session.currency || "usd",
              stripeSessionId: session.id,
              status: "paid",
              createdAt: new Date(),
            });
            console.log(`Payment recorded for appointment ${appointmentId}`);
          }
        } catch (dbErr) {
          console.error("Database error during webhook processing:", dbErr);
          return res.status(500).send("Database error");
        }
      }
    }

    res.json({ received: true });
  }
);

app.use(express.json());

app.use("/api/services", servicesRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/overview", overviewRoutes);

app.get("/", (req, res) => {
  res.json({ message: "SalonBook Server is running smoothly!" });
});

if (!process.env.VERCEL) {
  connectToMongoDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`SalonBook Server is running at http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start server due to MongoDB connection error:", err);
      process.exit(1);
    });
}

export default app;
