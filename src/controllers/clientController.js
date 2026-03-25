import { validationResult } from "express-validator";
import Client from "../models/Client.js";
import Order from "../models/Order.js";

// GET /api/clients  — with search & filters
export const getAllClients = async (req, res, next) => {
  try {
    const {
      search,
      bookingDate,
      deliveryDate,
      paymentStatus,
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isActive: true };

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // If filtering by booking/delivery date or payment status, query via orders
    if (bookingDate || deliveryDate || paymentStatus) {
      const orderQuery = {};

      if (bookingDate) {
        const date = new Date(bookingDate);
        orderQuery.bookingDate = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      if (deliveryDate) {
        const date = new Date(deliveryDate);
        orderQuery.deliveryDate = {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lte: new Date(date.setHours(23, 59, 59, 999)),
        };
      }

      if (paymentStatus) {
        orderQuery["payment.status"] = paymentStatus;
      }

      const matchingOrders = await Order.find(orderQuery).distinct("client");
      query._id = { $in: matchingOrders };
    }

    const skip = (page - 1) * limit;
    const [clients, total] = await Promise.all([
      Client.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
      Client.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      clients,
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/clients
export const createClient = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const client = await Client.create(req.body);
    res.status(201).json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

// GET /api/clients/:id
export const getClientById = async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ success: false, message: "Client not found." });

    // Include their orders
    const orders = await Order.find({ client: client._id }).sort({ createdAt: -1 });
    res.json({ success: true, client, orders });
  } catch (err) {
    next(err);
  }
};

// PUT /api/clients/:id
export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!client) return res.status(404).json({ success: false, message: "Client not found." });
    res.json({ success: true, client });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/clients/:id  (soft delete)
export const deleteClient = async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!client) return res.status(404).json({ success: false, message: "Client not found." });
    res.json({ success: true, message: "Client deleted." });
  } catch (err) {
    next(err);
  }
};
