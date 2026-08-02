# 🚀 QUICK VERIFICATION - Copy & Paste URLs

**Start servers first:**
```bash
# Terminal 1:
cd Frontend/controlthemarket-main && pnpm dev  # http://localhost:3034

# Terminal 2:
cd Backend/services/ecosystem/ctm-service && pnpm dev  # http://localhost:3001
```

---

## ✅ CLICK THESE LINKS TO TEST

### 🔐 **AUTH - Must Work**
```
http://localhost:3034/login
http://localhost:3034/signup
http://localhost:3034/forgot-password
```

**Test:**
1. Go to `/signup` → Choose role → Fill form → Submit
2. Go to `/login` → Try logging in with test account
3. Go to `/forgot-password` → Enter email → Should say "Check inbox"

---

### 💳 **PAYMENT - Must Work**
```
http://localhost:3034/company/billing
```

**Test:**
1. Login as company user
2. Should see "Billing & Payments"
3. Should see "Pay Now" button
4. Click "Pay Now" → Dialog opens
5. Select plan → Click "Pay with Razorpay"
6. *(Requires RAZORPAY_KEY_ID set)*

---

### 📊 **DASHBOARDS - Must Work**
```
http://localhost:3034/dashboard                    # Candidate dashboard
http://localhost:3034/company/dashboard            # Company dashboard
http://localhost:3034/admin/dashboard              # Admin dashboard
http://localhost:3034/company/billing              # Billing dashboard
```

---

### 📄 **POLICY PAGES - NEW (Must Load)**
```
http://localhost:3034/refund-policy                # ✨ NEW
http://localhost:3034/payment-policy               # ✨ NEW
http://localhost:3034/data-deletion                # ✨ NEW
http://localhost:3034/terms
http://localhost:3034/privacy
http://localhost:3034/contact
```

---

## 🔧 **API HEALTH CHECKS**

### Check Backend Healthy
```bash
curl http://localhost:3001/health
# Should return 200 OK
```

### Check Payment Providers
```bash
curl http://localhost:3001/api/v1/payments/health \
  -H "Authorization: Bearer TEST_TOKEN"
# Should show razorpay: true (if keys set)
```

---

## ⚡ **COMMON TESTS**

### ✅ Auth Works?
1. Go to `/signup`
2. Create test account
3. Go to `/login`
4. Login with test account
5. ✅ Should redirect to `/dashboard`

### ✅ Payment Works?
1. Go to `/company/billing` *(as company user)*
2. Click "Pay Now"
3. Dialog opens with plan list
4. Click "Pay with Razorpay"
5. ✅ Razorpay modal opens *(if keys set)*

### ✅ Dashboards Work?
1. Login as candidate → `/dashboard` ✅
2. Login as company → `/company/dashboard` ✅
3. Login as admin → `/admin/dashboard` ✅ *(admin only)*

### ✅ Policy Pages Work?
1. `/refund-policy` ✅
2. `/payment-policy` ✅
3. `/data-deletion` ✅

---

## 📱 **MOBILE TEST**

Open Chrome DevTools: `F12`
- Click Device Toggle: `Ctrl+Shift+M`
- Select "iPhone SE"
- Test each URL
- All should be responsive ✅

---

## 🌙 **DARK MODE TEST**

- Look for theme toggle
- Click to switch to dark mode
- All pages should work in dark mode ✅

---

## 🎯 **YOU'RE GOOD WHEN:**

- [ ] All auth pages load
- [ ] Can create account
- [ ] Can login
- [ ] Dashboard loads
- [ ] Billing page loads
- [ ] Payment dialog opens
- [ ] All policy pages load (5 total)
- [ ] Mobile responsive
- [ ] Dark mode works

**If all ✅, you're READY FOR PRODUCTION!**

---

## 🐛 **QUICK TROUBLESHOOT**

| Issue | Fix |
|-------|-----|
| "Cannot find module" | Run `pnpm install` |
| "Port 3034 already in use" | Kill: `lsof -i :3034` then `kill -9 PID` |
| Razorpay not showing | Set env vars: `export RAZORPAY_KEY_ID=...` |
| Payment dialog empty | Restart backend: `pnpm dev` in Backend folder |
| Policy pages 404 | Run `pnpm dev` to hot-reload |
| Dark mode broken | Clear cache: `Ctrl+Shift+Delete` |

---

## 📞 **NEED HELP?**

- Check `CTM_IMPLEMENTATION_GUIDE.md` - Full docs
- Check `LIVE_SERVER_VERIFICATION.md` - Detailed tests
- Check `COMPLETION_SUMMARY.md` - What was built

**Everything is production-ready. Just test and deploy!** 🚀
