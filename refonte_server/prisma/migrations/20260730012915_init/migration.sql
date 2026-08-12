-- CreateTable
CREATE TABLE `users` (
    `id_user` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NULL,
    `email` VARCHAR(150) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `ip_address` VARCHAR(50) NULL,
    `is_admin` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT false,
    `affiliate_code` VARCHAR(20) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id_user`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `author` (
    `id_author` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `civility` VARCHAR(20) NULL,
    `designation` VARCHAR(255) NULL,
    `email` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `is_email_verified` BOOLEAN NOT NULL DEFAULT false,
    `is_account_verified` BOOLEAN NOT NULL DEFAULT false,
    `telephone` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `image` TEXT NULL,
    `cover` TEXT NULL,
    `about` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `author_email_key`(`email`),
    PRIMARY KEY (`id_author`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `author_extension` (
    `id_author_ext` INTEGER NOT NULL AUTO_INCREMENT,
    `author_id` INTEGER NOT NULL,
    `country` VARCHAR(50) NULL,
    `address` VARCHAR(50) NULL,
    `document_id` VARCHAR(50) NULL,
    `full_name` VARCHAR(50) NULL,
    `documents` TEXT NULL,
    `social_links` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `author_extension_author_id_key`(`author_id`),
    PRIMARY KEY (`id_author_ext`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `category` (
    `id_category` INTEGER NOT NULL AUTO_INCREMENT,
    `category_name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `category_category_name_key`(`category_name`),
    PRIMARY KEY (`id_category`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books` (
    `id_book` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `date_pub` DATETIME(3) NOT NULL,
    `cover` TEXT NOT NULL,
    `file_path` VARCHAR(255) NULL,
    `price` INTEGER NOT NULL,
    `page_number` INTEGER NOT NULL,
    `book_link` TEXT NOT NULL,
    `resume` TEXT NOT NULL,
    `is_free` BOOLEAN NOT NULL DEFAULT true,
    `read_before_pay` BOOLEAN NOT NULL DEFAULT false,
    `is_promotion` BOOLEAN NOT NULL DEFAULT false,
    `promotion_price` INTEGER NOT NULL DEFAULT 0,
    `id_category` INTEGER NOT NULL,
    `id_author` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NOT NULL,

    INDEX `books_id_category_idx`(`id_category`),
    INDEX `books_id_author_idx`(`id_author`),
    PRIMARY KEY (`id_book`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `books_extension` (
    `id_book_extension` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `introduction` TEXT NULL,
    `topics` TEXT NULL,
    `conclusion` TEXT NULL,
    `language` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `books_extension_book_id_key`(`book_id`),
    PRIMARY KEY (`id_book_extension`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters` (
    `id_chapter` INTEGER NOT NULL AUTO_INCREMENT,
    `chapter_title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `chapter_number` INTEGER NOT NULL,
    `id_book` INTEGER NOT NULL,

    INDEX `chapters_id_book_idx`(`id_book`),
    PRIMARY KEY (`id_chapter`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chapters_extension` (
    `id_chapter_extension` INTEGER NOT NULL AUTO_INCREMENT,
    `chapter_id` INTEGER NOT NULL,
    `introduction` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `chapters_extension_chapter_id_key`(`chapter_id`),
    PRIMARY KEY (`id_chapter_extension`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cart` (
    `id_cart` INTEGER NOT NULL AUTO_INCREMENT,
    `qty` INTEGER NULL,
    `id_book` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `created` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cart_id_book_idx`(`id_book`),
    INDEX `cart_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_cart`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `achat` (
    `id_achat` INTEGER NOT NULL AUTO_INCREMENT,
    `date_achat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `price` INTEGER NOT NULL,
    `is_free` BOOLEAN NOT NULL DEFAULT true,
    `id_user` INTEGER NOT NULL,
    `id_book` INTEGER NOT NULL,
    `metadata` JSON NULL,
    `bookdata` JSON NULL,
    `payment_method` VARCHAR(255) NULL,
    `affiliate_code` VARCHAR(20) NULL,

    INDEX `achat_id_user_idx`(`id_user`),
    INDEX `achat_id_book_idx`(`id_book`),
    PRIMARY KEY (`id_achat`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `affiliate_code` VARCHAR(20) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `affiliate_user_id_key`(`user_id`),
    UNIQUE INDEX `affiliate_affiliate_code_key`(`affiliate_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `affiliate_code_usage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NULL,
    `book_id` INTEGER NULL,
    `affiliate_code` VARCHAR(20) NULL,
    `commission` VARCHAR(20) NULL,
    `clics` INTEGER NOT NULL DEFAULT 0,
    `action` VARCHAR(50) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commentaires` (
    `id_comment` INTEGER NOT NULL AUTO_INCREMENT,
    `message` TEXT NOT NULL,
    `rating` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_book` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,

    UNIQUE INDEX `commentaires_id_book_id_user_key`(`id_book`, `id_user`),
    PRIMARY KEY (`id_comment`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments_chapter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `chapter_id` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `comments_chapter_user_id_idx`(`user_id`),
    INDEX `comments_chapter_chapter_id_idx`(`chapter_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `likes` (
    `id_like` INTEGER NOT NULL AUTO_INCREMENT,
    `date_like` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `id_book` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,

    UNIQUE INDEX `likes_id_book_id_user_key`(`id_book`, `id_user`),
    PRIMARY KEY (`id_like`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `shares` (
    `id_share` INTEGER NOT NULL AUTO_INCREMENT,
    `share_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `plateform` VARCHAR(255) NOT NULL,
    `id_book` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,

    INDEX `shares_id_book_idx`(`id_book`),
    INDEX `shares_id_user_idx`(`id_user`),
    PRIMARY KEY (`id_share`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `readbook` (
    `id_read` INTEGER NOT NULL AUTO_INCREMENT,
    `read_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `chapter_read` INTEGER NOT NULL,
    `id_user` INTEGER NOT NULL,
    `id_book` INTEGER NOT NULL,

    INDEX `readbook_id_user_idx`(`id_user`),
    INDEX `readbook_id_book_idx`(`id_book`),
    PRIMARY KEY (`id_read`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `viewbooks` (
    `id_view` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `view_number` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `viewbooks_book_id_key`(`book_id`),
    PRIMARY KEY (`id_view`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `views_books_by_country` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `country` VARCHAR(255) NOT NULL,
    `total_views` INTEGER NOT NULL DEFAULT 0,
    `last_updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `views_books_by_country_book_id_country_key`(`book_id`, `country`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `views_books_by_platform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `platform` VARCHAR(255) NOT NULL,
    `total_views` INTEGER NOT NULL DEFAULT 0,
    `last_updated` DATETIME(3) NOT NULL,

    UNIQUE INDEX `views_books_by_platform_book_id_platform_key`(`book_id`, `platform`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `views_book_per_day` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `book_id` INTEGER NOT NULL,
    `view_date` DATE NOT NULL,
    `views` INTEGER NOT NULL DEFAULT 1,
    `ip` VARCHAR(50) NULL,
    `platform` VARCHAR(50) NULL,
    `user_agent` TEXT NULL,
    `user_id` INTEGER NULL,

    UNIQUE INDEX `views_book_per_day_book_id_view_date_key`(`book_id`, `view_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_posts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `author_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_comments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_post_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `blog_comments_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `blog_post_id` INTEGER NOT NULL,
    `media_type` ENUM('image', 'video') NOT NULL,
    `media_url` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `book_submitted` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email_address` VARCHAR(50) NOT NULL,
    `author_name` VARCHAR(50) NOT NULL,
    `telephone` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `file_name` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `author_extension` ADD CONSTRAINT `author_extension_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `author`(`id_author`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_id_category_fkey` FOREIGN KEY (`id_category`) REFERENCES `category`(`id_category`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books` ADD CONSTRAINT `books_id_author_fkey` FOREIGN KEY (`id_author`) REFERENCES `author`(`id_author`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books_extension` ADD CONSTRAINT `books_extension_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters` ADD CONSTRAINT `chapters_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chapters_extension` ADD CONSTRAINT `chapters_extension_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cart` ADD CONSTRAINT `cart_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat` ADD CONSTRAINT `achat_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `achat` ADD CONSTRAINT `achat_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `affiliate` ADD CONSTRAINT `affiliate_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires` ADD CONSTRAINT `commentaires_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commentaires` ADD CONSTRAINT `commentaires_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments_chapter` ADD CONSTRAINT `comments_chapter_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments_chapter` ADD CONSTRAINT `comments_chapter_chapter_id_fkey` FOREIGN KEY (`chapter_id`) REFERENCES `chapters`(`id_chapter`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `likes` ADD CONSTRAINT `likes_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shares` ADD CONSTRAINT `shares_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `shares` ADD CONSTRAINT `shares_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `readbook` ADD CONSTRAINT `readbook_id_user_fkey` FOREIGN KEY (`id_user`) REFERENCES `users`(`id_user`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `readbook` ADD CONSTRAINT `readbook_id_book_fkey` FOREIGN KEY (`id_book`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `viewbooks` ADD CONSTRAINT `viewbooks_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `views_books_by_country` ADD CONSTRAINT `views_books_by_country_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `views_books_by_platform` ADD CONSTRAINT `views_books_by_platform_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `views_book_per_day` ADD CONSTRAINT `views_book_per_day_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id_book`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_posts` ADD CONSTRAINT `blog_posts_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `author`(`id_author`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_comments` ADD CONSTRAINT `blog_comments_blog_post_id_fkey` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_blog_post_id_fkey` FOREIGN KEY (`blog_post_id`) REFERENCES `blog_posts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
