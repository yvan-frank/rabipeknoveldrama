<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Routeur minimal pour des pages (pas d'API) : enregistrement GET avec
 * segments dynamiques (":slug" -> app/livres/[slug]/page.tsx), dispatch par
 * matching de regex. Repris de refonte_server_php\Http\Router, simplifié
 * (une seule méthode utile ici : GET — les formulaires postent directement
 * vers l'API depuis les îlots React, pas vers ce routeur).
 */
final class Router
{
    /**
     * @var list<array{method:string,body:string,paramNames:list<string>,handler:callable}>
     */
    private array $routes = [];

    public function get(string $path, callable $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    private function add(string $method, string $path, callable $handler): void
    {
        [$body, $paramNames] = self::compile($path);
        $this->routes[] = [
            'method' => strtoupper($method),
            'body' => $body,
            'paramNames' => $paramNames,
            'handler' => $handler,
        ];
    }

    /** @return array{0:string,1:list<string>} */
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
        foreach ($this->routes as $route) {
            $pattern = '#^' . ($route['body'] === '' ? '/?' : $route['body']) . '$#';
            if (preg_match($pattern, $request->path, $matches) !== 1) {
                continue;
            }
            if ($route['method'] !== $request->method) {
                continue;
            }

            foreach ($route['paramNames'] as $name) {
                $request->params[$name] = $matches[$name];
            }

            ($route['handler'])($request);
            return;
        }

        Response::notFound();
    }
}
