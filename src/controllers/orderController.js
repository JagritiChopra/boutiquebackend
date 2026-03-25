import { validationResult } from "express-validator";
import Order from "../models/Order.js";
import Client from "../models/Client.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../middleware/uploadMiddleware.js";

// GET /api/orders  — with filters
export const getAllOrders = async (req, res, next) => {
  try {
    const {
      status,
      paymentStatus,
      clientId,
      bookingDateFrom,
      bookingDateTo,
      deliveryDateFrom,
      deliveryDateTo,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (paymentStatus) query["payment.status"] = paymentStatus;
    if (clientId) query.client = clientId;

    if (bookingDateFrom || bookingDateTo) {
      query.bookingDate = {};
      if (bookingDateFrom) query.bookingDate.$gte = new Date(bookingDateFrom);
      if (bookingDateTo) query.bookingDate.$lte = new Date(bookingDateTo);
    }

    if (deliveryDateFrom || deliveryDateTo) {
      query.deliveryDate = {};
      if (deliveryDateFrom) query.deliveryDate.$gte = new Date(deliveryDateFrom);
      if (deliveryDateTo) query.deliveryDate.$lte = new Date(deliveryDateTo);
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("client", "name phone")
        .populate("assignedTo", "name role")
        .sort({ deliveryDate: 1 })
        .skip(skip)
        .limit(Number(limit)),
      Order.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      orders,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders
// Accepts multipart/form-data so an image can be sent alongside the order data.
// All non-file fields come in req.body (express-validator still works on them).
export const createOrder = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    // Verify client exists
    const client = await Client.findById(req.body.client);
    if (!client) return res.status(404).json({ success: false, message: "Client not found." });

    // Upload image to Cloudinary if one was attached
    let imageUrl = undefined;
    let imagePublicId = undefined;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "boutique/orders");
      imageUrl = result.url;
      imagePublicId = result.publicId;
    }

    const order = await Order.create({
      ...req.body,
      ...(imageUrl && { imageUrl, imagePublicId }),
    });

    // Update client's default measurements & order count
    await Client.findByIdAndUpdate(client._id, {
      $inc: { totalOrders: 1 },
      ...(req.body.measurements && { defaultMeasurements: req.body.measurements }),
    });

    const populated = await order.populate("client", "name phone");
    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:id/image  — upload / replace image on an existing order
export const uploadOrderImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    // Delete old image from Cloudinary before uploading the new one
    if (order.imagePublicId) {
      await deleteFromCloudinary(order.imagePublicId);
    }

    const result = await uploadToCloudinary(req.file.buffer, "boutique/orders");

    order.imageUrl = result.url;
    order.imagePublicId = result.publicId;
    await order.save();

    res.json({ success: true, imageUrl: order.imageUrl });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/orders/:id/image  — remove image from an order
export const deleteOrderImage = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    await deleteFromCloudinary(order.imagePublicId);
    order.imageUrl = undefined;
    order.imagePublicId = undefined;
    await order.save();

    res.json({ success: true, message: "Image removed." });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("client", "name phone email")
      .populate("assignedTo", "name role");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PUT /api/orders/:id
export const updateOrder = async (req, res, next) => {
  try {
    // Auto-recalculate total if pricing changed
    if (req.body.pricing) {
      req.body.pricing.total =
        (req.body.pricing.stitching || 0) + (req.body.pricing.material || 0);
    }

    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("client", "name phone")
      .populate("assignedTo", "name role");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ["not_started", "in_progress", "ready", "delivered"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status." });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("client", "name phone");

    if (!order) return res.status(404).json({ success: false, message: "Order not found." });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/orders/:id/payment
export const updatePayment = async (req, res, next) => {
  try {
    const { paidAmount } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    order.payment.paidAmount = paidAmount;
    const total = order.pricing.total || 0;

    if (paidAmount <= 0) order.payment.status = "pending";
    else if (paidAmount >= total) order.payment.status = "completed";
    else order.payment.status = "partial";

    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/orders/:id  (admin only)
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found." });

    // Decrement client order count
    await Client.findByIdAndUpdate(order.client, { $inc: { totalOrders: -1 } });

    res.json({ success: true, message: "Order deleted." });
  } catch (err) {
    next(err);
  }
};
