-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 03, 2026 at 10:14 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `outfitkita2`
--

-- --------------------------------------------------------

--
-- Table structure for table `admins`
--

CREATE TABLE `admins` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `profile_image` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admins`
--

INSERT INTO `admins` (`id`, `name`, `email`, `password`, `created_at`, `updated_at`, `profile_image`) VALUES
(2, 'admin', 'admin@gmail.com', '$2y$10$M2qdONKc5euS8X8jfZhbs.V2pf4oOOjoPfGL8jzKK6V0YOyc.KKwC', '2026-05-06 03:02:22', '2026-05-06 03:17:31', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `guest_session_id` varchar(255) DEFAULT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `selected_size` varchar(20) DEFAULT NULL,
  `selected_color` varchar(50) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `cart`
--

INSERT INTO `cart` (`id`, `user_id`, `guest_session_id`, `product_id`, `quantity`, `selected_size`, `selected_color`, `price`, `created_at`, `updated_at`) VALUES
(73, 9, NULL, 17, 1, 'S', 'Hitam', 200000, '2026-06-23 11:10:07', '2026-06-23 11:10:07');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `category_name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `category_name`, `slug`, `created_at`) VALUES
(14, 'Pria - Hoodie', 'pria---hoodie', '2026-04-22 13:23:07'),
(15, 'Wanita - Kemeja', 'wanita---kemeja', '2026-04-22 13:25:17'),
(16, 'Unisex - Kaos', 'unisex---kaos', '2026-04-22 13:26:01'),
(17, 'Pria - Celana Panjang', 'pria---celana-panjang', '2026-04-27 15:16:31'),
(18, 'Unisex - Kaos', 'pria---unisex---kaos', '2026-04-29 16:08:35'),
(19, 'Unisex - Hoodie', 'unisex---hoodie', '2026-05-01 05:34:23'),
(20, 'Wanita - Dress', 'wanita---dress', '2026-05-06 04:28:45'),
(21, 'Pria - Unisex - Hoodie', 'pria---unisex---hoodie', '2026-05-06 09:38:10');

-- --------------------------------------------------------

--
-- Table structure for table `chat_conversations`
--

CREATE TABLE `chat_conversations` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `admin_id` int(11) DEFAULT NULL,
  `status` enum('active','closed') DEFAULT 'active',
  `last_message_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_conversations`
--

INSERT INTO `chat_conversations` (`id`, `user_id`, `admin_id`, `status`, `last_message_at`, `created_at`, `updated_at`) VALUES
(9, 1, 2, 'active', '2026-05-08 18:44:55', '2026-05-08 18:44:38', '2026-05-08 18:44:55');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` int(11) NOT NULL,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `sender_type` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`id`, `conversation_id`, `sender_id`, `sender_type`, `message`, `is_read`, `created_at`) VALUES
(15, 9, 1, 'customer', 'hai min', 1, '2026-05-08 18:44:41'),
(16, 9, 2, 'admin', 'iya ada kak, ada yg bisa dibantu?', 1, '2026-05-08 18:44:55');

-- --------------------------------------------------------

--
-- Table structure for table `favorites`
--

CREATE TABLE `favorites` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `favorites`
--

INSERT INTO `favorites` (`id`, `user_id`, `product_id`, `created_at`, `updated_at`) VALUES
(7, 1, 14, '2026-05-06 04:49:30', '2026-05-06 04:49:30');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `total_price` decimal(12,2) NOT NULL,
  `status` enum('pending','waiting_confirmation','settlement','processing','shipped','delivered','completed','cancel','cancelled','expire','rejected') DEFAULT 'pending',
  `snap_token` varchar(255) DEFAULT NULL,
  `shipping_address` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `customer_name` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `customer_address` text DEFAULT NULL,
  `customer_city` varchar(100) DEFAULT NULL,
  `customer_zip` varchar(10) DEFAULT NULL,
  `shipping_method` varchar(50) DEFAULT NULL,
  `shipping_cost` int(11) DEFAULT 0,
  `tracking_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payment_proof` varchar(500) DEFAULT NULL,
  `payment_uploaded_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `order_number`, `user_id`, `total_price`, `status`, `snap_token`, `shipping_address`, `created_at`, `customer_name`, `customer_email`, `customer_phone`, `customer_address`, `customer_city`, `customer_zip`, `shipping_method`, `shipping_cost`, `tracking_number`, `notes`, `payment_proof`, `payment_uploaded_at`, `rejection_reason`, `payment_method`) VALUES
