<?php

declare(strict_types=1);

namespace App\Modules\Cart;

use App\Http\Request;
use App\Http\Response;

/**
 * Équivalent de src/modules/cart/cart.controller.ts.
 */
final class CartController
{
    public static function list(Request $request): void
    {
        Response::success(CartService::listCart((int) $request->user['id']));
    }

    public static function addPart(Request $request): void
    {
        $partId = CartSchema::addPart($request->body);
        Response::success(CartService::addPartToCart((int) $request->user['id'], $partId), 201);
    }

    public static function removePart(Request $request): void
    {
        $partId = CartSchema::partIdParam($request->params['partId']);
        CartService::removePartFromCart((int) $request->user['id'], $partId);
        Response::noContent();
    }
}
