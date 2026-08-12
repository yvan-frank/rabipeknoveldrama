"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
// Valide et remplace req[target] par la version parsée (types coercés, champs
// inconnus retirés) : les controllers reçoivent toujours une donnée propre.
function validate(schema, target = 'body') {
    return (req, _res, next) => {
        req[target] = schema.parse(req[target]);
        next();
    };
}
//# sourceMappingURL=validate.middleware.js.map