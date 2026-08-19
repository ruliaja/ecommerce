# 📧 Gmail SMTP Integration - OutFitKita

## ✅ Implementasi Selesai!

Fitur pengiriman email reset password menggunakan **Gmail SMTP** telah berhasil diintegrasikan ke aplikasi OutFitKita.

---

## 📋 Yang Sudah Dibuat

### **1. Backend Files**
- ✅ `backend/libs/EmailHelper.php` - Helper class untuk mengirim email via Gmail SMTP
- ✅ `backend/composer.json` - Dependency management untuk PHPMailer
- ✅ `backend/config/email.php` - Konfigurasi email (opsional)
- ✅ `backend/.env` - Environment variables untuk Gmail credentials
- ✅ `backend/.env.example` - Template untuk environment variables
- ✅ `backend/modules/auth.php` - Updated untuk menggunakan EmailHelper

### **2. Dependencies**
- ✅ PHPMailer v6.12.0 - Installed via Composer

---

## 🚀 Cara Setup Gmail SMTP

### **Step 1: Buat App Password di Gmail**

Gmail tidak mengizinkan login dengan password biasa untuk aplikasi pihak ketiga. Anda harus membuat **App Password**.

**Langkah-langkah:**

1. **Login ke akun Gmail** yang akan digunakan untuk mengirim email
2. Buka **Google Account Settings**: https://myaccount.google.com/
3. Pilih **Security** di menu kiri
4. **Aktifkan 2-Step Verification** jika belum aktif:
   - Scroll ke bawah ke section "How you sign in to Google"
   - Klik "2-Step Verification"
   - Follow petunjuk untuk mengaktifkan
5. **Buat App Password** setelah 2FA aktif:
   - Kembali ke Security page
   - Scroll ke bawah ke section "How you sign in to Google"
   - Klik "App passwords" (atau "2-Step Verification" → "App passwords")
   - Pilih "Select app" → **Mail**
   - Pilih "Select device" → **Other** (masukkan "OutFitKita")
   - Klik **Generate**
   - **Salin 16-digit password** yang muncul (contoh: `abcd efgh ijkl mnop`)

### **Step 2: Update File .env**

Buka file `backend/.env` dan update dengan credentials Gmail Anda:

```env
# Gmail SMTP Configuration
GMAIL_USERNAME=your-email@gmail.com
GMAIL_PASSWORD=abcdefghijklmnop  # 16-digit App Password (tanpa spasi)
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_ENCRYPTION=tls

# Base URL
BASE_URL=https://outfitkita.my.id
API_URL=https://outfitkita.my.id/api
```

**Penting:**
- Gunakan **App Password** (16 digit), bukan password Gmail biasa
- Hapus semua spasi dari App Password
- Jangan commit file `.env` ke Git (sudah ada di .gitignore)

### **Step 3: Test Email Functionality**

Test dengan melakukan forgot password:

1. Buka: https://outfitkita.my.id/forgot-password
2. Masukkan email yang terdaftar
3. Klik "Kirim Link Reset Password"
4. Cek inbox email (atau folder spam)

---

## 🔧 Konfigurasi

### **Port Options**

Anda bisa menggunakan 2 port berbeda:

| Port | Encryption | Description |
|------|------------|-------------|
| 587  | TLS        | Recommended (STARTTLS) |
| 465  | SSL        | Legacy (SMTPS) |

Untuk mengganti port, edit file `.env`:

```env
# Untuk Port 587 (TLS) - Recommended
GMAIL_SMTP_PORT=587
GMAIL_ENCRYPTION=tls

# Atau untuk Port 465 (SSL)
GMAIL_SMTP_PORT=465
GMAIL_ENCRYPTION=ssl
```

### **Custom Base URL**

Jika Anda menggunakan domain berbeda atau environment development:

```env
# Production
BASE_URL=https://outfitkita.my.id

# Development
BASE_URL=http://localhost:5173
```

---

## 📧 Email Template

Email yang dikirim memiliki fitur:

- ✨ **HTML Template** dengan design modern
- 🎨 **Gradient Button** untuk reset password
- 📱 **Responsive Design**
- ⏰ **Informasi expiry time** (1 jam)
- 🔒 **Security notice**
- 📋 **Plain text fallback** (untuk email client yang tidak support HTML)

---

## 🛠️ Troubleshooting

### 1. **Email tidak terkirim / Error "Username and Password not accepted"**

**Penyebab:**
- App Password salah
- 2-Step Verification belum aktif
- Menggunakan password Gmail biasa

**Solusi:**
- Pastikan 2FA sudah aktif di akun Gmail
- Generate ulang App Password
- Copy App Password tanpa spasi
- Update file `.env` dengan App Password yang baru

### 2. **Error "Could not authenticate"**

**Penyebab:**
- Gmail credentials tidak valid
- Port atau encryption salah