(13, 'ORD202604271730126082', 1, 60000.00, 'cancel', NULL, '', '2026-04-27 15:30:12', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/api/index.php/uploads/payment_proofs/proof_13_1777303826_7a320890.jpg', '2026-04-27 15:30:26', NULL, 'BRI'),
(14, 'ORD202604280606051597', 1, 295000.00, 'completed', NULL, '', '2026-04-28 04:06:05', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_14_1777349177_9a26eefa.jpg', '2026-04-28 04:06:17', NULL, 'GoPay'),
(15, 'ORD202604281627002268', 1, 145000.00, 'completed', NULL, '', '2026-04-28 14:27:00', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_15_1777386434_3a282142.jpg', '2026-04-28 14:27:14', NULL, 'GoPay'),
(16, 'ORD202604281637524299', 1, 210000.00, 'completed', NULL, '', '2026-04-28 14:37:52', 'Yoga', 'Yoga@gmail.com', '087799665544', 'Jalan Hiu, No. 14, RT/RW 002/023, Kel. D6, Kec. Pinang Raya', 'Kota Bekasi', '77665', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_16_1777387089_48f29b07.jpg', '2026-04-28 14:38:09', NULL, 'GoPay'),
(17, 'ORD202605010345455239', 1, 145000.00, 'completed', NULL, '', '2026-05-01 01:45:45', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_17_1777599962_4831ef4a.jpg', '2026-05-01 01:46:02', NULL, 'GoPay'),
(19, 'ORD202605011225268741', 1, 100000.00, 'completed', NULL, '', '2026-05-01 10:25:26', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_19_1777631135_4d99c1a2.jpg', '2026-05-01 10:25:35', NULL, 'GoPay'),
(20, 'ORD202605011228357122', 1, 100000.00, 'completed', NULL, '', '2026-05-01 10:28:35', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_20_1777631324_12a11e4e.jpg', '2026-05-01 10:28:44', NULL, 'GoPay'),
(21, 'ORD202605011232495739', 1, 185000.00, 'completed', NULL, '', '2026-05-01 10:32:49', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_21_1777631579_4f1fc011.jpg', '2026-05-01 10:32:59', NULL, 'BRI'),
(22, 'ORD202605042057511125', 1, 60000.00, 'completed', NULL, '', '2026-05-04 18:57:51', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_22_1777921083_5279dfc2.jpg', '2026-05-04 18:58:03', NULL, 'GoPay'),
(23, 'ORD202605060656025837', 1, 145000.00, 'cancel', NULL, '', '2026-05-06 04:56:02', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', NULL, NULL, NULL, 'BRI'),
(24, 'ORD202605060657094909', 1, 210000.00, 'completed', NULL, '', '2026-05-06 04:57:09', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_24_1778043442_0205eba8.jpg', '2026-05-06 04:57:22', NULL, 'GoPay'),
(25, 'ORD202605060822173549', 1, 145000.00, 'completed', NULL, '', '2026-05-06 06:22:17', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_25_1778052899_985115b6.jpg', '2026-05-06 07:34:59', NULL, 'GoPay'),
(26, 'ORD202605071230532242', 1, 100000.00, 'cancel', NULL, '', '2026-05-07 10:30:53', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_26_1778149867_8e26b4d1.jpg', '2026-05-07 10:31:07', NULL, 'GoPay'),
(27, 'ORD202605071238224438', 1, 215000.00, 'cancel', NULL, '', '2026-05-07 10:38:22', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_27_1778150310_09b39f93.jpg', '2026-05-07 10:38:30', NULL, 'GoPay'),
(28, 'ORD202605071246219145', 1, 100000.00, 'cancel', NULL, '', '2026-05-07 10:46:21', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_28_1778150791_7d993030.jpg', '2026-05-07 10:46:31', NULL, 'GoPay'),
(29, 'ORD202605091026506523', 1, 235000.00, 'completed', NULL, '', '2026-05-09 08:26:50', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'express', 35000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_29_1778315220_3be6eeb8.jpg', '2026-05-09 08:27:00', NULL, 'BRI'),
(30, 'ORD202606231330283701', 1, 165000.00, 'cancel', NULL, '', '2026-06-23 11:30:28', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', NULL, NULL, NULL, 'GoPay'),
(31, 'ORD202606251512093646', 1, 165000.00, 'rejected', NULL, '', '2026-06-25 13:12:09', 'Tryansah Maruli Tua', 'ruli@gmail.com', '085709587092', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', '17164', 'standard', 15000, NULL, '', 'http://localhost/OutFitKita3/backend/uploads/payment_proofs/proof_31_1782393140_43508de3.jpg', '2026-06-25 13:12:20', 'Pembayaran Tidak Sesuai', 'GoPay');

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL,
  `price_at_purchase` decimal(12,2) NOT NULL,
  `subtotal` decimal(12,2) NOT NULL,
  `selected_size` varchar(20) DEFAULT NULL,
  `selected_color` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `qty`, `price_at_purchase`, `subtotal`, `selected_size`, `selected_color`) VALUES
(14, 13, 14, 0, 0.00, 0.00, NULL, NULL),
(15, 14, 11, 1, 150000.00, 150000.00, NULL, NULL),
(16, 14, 13, 1, 85000.00, 85000.00, NULL, NULL),
(17, 14, 14, 1, 45000.00, 45000.00, NULL, NULL),
(18, 15, 13, 1, 85000.00, 85000.00, NULL, NULL),
(19, 15, 14, 1, 45000.00, 45000.00, NULL, NULL),
(20, 16, 11, 1, 150000.00, 150000.00, NULL, NULL),
(21, 16, 14, 1, 45000.00, 45000.00, NULL, NULL),
(22, 17, 13, 1, 85000.00, 85000.00, 'S', 'Hitam'),
(23, 17, 14, 1, 45000.00, 45000.00, 'M', 'Chino'),
(25, 19, 13, 1, 85000.00, 85000.00, 'M', 'Hitam'),
(26, 20, 13, 1, 85000.00, 85000.00, 'L', 'Hitam'),
(27, 21, 13, 2, 85000.00, 170000.00, 'L', 'Hitam'),
(28, 22, 14, 1, 45000.00, 45000.00, 'L', 'Abu-Abu'),
(29, 23, 14, 1, 45000.00, 45000.00, 'S', 'Chino'),
(30, 23, 13, 1, 85000.00, 85000.00, 'XL', 'Hitam'),
(31, 24, 11, 1, 150000.00, 150000.00, 'L', 'Abu-Abu'),
(32, 24, 14, 1, 45000.00, 45000.00, 'L', 'Chino'),
(33, 25, 14, 1, 45000.00, 45000.00, 'L', 'Abu-Abu'),
(34, 25, 13, 1, 85000.00, 85000.00, 'L', 'Hitam'),
(35, 26, 14, 1, 85000.00, 85000.00, 'M', 'Khaki'),
(36, 27, 17, 1, 200000.00, 200000.00, 'L', 'Hitam'),
(37, 28, 13, 1, 85000.00, 85000.00, 'L', 'Hitam'),
(38, 29, 17, 1, 200000.00, 200000.00, 'L', 'Hitam'),
(39, 30, 11, 1, 150000.00, 150000.00, 'L', 'Abu-Abu'),
(40, 31, 16, 1, 150000.00, 150000.00, 'All Size', 'Hitam');

-- --------------------------------------------------------

--
-- Table structure for table `payment_settings`
--

CREATE TABLE `payment_settings` (
  `id` int(11) NOT NULL,
  `bank_name` varchar(100) NOT NULL,
  `account_number` varchar(50) NOT NULL,
  `account_holder` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payment_settings`
--

INSERT INTO `payment_settings` (`id`, `bank_name`, `account_number`, `account_holder`, `description`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'GoPay', '085282655014', 'OutFitKita Store', 'Gopay', 1, '2026-04-27 14:04:24', '2026-04-27 14:09:41'),
(2, 'BRI', '51143273864222', 'OutFitKita Store', 'Bank Rakyat Indonesia', 1, '2026-04-27 14:04:24', '2026-04-27 14:10:21');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `sizes` varchar(50) DEFAULT NULL,
  `colors` varchar(500) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `stock`, `sizes`, `colors`, `image_url`, `created_at`) VALUES
(11, 19, 'Sweeter Abu', 'sweeter-abu-1776864187', 'Sweeters berwarna abu-abu tersedia ukuran S-XL', 150000.00, 25, 'S,XL,M,L', 'Abu-Abu', 'http://localhost/OutFitKita3/backend/uploads/1776864169_19deae767ded067c.jpg', '2026-04-22 13:23:07'),
(13, 18, 'Kaos Oversize Polos', 'kaos-hitam-1776864361', 'Kaos Hitam Oversize', 85000.00, 33, 'M,L,S,XL', 'Hitam', 'http://localhost/OutFitKita3/backend/uploads/1776864340_1f34f727561dfdcf.jpg', '2026-04-22 13:26:01'),
(14, 17, 'Celana Panjang Kargo', 'celana-kargo-1777302991', 'Tampil kasual dan tetap fungsional dengan Celana Panjang Kargo yang dirancang untuk gaya aktif dan modern. Memiliki desain loose fit dengan banyak kantong khas kargo, celana ini tidak hanya stylish tapi juga praktis untuk membawa barang kecil saat beraktivitas.\\n\\nWarna netral yang versatile membuatnya mudah dipadukan dengan berbagai atasan seperti hoodie, kaos, maupun jaket. Cocok digunakan untuk kegiatan sehari-hari, traveling, hingga streetwear outfit.\\n\\nDetail Produk:\\n\\nNama: Celana Panjang Kargo\\nWarna: Khaki (cream/coklat muda)\\nModel: Loose fit / baggy\\nBahan: Cotton twill (kuat, nyaman, dan breathable)\\nKantong samping besar (cargo pockets)\\nPinggang elastis + tali (nyaman & fleksibel)\\nJahitan rapi dan kuat\\n\\nUkuran Tersedia:\\n\\nS → Lingkar pinggang: 68–76 cm | Panjang: 95 cm\\nM → Lingkar pinggang: 72–80 cm | Panjang: 98 cm\\nL → Lingkar pinggang: 76–86 cm | Panjang: 101 cm\\nXL → Lingkar pinggang: 80–92 cm | Panjang: 104 cm\\n\\n(Toleransi ukuran ±2–3 cm)\\n\\nCelana ini cocok untuk kamu yang ingin tampil santai, trendy, dan tetap nyaman di berbagai aktivitas.', 85000.00, 31, 'M,S,L,XL', 'Khaki', 'http://localhost/OutFitKita3/backend/uploads/1777302967_8064849affddb7a9.jpg', '2026-04-27 15:16:31'),
(16, 20, 'Dress Bunga-Bunga', 'dress-bunga-bunga-1778041725', 'Tampil anggun dan feminin dengan Dress Bunga-Bunga berwarna hitam yang dipadukan dengan motif floral cantik. Desainnya yang elegan dengan detail tali pita di bagian bahu memberikan sentuhan manis sekaligus stylish, cocok digunakan untuk berbagai kesempatan seperti hangout, dinner, hingga acara semi-formal.\\n\\nPotongan dress yang mengikuti bentuk tubuh dengan detail ruffle di bagian bawah menciptakan siluet yang menawan dan modern. Materialnya ringan dan nyaman dipakai, sehingga tetap terasa adem meskipun digunakan dalam waktu lama.\\n\\nDetail Produk:\\n\\nNama: Dress Bunga-Bunga\\nWarna: Hitam (motif floral)\\nUkuran: All Size (fit to M/L)\\nModel: Slim fit dengan aksen ruffle bawah\\nTali bahu model pita (adjustable)\\nBahan: Polyester premium (ringan & tidak mudah kusut)\\nNyaman digunakan untuk berbagai aktivitas\\n\\nUkuran:\\n\\nLingkar dada: 80 – 95 cm\\nLingkar pinggang: 65 – 80 cm\\nPanjang dress: ±85 cm\\n\\n(Toleransi ukuran ±2–3 cm)\\n\\nDress ini cocok untuk kamu yang ingin tampil simple namun tetap terlihat chic dan fashionable di setiap momen.', 150000.00, 19, 'All Size', 'Hitam', 'http://localhost/OutFitKita3/backend/uploads/1778041563_8e553673f5038487.jpg', '2026-05-06 04:28:45'),
(17, 19, 'Hoodie Erigo Polos', 'hoodie-erigo-polos-1778058325', 'Tampil simpel tapi tetap stylish dengan Hoodie Erigo Polos. Didesain dengan konsep minimalis tanpa motif, hoodie ini cocok dipadukan dengan berbagai outfit—mulai dari gaya santai hingga streetwear. Warna hitam pekat memberikan kesan elegan dan mudah dipakai di berbagai kesempatan.\\n\\nDibuat dari bahan berkualitas yang lembut dan nyaman di kulit, hoodie ini juga memiliki potongan relaxed fit yang memberikan ruang gerak lebih serta cocok digunakan seharian. Dilengkapi dengan kantong depan (kangaroo pocket) dan hoodie penutup kepala untuk menambah fungsi dan gaya.\\n\\nDetail Produk:\\n\\nModel: Hoodie polos (tanpa sablon)\\nWarna: Hitam\\nBahan: Cotton fleece premium (hangat & breathable)\\nKantong depan\\nJahitan rapi & kuat\\nNyaman untuk harian, hangout, hingga traveling\\n\\nUkuran Tersedia:\\n\\nS → Lebar dada: 50 cm | Panjang: 65 cm\\nM → Lebar dada: 53 cm | Panjang: 68 cm\\nL → Lebar dada: 56 cm | Panjang: 71 cm\\nXL → Lebar dada: 59 cm | Panjang: 74 cm\\n\\n(Toleransi ukuran ±1–2 cm)\\n\\nHoodie ini cocok untuk kamu yang suka tampil clean, effortless, dan tetap fashionable di segala suasana.', 200000.00, 4, 'S,XL,M,L', 'Hitam', 'http://localhost/OutFitKita3/backend/uploads/1778058033_688c87c184b2a9fb.jpg', '2026-05-06 09:05:25');

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `size` varchar(20) NOT NULL,
  `color` varchar(50) NOT NULL,
  `stock` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `size`, `color`, `stock`, `created_at`, `updated_at`) VALUES
(2, 13, 'M', 'Hitam', 9, '2026-04-29 16:08:35', '2026-05-01 10:25:26'),
(3, 13, 'L', 'Hitam', 6, '2026-04-29 16:08:35', '2026-05-07 10:47:00'),
(4, 13, 'S', 'Hitam', 14, '2026-04-29 16:08:35', '2026-05-01 01:45:45'),
(5, 13, 'XL', 'Hitam', 4, '2026-04-29 16:08:35', '2026-05-06 04:56:02'),
(6, 11, 'S', 'Abu-Abu', 10, '2026-05-01 05:34:23', '2026-05-01 05:34:23'),
(7, 11, 'XL', 'Abu-Abu', 8, '2026-05-01 05:34:23', '2026-05-01 05:34:23'),
(8, 11, 'M', 'Abu-Abu', 4, '2026-05-01 05:34:23', '2026-05-01 05:34:23'),
(9, 11, 'L', 'Abu-Abu', 3, '2026-05-01 05:34:23', '2026-06-25 13:00:26'),
(31, 16, 'All Size', 'Hitam', 19, '2026-05-06 09:46:06', '2026-06-25 13:12:52'),
(39, 14, 'S', 'Khaki', 14, '2026-05-06 09:52:26', '2026-05-06 09:52:26'),
(40, 14, 'M', 'Khaki', 9, '2026-05-06 09:52:26', '2026-05-07 10:30:53'),
(41, 14, 'L', 'Khaki', 5, '2026-05-06 09:52:26', '2026-05-06 09:52:26'),
(42, 14, 'XL', 'Khaki', 3, '2026-05-06 09:52:26', '2026-05-06 09:52:26'),
(43, 17, 'S', 'Hitam', 3, '2026-05-06 10:09:48', '2026-05-06 10:09:48'),
(44, 17, 'M', 'Hitam', 0, '2026-05-06 10:09:48', '2026-05-06 10:09:48'),
(45, 17, 'L', 'Hitam', 0, '2026-05-06 10:09:48', '2026-05-09 08:26:50'),
(46, 17, 'XL', 'Hitam', 1, '2026-05-06 10:09:48', '2026-05-06 10:09:48');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `order_id` varchar(100) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `review` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `order_id`, `rating`, `review`, `created_at`) VALUES
(1, 14, 1, '25', 5, 'Bahannya Sejuk Banget', '2026-05-06 08:29:51'),
(2, 13, 1, '25', 5, 'Bahan Berkualitas top', '2026-05-06 08:30:12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','customer') DEFAULT 'customer',
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `username`, `password`, `role`, `phone`, `profile_image`, `created_at`, `updated_at`) VALUES
(1, 'Tryansah Maruli Tua', 'ruli@gmail.com', 'ruliaje', '$2y$10$Qi03njsiCPrY2.WLoJ0v1OQzr1F//wERjrxgrrIis4HfGhJK2ph3S', 'customer', '085709587092', 'http://localhost/OutFitKita3/backend/uploads/1776782708_374d3393d4995ba3.jpg', '2026-04-20 20:16:43', '2026-04-28 04:00:53'),
(7, 'Wahyu Nugroho', 'nugroho@gmail.com', 'nugroho2691', '$2y$10$OQJvGEOPUEAR0nV0iY.78O3AsOTl3Zyc88uW9q14OfR7eNms6aUvu', 'customer', '08123456789', NULL, '2026-05-01 16:20:20', '2026-05-01 16:21:30'),
(8, 'Tryansah Maruli Tua', 'ruligamerz6@gmail.com', 'ruligamerz65732', '$2y$10$chG4WP90WQyZMmGL6QXJa.vD00gMlm19HLPq48FAZKm3a.QUs1iwe', 'customer', NULL, NULL, '2026-06-19 03:04:43', '2026-06-19 03:04:43'),
(9, 'Rhabeca Fetrylia', 'fetrylia@gmail.com', 'fetrylia9878', '$2y$10$/g6mmiA5uYWIlf9XnNV6MulGxnEEK91gKIlGoCWd/9fCoEycrTaba', 'customer', NULL, NULL, '2026-06-19 03:59:59', '2026-06-19 03:59:59');

-- --------------------------------------------------------

--
-- Table structure for table `user_addresses`
--

CREATE TABLE `user_addresses` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `recipient_name` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `province` varchar(100) NOT NULL,
  `zipCode` varchar(10) NOT NULL,
  `label` varchar(50) DEFAULT 'Rumah',
  `is_default` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_addresses`
--

INSERT INTO `user_addresses` (`id`, `user_id`, `recipient_name`, `address`, `city`, `province`, `zipCode`, `label`, `is_default`, `created_at`, `updated_at`) VALUES
(1, 1, 'Tryansah Maruli Tua', 'Jalan Raya Pekayon, No. 32A, RT/RW 002/020, Kel. Pakayon Jaya, Kec. Bekasi Selatan', 'Kota Bekasi', 'Jawa Barat', '17164', 'Rumah', 1, '2026-04-20 20:16:43', '2026-04-25 08:11:17'),
(3, 7, 'Wahyu Nugroho', 'Jl. Pasar Tambun, No. 30, RT/RW 002/023, Kel. Tambun Utara, Kec. Tambun', 'Bekasi', 'Jawa Barat', '11223', 'Rumah', 1, '2026-05-01 16:23:25', '2026-05-01 16:23:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admins`
--
ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cart` (`user_id`,`product_id`,`guest_session_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_admin` (`admin_id`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_last_message` (`last_message_at`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conversation` (`conversation_id`),
  ADD KEY `idx_sender` (`sender_id`),
  ADD KEY `idx_read` (`is_read`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  ADD KEY `idx_user` (`user_id`),
  ADD KEY `idx_product` (`product_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `order_number` (`order_number`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `order_id` (`order_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `payment_settings`
--
ALTER TABLE `payment_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_is_active` (`is_active`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_variant` (`product_id`,`size`,`color`),
  ADD KEY `idx_product` (`product_id`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_review` (`product_id`,`user_id`,`order_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_default` (`is_default`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admins`
--
ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=76;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `favorites`
--
ALTER TABLE `favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `payment_settings`
--
ALTER TABLE `payment_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `user_addresses`
--
ALTER TABLE `user_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_conversations`
--
ALTER TABLE `chat_conversations`
  ADD CONSTRAINT `chat_conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `chat_conversations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `favorites_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `favorites_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_addresses`
--
ALTER TABLE `user_addresses`
  ADD CONSTRAINT `user_addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
