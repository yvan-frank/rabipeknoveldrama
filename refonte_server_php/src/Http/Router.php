<?php

declare(strict_types=1);

namespace App\Http;

use App\Utils\ApiError;

/**
 * Routeur minimal équivalent à express.Router() : enregistrement par
 * méthode+chemin (avec segments dynamiques ":id"), montage de sous-routeurs
 * avec préfixe (router.use('/prefix', subRouter)), chaîne de middlewares
 * par route, dispatch avec matching + exécution.
 */
final class Router
{
    /**
     * @var list<array{method:string,body:string,paramNames:list<string>,handler:callable,middlewares:list<callable>}>
     */
    private array $routes = [];

    /** @param list<callable> $middlewares */
    public function get(string $path, callable $handler, array $middlewares = []): void
    {
        $this->add('GET', $path, $handler, $middlewares);
    }

    /** @param list<callable> $middlewares */
    public function post(string $path, callable $handler, array $middlewares = []): void
    {
        $this->add('POST', $path, $handler, $middlewares);
    }

    /** @param list<callable> $middlewares */
    public function put(string $path, callable $handler, array $middlewares = []): void
    {
        $this->add('PUT', $path, $handler, $middlewares);
    }

    /** @param list<callable> $middlewares */
    public function patch(string $path, callable $handler, array $middlewares = []): void
    {
        $this->add('PATCH', $path, $handler, $middlewares);
    }

    /** @param list<callable> $middlewares */
    public function delete(string $path, callable $handler, array $middlewares = []): void
    {
        $this->add('DELETE', $path, $handler, $middlewares);
    }

    /** @param list<callable> $middlewares */
    public function add(string $method, string $path, callable $handler, array $middlewares = []): void
    {
        [$body, $paramNames] = self::compile($path);
        $this->routes[] = [
            'method' => strtoupper($method),
            'body' => $body,
            'paramNames' => $paramNames,
            'handler' => $handler,
            'middlewares' => $middlewares,
        ];
    }

    /**
     * Monte un sous-routeur sous un préfixe, comme `router.use('/books', booksRouter)`.
     * $registrar reçoit un Router vierge à peupler ; ses routes sont ensuite
     * fusionnées ici avec le préfixe appliqué.
     *
     * @param list<callable> $middlewares middlewares appliqués à TOUTES les routes montées (ex: requireAuth global d'un module)
     */
    public function mount(string $prefix, callable $registrar, array $middlewares = []): void
    {
        $sub = new self();
        $registrar($sub);

        $prefixBody = preg_quote(rtrim($prefix, '/'), '#');

        foreach ($sub->routes as $route) {
            $this->routes[] = [
                'method' => $route['method'],
                'body' => $prefixBody . $route['body'],
                'paramNames' => $route['paramNames'],
                'handler' => $route['handler'],
                'middlewares' => array_merge($middlewares, $route['middlewares']),
            ];
        }
    }

    /**
     * Compile un chemin (":id" -> groupe nommé) en corps de regex SANS
     * ancres ni délimiteurs, pour rester composable par mount() : le corps
     * commence toujours par "/" (ou est vide pour la racine "/") afin qu'un
     * préfixe puisse être simplement concaténé devant.
     *
     * @return array{0:string,1:list<string>}
     */
    private static function compile(string $path): array
    {
        $paramNames = [];
        $segments = explode('/', trim($path, '/'));
        $regexSegments = [];

        foreach ($segments as $segment) {
            if ($segment === '') {
                continue;
            }
            if (str_starts_with($segment, ':')) {
                $name = substr($segment, 1);
                $paramNames[] = $name;
                $regexSegments[] = '(?P<' . $name . '>[^/]+)';
            } else {
                $regexSegments[] = preg_quote($segment, '#');
            }
        }

        $body = $regexSegments === [] ? '' : '/' . implode('/', $regexSegments);
        return [$body, $paramNames];
    }

    public function dispatch(Request $request): void
    {
        $matchedPath = false;

        foreach ($this->routes as $route) {
            $pattern = '#^' . ($route['body'] === '' ? '/?' : $route['body']) . '$#';
            if (preg_match($pattern, $request->path, $matches) !== 1) {
                continue;
            }

            $matchedPath = true;

            if ($route['method'] !== $request->method) {
                continue;
            }

            foreach ($route['paramNames'] as $name) {
                $request->params[$name] = $matches[$name];
            }

            $this->runChain($route['middlewares'], $route['handler'], $request);
            return;
        }

        if ($matchedPath) {
            throw new ApiError(405, 'Méthode non autorisée pour cette route');
        }

        throw ApiError::notFound("Route introuvable : {$request->method} {$request->path}");
    }

    /** @param list<callable> $middlewares */
    private function runChain(array $middlewares, callable $handler, Request $request): void
    {
        $next = $handler;
        for ($i = count($middlewares) - 1; $i >= 0; $i--) {
            $middleware = $middlewares[$i];
            $next = static fn (Request $req) => $middleware($req, $next);
        }
        $next($request);
    }
}
