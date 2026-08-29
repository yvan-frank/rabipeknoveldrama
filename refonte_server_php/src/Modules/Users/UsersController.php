<?php

declare(strict_types=1);

namespace App\Modules\Users;

use App\Http\Request;
use App\Http\Response;
use App\Utils\ApiError;

/**
 * Équivalent de src/modules/users/users.controller.ts.
 */
final class UsersController
{
    public static function list(Request $request): void
    {
        $query = UsersSchema::listQuery($request->query);
        Response::success(UsersService::listUsers($query['page'], $query['pageSize']));
    }

    public static function show(Request $request): void
    {
        $id = UsersSchema::idParam($request->params['id']);
        Response::success(UsersService::getUserById($id));
    }

    public static function listBookGrants(Request $request): void
    {
        $query = UsersSchema::listQuery($request->query);
        Response::success(UsersService::listBookGrants($query['page'], $query['pageSize']));
    }

    public static function revokeBookGrant(Request $request): void
    {
        $grantId = UsersSchema::grantIdParam($request->params['grantId']);
        UsersService::revokeBookGrant($grantId);
        Response::noContent();
    }

    public static function delete(Request $request): void
    {
        $id = UsersSchema::idParam($request->params['id']);
        if ($id === (int) $request->user['id']) {
            throw ApiError::badRequest('Vous ne pouvez pas supprimer votre propre compte');
        }
        UsersService::softDeleteUser($id);
        Response::noContent();
    }

    public static function update(Request $request): void
    {
        $id = UsersSchema::idParam($request->params['id']);
        $input = UsersSchema::update($request->body);
        Response::success(UsersService::updateUser($id, $input));
    }

    public static function promoteToAuthor(Request $request): void
    {
        $id = UsersSchema::idParam($request->params['id']);
        Response::success(UsersService::promoteToAuthor($id), 201);
    }

    public static function grantBook(Request $request): void
    {
        $id = UsersSchema::idParam($request->params['id']);
        $input = UsersSchema::grantBook($request->body);
        Response::success(UsersService::grantBookToUser($id, $input, (int) $request->user['id']), 201);
    }

    public static function myDashboard(Request $request): void
    {
        Response::success(UsersService::getUserDashboard((int) $request->user['id']));
    }

    public static function adminDashboard(Request $request): void
    {
        Response::success(UsersService::getAdminDashboard());
    }
}
