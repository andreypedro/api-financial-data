import { Document, model, Schema } from 'mongoose';

export interface IMarketDocument extends Document {
   id: string;
   status:
      | 'PRE_SAVED'
      | 'FILE_DOWNLOADED'
      | 'SUMMARIZED'
      | 'PUBLISHED'
      | 'DOWNLOAD_ERROR'
      | 'TICKER_NOT_FOUND';
   externalId: string;
   ticker: string;
   fundDescription: string;
   tradingName: string;
   category: 'DIVIDENDS' | 'REPORT';
   fileExtension?: 'pdf' | 'xml';
   tldr: string;
   summary: string;
   content: string;
   createdAt: Date;
}

const MarketDocumentSchema = new Schema<IMarketDocument>({
   id: { type: String, required: true, unique: true },
   status: {
      type: String,
      enum: [
         'PRE_SAVED',
         'FILE_DOWNLOADED',
         'SUMMARIZED',
         'PUBLISHED',
         'DOWNLOAD_ERROR',
         'TICKER_NOT_FOUND',
      ],
      required: true,
   },
   category: { type: String, enum: ['DIVIDENDS', 'REPORT'] },
   externalId: { type: String, required: true },
   ticker: { type: String, required: false },
   fundDescription: { type: String, required: true },
   tradingName: { type: String, required: true },
   fileExtension: { type: String, enum: ['pdf', 'xml'], required: false },
   tldr: { type: String, required: false },
   summary: { type: String, required: false },
   content: { type: String, required: false },
   createdAt: { type: Date, required: true },
});

export default model<IMarketDocument>('MarketDocument', MarketDocumentSchema);
