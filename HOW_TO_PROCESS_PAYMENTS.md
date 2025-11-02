# How to Process Payments

## Overview
When you assign a winner to a tender, the payment status is set to "Pending". You need to manually process the payment to change it to "Completed" and credit the contractor.

## Step-by-Step Guide

### Method 1: From Tenders Page

1. **Login as Admin**
   - Email: admin@platform.com
   - Password: admin123

2. **Navigate to Tenders Page**
   - Click "Tenders" in the sidebar

3. **Find Awarded Tender**
   - Look for tenders with status "Awarded"
   - You'll see "Winner Assigned" badge

4. **Process Payment**
   - Click the green "Process Payment" button
   - Confirm the payment amount
   - Click "OK" to process

5. **Verify**
   - Status changes to "Payment Completed"
   - Transaction hash is displayed
   - Contractor receives the ETH

### Method 2: From Payments Page

1. **Login as Admin**
   - Email: admin@platform.com
   - Password: admin123

2. **Navigate to Payments Page**
   - Click "Payments" 💰 in the sidebar

3. **Find Pending Payment**
   - Look for payments with "Pending" status (yellow badge)
   - Shows contractor name and amount

4. **Process Payment**
   - Click the green "Process Payment" button on the right
   - Confirm the payment details
   - Click "OK" to process

5. **Success**
   - Alert shows "Payment processed successfully!"
   - Transaction hash is displayed
   - Status changes to "Completed" (green badge)
   - Page automatically refreshes

## What Happens When You Process Payment

1. **Backend Updates:**
   - Payment status: Pending → Completed
   - Payment date is recorded
   - Transaction hash is generated
   - Tender is updated in database

2. **Contractor Sees:**
   - Payment appears in their Payments page
   - Status shows "Completed"
   - Can view transaction hash
   - Total earnings updated

3. **Admin Sees:**
   - Payment marked as completed
   - Transaction hash recorded
   - Can track all processed payments

## Payment Status Flow

```
Tender Created
    ↓
Bids Submitted
    ↓
Admin Assigns Winner
    ↓
Payment Status: PENDING ⏳
    ↓
Admin Clicks "Process Payment"
    ↓
Payment Status: COMPLETED ✅
    ↓
Contractor Receives ETH
```

## Where to Find Process Payment Button

### Tenders Page:
- Next to "Winner Assigned" badge
- Only visible for awarded tenders with pending payments
- Green button with 💰 icon

### Payments Page:
- On the right side of each pending payment row
- Shows contractor name and amount
- Easier to manage multiple payments

## Troubleshooting

### Button Not Showing
- Make sure you're logged in as admin
- Tender must be in "Awarded" status
- Payment status must be "Pending"
- Refresh the page

### Payment Processing Fails
- Check backend server is running
- Verify you have admin permissions
- Check browser console for errors
- Try again after a few seconds

### Payment Still Pending
- Click the "Process Payment" button
- Confirm the dialog
- Wait for success message
- Refresh the page

## Testing

### Test the Payment Flow:

1. **Create a Tender** (as admin)
2. **Submit a Bid** (as verified contractor)
3. **Assign Winner** (as admin)
   - Payment status: Pending
4. **Process Payment** (as admin)
   - Click "Process Payment" button
   - Confirm
5. **Verify** (as contractor)
   - Go to Payments page
   - See completed payment
   - View transaction hash

## Current Implementation

**Note:** Currently, the system simulates blockchain transactions. The payment is recorded in the database with a mock transaction hash. 

To enable real blockchain payments:
1. Deploy smart contracts (see START_BLOCKCHAIN.md)
2. Integrate Web3 for actual ETH transfers
3. Connect MetaMask for wallet interactions

For now, the system works perfectly for tracking and managing payments without actual blockchain transactions!

## Quick Reference

**Admin Actions:**
- ✅ Assign winner → Payment: Pending
- ✅ Process payment → Payment: Completed
- ✅ View all payments
- ✅ Track transaction hashes

**Contractor Actions:**
- ✅ View their payments
- ✅ See payment status
- ✅ Track total earnings
- ✅ View transaction hashes

**Payment Statuses:**
- 🟡 **Pending** - Awaiting admin to process
- 🟢 **Completed** - Payment processed successfully
- 🔵 **Processing** - Payment in progress
- 🔴 **Failed** - Payment failed (retry needed)