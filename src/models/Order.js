import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // tailor/staff
    },
    name: { type: String, required: true, trim: true }, // e.g. "Wedding Suit"
    bookingDate: { type: Date, default: Date.now },
    deliveryDate: { type: Date, required: true },
    measurements: {
      shirt: {
        length: Number,
        chest: Number,
        waist: Number,
        hip: Number,
        neckFront: Number,
        neckBack: Number,
        shoulder: Number,
      },
      sleeve: {
        length: Number,
        cuff: Number,
        bicep: Number,
        armhole: Number,
      },
      trouser: {
        length: Number,
        thigh: Number,
        waist: Number,
        cuff: Number,
        knee: Number,
      },
    },
    material: {
      lining: { type: Boolean, default: false },
      description: { type: String }, // fabric notes
    },
    pricing: {
      stitching: { type: Number, default: 0 },
      material: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    payment: {
      status: {
        type: String,
        enum: ["pending", "partial", "completed"],
        default: "pending",
      },
      paidAmount: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["not_started", "in_progress", "ready", "delivered"],
      default: "not_started",
    },
    remarks: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String }, // Cloudinary public_id for deletion/replacement
  },
  { timestamps: true }
);

// Auto-generate orderId before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderId = `ORD-${String(count + 1).padStart(4, "0")}`;
  }
  // Auto-calculate total
  if (this.pricing) {
    this.pricing.total =
      (this.pricing.stitching || 0) + (this.pricing.material || 0);
  }
  next();
});

// Indexes for common queries
orderSchema.index({ client: 1 });
orderSchema.index({ deliveryDate: 1 });
orderSchema.index({ bookingDate: 1 });
orderSchema.index({ "payment.status": 1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);
export default Order;
