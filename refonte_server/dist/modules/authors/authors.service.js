"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKycComplete = isKycComplete;
exports.isKycVerified = isKycVerified;
exports.getAuthorKycBypassPolicy = getAuthorKycBypassPolicy;
exports.setAuthorKycBypassPolicy = setAuthorKycBypassPolicy;
exports.getMyKyc = getMyKyc;
exports.submitKyc = submitKyc;
exports.listAuthorsForKycReview = listAuthorsForKycReview;
exports.setAuthorKycVerification = setAuthorKycVerification;
exports.assertAuthorKycComplete = assertAuthorKycComplete;
const prisma_1 = require("../../lib/prisma");
const ApiError_1 = require("../../utils/ApiError");
// KYC "complet" = toutes les données d'identité renseignées ET la politique
// de confidentialité acceptée — purement déclaratif (l'auteur a rempli le
// formulaire), distinct de la vérification par un administrateur ci-dessous.
function isKycComplete(extension) {
    if (!extension)
        return false;
    return Boolean(extension.country &&
        extension.address &&
        extension.documentType &&
        extension.documentId &&
        extension.documents &&
        extension.fullName &&
        extension.privacyAcceptedAt);
}
// La vérification (kycVerifiedAt) est ce qui autorise réellement les actions
// d'écriture (cf. requireAuthorKyc) — un KYC complet mais pas encore
// examiné par un administrateur ne suffit pas.
function isKycVerified(extension) {
    return Boolean(extension?.kycVerifiedAt);
}
// Le bypass est un réglage global, volontairement désactivé par défaut. Il ne
// falsifie pas les données KYC existantes : il autorise temporairement les
// auteurs actuels et futurs à publier sans vérification.
async function getPlatformSettings() {
    return prisma_1.prisma.platformSetting.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
    });
}
async function getAuthorKycBypassPolicy() {
    const settings = await getPlatformSettings();
    return { enabled: settings.authorKycBypassEnabled };
}
async function setAuthorKycBypassPolicy(enabled) {
    const settings = await prisma_1.prisma.platformSetting.upsert({
        where: { id: 1 },
        create: { id: 1, authorKycBypassEnabled: enabled },
        update: { authorKycBypassEnabled: enabled },
    });
    return { enabled: settings.authorKycBypassEnabled };
}
async function getMyKyc(authorId) {
    const extension = await prisma_1.prisma.authorExtension.findUnique({ where: { authorId } });
    return { extension, isComplete: isKycComplete(extension), isVerified: isKycVerified(extension) };
}
async function submitKyc(authorId, input) {
    const data = {
        country: input.country,
        address: input.address,
        documentType: input.documentType,
        documentId: input.documentId,
        documents: input.documents,
        fullName: input.fullName,
        socialLinks: input.socialLinks,
        privacyAcceptedAt: new Date(),
        // Toute nouvelle soumission doit repasser en revue, même si elle avait
        // déjà été vérifiée auparavant.
        kycVerifiedAt: null,
    };
    return prisma_1.prisma.authorExtension.upsert({
        where: { authorId },
        create: { authorId, ...data },
        update: data,
    });
}
// Espace admin : liste de tous les auteurs ayant soumis un KYC (au moins
// partiellement), avec leur statut, pour la page de vérification.
async function listAuthorsForKycReview() {
    const authors = await prisma_1.prisma.author.findMany({
        where: { extension: { isNot: null } },
        select: {
            id: true,
            name: true,
            email: true,
            extension: true,
        },
        orderBy: { extension: { updatedAt: 'desc' } },
    });
    return authors.map((author) => ({
        id: author.id,
        name: author.name,
        email: author.email,
        extension: author.extension,
        isComplete: isKycComplete(author.extension),
        isVerified: isKycVerified(author.extension),
    }));
}
async function setAuthorKycVerification(authorId, verified) {
    const extension = await prisma_1.prisma.authorExtension.findUnique({ where: { authorId } });
    if (!extension) {
        throw ApiError_1.ApiError.notFound("Cet auteur n'a pas encore soumis de KYC");
    }
    if (verified && !isKycComplete(extension)) {
        throw ApiError_1.ApiError.badRequest('Le KYC de cet auteur est incomplet, impossible de le vérifier');
    }
    return prisma_1.prisma.authorExtension.update({
        where: { authorId },
        data: { kycVerifiedAt: verified ? new Date() : null },
    });
}
// Utilisé par le middleware requireAuthorKyc (cf. middlewares/authorKyc.middleware.ts)
// pour bloquer les actions d'écriture (livres/chapitres) tant que le KYC n'est
// pas vérifié — un admin n'est jamais concerné, un auteur toujours.
async function assertAuthorKycComplete(authorId) {
    const policy = await getAuthorKycBypassPolicy();
    if (policy.enabled)
        return;
    const extension = await prisma_1.prisma.authorExtension.findUnique({ where: { authorId } });
    if (!isKycComplete(extension)) {
        throw ApiError_1.ApiError.forbidden('Complétez la vérification de votre identité (KYC) avant de continuer.');
    }
    if (!isKycVerified(extension)) {
        throw ApiError_1.ApiError.forbidden('Votre KYC est en attente de vérification par un administrateur.');
    }
}
//# sourceMappingURL=authors.service.js.map