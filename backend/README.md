# Foodiez - Online Food Ordering System API

A comprehensive MERN stack backend API for an online food ordering system with JWT authentication and role-based access control.

## Features

- **JWT Authentication** with role-based access (Admin & Customer)
- **Admin Management**: CRUD operations for restaurants and menu items
- **Customer Features**: Browse restaurants, manage cart, place orders
- **Order Management**: Complete order lifecycle with status tracking
- **File Upload**: Image uploads using Cloudinary
- **Advanced Filtering**: Search and filter restaurants and menu items
- **Comprehensive Validation**: Input validation and error handling

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **File Upload**: Multer with Cloudinary
- **Validation**: Express Validator
- **Security**: Bcrypt for password hashing, CORS

## Installation & Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/foodiez
   JWT_SECRET=your_jwt_secret_key_here_make_it_very_secure_and_long
   JWT_EXPIRE=30d

   # Cloudinary Configuration (Optional - for image uploads)
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on your system

4. **Run the application**
   ```bash
   npm start
   # or for development with nodemon
   npm run dev
   ```

## API Documentation

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

#### Admin Authentication
- `POST /api/admin/register` - Register new admin
- `POST /api/admin/login` - Admin login
- `GET /api/admin/profile` - Get admin profile (Protected)
- `PUT /api/admin/profile` - Update admin profile (Protected)
- `GET /api/admin/dashboard` - Get dashboard stats (Protected)

#### Customer Authentication
- `POST /api/customer/register` - Register new customer
- `POST /api/customer/login` - Customer login
- `GET /api/customer/profile` - Get customer profile (Protected)
- `PUT /api/customer/profile` - Update customer profile (Protected)
- `POST /api/customer/favorites/:restaurantId` - Add to favorites (Protected)
- `DELETE /api/customer/favorites/:restaurantId` - Remove from favorites (Protected)

### Restaurant Management

- `GET /api/restaurants` - Get all restaurants (Public)
- `GET /api/restaurants/:id` - Get single restaurant (Public)
- `POST /api/restaurants` - Create restaurant (Admin only)
- `PUT /api/restaurants/:id` - Update restaurant (Admin only)
- `DELETE /api/restaurants/:id` - Delete restaurant (Admin only)
- `GET /api/restaurants/:id/menu` - Get restaurant menu (Public)
- `GET /api/restaurants/:id/stats` - Get restaurant stats (Admin only)

### Menu Item Management

- `GET /api/menu-items` - Get all menu items (Public)
- `GET /api/menu-items/:id` - Get single menu item (Public)
- `POST /api/menu-items` - Create menu item (Admin only)
- `PUT /api/menu-items/:id` - Update menu item (Admin only)
- `DELETE /api/menu-items/:id` - Delete menu item (Admin only)
- `PATCH /api/menu-items/:id/toggle-availability` - Toggle availability (Admin only)
- `GET /api/menu-items/categories` - Get all categories (Public)
- `GET /api/menu-items/categories/:category` - Get items by category (Public)

### Cart Management

- `GET /api/cart` - Get customer's cart (Customer only)
- `GET /api/cart/summary` - Get cart summary (Customer only)
- `POST /api/cart/add` - Add item to cart (Customer only)
- `PUT /api/cart/item/:itemId` - Update cart item (Customer only)
- `DELETE /api/cart/item/:itemId` - Remove item from cart (Customer only)
- `DELETE /api/cart/clear` - Clear entire cart (Customer only)

### Order Management

#### Customer Orders
- `GET /api/orders` - Get customer's orders (Customer only)
- `POST /api/orders` - Create order from cart (Customer only)
- `GET /api/orders/:id` - Get single order (Customer/Admin)
- `PUT /api/orders/:id/cancel` - Cancel order (Customer only)
- `PUT /api/orders/:id/review` - Add review to order (Customer only)

#### Admin Orders
- `GET /api/orders/admin/all` - Get all orders (Admin only)
- `GET /api/orders/admin/stats` - Get order statistics (Admin only)
- `PUT /api/orders/:id/status` - Update order status (Admin only)

## Request/Response Examples

### Register Admin
```http
POST /api/admin/register
Content-Type: application/json

{
  "name": "Admin User",
  "email": "admin@foodiez.com",
  "password": "admin123",
  "phone": "+1234567890"
}
```

### Register Customer
```http
POST /api/customer/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001"
  }
}
```

### Create Restaurant
```http
POST /api/restaurants
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Italian Delights",
  "description": "Authentic Italian cuisine",
  "address": {
    "street": "456 Restaurant Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002"
  },
  "phone": "+1987654321",
  "email": "info@italiandelights.com",
  "cuisine": "Italian",
  "priceRange": "$$",
  "deliveryFee": 2.99,
  "minimumOrder": 15.00
}
```

### Add Item to Cart
```http
POST /api/cart/add
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "menuItemId": "64a5b2c3d4e5f6789abcdef0",
  "quantity": 2,
  "specialInstructions": "Extra cheese please"
}
```

### Place Order
```http
POST /api/orders
Authorization: Bearer <customer_token>
Content-Type: application/json

{
  "paymentMethod": "credit-card",
  "deliveryAddress": {
    "street": "123 Customer St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10003",
    "phone": "+1122334455"
  },
  "specialInstructions": "Ring the bell twice"
}
```

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Array of validation errors (if applicable)
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Authentication

Include JWT token in requests:
```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned upon successful login/registration and are valid for 30 days.

## File Uploads

Image uploads are handled via multipart/form-data with Cloudinary integration:
- Restaurant images: `/api/restaurants` (POST/PUT with `image` field)
- Menu item images: `/api/menu-items` (POST/PUT with `image` field)

## Query Parameters

### Restaurants
- `search` - Text search in name, cuisine, tags
- `cuisine` - Filter by cuisine type
- `city` - Filter by city
- `minRating` - Minimum rating filter
- `priceRange` - Filter by price range ($, $$, $$$, $$$$)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - asc/desc (default: desc)

### Menu Items
- `restaurant` - Filter by restaurant ID
- `category` - Filter by category
- `vegetarian` - true/false
- `vegan` - true/false
- `glutenFree` - true/false
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `search` - Text search
- `available` - true/false (default: true)

### Orders
- `status` - Filter by order status
- `page` - Page number
- `limit` - Items per page

## License

MIT License