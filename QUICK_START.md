# 🚀 Quick Start Guide - Gmail SMTP Integration

## ⚡ Setup dalam 5 Menit

### **1️⃣ Generate Gmail App Password (2 menit)**

1. Buka: https://myaccount.google.com/security
2. Aktifkan **2-Step Verification** (jika belum)
3. Klik **App passwords** → Mail → Other (ketik "OutFitKita")
4. **Copy 16-digit password** (contoh: `abcd efgh ijkl mnop`)

### **2️⃣ Update .env File (1 menit)**

Edit `backend/.env`:

```env
GMAIL_USERNAME=your-email@gmail.com
GMAIL_PASSWORD=abcdefghijklmnop
```

**Penting:** Hapus spasi dari App Password!

### **3️⃣ Verify Setup (2 menit)**

Akses: `http://localhost/ecommerce/backend/test_email.php`

- Masukkan email Anda
- Klik "Send Test Email"
- Cek inbox

---

## 📋 Files & Folders

```
backend/
├── libs/EmailHelper.php          ← Gmail SMTP class
├── test_email.php                ← Test script
├── .env                          ← Update dengan credentials
├── composer.json                 ← Dependency config
└── vendor/                       ← PHPMailer (auto)
```

---

## 🔗 Links

| Link | Purpose |
|------|---------|
| http://localhost/ecommerce/backend/test_email.php | Test email sending |
| https://myaccount.google.com/security | Get App Password |
| https://outfitkita.my.id/forgot-password | Forgot password page |

---

## ✅ Testing Forgot Password

1. Buka: https://outfitkita.my.id/forgot-password
2. Masukkan email terdaftar
3. Klik "Kirim Link Reset Password"
4. Cek email Anda
5. Klik link reset
6. Set password baru

---

## ❌ Jika Email Tidak Terkirim

```
Error: "Username and Password not accepted"
→ Gunakan App Password (16 digit), bukan password Gmail
→ Pastikan 2FA aktif

Error: "Email configuration not set"
→ Update GMAIL_USERNAME dan GMAIL_PASSWORD di .env
→ Restart Apache

Connection timeout
→ Coba port 465 (SSL) instead of 587
```

---

## 📚 Documentation Files

- **GMAIL_SMTP_SETUP.md** - Setup guide lengkap
- **GMAIL_SMTP_SUMMARY.md** - Summary & features
- **FORGOT_PASSWORD_FEATURE.md** - Forgot password feature
- **QUICK_START.md** - This file

---

## 🎯 Done!

Gmail SMTP sudah siap! 🎉

Enjoy! 📧✨
