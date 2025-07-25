import { Document, model, Schema } from 'mongoose';

export interface IAsset {
   ticker: string;
   name: string;
   close: number;
   change: number;
   volume: number;
   market_cap: number | null;
   logo: string | null;
   sector: string | null;
   type: 'fund' | 'stock' | 'bdr';
   is_public?: boolean;
}

export interface IAssetDocument extends IAsset, Document {}

const AssetSchema = new Schema<IAsset>({
   // id: { type: String, required: true, unique: true },
   ticker: { type: String, required: true },
   name: { type: String, required: true },
   close: { type: Number, required: true },
   change: { type: Number, required: true },
   volume: { type: Number, required: true },
   market_cap: { type: Number, required: false },
   logo: { type: String, required: false },
   sector: { type: String, required: false },
   type: { type: String, enum: ['fund', 'stock', 'bdr'], required: true },
   is_public: { type: Boolean, required: false, default: true },
});

export default model<IAsset>('Asset', AssetSchema);
