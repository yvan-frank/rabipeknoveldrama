<?php

declare(strict_types=1);

namespace App\Modules\Narration;

use RuntimeException;

// 409 renvoyé par POST /generate/{job_id}/cancel quand le job est déjà
// done/error/cancelled côté TTS — NarrationService le traite en rafraîchissant
// simplement le statut local plutôt qu'en erreur.
final class NarrationJobAlreadyFinishedException extends RuntimeException
{
}
