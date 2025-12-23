# NFT Bidding System - Complete Guide

## ✅ Bidding System Implemented!

Your NFT marketplace now has a full bidding/auction system!

---

## 🎯 Features

### 1. **Create Auctions**
- Go to "My NFTs" page
- Click "Start Bidding" on any NFT you own
- Set base price (minimum bid)
- Set auction duration (seconds, minutes, hours, or days)
- Auction starts immediately

### 2. **Place Bids**
- Go to "Active Bids" page (or Discover → Active Bids)
- View all active auctions
- See current bid, timer countdown, and bid history
- Place bids higher than current bid

### 3. **Timer System**
- Real-time countdown (days, hours, minutes, seconds)
- Automatically ends when timer reaches zero
- Updates every second

### 4. **Automatic Winner Selection**
- When timer ends, highest bidder wins
- Seller can manually end auction after timer expires
- NFT transfer can be completed (requires wallet connection)

---

## 📁 Files Created/Modified

### **API Routes** (`pages/api/bids/`)
- `create.js` - Create new auctions
- `place.js` - Place bids on auctions
- `active.js` - Get all active auctions
- `end.js` - End auctions and select winner

### **Components**
- `components/BidModal/BidModal.jsx` - Modal for creating auctions
- `components/BidTimer/BidTimer.jsx` - Countdown timer component

### **Pages**
- `pages/bids.js` - View and place bids on active auctions
- `pages/mynfts.js` - Updated with "Start Bidding" button

### **Database**
- `lib/db.js` - Added `getBidsCollection()` helper
- MongoDB collection: `bids`

---

## 🗄️ Database Schema

### **Bids Collection**
```javascript
{
  tokenId: Number,           // NFT token ID
  seller: String,            // Seller email
  sellerWallet: String,      // Seller wallet (optional)
  basePrice: Number,          // Minimum bid (ETH)
  currentBid: Number,        // Current highest bid (ETH)
  highestBidder: String,     // Highest bidder email
  highestBidderWallet: String, // Highest bidder wallet (optional)
  bids: [                    // Array of all bids
    {
      bidder: String,
      bidderWallet: String,
      amount: Number,
      timestamp: Date
    }
  ],
  startTime: Date,
  endTime: Date,
  duration: Number,           // Duration in seconds
  status: String,             // 'active', 'ended', 'completed'
  createdAt: Date,
  completedAt: Date           // When auction was completed
}
```

---

## 🚀 How to Use

### **For Sellers (NFT Owners)**

1. **Go to My NFTs**: Navigate to `/mynfts`
2. **Click "Start Bidding"**: On any NFT you own
3. **Set Base Price**: Minimum bid amount (e.g., 0.1 ETH)
4. **Set Duration**: 
   - Choose unit: Seconds, Minutes, Hours, or Days
   - Enter duration (e.g., 24 hours)
5. **Create Auction**: Click "Start Auction"
6. **Wait for Bids**: Users can now bid on your NFT
7. **End Auction**: After timer expires, manually end to complete transfer

### **For Bidders**

1. **Go to Active Bids**: Navigate to `/bids` or Discover → Active Bids
2. **View Auctions**: See all active auctions with timers
3. **Place Bid**: 
   - Enter bid amount (must be higher than current bid)
   - Click "Place Bid"
4. **Watch Timer**: See countdown in real-time
5. **Win Auction**: If you're highest bidder when timer ends, you win!

---

## 🔧 API Endpoints

### **POST `/api/bids/create`**
Create a new auction
```json
{
  "tokenId": 1,
  "basePrice": 0.1,
  "duration": 86400  // seconds (24 hours)
}
```

### **POST `/api/bids/place`**
Place a bid on an auction
```json
{
  "auctionId": "507f1f77bcf86cd799439011",
  "bidAmount": 0.15
}
```

### **GET `/api/bids/active`**
Get all active auctions
```json
{
  "auctions": [...]
}
```

### **POST `/api/bids/end`**
End an auction (seller only)
```json
{
  "auctionId": "507f1f77bcf86cd799439011"
}
```

---

## ⚙️ Configuration

### **Timer Units**
- **Seconds**: For very short auctions (testing)
- **Minutes**: Short auctions (1-60 minutes)
- **Hours**: Standard auctions (1-168 hours / 7 days)
- **Days**: Long auctions (1-30 days)

### **Auto-Refresh**
- Active bids page refreshes every 10 seconds
- Timer updates every second
- Auctions automatically marked as "ended" when timer expires

---

## 🔐 Security Features

- ✅ Authentication required (sign in with Google)
- ✅ Sellers can't bid on their own auctions
- ✅ Bids must be higher than current bid
- ✅ Only seller can end auction
- ✅ Auction validation (active status, not expired)

---

## 🎨 UI Features

- **Bid Modal**: Clean, user-friendly form
- **Timer Display**: Real-time countdown with days/hours/minutes/seconds
- **Auction Cards**: Beautiful cards showing all auction info
- **Bid History**: See all bids placed
- **Status Indicators**: Clear active/ended status

---

## 📝 Next Steps (Optional Enhancements)

1. **Smart Contract Integration**: 
   - Automatically transfer NFT to winner on blockchain
   - Escrow system for bids

2. **Email Notifications**:
   - Notify when outbid
   - Notify when auction ends
   - Notify winner

3. **Bid History Page**:
   - View all your bids
   - View all your auctions

4. **Advanced Features**:
   - Reserve price
   - Buy now option
   - Automatic bid increments

---

## 🐛 Troubleshooting

### **"Auction not found"**
- Check if auction ID is correct
- Auction may have been deleted

### **"Auction has ended"**
- Timer expired
- Refresh page to see updated status

### **"Bid must be higher"**
- Enter amount higher than current bid
- Check current bid amount on auction card

### **"Unauthorized"**
- Sign in with Google first
- Check session status

---

## ✅ Everything is Ready!

Your bidding system is fully functional:
- ✅ Create auctions from My NFTs page
- ✅ View active auctions on Bids page
- ✅ Place bids with real-time updates
- ✅ Timer countdown with automatic ending
- ✅ Winner selection when timer expires

**Start creating auctions and let users bid on your NFTs!** 🎉

