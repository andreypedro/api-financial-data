import { NextFunction, Request, Response } from "express"

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if(err) {
        res.status(500).json({
            success: false,
            message: err.message? err.message: 'An error ocurred.'
        })
    }
}