# Payment System Documentation

## Overview
When an admin accepts/approves a contractor's bid for a tender, ETH is transferred from the admin to the contractor via smart contract.

## Features Implemented

### 1. Smart Contract - TenderPayment.sol
Located in `contracts/TenderPayment.sol`

**Key Functions:**
- `payContractor()` - Admin pays contractor for winning tender
- `getPayment()` - Get payment details
- `getContractorPayments()` - Get all payments for a contractor
- `getContractorTotalEarnings()` - Get total ETH earned by contractor

**Events:**
- `PaymentMade` - Emitted when payment is processed
- `PaymentReceived` - Emitted when contract receives ETH

### 2. Backend Routes

#### Assign Winner (Updated)
```
POST /api/tenders/:id/assign
```
- Assigns winning bid to tender
- Sets payment status to "Pending"
- Returns contractor wallet address and payment info

#### Process Payment
```
POST /api/tenders/:id/process-payment
```
- Processes ETH payment to contractor
- Updates payment status to "Completed"
- Records transaction hash

#### Get All Payments (Admin)
```
GET /api/tenders/payments/all
```
- Returns all payments across all tenders
- Admin only

#### Get Contractor Payments
```
GET /api/tenders/payments/contractor/:contractorId
```
- Returns payments for specific contractor
- Contractors can only view their own payments

### 3. Database Schema Updates

**Tender Model - New Fields:**
```javascript
{
  awardedAt: Date,           // When tender was awarded
  paymentAmount: String,     // ETH amount to be paid
  paymentStatus: String,     // Pending, Processing, Completed, Failed
  paymentDate: Date,         // When payment was processed
  transactionHash: String    // Blockchain transaction hash
}
```

### 4. Frontend Pages

#### Payments Page (`/payments`)
- **For Contractors:**
  - View all received payments
  - Track total earnings
  - See pending payments
  - View transaction hashes

- **For Admins:**
  - View all contractor payments
  - Process pending payments
  - Track payment history

#### Tenders Page (Updated)
- Shows payment status for awarded tenders
- Admin can process payments after assigning winner

## Workflow

### Step 1: Admin Assigns Winner
1. Admin reviews bids on tender
2. Clicks "Approve & Assign" on winning bid
3. System:
   - Updates tender status to "Awarded"
   - Sets payment status to "Pending"
   - Records contractor wallet address
   - Shows payment information

### Step 2: Admin Processes Payment
1. Admin navigates to Payments page or tender details
2. Clicks "Process Payment"
3. System:
   - Calls smart contract `payContractor()` function
   - Transfers ETH from admin to contractor
   - Records transaction hash
   - Updates payment status to "Completed"

### Step 3: Contractor Views Payment
1. Contractor navigates to Payments page
2. Sees:
   - Total earnings
   - Pending payments
   - Completed payments with transaction hashes
   - Can click transaction hash to view on Etherscan

## Smart Contract Deployment

### Prerequisites
1. Start Hardhat node:
   ```bash
   npx hardhat node
   ```

2. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Contract Address
After deployment, the TenderPayment contract address is saved in:
- `contract-addresses.json`

## API Examples

### Assign Winner
```javascript
POST /api/tenders/507f1f77bcf86cd799439011/assign
Headers: {
  Authorization: Bearer <admin_token>
}
Body: {
  bidId: "507f191e810c19729de860ea"
}

Response: {
  message: "Winner assigned successfully. Payment can now be processed.",
  tender: {...},
  contractor: {
    name: "ABC Construction",
    walletAddress: "0x1234...",
    amount: "50.5"
  },
  paymentInfo: {
    status: "Pending",
    amount: "50.5",
    contractorAddress: "0x1234..."
  }
}
```

### Process Payment
```javascript
POST /api/tenders/507f1f77bcf86cd799439011/process-payment
Headers: {
  Authorization: Bearer <admin_token>
}

Response: {
  message: "Payment processed successfully",
  payment: {
    tenderId: "507f1f77bcf86cd799439011",
    tenderTitle: "City Bridge Construction",
    contractorAddress: "0x1234...",
    contractorName: "ABC Construction",
    amount: "50.5",
    timestamp: "2025-01-27T10:30:00.000Z",
    transactionHash: "0xabcd...",
    status: "Completed"
  }
}
```

### Get Contractor Payments
```javascript
GET /api/tenders/payments/contractor/507f1f77bcf86cd799439011
Headers: {
  Authorization: Bearer <contractor_token>
}

Response: [
  {
    tenderId: "507f1f77bcf86cd799439011",
    tenderTitle: "City Bridge Construction",
    amount: "50.5",
    paymentStatus: "Completed",
    paymentDate: "2025-01-27T10:30:00.000Z",
    transactionHash: "0xabcd...",
    awardedAt: "2025-01-27T09:00:00.000Z"
  }
]
```

## Security Features

1. **Role-Based Access:**
   - Only admins can assign winners
   - Only admins can process payments
   - Contractors can only view their own payments

2. **Smart Contract Security:**
   - ReentrancyGuard prevents reentrancy attacks
   - AccessControl for role management
   - Excess ETH automatically refunded to admin

3. **Validation:**
   - Validates contractor wallet address exists
   - Checks tender is awarded before payment
   - Prevents duplicate payments

## Testing

### Test Payment Flow
1. Login as admin
2. Create a tender
3. Login as contractor (verified)
4. Submit a bid
5. Login as admin
6. Assign winner
7. Process payment
8. Login as contractor
9. View payment in Payments page

## Future Enhancements

1. **Milestone Payments:**
   - Split payment into milestones
   - Release payment based on progress

2. **Escrow System:**
   - Hold funds in escrow
   - Release on completion

3. **Multi-Currency Support:**
   - Support for ERC-20 tokens
   - Stablecoin payments

4. **Automated Payments:**
   - Auto-process on winner assignment
   - Scheduled payments

5. **Payment Notifications:**
   - Email notifications
   - In-app notifications
   - Webhook integrations

## Troubleshooting

### Payment Not Processing
- Check admin has sufficient ETH balance
- Verify contractor wallet address is valid
- Ensure Hardhat node is running
- Check contract is deployed

### Transaction Hash Not Showing
- Verify blockchain connection
- Check contract deployment
- Review backend logs

### Contractor Can't See Payments
- Verify contractor is logged in
- Check tender was awarded to them
- Ensure payment was processed

## Files Created/Modified

### New Files:
- `contracts/TenderPayment.sol` - Payment smart contract
- `Frontend_part/src/pages/Payments.js` - Payments page
- `PAYMENT_SYSTEM.md` - This documentation

### Modified Files:
- `scripts/deploy.js` - Added TenderPayment deployment
- `routes/tenders.js` - Added payment routes
- `models/Tender.js` - Added payment fields
- `App.js` - Added Payments route
- `Layout.js` - Added Payments navigation

## Support

For issues or questions:
1. Check backend logs for errors
2. Verify smart contract deployment
3. Test with demo accounts
4. Review transaction on Etherscan