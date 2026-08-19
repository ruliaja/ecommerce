-- SQL Query untuk menambahkan kolom reset password ke tabel users
-- Jalankan query ini di phpMyAdmin atau MySQL client Anda

ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL DEFAULT NULL AFTER password;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL AFTER reset_token;

-- Opsional: Tambahkan index untuk performa query
CREATE INDEX idx_reset_token ON users(reset_token);
