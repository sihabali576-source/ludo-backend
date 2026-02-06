-- ==========================================
-- PRODUCTION DATABASE SCHEMA FOR LUDO PLATFORM
-- ==========================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+06:00";

-- 1. USER & AUTH
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `uuid` VARCHAR(36) NOT NULL UNIQUE,
  `mobile` VARCHAR(15) NOT NULL UNIQUE,
  `email` VARCHAR(100),
  `password_hash` VARCHAR(255) NOT NULL,
  `name` VARCHAR(100),
  `avatar` VARCHAR(255),
  `role` ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
  `status` ENUM('active', 'banned', 'suspended') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `user_profiles` (
  `user_id` INT PRIMARY KEY,
  `kyc_status` ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  `country` VARCHAR(50),
  `device_id` VARCHAR(100),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

-- 2. WALLET SYSTEM (Double Entry Ledger)
CREATE TABLE `wallets` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `balance_main` DECIMAL(15, 2) DEFAULT 0.00,
  `balance_bonus` DECIMAL(15, 2) DEFAULT 0.00,
  `balance_locked` DECIMAL(15, 2) DEFAULT 0.00,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE TABLE `wallet_transactions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('deposit', 'withdraw', 'bet_entry', 'winning', 'refund', 'bonus', 'penalty') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `balance_before` DECIMAL(15, 2) NOT NULL,
  `balance_after` DECIMAL(15, 2) NOT NULL,
  `source` VARCHAR(50) DEFAULT 'system', -- 'bkash', 'nagad', 'game_win'
  `status` ENUM('pending', 'success', 'failed', 'reversed') DEFAULT 'success',
  `trx_id` VARCHAR(100) UNIQUE, -- External TrxID
  `ref_id` VARCHAR(100), -- Internal Reference
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

CREATE TABLE `ledger_entries` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `transaction_id` BIGINT NOT NULL,
  `account_code` VARCHAR(20) NOT NULL, -- e.g., 'ASSET_CASH', 'LIABILITY_USER'
  `debit` DECIMAL(15, 2) DEFAULT 0.00,
  `credit` DECIMAL(15, 2) DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`transaction_id`) REFERENCES `wallet_transactions`(`id`)
);

-- 3. GAME & MATCHMAKING
CREATE TABLE `game_rooms` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_code` VARCHAR(10) UNIQUE,
  `creator_id` INT,
  `bet_amount` DECIMAL(10, 2) NOT NULL,
  `player_count` INT DEFAULT 2,
  `status` ENUM('waiting', 'playing', 'finished', 'abandoned') DEFAULT 'waiting',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `game_participants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `user_id` INT,
  `color` ENUM('red', 'green', 'yellow', 'blue'),
  `is_bot` BOOLEAN DEFAULT 0,
  `final_position` INT, -- 1, 2, 3, 4
  FOREIGN KEY (`room_id`) REFERENCES `game_rooms`(`id`)
);

CREATE TABLE `game_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `room_id` INT NOT NULL,
  `event_type` VARCHAR(50), -- 'ROLL_DICE', 'MOVE_TOKEN', 'KILL', 'WIN'
  `user_id` INT,
  `data` JSON, -- Stores dice value, move details
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. DEPOSIT & WITHDRAW
CREATE TABLE `payment_requests` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `type` ENUM('deposit', 'withdraw') NOT NULL,
  `method` ENUM('bkash', 'nagad', 'rocket') NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `sender_number` VARCHAR(20),
  `trx_id` VARCHAR(100),
  `screenshot` VARCHAR(255),
  `admin_note` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `processed_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- 5. ADMIN & SECURITY
CREATE TABLE `admin_activity_logs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `action` VARCHAR(50) NOT NULL, -- 'LOGIN', 'APPROVE_DEPOSIT', 'BAN_USER'
  `target_user_id` INT,
  `details` JSON,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `fraud_alerts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT,
  `alert_type` VARCHAR(50),
  `severity` ENUM('low', 'medium', 'high'),
  `description` TEXT,
  `is_resolved` BOOLEAN DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
