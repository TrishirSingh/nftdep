# Database Features for NFT Marketplace

## Current Status
- ✅ Google Sign-In (JWT sessions - no database)
- ✅ Wallet Connection (MetaMask)
- ❌ No persistent user data storage

## Recommended Database: MongoDB

**Why MongoDB?**
- Easy to set up with Next.js
- Flexible schema (good for evolving features)
- Great NextAuth.js adapter support
- Free tier available (MongoDB Atlas)

---

## Priority 1: Essential Features (Start Here)

### 1. **User Profiles** ⭐⭐⭐
**What to store:**
```javascript
{
  userId: "google-oauth-id",
  email: "user@example.com",
  name: "John Doe",
  image: "https://...",
  bio: "NFT collector",
  username: "@johndoe",
  createdAt: Date,
  updatedAt: Date
}
```

**Benefits:**
- Enable `/myprofile` page
- Custom usernames
- User bios and social links
- Profile customization

---

### 2. **Wallet Address Linking** ⭐⭐⭐
**What to store:**
```javascript
{
  userId: "google-oauth-id",
  wallets: [
    {
      address: "0x...",
      isPrimary: true,
      verified: false,
      connectedAt: Date
    }
  ]
}
```

**Benefits:**
- Link multiple wallets to one account
- Auto-connect primary wallet
- Wallet verification system

---

### 3. **Favorites/Wishlist** ⭐⭐
**What to store:**
```javascript
{
  userId: "google-oauth-id",
  favorites: [
    {
      tokenId: 123,
      contractAddress: "0x...",
      addedAt: Date,
      notes: "Want to buy this"
    }
  ]
}
```

**Benefits:**
- Save favorite NFTs
- Price alerts
- Quick access to liked items

---

### 4. **Transaction History** ⭐⭐
**What to store:**
```javascript
{
  userId: "google-oauth-id",
  transactions: [
    {
      type: "purchase" | "sale" | "listing",
      tokenId: 123,
      price: "0.5",
      priceWei: "500000000000000000",
      txHash: "0x...",
      timestamp: Date,
      status: "completed" | "pending" | "failed"
    }
  ]
}
```

**Benefits:**
- Track all user activity
- Transaction receipts
- Tax reporting data
- Activity timeline

---

## Priority 2: Nice to Have

### 5. **Activity Feed**
- User actions log
- Follow system
- Social features

### 6. **Notifications**
- Price alerts
- Bid updates
- New listings

### 7. **User Preferences**
- Theme settings
- Notification preferences
- Privacy settings

### 8. **Saved Searches**
- Store search queries
- Auto-refresh

---

## Priority 3: Advanced Features

### 9. **User Ratings/Reviews**
- Rate sellers
- Review NFTs
- Reputation system

### 10. **Collections/Portfolios**
- Custom collections
- Share collections
- Analytics

### 11. **Analytics Dashboard**
- Portfolio value
- Trading stats
- Performance metrics

---

## Implementation Steps

### Step 1: Set Up MongoDB
1. Create MongoDB Atlas account (free)
2. Create cluster
3. Get connection string
4. Install: `npm install mongodb @next-auth/mongodb-adapter`

### Step 2: Update NextAuth
- Add MongoDB adapter
- Store users in database

### Step 3: Create Database Models
- User schema
- Wallet schema
- Favorites schema
- Transactions schema

### Step 4: Create API Routes
- `/api/user/profile` - Get/Update profile
- `/api/user/wallets` - Manage wallets
- `/api/user/favorites` - Manage favorites
- `/api/user/transactions` - Get transaction history

### Step 5: Update Frontend
- `/myprofile` page
- Wallet linking UI
- Favorites button on NFT cards
- Transaction history page

---

## Database Schema Example (MongoDB)

```javascript
// Users Collection
{
  _id: ObjectId,
  email: String,
  name: String,
  image: String,
  bio: String,
  username: String,
  wallets: [{
    address: String,
    isPrimary: Boolean,
    verified: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}

// Favorites Collection
{
  _id: ObjectId,
  userId: ObjectId,
  tokenId: Number,
  contractAddress: String,
  notes: String,
  addedAt: Date
}

// Transactions Collection
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // "purchase", "sale", "listing"
  tokenId: Number,
  contractAddress: String,
  price: String,
  priceWei: String,
  txHash: String,
  timestamp: Date,
  status: String
}
```

---

## Quick Start Commands

```bash
# Install MongoDB adapter
npm install mongodb @next-auth/mongodb-adapter

# Or use Mongoose (alternative)
npm install mongoose
```

---

## Next Steps

Would you like me to:
1. ✅ Set up MongoDB connection
2. ✅ Add NextAuth MongoDB adapter
3. ✅ Create user profile API
4. ✅ Build `/myprofile` page
5. ✅ Add wallet linking feature

Let me know which features you want to implement first!

