import { NextFunction, Request, Response } from "express";
import FinancialDocumentService from "../services/FinancialDocumentService";

export const GetFinancialDocumentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
        const financialDocument = new FinancialDocumentService();
        const response = await financialDocument.import();

        res.json({
            success: true,
            message: 'Data was load succefully from BMF.'
        })
    }
    catch(err) {
        next(err)
    }
}