# Complaints System Documentation

## Overview
Quality Assurance team can submit complaints about contractors. These complaints are visible to Quality Verifiers, Certificate Verifiers, and Admins - but NOT to contractors.

## Features Implemented

### 1. Backend Components

**Complaint Model** (`models/Complaint.js`):
- Contractor ID
- Submitted by (Quality Verifier)
- Subject and description
- Category (general, quality, safety, compliance, other)
- Status (pending, under_review, resolved, escalated)
- Priority (low, medium, high, critical)
- Resolution notes
- Timestamps

**Complaint Routes** (`routes/complaints.js`):
- `POST /api/complaints` - Submit complaint (Verifier only)
- `GET /api/complaints` - Get all complaints (Verifier/Admin only)
- `GET /api/complaints/:id` - Get complaint by ID
- `PUT /api/complaints/:id/status` - Update complaint status
- `GET /api/complaints/contractor/:contractorId` - Get complaints for contractor

### 2. Frontend Pages

**Quality Assurance Page** (Updated):
- "Handle Complaints" button
- Form to submit complaints
- Select contractor
- Choose category
- Add description
- Complaints saved to database

**Complaints Page** (New - `/complaints`):
- View all submitted complaints
- Statistics dashboard
- Filter by status
- Update complaint status
- Add resolution notes
- Visible to: Quality Verifiers, Certificate Verifiers, Admins
- Hidden from: Contractors

### 3. Navigation

New menu item: **Complaints** 🛡️
- Visible to: Verifiers and Admins
- Hidden from: Contractors
- Shows all complaints submitted by Quality Assurance

## Workflow

### Step 1: Quality Assurance Submits Complaint

1. **Login as Quality Assurance**
   - Email: verifier2@platform.com
   - Password: verifier123

2. **Go to Quality Assurance Page**
   - Click "Handle Complaints" button

3. **Fill Complaint Form**
   - Select contractor
   - Choose category (quality, safety, compliance, etc.)
   - Enter subject
   - Add description
   - Submit

4. **Complaint Saved**
   - Stored in database
   - Status: Pending
   - Visible to all verifiers and admins

### Step 2: Certificate Verifier Reviews Complaint

1. **Login as Certificate Verifier**
   - Email: verifier@platform.com
   - Password: verifier123

2. **Go to Complaints Page**
   - Click "Complaints" in sidebar
   - See all submitted complaints

3. **Review Complaint**
   - Click "Review" button
   - Enter review notes
   - Status changes to "Under Review"

4. **Take Action**
   - **Resolve**: Mark as resolved with notes
   - **Escalate**: Escalate to admin for serious issues

### Step 3: Admin Manages Complaints

1. **Login as Admin**
   - Email: admin@platform.com
   - Password: admin123

2. **Go to Complaints Page**
   - View all complaints
   - See statistics

3. **Manage Complaints**
   - Review pending complaints
   - Resolve issues
   - Take action on escalated complaints

## Access Control

### Who Can See Complaints?

✅ **Quality Assurance Verifiers**
- Can submit complaints
- Can view all complaints
- Can update complaint status

✅ **Certificate Verifiers**
- Can view all complaints
- Can update complaint status
- Can resolve complaints

✅ **Admins**
- Can view all complaints
- Can update complaint status
- Can resolve complaints
- Full access to all features

❌ **Contractors**
- Cannot see complaints
- Cannot access complaints page
- No visibility into complaints about them

## Complaint Statuses

1. **Pending** 🟡
   - Just submitted
   - Awaiting review
   - Actions: Review, Escalate

2. **Under Review** 🔵
   - Being investigated
   - Verifier assigned
   - Actions: Resolve

3. **Resolved** 🟢
   - Issue fixed
   - Resolution notes added
   - Closed

4. **Escalated** 🔴
   - Serious issue
   - Requires admin attention
   - High priority

## Complaint Categories

- **General** - General issues
- **Quality** - Quality problems
- **Safety** - Safety concerns
- **Compliance** - Compliance violations
- **Other** - Other issues

## Priority Levels

- **Low** - Minor issues
- **Medium** - Standard issues
- **High** - Important issues
- **Critical** - Urgent issues

## Statistics Dashboard

The Complaints page shows:
- Total complaints
- Pending complaints
- Under review
- Resolved complaints
- Escalated complaints

## API Endpoints

```
POST   /api/complaints                      - Submit complaint
GET    /api/complaints                      - Get all complaints
GET    /api/complaints/:id                  - Get complaint by ID
PUT    /api/complaints/:id/status           - Update status
GET    /api/complaints/contractor/:id       - Get contractor complaints
```

## Testing

### Test the Complaint Flow:

1. **Submit Complaint** (as Quality Assurance)
   - Login: verifier2@platform.com
   - Go to Quality Assurance page
   - Click "Handle Complaints"
   - Fill form and submit

2. **View Complaint** (as Certificate Verifier)
   - Login: verifier@platform.com
   - Go to Complaints page
   - See submitted complaint

3. **Review Complaint** (as Certificate Verifier)
   - Click "Review" button
   - Enter notes
   - Status changes to "Under Review"

4. **Resolve Complaint** (as Certificate Verifier or Admin)
   - Click "Resolve" button
   - Enter resolution notes
   - Status changes to "Resolved"

5. **Verify Contractor Cannot See**
   - Login as contractor
   - No "Complaints" menu item
   - Cannot access /complaints page

## Security Features

✅ Role-based access control
✅ Only verifiers and admins can view complaints
✅ Contractors completely blocked from complaints
✅ All actions logged with user info
✅ Timestamps for audit trail

## Files Created/Modified

### New Files:
- `Backend_part/models/Complaint.js` - Complaint model
- `Backend_part/routes/complaints.js` - Complaint routes
- `Frontend_part/src/pages/Complaints.js` - Complaints page
- `COMPLAINTS_SYSTEM.md` - This documentation

### Modified Files:
- `Backend_part/server.js` - Added complaints route
- `Frontend_part/src/App.js` - Added Complaints route
- `Frontend_part/src/components/Layout.js` - Added Complaints navigation
- `Frontend_part/src/pages/QualityAssurance.js` - Updated complaint submission

## Benefits

1. **Transparency** - All verifiers see all complaints
2. **Accountability** - Track who submitted and resolved
3. **Privacy** - Contractors don't see complaints
4. **Collaboration** - QA and Verifiers work together
5. **Audit Trail** - Complete history of all complaints
6. **Escalation** - Serious issues go to admin

## Future Enhancements

- Email notifications for new complaints
- Complaint assignment to specific verifiers
- Attachment support for evidence
- Complaint analytics and reports
- Contractor response system (optional)
- Integration with verification status