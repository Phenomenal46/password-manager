/*
 * Centralized Express error handler.
 *
 * Any unexpected error passed to next(error)
 * ends up here.
 */
export function errorHandler(err, req, res, next) {
    console.error(err);

    // Avoid exposing internal error details to clients.
    res.status(err.statusCode || 500).json({
        message:
            err.statusCode
                ? err.message
                : "Internal server error",
    });
}