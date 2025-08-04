import { Document, model, Schema } from 'mongoose';

export interface IPost extends Document {
   id: string;
   documentId?: string;
   documentExternalId?: string;
   fileExtension?: 'pdf' | 'xml';
   ticker: string;
   content: string;
   publishedAt: Date;
   type: 'dividend' | 'report' | 'news';
   metrics?: Record<string, string>;
}

const PostSchema = new Schema<IPost>({
   id: { type: String, required: true, unique: true },
   documentId: { type: String, required: false },
   documentExternalId: { type: String, required: false },
   fileExtension: { type: String, enum: ['pdf', 'xml'], required: false },
   ticker: { type: String, required: true },
   content: { type: String, required: true },
   publishedAt: { type: Date, required: true },
   type: { type: String, enum: ['dividend', 'report', 'news'], required: true },
   metrics: { type: Map, of: String },
});

export default model<IPost>('Post', PostSchema);
