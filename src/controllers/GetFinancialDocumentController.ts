import { NextFunction, Request, Response } from "express";
import FinancialDocumentService from "../services/FinancialDocumentService";

export const GetFinancialDocumentController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    try {
        const financialDocument = new FinancialDocumentService()
        const response = await financialDocument.importMarketDocument()

        //if(await financialDocument.getDocumentFromUrl('')) {
        //    console.log('Document was loaded from website')
        //}

        res.json(response)
    }
    catch(err) {
        next(err)
    }
}