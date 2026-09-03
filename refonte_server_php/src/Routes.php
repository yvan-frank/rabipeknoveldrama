<?php

declare(strict_types=1);

namespace App;

use App\Http\Router;
use App\Modules\Achats\AchatsRoutes;
use App\Modules\Auth\AuthRoutes;
use App\Modules\Authors\AuthorsRoutes;
use App\Modules\BookParts\BookPartsRoutes;
use App\Modules\Books\BooksRoutes;
use App\Modules\Cart\CartRoutes;
use App\Modules\Categories\CategoriesRoutes;
use App\Modules\Chapters\ChaptersRoutes;
use App\Modules\Chapters\ReadingProgressRoutes;
use App\Modules\Comments\CommentsRoutes;
use App\Modules\Epub\EpubRoutes;
use App\Modules\Likes\LikesRoutes;
use App\Modules\Narration\NarrationRoutes;
use App\Modules\Notifications\NotificationsRoutes;
use App\Modules\Points\PointsRoutes;
use App\Modules\Stats\StatsRoutes;
use App\Modules\Support\SupportRoutes;
use App\Modules\System\SystemRoutes;
use App\Modules\Uploads\UploadsRoutes;
use App\Modules\Users\UsersRoutes;

/**
 * Équivalent de src/routes/index.ts : monte chaque module sous son préfixe.
 * Ce routeur est lui-même monté sous /api par App.php (app.use('/api', router)
 * côté Node).
 */
final class Routes
{
    public static function register(Router $router): void
    {
        $router->mount('/auth', AuthRoutes::register(...));
        $router->mount('/users', UsersRoutes::register(...));
        $router->mount('/books', BooksRoutes::register(...));
        $router->mount('/books', EpubRoutes::registerBookEditions(...));
        $router->mount('/books', EpubRoutes::registerBookReader(...));
        $router->mount('/books', ReadingProgressRoutes::register(...));
        $router->mount('/epub-editions', EpubRoutes::registerEditions(...));
        $router->mount('/chapters', ChaptersRoutes::register(...));
        $router->mount('/chapters', NarrationRoutes::register(...));
        $router->mount('/authors', AuthorsRoutes::register(...));
        $router->mount('/categories', CategoriesRoutes::register(...));
        $router->mount('/cart', CartRoutes::register(...));
        $router->mount('/achats', AchatsRoutes::register(...));
        $router->mount('/comments', CommentsRoutes::register(...));
        $router->mount('/stats', StatsRoutes::register(...));
        $router->mount('/likes', LikesRoutes::register(...));
        $router->mount('/uploads', UploadsRoutes::register(...));
        $router->mount('/book-parts', BookPartsRoutes::register(...));
        $router->mount('/points', PointsRoutes::register(...));
        $router->mount('/support', SupportRoutes::register(...));
        $router->mount('/notifications', NotificationsRoutes::register(...));
        $router->mount('/system', SystemRoutes::register(...));
    }
}
