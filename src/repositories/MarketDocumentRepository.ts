import MarketDocumentModel, { IMarketDocument } from "entities/MarketDocument";


class MarketDocumentRepository {
    async create(data: IMarketDocument) {
    return MarketDocumentModel.create(data);
  }

  async findAll() {
    return MarketDocumentModel.find();
  }

  async findById(id: string) {
    return MarketDocumentModel.findOne({ id });
  }

  async update(id: string, data: Partial<IMarketDocument>) {
    return MarketDocumentModel.findOneAndUpdate({ id }, data, { new: true });
  }

  async delete(id: string) {
    return MarketDocumentModel.findOneAndDelete({ id });
  }
}

export default new MarketDocumentRepository();