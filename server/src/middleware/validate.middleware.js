/*
 * Generic validation middleware.
 *
 * The route supplies a Zod schema.
 * We validate req.body, req.query, or another request location
 * before the controller executes.
 */
export function validate(schema, location = "body") {
    return (req, res, next) => {
        const result = schema.safeParse(req[location]);

        if (!result.success) {
            return res.status(400).json({
                message: result.error.issues[0]?.message || "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // Express exposes req.query as read-only, so update its contents instead.
        if (location === "query") {
            Object.keys(req.query).forEach((key) => delete req.query[key]);
            Object.assign(req.query, result.data);
        } else {
            req[location] = result.data;
        }

        next();
    };
}