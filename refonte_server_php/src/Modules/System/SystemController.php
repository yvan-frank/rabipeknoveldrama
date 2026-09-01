<?php

declare(strict_types=1);

namespace App\Modules\System;

use App\Http\Request;
use App\Http\Response;

final class SystemController
{
    public static function testSmtp(Request $request): void
    {
        Response::success(SmtpTester::test());
    }
}
