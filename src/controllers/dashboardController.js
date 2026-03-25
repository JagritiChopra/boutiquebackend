import Order from "../models/Order.js";
import Client from "../models/Client.js";

// GET /api/dashboard
export const getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      totalClients,
      totalOrders,
      ordersByStatus,
      paymentStats,
      deliveriesToday,
      upcomingDeliveries,
      recentOrders,
    ] = await Promise.all([
      Client.countDocuments({ isActive: true }),
      Order.countDocuments(),

      Order.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      Order.aggregate([
        {
          $group: {
            _id: "$payment.status",
            count: { $sum: 1 },
            totalAmount: { $sum: "$pricing.total" },
            paidAmount: { $sum: "$payment.paidAmount" },
          },
        },
      ]),

      Order.countDocuments({
        deliveryDate: { $gte: startOfDay, $lte: endOfDay },
      }),

      Order.find({
        deliveryDate: { $gte: new Date() },
        status: { $ne: "delivered" },
      })
        .populate("client", "name phone")
        .sort({ deliveryDate: 1 })
        .limit(5),

      Order.find()
        .populate("client", "name phone")
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // Compute total revenue
    const revenueStats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$pricing.total" },
          totalCollected: { $sum: "$payment.paidAmount" },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalClients,
        totalOrders,
        deliveriesToday,
        ordersByStatus: ordersByStatus.reduce((acc, cur) => {
          acc[cur._id] = cur.count;
          return acc;
        }, {}),
        paymentStats,
        revenue: revenueStats[0] || { totalRevenue: 0, totalCollected: 0 },
        upcomingDeliveries,
        recentOrders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/dashboard/schedule?date=YYYY-MM-DD
// Returns orders by deliveryDate AND bookingDate for the same period.
export const getSchedule = async (req, res, next) => {
  try {
    const { date, from, to } = req.query;

    let dateRange = {};

    if (date) {
      const d = new Date(date);
      dateRange = {
        $gte: new Date(new Date(d).setHours(0, 0, 0, 0)),
        $lte: new Date(new Date(d).setHours(23, 59, 59, 999)),
      };
    } else if (from || to) {
      if (from) dateRange.$gte = new Date(from);
      if (to)   dateRange.$lte = new Date(to);
    } else {
      const now = new Date();
      const weekLater = new Date();
      weekLater.setDate(weekLater.getDate() + 7);
      dateRange = { $gte: now, $lte: weekLater };
    }

    const [orders, bookingOrders] = await Promise.all([
      Order.find({ deliveryDate: dateRange })
        .populate("client", "name phone")
        .populate("assignedTo", "name")
        .sort({ deliveryDate: 1 }),
      Order.find({ bookingDate: dateRange })
        .populate("client", "name phone")
        .populate("assignedTo", "name")
        .sort({ bookingDate: 1 }),
    ]);

    res.json({ success: true, count: orders.length, orders, bookingOrders });
  } catch (err) {
    next(err);
  }
};
