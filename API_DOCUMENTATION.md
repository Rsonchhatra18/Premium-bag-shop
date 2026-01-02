# Premium Bag Shop - API Documentation

## 🚀 All Features Implemented Successfully!

---

## **USER ROUTES** (`/users`)

### Authentication
- `POST /register` - Register new user
  - Body: `{ fullname, email, password }`
  
- `POST /login` - Login user
  - Body: `{ email, password }`
  - Returns: JWT token in cookie

- `POST /logout` - Logout user (Protected)

### Cart Management (All Protected)
- `POST /cart/add` - Add product to cart
  - Body: `{ productId, quantity }`
  
- `GET /cart` - View cart with total amount

- `PUT /cart/:productId` - Update cart item quantity
  - Body: `{ quantity }`

- `DELETE /cart/:productId` - Remove item from cart

- `DELETE /cart` - Clear entire cart

### Order Management (All Protected)
- `POST /orders` - Place order (checkout)
  - Body: 
```json
{
  "shippingAddress": {
    "address": "string",
    "city": "string",
    "state": "string",
    "pincode": "string",
    "phone": "string"
  },
  "paymentMethod": "cod" or "online"
}
```

- `GET /orders` - Get all user orders

- `GET /orders/:orderId` - Get single order details

- `PUT /orders/:orderId/cancel` - Cancel order

### Profile Management (All Protected)
- `GET /profile` - View profile

- `PUT /profile` - Update profile
  - Body: `{ fullname, contact, picture }` (at least 1)

- `PUT /profile/password` - Change password
  - Body: `{ currentPassword, newPassword }`

---

## **OWNER/ADMIN ROUTES** (`/owners`)

### Authentication
- `POST /login` - Owner login
  - Body: `{ email, password }`
  - Returns: JWT token in cookie (ownerToken)

- `POST /logout` - Owner logout

- `POST /create` - Create owner (development only)
  - Body: `{ fullname, email, password }`

### Dashboard (All Protected)
- `GET /dashboard` - Get dashboard statistics
  - Returns: Total products, users, orders, revenue, order statuses, recent orders, low stock products

- `GET /orders` - Get all orders (admin view)

- `PUT /orders/:orderId/status` - Update order status
  - Body: `{ status: 'pending'|'processing'|'shipped'|'delivered'|'cancelled' }`

### Product Management (All Protected)
- `POST /admin/products` - Create product with image
  - Content-Type: `multipart/form-data`
  - Fields: `image` (file), `name`, `price`, `discount`, `bgcolor`, `panelcolour`, `textcolour`, `category`, `stock`

- `GET /admin/products` - Get all products (public)

- `GET /admin/products/:productId` - Get single product (public)

- `PUT /admin/products/:productId` - Update product
  - Can update any field, image is optional

- `DELETE /admin/products/:productId` - Delete product

---

## **PRODUCT ROUTES** (`/products`)

### Browse Products (Public)
- `GET /all` - Get all products with filters
  - Query Params:
    - `search` - Search by name
    - `category` - Filter by category
    - `minPrice` - Minimum price filter
    - `maxPrice` - Maximum price filter
    - `sortBy` - Sort field (default: 'createdAt')
    - `order` - 'asc' or 'desc' (default: 'desc')
    - `page` - Page number (default: 1)
    - `limit` - Items per page (default: 10)
  
  Example: `/products/all?search=leather&category=bags&minPrice=1000&maxPrice=5000&sortBy=price&order=asc&page=1&limit=10`

- `GET /categories` - Get all available categories

- `GET /category/:category` - Get products by specific category

- `GET /:productId` - Get single product with reviews

### Reviews & Ratings (Protected)
- `POST /:productId/review` - Add review
  - Body: `{ rating: 1-5, comment: "string" }`

- `PUT /:productId/review/:reviewId` - Update your review
  - Body: `{ rating: 1-5, comment: "string" }`

- `DELETE /:productId/review/:reviewId` - Delete your review

---

## **NEW MODELS**

### User Model (Updated)
```javascript
{
  fullname: String,
  email: String,
  password: String (hashed),
  cart: [{
    product: ObjectId (ref: 'products'),
    quantity: Number
  }],
  orders: [ObjectId (ref: 'orders')],
  contact: Number,
  picture: String,
  timestamps: true
}
```

### Product Model (Updated)
```javascript
{
  image: String,
  name: String,
  price: Number,
  discount: Number (0-100),
  bgcolor: String,
  panelcolour: String,
  textcolour: String,
  category: String (default: 'Uncategorized'),
  stock: Number (default: 0),
  reviews: [{
    user: ObjectId (ref: 'users'),
    rating: Number (1-5),
    comment: String,
    createdAt: Date
  }],
  averageRating: Number (default: 0),
  totalReviews: Number (default: 0),
  timestamps: true
}
```

### Order Model (NEW)
```javascript
{
  user: ObjectId (ref: 'users'),
  products: [{
    product: ObjectId (ref: 'products'),
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  status: String (enum: pending, processing, shipped, delivered, cancelled),
  shippingAddress: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    phone: String
  },
  paymentMethod: String (enum: cod, online),
  paymentStatus: String (enum: pending, paid, failed),
  timestamps: true
}
```

---

## **KEY FEATURES ADDED**

### User Side ✅
1. **Cart Management** - Full CRUD operations on cart
2. **Order System** - Place orders, view history, cancel orders
3. **Profile Management** - View, update, change password
4. **Logout** - Clear authentication

### Admin Side ✅
1. **Owner Authentication** - Separate login for owners
2. **Dashboard** - Comprehensive statistics and analytics
3. **Order Management** - View all orders, update status

### Product Side ✅
1. **Categories** - Products organized by categories
2. **Search & Filter** - Advanced search with price range, sorting, pagination
3. **Reviews & Ratings** - Users can add/update/delete reviews, automatic average rating calculation

---

## **TESTING IN POSTMAN**

### Setup
1. Create a new collection "Premium Bag Shop"
2. Add environment variable: `baseUrl = http://localhost:3000`

### Test Flow
1. **Register User** → `POST /users/register`
2. **Login User** → `POST /users/login` (saves cookie automatically)
3. **Browse Products** → `GET /products/all?category=bags&sortBy=price`
4. **Add to Cart** → `POST /users/cart/add`
5. **View Cart** → `GET /users/cart`
6. **Place Order** → `POST /users/orders`
7. **Add Review** → `POST /products/:productId/review`
8. **Owner Login** → `POST /owners/login`
9. **View Dashboard** → `GET /owners/dashboard`

---

## **IMPORTANT NOTES**

1. **Authentication**: 
   - User cookie: `token`
   - Owner cookie: `ownerToken`
   - Both use isLoggedIn middleware

2. **Stock Management**: 
   - Stock decreases when order is placed
   - Stock restored when order is cancelled

3. **Image Upload**: 
   - Uses multer with memoryStorage
   - Saves to `public/images/` folder
   - Max size: 5MB

4. **Categories**: 
   - Dynamic - automatically created when products are added
   - Default: 'Uncategorized'

5. **Reviews**: 
   - One review per user per product
   - Automatic average rating calculation
   - Can be updated/deleted by owner only

---


