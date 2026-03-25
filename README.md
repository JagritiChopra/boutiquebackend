# Boutique Management — Backend API

Node.js + Express + MongoDB REST API

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Fill in MONGO_URI and JWT_SECRET

# 3. Seed the first admin user
node seed.js

# 4. Run dev server
npm run dev
```

---

## Auth

All routes (except `/api/auth/login`) require:
```
Authorization: Bearer <token>
```

---

## API Reference

### 🔐 Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/auth/me` | Any | Get current user |
| PUT | `/api/auth/change-password` | Any | Change own password |

---

### 👤 Users / Team
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/users` | Admin | List all team members |
| POST | `/api/users` | Admin | Create team member |
| GET | `/api/users/:id` | Any | Get user by ID |
| PUT | `/api/users/:id` | Admin / Self | Update user |
| DELETE | `/api/users/:id` | Admin | Deactivate user |

**Create User Body:**
```json
{
  "name": "Usman",
  "email": "usman@boutique.com",
  "password": "pass123",
  "phone": "03001234567",
  "role": "tailor"  // "admin" | "tailor" | "staff"
}
```

---

### 👥 Clients
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/clients` | Any | List/search clients |
| POST | `/api/clients` | Any | Add new client |
| GET | `/api/clients/:id` | Any | Get client + their orders |
| PUT | `/api/clients/:id` | Any | Update client |
| DELETE | `/api/clients/:id` | Admin | Soft-delete client |

**Search Query Params:**
```
GET /api/clients?search=Ahmed
GET /api/clients?bookingDate=2024-12-01
GET /api/clients?deliveryDate=2024-12-25
GET /api/clients?paymentStatus=pending
GET /api/clients?page=1&limit=20
```

**Create Client Body:**
```json
{
  "name": "Ahmed Khan",
  "phone": "03211234567",
  "email": "ahmed@example.com",
  "address": "DHA Phase 5, Lahore",
  "notes": "VIP client",
  "defaultMeasurements": {
    "shirt": { "length": 30, "chest": 40, "waist": 36, "shoulder": 16 },
    "trouser": { "length": 42, "waist": 34, "thigh": 24 }
  }
}
```

---

### 📦 Orders
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| GET | `/api/orders` | Any | List/filter orders |
| POST | `/api/orders` | Any | Create new order |
| GET | `/api/orders/:id` | Any | Get order detail |
| PUT | `/api/orders/:id` | Any | Full order update |
| PATCH | `/api/orders/:id/status` | Any | Quick status update |
| PATCH | `/api/orders/:id/payment` | Any | Update payment |
| DELETE | `/api/orders/:id` | Admin | Delete order |

**Order Filter Params:**
```
GET /api/orders?status=in_progress
GET /api/orders?paymentStatus=pending
GET /api/orders?clientId=<id>
GET /api/orders?deliveryDateFrom=2024-12-01&deliveryDateTo=2024-12-31
GET /api/orders?bookingDateFrom=2024-11-01
```

**Create Order Body:**
```json
{
  "client": "<clientId>",
  "name": "Wedding Suit",
  "deliveryDate": "2024-12-25",
  "assignedTo": "<userId>",
  "measurements": {
    "shirt": { "length": 30, "chest": 40, "waist": 36, "shoulder": 16, "neckFront": 15, "neckBack": 15, "hip": 38 },
    "sleeve": { "length": 24, "cuff": 9, "bicep": 14, "armhole": 18 },
    "trouser": { "length": 42, "waist": 34, "thigh": 24, "cuff": 8, "knee": 18 }
  },
  "material": { "lining": true, "description": "Raw silk, blue" },
  "pricing": { "stitching": 3500, "material": 5000 },
  "remarks": "Sherwani style buttons",
  "status": "not_started"
}
```

**Update Status:**
```json
PATCH /api/orders/:id/status
{ "status": "in_progress" }
// Options: not_started | in_progress | ready | delivered
```

**Update Payment:**
```json
PATCH /api/orders/:id/payment
{ "paidAmount": 5000 }
// Status auto-calculated: pending / partial / completed
```

---

### 🏠 Dashboard & Schedule
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard` | Home screen stats |
| GET | `/api/dashboard/schedule` | Delivery schedule |

**Schedule Params:**
```
GET /api/dashboard/schedule                        → Next 7 days
GET /api/dashboard/schedule?date=2024-12-25       → Specific day
GET /api/dashboard/schedule?from=2024-12-01&to=2024-12-31
```

**Dashboard Response includes:**
- Total clients, total orders
- Orders by status (not_started / in_progress / ready / delivered)
- Payment stats + revenue collected
- Today's deliveries count
- Upcoming 5 deliveries
- 5 most recent orders

---

## Roles
| Role | Permissions |
|------|-------------|
| `admin` | Full access including delete, team management |
| `tailor` | View & update orders assigned to them |
| `staff` | View clients/orders, create/edit orders |
