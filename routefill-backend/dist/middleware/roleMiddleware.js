"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const errors_1 = require("../utils/errors");
/**
 * Role authorization guard ensuring the authenticated user possesses at least one required role.
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            next(new errors_1.ForbiddenError('Authentication context missing'));
            return;
        }
        const hasRole = req.user.roles.some((role) => allowedRoles.includes(role) || req.user?.roles.includes('ADMIN'));
        if (!hasRole) {
            next(new errors_1.ForbiddenError(`Action requires one of the following roles: [${allowedRoles.join(', ')}]`));
            return;
        }
        next();
    };
}
