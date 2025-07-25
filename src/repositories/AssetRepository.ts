import Asset, { IAsset } from '../entities/Asset';

class AssetRepository {
   async createOrUpdate(ticker: string, data: Partial<IAsset>) {
      return await Asset.findOneAndUpdate({ ticker }, { $set: data }, { new: true, upsert: true });
   }
   async create(data: Partial<IAsset>) {
      const asset = new Asset(data);
      return await asset.save();
   }

   async findByTicker(ticker: string) {
      return await Asset.findOne({ ticker });
   }

   async findAll() {
      return await Asset.find();
   }

   async update(ticker: string, data: Partial<IAsset>) {
      return await Asset.findOneAndUpdate({ ticker }, data, { new: true });
   }

   async delete(ticker: string) {
      return await Asset.findOneAndDelete({ ticker });
   }
}

export default new AssetRepository();
