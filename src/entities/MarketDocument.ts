import { Document, model, Schema } from "mongoose";

export interface IMarketDocument extends Document {
    id: string;
    externalId: string;
    ticker: string;
    fundDescription: string;
    tradingName: string
}

const MarketDocumentSchema = new Schema<IMarketDocument>({
    id: { type: String, required: true, unique: true },
    ticker: { type: String, required: true},
    fundDescription: { type: String, required: true },
    tradingName: { type: String, required: true }
});

export default model<IMarketDocument>('MarketDocument', MarketDocumentSchema);