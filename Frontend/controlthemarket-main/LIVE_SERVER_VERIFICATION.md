# CTM Live Server Verification Guide

**Check everything is working on your live/running server**

---

## 🚀 Start the Dev Server

```bash
cd Frontend/controlthemarket-main
pnpm dev
# Runs on http://localhost:3034

# In another terminal:
cd Backend/services/ecosystem/ctm-service
pnpm dev
# Runs on http://localhost:3001
```

---

## 📍 AUTH FLOW - Test All Pages

### 1️⃣ **Login Page**
**URL:** http://localhost:3034/login

**Test:**
- [ ] Page loads
- [ ] Email input works
- [ ] Password input works
- [ ] "Forgot password?" link works
- [ ] "Create account" link works
- [ ] Try logging in (use test credentials)
- [ ] OTP tab visible

**What to see:**
```
✅ Email + Password form
✅ OTP email login option
✅ "Send OTP" button
✅ Error messages on invalid input
```

---

### 2️⃣ **Signup Page (Role Selector)**
**URL:** http://localhost:3034/signup

**Test:**
- [ ] Page loads
- [ ] Two role cards visible
- [ ] "I'm a Candidate" card clickable
- [ ] "I'm a Company" card clickable
- [ ] Assurances show at bottom

**What to see:**
```
✅ Candidate role card
✅ Company role card
✅ "Free to get started", "No credit card", "Verified scoring" badges
```

---

### 3️⃣ **Candidate Signup**
**URL:** http://localhost:3034/signup/candidate

**Test:**
- [ ] Form loads
- [ ] Name input
- [ ] Email input
- [ ] Password input
- [ ] Phone input (optional)
- [ ] Skills input
- [ ] Submit button
- [ ] "Already have account?" link

**What to see:**
```
✅ Candidate-specific fields
✅ Skills multi-select
✅ Password strength indicator
```

---

### 4️⃣ **Company Signup**
**URL:** http://localhost:3034/signup/company

**Test:**
- [ ] Form loads
- [ ] Name input
- [ ] Email input
- [ ] Password input
- [ ] Company name input
- [ ] Company description
- [ ] Company website
- [ ] Submit button

**What to see:**
```
✅ Company-specific fields
✅ Business info inputs
✅ Form validation
```

---

### 5️⃣ **Forgot Password**
**URL:** http://localhost:3034/forgot-password

**Test:**
- [ ] Page loads
- [ ] Email input visible
- [ ] "Send reset link" button works
- [ ] Shows "Check your inbox" after submit
- [ ] "Use a different email" button works
- [ ] "Back to sign in" link works

**What to see:**
```
✅ Email input
✅ Generic success message (doesn't reveal if email exists)
✅ Professional styling
```

---

## 🔐 PAYMENT GATEWAY - Test Razorpay

### 📊 **Check Payment Health**

**Command:**
```bash
curl http://localhost:3001/api/v1/payments/health \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "providers": ["razorpay"],
  "configured": {
    "razorpay": true
  }
}
```

---

### 💳 **Billing Dashboard**
**URL:** http://localhost:3034/company/billing

**Prerequisites:**
- [ ] Logged in as company user
- [ ] Have RAZORPAY keys set

**Test:**
- [ ] Page loads
- [ ] Shows "Billing & Payments" title
- [ ] Shows recent invoices table
- [ ] Shows "Amount Due" card
- [ ] "Pay Now" button visible
- [ ] "Choose plan & pay" button visible

**What to see:**
```
✅ Invoice ID, Date, Amount, Status columns
✅ Download button for invoices
✅ "Pay Now" button (if amount due > 0)
✅ Billing overview card
✅ Next bill date
✅ Payment method info: "Stripe & Razorpay"
```

---

### 🛒 **Payment Dialog - Click "Pay Now"**

**URL:** http://localhost:3034/company/billing → Click "Pay Now"

**Test:**
- [ ] Dialog pops up
- [ ] "Choose a plan & pay" title shows
- [ ] Monthly/Yearly toggle works
- [ ] Plan options load
- [ ] Plan selection works (highlight)
- [ ] "Pay by card" button appears
- [ ] "Pay with Razorpay" button appears

**What to see:**
```
✅ Dialog modal opens
✅ Plan list (Professional, Enterprise, etc.)
✅ Price displays (monthly/yearly)
✅ Payment provider buttons:
   - Pay by card (Stripe)
   - Pay with Razorpay · UPI / Cards / Netbanking
   - Other providers if configured
```

---

### 🎯 **Razorpay Modal - Click "Pay with Razorpay"**

**Prerequisites:**
- Dialog open
- Razorpay key configured
- Plan selected

**Test:**
- [ ] Click "Pay with Razorpay"
- [ ] Razorpay modal opens
- [ ] Shows plan name
- [ ] Shows amount in INR
- [ ] Shows email prefill
- [ ] Test payment options available

