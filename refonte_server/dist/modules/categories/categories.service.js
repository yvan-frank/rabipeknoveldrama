"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCategories = listCategories;
const prisma_1 = require("../../lib/prisma");
async function listCategories() {
    return prisma_1.prisma.category.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
    });
}
//# sourceMappingURL=categories.service.js.map