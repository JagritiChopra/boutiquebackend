import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    notes: { type: String },
    // Saved measurements (default/last used)
    defaultMeasurements: {
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
    totalOrders: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text index for search
clientSchema.index({ name: "text", phone: "text", email: "text" });

const Client = mongoose.model("Client", clientSchema);
export default Client;