**What to see:**
```
✅ Razorpay Checkout modal
✅ Amount display
✅ Plan name as description
✅ Your email prefilled
✅ Payment method tabs:
   - Cards
   - UPI
   - Net Banking
   - Wallets
```

---

### 💰 **Test Payment (Razorpay Test Mode)**

**Razorpay Test Card:**
```
Card Number:  4111 1111 1111 1111
Expiry:       12/25
CVV:          123
OTP:          123456
```

**Test:**
- [ ] Enter test card
- [ ] Click Pay
- [ ] Payment processes
- [ ] Modal closes
- [ ] Redirected to `/company/billing?paid=1`
- [ ] See "Payment received" toast

**Expected Flow:**
```
Fill Card → Click Pay → OTP prompt → Enter 123456 → Success
→ Redirected to billing dashboard with success message
```

---

## 📊 DASHBOARDS - Check All User Types

### 👤 **Candidate Dashboard**
**URL:** http://localhost:3034/dashboard

**Prerequisites:**
- Logged in as candidate

**Test:**
- [ ] Page loads
- [ ] Shows task assignments
- [ ] Shows submission history
- [ ] Shows stats/scores
- [ ] Shows skills

**What to see:**
```
✅ My Assignments section
✅ Submission history table
✅ Performance metrics
✅ Skills display
```

---

### 🏢 **Company Dashboard**
**URL:** http://localhost:3034/company/dashboard

**Prerequisites:**
- Logged in as company user

**Test:**
- [ ] Page loads
- [ ] Shows top candidates
- [ ] Shows active postings
- [ ] Shows hiring pipeline
- [ ] Shows analytics

**What to see:**
```
✅ Candidates section
✅ Open positions
✅ Recent activity
✅ Charts/metrics
```

---

### 👨‍💼 **Admin Dashboard**
**URL:** http://localhost:3034/admin/dashboard

**Prerequisites:**
- Logged in as admin
- Admin role in database

**Test:**
- [ ] Page loads (if admin)
- [ ] Shows platform overview
- [ ] Shows user stats
- [ ] Shows system health
- [ ] Shows activity logs

**What to see:**
```
✅ Platform metrics
✅ User counts
✅ Revenue data
✅ System status
```

---

## 📄 POLICY PAGES - Check All

### ✅ **Terms of Service**
**URL:** http://localhost:3034/terms

- [ ] Page loads
- [ ] Content displays
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Links work

---

### ✅ **Privacy Policy**
**URL:** http://localhost:3034/privacy

- [ ] Page loads
- [ ] Content displays
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Email link works (privacy@...)

---

### ✅ **Refund Policy** *(NEW)*
**URL:** http://localhost:3034/refund-policy

**Must See:**
```
✅ "Refund Policy" title
✅ "Subscription Refunds" section
✅ "How to Request a Refund" steps
✅ "Non-Refundable Items" list
✅ Contact email: support@controlthemarket.com
```

---

### ✅ **Payment Policy** *(NEW)*
**URL:** http://localhost:3034/payment-policy

**Must See:**
```
✅ "Payment Policy" title
✅ "Accepted Payment Methods" (Cards, UPI, Net Banking, etc.)
✅ "Payment Security" section (SSL, PCI-DSS, etc.)
✅ "Payment Processing Steps" (7 steps)
✅ "Failed Payments" handling
✅ Razorpay, Stripe mentioned
```

---

### ✅ **Data Deletion Policy** *(NEW)*
**URL:** http://localhost:3034/data-deletion

**Must See:**
```
✅ "Account Deletion & Data Removal" title
✅ "Request Account Deletion" steps
✅ "What Gets Deleted" list
✅ "What's Retained" (transaction history, etc.)
✅ Deletion timeline (1-4 steps with timeline)
✅ Contact email: privacy@controlthemarket.com
```

---

### ✅ **Contact**
**URL:** http://localhost:3034/contact

- [ ] Page loads
- [ ] Contact form present
- [ ] All fields present
- [ ] Submit works

---

## 🔍 API HEALTH CHECKS

### **Backend Health**
```bash
curl http://localhost:3001/health
```

**Expected:** `200 OK`

---

### **Payment Provider Status**
```bash
curl http://localhost:3001/api/v1/payments/provider \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "providers": ["razorpay"],
  "default": "razorpay",
  "configured": true
}
```

---

### **Get Invoices**
```bash
curl http://localhost:3001/api/v1/invoices \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected:** List of invoices for your company

---

### **Create Checkout**
```bash
curl -X POST http://localhost:3001/api/v1/payments/checkout \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": "basic",
    "provider": "razorpay",
    "billing_cycle": "monthly",
    "email": "user@example.com"
  }'