**Solusi:**
```env
# Pastikan konfigurasi benar:
GMAIL_USERNAME=your-email@gmail.com  # Email lengkap
GMAIL_PASSWORD=abcdefghijklmnop      # App Password 16 digit
GMAIL_SMTP_HOST=smtp.gmail.com
GMAIL_SMTP_PORT=587
GMAIL_ENCRYPTION=tls
```

### 3. **Error "Email configuration not set"**

**Penyebab:**
- File `.env` tidak ada atau tidak terbaca
- GMAIL_USERNAME atau GMAIL_PASSWORD kosong

**Solusi:**
- Pastikan file `backend/.env` exists
- Pastikan GMAIL_USERNAME dan GMAIL_PASSWORD sudah diisi
- Restart web server (Apache/Nginx)

### 4. **Email masuk ke Spam**

**Penyebab:**
- Email baru / belum ada reputation
- Domain tidak ada SPF/DKIM records

**Solusi:**
- Minta penerima untuk mark email sebagai "Not Spam"
- Setup SPF dan DKIM records di domain DNS settings
- Gunakan domain email yang sudah verified

### 5. **Timeout / Connection Error**

**Penyebab:**
- Firewall blocking port 587/465
- SSL/TLS certificate issue

**Solusi:**
- Pastikan port 587 atau 465 tidak diblock oleh firewall
- Coba ganti port dari 587 ke 465 (atau sebaliknya)
- Pastikan PHP OpenSSL extension aktif

---

## 🔒 Security Best Practices

1. **Jangan commit `.env` file** ke Git repository
   - File `.env` sudah ada di `.gitignore`
   - Gunakan `.env.example` sebagai template

2. **Gunakan App Password**, bukan password Gmail biasa
   - App Password bisa direvoke kapan saja
   - Lebih aman untuk aplikasi pihak ketiga

3. **Limit rate** email yang dikirim
   - Gmail limit: 500 emails/day untuk akun gratis
   - Tambahkan rate limiting jika diperlukan

4. **Monitor Gmail account**
   - Check suspicious activity di https://myaccount.google.com/security
   - Review app passwords yang aktif

---

## 📊 Gmail Sending Limits

| Account Type | Daily Limit | Per Minute |
|--------------|-------------|------------|
| Free Gmail   | 500 emails  | ~20 emails |
| Google Workspace | 2,000 emails | ~30 emails |

Untuk high-volume email, pertimbangkan:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (pay-as-you-go)

---

## 🧪 Testing

### **Test di Development**

Jika email gagal terkirim, akan ada `debug_token` di response API:

```json
{
  "status": "success",
  "message": "Link reset password telah dikirim ke email Anda",
  "debug_token": "abc123..."
}
```

Gunakan token tersebut untuk testing:
```
http://localhost:5173/reset-password?token=abc123...
```

### **Test Email Sending**

Buat file test sederhana `backend/test_email.php`:

```php
<?php
require_once 'libs/EmailHelper.php';

$emailHelper = new EmailHelper();
$result = $emailHelper->send(
    'test@example.com',
    'Test User',
    'Test Email',
    '<h1>Test Email dari OutFitKita</h1><p>Jika Anda menerima email ini, konfigurasi Gmail SMTP berhasil!</p>',
    'Test Email dari OutFitKita'
);

echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

Akses: `http://localhost/ecommerce/backend/test_email.php`

---

## 📁 File Structure

```
backend/
├── libs/
│   └── EmailHelper.php          # Gmail SMTP helper class
├── config/
│   └── email.php                # Email configuration (opsional)
├── modules/
│   └── auth.php                 # Updated dengan EmailHelper
├── vendor/                      # PHPMailer library (auto-generated)
│   └── phpmailer/
├── .env                         # Environment variables (JANGAN COMMIT!)
├── .env.example                 # Template untuk .env
├── composer.json                # Dependencies
└── composer.lock                # Lock file (auto-generated)
```

---

## ✅ Checklist Setup

- [ ] Aktifkan 2-Step Verification di Gmail
- [ ] Generate App Password di Gmail
- [ ] Update file `backend/.env` dengan Gmail credentials
- [ ] Pastikan PHPMailer sudah terinstall (`composer install`)
- [ ] Test forgot password functionality
- [ ] Cek inbox email untuk reset password email
- [ ] Verify link reset password berfungsi

---

## 🎉 Done!

Fitur Gmail SMTP untuk reset password sudah siap digunakan!

**Support:**
- PHPMailer Docs: https://github.com/PHPMailer/PHPMailer
- Gmail App Passwords: https://support.google.com/accounts/answer/185833
- Gmail SMTP Settings: https://support.google.com/mail/answer/7126229

**File yang dimodifikasi:**
1. `backend/libs/EmailHelper.php` (NEW)
2. `backend/composer.json` (NEW)
3. `backend/.env` (UPDATED)
4. `backend/.env.example` (NEW)
5. `backend/modules/auth.php` (UPDATED)

🚀 **Happy Coding!**
