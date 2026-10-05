-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 09, 2023 at 06:14 AM
-- Server version: 10.6.14-MariaDB-cll-lve
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u945162271_web_story`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `password` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`id`, `user_id`, `password`) VALUES
(2, 'weareloyaldeveloper@', '6b4f9e12ea9c28a1a81d1077cfc2e3cd');

-- --------------------------------------------------------

--
-- Table structure for table `category`
--

CREATE TABLE `category` (
  `cat_id` int(11) NOT NULL,
  `cat_name` text NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `category`
--

INSERT INTO `category` (`cat_id`, `cat_name`, `added_date`, `updated_date`) VALUES
(1, 'entertainment', '2023-02-18 17:49:14', '2023-02-18 17:49:14'),
(2, 'lifestyle', '2023-02-18 17:49:36', '2023-02-18 17:49:36'),
(3, 'technology', '2023-02-18 17:49:52', '2023-02-18 17:49:52'),
(4, 'sports', '2023-02-18 17:50:08', '2023-02-18 17:50:08');

-- --------------------------------------------------------

--
-- Table structure for table `comment`
--

CREATE TABLE `comment` (
  `comment_id` int(11) NOT NULL,
  `commenter_name` varchar(11) NOT NULL,
  `comment_userid` text NOT NULL,
  `comment_page` text NOT NULL,
  `comment_txt` text NOT NULL,
  `comment_approve` varchar(11) NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meta`
--

CREATE TABLE `meta` (
  `meta_id` int(11) NOT NULL,
  `page_url` text NOT NULL,
  `meta_title` text NOT NULL,
  `meta_desc` text NOT NULL,
  `added_date` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_date` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `post`
--

CREATE TABLE `post` (
  `post_id` int(11) NOT NULL,
  `cat_id` int(11) NOT NULL,
  `sub_cat_id` int(11) NOT NULL,
  `post_title` text NOT NULL,
  `uri` text NOT NULL,
  `post_img` text NOT NULL,
  `post_alt_title` varchar(100) NOT NULL,
  `post_desc` text NOT NULL,
  `posted_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `post_updated` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `post`
--

INSERT INTO `post` (`post_id`, `cat_id`, `sub_cat_id`, `post_title`, `uri`, `post_img`, `post_alt_title`, `post_desc`, `posted_date`, `post_updated`) VALUES
(1, 1, 1, 'this super hack will prevent milk from boiling over', 'testing', 'post.png', 'testing', '<p>testing</p>\r\n', '2023-02-18 20:11:48', '2023-02-18 17:58:07');

-- --------------------------------------------------------

--
-- Table structure for table `quots`
--

CREATE TABLE `quots` (
  `quot_id` int(11) NOT NULL,
  `page_url` text NOT NULL,
  `quot_title` text NOT NULL,
  `quot_txt` text NOT NULL,
  `quot_by` text NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `update_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `register`
--

CREATE TABLE `register` (
  `sl_no` int(11) NOT NULL,
  `user_name` varchar(50) NOT NULL,
  `user_id` text NOT NULL,
  `user_pass` text NOT NULL,
  `verify` text DEFAULT NULL,
  `user_fav_topic` varchar(50) NOT NULL,
  `user_location` text NOT NULL,
  `user_about` text NOT NULL,
  `user_profile_pic` text NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscribe`
--

CREATE TABLE `subscribe` (
  `subscriber_id` int(11) NOT NULL,
  `subscriber_email` text NOT NULL,
  `subscribe_page` text NOT NULL,
  `status` varchar(10) NOT NULL,
  `subscribe_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sub_category`
--

CREATE TABLE `sub_category` (
  `sub_cat_id` int(11) NOT NULL,
  `cat_id` int(11) NOT NULL,
  `sub_cat_name` text NOT NULL,
  `sub_cat_desc` text NOT NULL,
  `author_name` varchar(50) NOT NULL,
  `author_img` text NOT NULL,
  `tags` text NOT NULL,
  `cookie` text NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sub_category`
--

INSERT INTO `sub_category` (`sub_cat_id`, `cat_id`, `sub_cat_name`, `sub_cat_desc`, `author_name`, `author_img`, `tags`, `cookie`, `added_date`, `updated_date`) VALUES
(1, 1, 'bollywood', '<p>Bollywood Desc</p>\r\n', 'allen', 'user.png', 'bollywood', '', '2023-02-18 17:51:49', '2023-02-18 17:51:49'),
(2, 1, 'hollywood', '<p>Hollywood</p>\r\n', 'allen', 'user.png', 'hollywood', '', '2023-02-18 17:52:18', '2023-02-18 17:52:18'),
(3, 1, 'web series', '<p>Web series</p>\r\n', 'allen', 'user.png', 'web series', '', '2023-02-18 17:52:47', '2023-02-18 17:52:47');

-- --------------------------------------------------------

--
-- Table structure for table `terms`
--

CREATE TABLE `terms` (
  `term_id` int(11) NOT NULL,
  `term_name` text NOT NULL,
  `term_category` text NOT NULL,
  `posted_by` text NOT NULL,
  `reviewed_by` text NOT NULL,
  `term_desc` text NOT NULL,
  `added_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `category`
--
ALTER TABLE `category`
  ADD PRIMARY KEY (`cat_id`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`comment_id`);

--
-- Indexes for table `meta`
--
ALTER TABLE `meta`
  ADD PRIMARY KEY (`meta_id`);

--
-- Indexes for table `post`
--
ALTER TABLE `post`
  ADD PRIMARY KEY (`post_id`);

--
-- Indexes for table `quots`
--
ALTER TABLE `quots`
  ADD PRIMARY KEY (`quot_id`);

--
-- Indexes for table `register`
--
ALTER TABLE `register`
  ADD PRIMARY KEY (`sl_no`);

--
-- Indexes for table `subscribe`
--
ALTER TABLE `subscribe`
  ADD PRIMARY KEY (`subscriber_id`);

--
-- Indexes for table `sub_category`
--
ALTER TABLE `sub_category`
  ADD PRIMARY KEY (`sub_cat_id`);

--
-- Indexes for table `terms`
--
ALTER TABLE `terms`
  ADD PRIMARY KEY (`term_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin`
--
ALTER TABLE `admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `category`
--
ALTER TABLE `category`
  MODIFY `cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `comment`
--
ALTER TABLE `comment`
  MODIFY `comment_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `meta`
--
ALTER TABLE `meta`
  MODIFY `meta_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `post`
--
ALTER TABLE `post`
  MODIFY `post_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `quots`
--
ALTER TABLE `quots`
  MODIFY `quot_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `register`
--
ALTER TABLE `register`
  MODIFY `sl_no` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `subscribe`
--
ALTER TABLE `subscribe`
  MODIFY `subscriber_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `sub_category`
--
ALTER TABLE `sub_category`
  MODIFY `sub_cat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `terms`
--
ALTER TABLE `terms`
  MODIFY `term_id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
