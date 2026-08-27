-- Schéma initial du serveur PHP natif, capturé depuis la base de
-- développement (rabi_refonte_bd) au moment où le serveur PHP a repris la
-- propriété du schéma — jusqu'ici la base était possédée par
-- refonte_server/prisma/schema.prisma (Node), ce scaffold ne faisait que s'y
-- connecter (cf. commentaire historique dans src/Lib/Database.php). Toutes
-- les tables présentes reflètent donc l'état cumulé de toutes les
-- migrations Prisma appliquées à ce jour, y compris chapter_point_unlocks
-- (cf. refonte_server/prisma/migrations/20260827000000_chapter_point_unlocks),
-- MOINS `_prisma_migrations` (bookkeeping propre à Prisma, sans équivalent
-- ici — cf. bin/migrate.php qui a sa propre table `_php_migrations`).
--
-- `IF NOT EXISTS` sur chaque table : ce fichier doit fonctionner aussi bien
-- pour créer une base neuve (nouvel environnement) que pour être rejoué sans
-- effet sur une base déjà à jour (ex. la base de dev actuelle, déjà dans cet
-- état). Les futures évolutions de schéma vivent dans des fichiers
-- numérotés suivants (0002_xxx.sql, etc.), jamais en modifiant ce fichier
-- après coup — comme n'importe quel système de migrations.
SET FOREIGN_KEY_CHECKS=0;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `achat` (
  `id_achat` int(11) NOT NULL AUTO_INCREMENT,
  `date_achat` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `price` int(11) NOT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 1,
  `id_user` int(11) NOT NULL,
  `id_book` int(11) NOT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `bookdata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bookdata`)),
  `payment_method` varchar(255) DEFAULT NULL,
  `affiliate_code` varchar(20) DEFAULT NULL,
  `part_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_achat`),
  KEY `achat_id_user_idx` (`id_user`),
  KEY `achat_id_book_idx` (`id_book`),
  KEY `achat_part_id_idx` (`part_id`),
  CONSTRAINT `achat_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON UPDATE CASCADE,
  CONSTRAINT `achat_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON UPDATE CASCADE,
  CONSTRAINT `achat_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `book_parts` (`id_book_part`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `affiliate` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `affiliate_code` varchar(20) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `affiliate_affiliate_code_key` (`affiliate_code`),
  UNIQUE KEY `affiliate_user_id_key` (`user_id`),
  CONSTRAINT `affiliate_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `affiliate_code_usage` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `book_id` int(11) DEFAULT NULL,
  `affiliate_code` varchar(20) DEFAULT NULL,
  `commission` varchar(20) DEFAULT NULL,
  `clics` int(11) NOT NULL DEFAULT 0,
  `action` varchar(50) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `article_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `article_id` varchar(50) NOT NULL,
  `read_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `article_reads_user_id_article_id_key` (`user_id`,`article_id`),
  CONSTRAINT `article_reads_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `author` (
  `id_author` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `civility` varchar(20) DEFAULT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `is_account_verified` tinyint(1) NOT NULL DEFAULT 0,
  `telephone` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `image` text DEFAULT NULL,
  `cover` text DEFAULT NULL,
  `about` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modified_at` datetime(3) DEFAULT NULL,
  `genres` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`genres`)),
  PRIMARY KEY (`id_author`),
  UNIQUE KEY `author_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `author_extension` (
  `id_author_ext` int(11) NOT NULL AUTO_INCREMENT,
  `author_id` int(11) NOT NULL,
  `country` varchar(50) DEFAULT NULL,
  `address` varchar(50) DEFAULT NULL,
  `document_id` varchar(50) DEFAULT NULL,
  `full_name` varchar(50) DEFAULT NULL,
  `documents` text DEFAULT NULL,
  `social_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`social_links`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modified_at` datetime(3) DEFAULT NULL,
  `document_type` varchar(20) DEFAULT NULL,
  `privacy_accepted_at` datetime(3) DEFAULT NULL,
  `kyc_verified_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id_author_ext`),
  UNIQUE KEY `author_extension_author_id_key` (`author_id`),
  CONSTRAINT `author_extension_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `author` (`id_author`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `blog_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `blog_post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` varchar(191) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `blog_comments_user_id_idx` (`user_id`),
  KEY `blog_comments_blog_post_id_fkey` (`blog_post_id`),
  CONSTRAINT `blog_comments_blog_post_id_fkey` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `blog_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `author_id` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `blog_posts_author_id_fkey` (`author_id`),
  CONSTRAINT `blog_posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `author` (`id_author`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `book_parts` (
  `id_book_part` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `part_number` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `price` int(11) NOT NULL DEFAULT 0,
  `is_free` tinyint(1) NOT NULL DEFAULT 0,
  `free_chapter_count` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id_book_part`),
  UNIQUE KEY `book_parts_book_id_part_number_key` (`book_id`,`part_number`),
  KEY `book_parts_book_id_idx` (`book_id`),
  CONSTRAINT `book_parts_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `book_review_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `comment_id` int(11) NOT NULL,
  `responder_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `book_review_replies_comment_id_key` (`comment_id`),
  KEY `book_review_replies_responder_id_idx` (`responder_id`),
  CONSTRAINT `book_review_replies_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `commentaires` (`id_comment`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `book_submitted` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email_address` varchar(50) NOT NULL,
  `author_name` varchar(50) NOT NULL,
  `telephone` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `file_name` text NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `book_view_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `visitor_hash` char(64) NOT NULL,
  `country` varchar(2) DEFAULT NULL,
  `platform` varchar(20) DEFAULT NULL,
  `viewed_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `book_view_events_book_id_viewed_at_idx` (`book_id`,`viewed_at`),
  KEY `book_view_events_book_id_visitor_hash_viewed_at_idx` (`book_id`,`visitor_hash`,`viewed_at`),
  KEY `book_view_events_user_id_viewed_at_idx` (`user_id`,`viewed_at`),
  CONSTRAINT `book_view_events_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `books` (
  `id_book` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `date_pub` datetime(3) NOT NULL,
  `cover` text NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `price` int(11) NOT NULL,
  `page_number` int(11) NOT NULL,
  `book_link` text DEFAULT NULL,
  `resume` text NOT NULL,
  `is_free` tinyint(1) NOT NULL DEFAULT 1,
  `read_before_pay` tinyint(1) NOT NULL DEFAULT 0,
  `is_promotion` tinyint(1) NOT NULL DEFAULT 0,
  `promotion_price` int(11) NOT NULL DEFAULT 0,
  `id_category` int(11) NOT NULL,
  `id_author` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modified_at` datetime(3) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `free_chapter_count` int(11) NOT NULL DEFAULT 3,
  `is_adult_only` tinyint(1) NOT NULL DEFAULT 0,
  `is_published` tinyint(1) NOT NULL DEFAULT 1,
  `is_blocked` tinyint(1) NOT NULL DEFAULT 0,
  `suspended_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id_book`),
  UNIQUE KEY `books_slug_key` (`slug`),
  KEY `books_id_category_idx` (`id_category`),
  KEY `books_id_author_idx` (`id_author`),
  CONSTRAINT `books_id_author_fkey` FOREIGN KEY (`id_author`) REFERENCES `author` (`id_author`) ON UPDATE CASCADE,
  CONSTRAINT `books_id_category_fkey` FOREIGN KEY (`id_category`) REFERENCES `category` (`id_category`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `books_extension` (
  `id_book_extension` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `introduction` text DEFAULT NULL,
  `topics` text DEFAULT NULL,
  `conclusion` text DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modified_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id_book_extension`),
  UNIQUE KEY `books_extension_book_id_key` (`book_id`),
  CONSTRAINT `books_extension_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `cart` (
  `id_cart` int(11) NOT NULL AUTO_INCREMENT,
  `qty` int(11) DEFAULT NULL,
  `id_book` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `created` datetime(3) DEFAULT current_timestamp(3),
  `part_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_cart`),
  UNIQUE KEY `cart_id_user_part_id_key` (`id_user`,`part_id`),
  KEY `cart_id_book_idx` (`id_book`),
  KEY `cart_id_user_idx` (`id_user`),
  KEY `cart_part_id_idx` (`part_id`),
  CONSTRAINT `cart_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `cart_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `book_parts` (`id_book_part`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `category` (
  `id_category` int(11) NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`id_category`),
  UNIQUE KEY `category_category_name_key` (`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `chapter_point_unlocks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `points_spent` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `chapter_point_unlocks_user_id_chapter_id_key` (`user_id`,`chapter_id`),
  KEY `chapter_point_unlocks_chapter_id_idx` (`chapter_id`),
  CONSTRAINT `chapter_point_unlocks_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chapter_point_unlocks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `chapters` (
  `id_chapter` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `chapter_number` int(11) NOT NULL,
  `id_book` int(11) NOT NULL,
  `part_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_chapter`),
  UNIQUE KEY `chapters_id_book_chapter_number_key` (`id_book`,`chapter_number`),
  KEY `chapters_id_book_idx` (`id_book`),
  KEY `chapters_part_id_idx` (`part_id`),
  CONSTRAINT `chapters_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `chapters_part_id_fkey` FOREIGN KEY (`part_id`) REFERENCES `book_parts` (`id_book_part`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `chapters_extension` (
  `id_chapter_extension` int(11) NOT NULL AUTO_INCREMENT,
  `chapter_id` int(11) NOT NULL,
  `introduction` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `modified_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id_chapter_extension`),
  UNIQUE KEY `chapters_extension_chapter_id_key` (`chapter_id`),
  CONSTRAINT `chapters_extension_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `check_ins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `check_in_date` date NOT NULL,
  `streak_day` int(11) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `check_ins_user_id_check_in_date_key` (`user_id`,`check_in_date`),
  KEY `check_ins_user_id_check_in_date_idx` (`user_id`,`check_in_date`),
  CONSTRAINT `check_ins_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `commentaires` (
  `id_comment` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `rating` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `id_book` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  PRIMARY KEY (`id_comment`),
  UNIQUE KEY `commentaires_id_book_id_user_key` (`id_book`,`id_user`),
  KEY `commentaires_id_user_fkey` (`id_user`),
  CONSTRAINT `commentaires_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `commentaires_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `comments_chapter` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `chapter_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comments_chapter_user_id_idx` (`user_id`),
  KEY `comments_chapter_chapter_id_idx` (`chapter_id`),
  KEY `comments_chapter_parent_id_idx` (`parent_id`),
  CONSTRAINT `comments_chapter_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters` (`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_chapter_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `comments_chapter` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `comments_chapter_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `daily_reading_time` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total_seconds` int(11) NOT NULL DEFAULT 0,
  `milestone_15_credited` tinyint(1) NOT NULL DEFAULT 0,
  `milestone_30_credited` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `daily_reading_time_user_id_date_key` (`user_id`,`date`),
  CONSTRAINT `daily_reading_time_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `epub_assets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `epub_edition_id` int(11) NOT NULL,
  `source_url` text DEFAULT NULL,
  `archive_path` varchar(500) NOT NULL,
  `storage_key` varchar(500) DEFAULT NULL,
  `media_type` varchar(100) NOT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `epub_assets_epub_edition_id_archive_path_key` (`epub_edition_id`,`archive_path`),
  CONSTRAINT `epub_assets_epub_edition_id_fkey` FOREIGN KEY (`epub_edition_id`) REFERENCES `epub_editions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `epub_editions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `status` enum('QUEUED','PROCESSING','READY','FAILED') NOT NULL DEFAULT 'QUEUED',
  `storage_key` varchar(500) DEFAULT NULL,
  `file_size_bytes` int(11) DEFAULT NULL,
  `checksum` varchar(64) DEFAULT NULL,
  `source_revision` varchar(64) NOT NULL,
  `error_message` text DEFAULT NULL,
  `generated_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `epub_editions_book_id_version_key` (`book_id`,`version`),
  KEY `epub_editions_book_id_status_idx` (`book_id`,`status`),
  CONSTRAINT `epub_editions_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `likes` (
  `id_like` int(11) NOT NULL AUTO_INCREMENT,
  `date_like` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `id_book` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  PRIMARY KEY (`id_like`),
  UNIQUE KEY `likes_id_book_id_user_key` (`id_book`,`id_user`),
  KEY `likes_id_user_fkey` (`id_user`),
  CONSTRAINT `likes_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `likes_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `media` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `blog_post_id` int(11) NOT NULL,
  `media_type` enum('image','video') NOT NULL,
  `media_url` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `media_blog_post_id_fkey` (`blog_post_id`),
  CONSTRAINT `media_blog_post_id_fkey` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` int(11) NOT NULL,
  `author_kyc_bypass_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` datetime(3) NOT NULL,
  `chapter_unlock_points_cost` int(11) NOT NULL DEFAULT 40,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `points_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL,
  `reason` varchar(50) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `points_transactions_user_id_created_at_idx` (`user_id`,`created_at`),
  CONSTRAINT `points_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `push_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `push_tokens_token_key` (`token`),
  KEY `push_tokens_user_id_idx` (`user_id`),
  CONSTRAINT `push_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `readbook` (
  `id_read` int(11) NOT NULL AUTO_INCREMENT,
  `read_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `chapter_read` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_book` int(11) NOT NULL,
  `progress_percent` double NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_read`),
  UNIQUE KEY `readbook_id_user_id_book_key` (`id_user`,`id_book`),
  KEY `readbook_id_user_idx` (`id_user`),
  KEY `readbook_id_book_idx` (`id_book`),
  CONSTRAINT `readbook_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `readbook_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token_hash` varchar(64) NOT NULL,
  `account_type` varchar(10) NOT NULL,
  `account_id` int(11) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `revoked_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_tokens_token_hash_key` (`token_hash`),
  KEY `refresh_tokens_account_type_account_id_idx` (`account_type`,`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `shares` (
  `id_share` int(11) NOT NULL AUTO_INCREMENT,
  `share_date` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `plateform` varchar(255) NOT NULL,
  `id_book` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  PRIMARY KEY (`id_share`),
  KEY `shares_id_book_idx` (`id_book`),
  KEY `shares_id_user_idx` (`id_user`),
  CONSTRAINT `shares_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `shares_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `sender` enum('user','admin') NOT NULL,
  `content` text NOT NULL,
  `read_by_user` tinyint(1) NOT NULL DEFAULT 0,
  `read_by_admin` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `support_messages_user_id_created_at_idx` (`user_id`,`created_at`),
  CONSTRAINT `support_messages_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id_user`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `users` (
  `id_user` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `affiliate_code` varchar(20) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  `points_balance` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_user`),
  UNIQUE KEY `users_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `viewbooks` (
  `id_view` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `view_number` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_view`),
  UNIQUE KEY `viewbooks_book_id_key` (`book_id`),
  CONSTRAINT `viewbooks_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `views_book_per_day` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `view_date` date NOT NULL,
  `views` int(11) NOT NULL DEFAULT 1,
  `ip` varchar(50) DEFAULT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `views_book_per_day_book_id_view_date_key` (`book_id`,`view_date`),
  CONSTRAINT `views_book_per_day_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `views_books_by_country` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `country` varchar(255) NOT NULL,
  `total_views` int(11) NOT NULL DEFAULT 0,
  `last_updated` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `views_books_by_country_book_id_country_key` (`book_id`,`country`),
  CONSTRAINT `views_books_by_country_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE IF NOT EXISTS `views_books_by_platform` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `book_id` int(11) NOT NULL,
  `platform` varchar(255) NOT NULL,
  `total_views` int(11) NOT NULL DEFAULT 0,
  `last_updated` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `views_books_by_platform_book_id_platform_key` (`book_id`,`platform`),
  CONSTRAINT `views_books_by_platform_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books` (`id_book`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET FOREIGN_KEY_CHECKS=1;