```

**Expected Response:**
```json
{
  "provider": "razorpay",
  "orderId": "order_xxxxx",
  "keyId": "rzp_test_xxxxx",
  "amount": 99900,
  "currency": "INR",
  "clientParams": { ... }
}
```

---

## 📱 RESPONSIVE DESIGN CHECK

### **Mobile (375px)**
1. Open Chrome DevTools: `F12`
2. Click Device Toggle: `Ctrl+Shift+M`
3. Select "iPhone SE"
4. Test each page:
   - [ ] Login page responsive
   - [ ] Signup pages responsive
   - [ ] Billing dashboard responsive
   - [ ] Policy pages responsive
   - [ ] All buttons clickable
   - [ ] Text readable

---

### **Tablet (768px)**
1. DevTools → Select "iPad"
2. Test same pages
3. Verify layout adapts

---

### **Desktop (1440px)**
1. DevTools → Select "MacBook Pro"
2. Verify full layout works

---

## 🌙 DARK MODE CHECK

**Toggle Dark Mode:**
1. Look for theme toggle (usually top right)
2. Or press keyboard shortcut if available
3. Test each page loads correctly in dark mode:
   - [ ] Login page
   - [ ] Signup pages
   - [ ] Billing dashboard
   - [ ] Policy pages
   - [ ] Text readable
   - [ ] Links visible

---

## 🧪 COMPLETE TEST CHECKLIST

```
AUTH FLOW
[ ] Login page loads
[ ] Signup (Candidate) works
[ ] Signup (Company) works
[ ] Forgot password works
[ ] OTP tab visible

PAYMENT
[ ] Billing dashboard loads
[ ] "Pay Now" button visible
[ ] Payment dialog opens
[ ] Razorpay modal opens
[ ] Test payment completes
[ ] Redirect to success page

DASHBOARDS
[ ] Candidate dashboard loads
[ ] Company dashboard loads
[ ] Admin dashboard loads
[ ] Billing dashboard loads

POLICIES
[ ] /terms loads
[ ] /privacy loads
[ ] /refund-policy loads ✨ NEW
[ ] /payment-policy loads ✨ NEW
[ ] /data-deletion loads ✨ NEW
[ ] /contact loads

RESPONSIVE
[ ] Mobile (375px) works
[ ] Tablet (768px) works
[ ] Desktop (1440px) works

DARK MODE
[ ] All pages work in dark mode
[ ] Text readable
[ ] Colors appropriate

API HEALTH
[ ] /health returns 200
[ ] /payments/health responds
[ ] /payments/provider has razorpay
[ ] /invoices returns data
```

---

## 🐛 COMMON ISSUES & FIXES

### "Razorpay modal doesn't open"
```bash
# Check keys are set
echo $RAZORPAY_KEY_ID
echo $RAZORPAY_KEY_SECRET

# Check health endpoint
curl http://localhost:3001/api/v1/payments/health
# Should show razorpay: true
```

---

### "Payment dialog doesn't show"
```bash
# Check you're logged in
# Check you have a companyId
# Check plans exist in database
```

---

### "Policy pages 404"
```bash
# Check files exist:
ls src/app/\(public\)/refund-policy/page.tsx
ls src/app/\(public\)/payment-policy/page.tsx
ls src/app/\(public\)/data-deletion/page.tsx

# Restart dev server
pnpm dev
```

---

### "Signup doesn't work"
```bash
# Check backend is running
curl http://localhost:3001/health

# Check auth service is running
curl http://localhost:3003/health  # auth-service
```

---

## 📊 VERIFICATION SUMMARY

| Feature | URL | Expected |
|---------|-----|----------|
| Login | `/login` | Email + OTP form |
| Candidate Signup | `/signup/candidate` | Form loads |
| Company Signup | `/signup/company` | Form loads |
| Forgot Password | `/forgot-password` | Email input |
| Dashboard | `/dashboard` | User tasks |
| Company Dashboard | `/company/dashboard` | Company info |
| Billing | `/company/billing` | Invoices + Pay Now |
| Terms | `/terms` | Legal text |
| Privacy | `/privacy` | Privacy text |
| Refund Policy | `/refund-policy` | Refund info ✨ |
| Payment Policy | `/payment-policy` | Payment info ✨ |
| Data Deletion | `/data-deletion` | Deletion info ✨ |

---

## ✅ YOU'RE DONE WHEN:

1. ✅ All auth pages load
2. ✅ Signup works (try creating test account)
3. ✅ Login works with new account
4. ✅ Dashboards load for your role
5. ✅ Billing page shows invoices
6. ✅ Payment dialog opens
7. ✅ Razorpay modal opens (with credentials)
8. ✅ Test payment completes
9. ✅ All 5 policy pages load
10. ✅ Mobile responsive
11. ✅ Dark mode works

**Then you're production-ready!** 🚀
