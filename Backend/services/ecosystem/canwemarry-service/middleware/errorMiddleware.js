'use strict';
const { AppError } = require('../utils/errors');
const { sendError } = require('../utils/response');

const notFoundHandler = (req, res, next) => next(new AppError('NOT_FOUND', 'Route not found', 404));

/**
 * Centralised error handling.
 *
 * An expected AppError is returned as-is. Anything else — a Sequelize failure, a null
 * dereference — is reported as a bare 500 with a fixed message: driver errors routinely
 * contain table names, column names and fragments of the offending row, and this
 * service's rows are the most sensitive thing on the platform.
 */
const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof AppError || error.expected) {
        return sendError(req, res, error);
    }

    // A body express.json() could not parse is the CALLER's mistake, not a fault here.
    // Reporting it as a 500 sent a client hunting for a server problem, and put a parser
    // message — which quotes a fragment of the offending body — into the server log at
    // error level. Answer 400 and say nothing about the content.
    if (error instanceof SyntaxError && 'body' in error) {
        return sendError(req, res, new AppError('BAD_REQUEST', 'The request body was not valid JSON.', 400));
    }

    /*
     * A unique-constraint violation is a RACE, not a fault.
     *
     * Every "do this once" rule here is enforced by a database constraint as well as by a
     * check in the service — the check reads, then writes, so two requests arriving together
     * both pass it and the constraint catches the second. That is the constraint doing its
     * job. Reporting it as a 500 told somebody who double-clicked "Offer support" that the
     * server had broken, when the truthful answer is that they had already offered.
     *
     * Measured: three concurrent support offers produced one row and two 500s.
     *
     * Nothing from the driver is echoed back — the constraint name would name the table and
     * the columns, which is exactly the sort of detail the fixed-message rule below exists
     * to withhold.
     */
    if (error.name === 'SequelizeUniqueConstraintError') {
        return sendError(req, res, new AppError(
            'CONFLICT',
            'That has already been done. If you sent this twice, only the first was kept.',
            409,
        ));
    }

    // A foreign key that no longer resolves means the thing being referenced has gone —
    // usually deleted between the read and the write. 409 for the same reason.
    if (error.name === 'SequelizeForeignKeyConstraintError') {
        return sendError(req, res, new AppError(
            'CONFLICT',
            'Something this depends on has changed. Reload and try again.',
            409,
        ));
    }

    // Log the detail server-side, keyed by request id, and return none of it.
    console.error('[canwemarry] unhandled error', {
        requestId: req.requestId,
        route: `${req.method} ${req.originalUrl}`,
        name: error.name,
        message: error.message,
    });

    return sendError(req, res, new AppError('INTERNAL_SERVER_ERROR', 'Something went wrong. The request id can be quoted to support.', 500));
};

module.exports = { notFoundHandler, errorHandler };
