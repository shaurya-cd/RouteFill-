"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
/**
 * Validates request payload against a Zod schema for body, params, or query parameters.
 */
function validateRequest(schema) {
    return async (req, res, next) => {
        try {
            if (schema.body) {
                req.body = await schema.body.parseAsync(req.body);
            }
            if (schema.query) {
                req.query = await schema.query.parseAsync(req.query);
            }
            if (schema.params) {
                req.params = await schema.params.parseAsync(req.params);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
