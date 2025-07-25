import axios from 'axios';
import { IAsset } from '../entities/Asset';
import AssetRepository from '../repositories/AssetRepository';

type IAssetsFromApi = {
   stock: string;
   name: string;
   close: number;
   change: number;
   volume: number;
   market_cap: number | null;
   logo: string | null;
   sector: string | null;
   type: string;
};

class FinancialMarketDataService {
   private isStocksApiResponse(resp: any): resp is { stocks: IAssetsFromApi[] } {
      return (
         typeof resp === 'object' &&
         resp !== null &&
         Array.isArray(resp.stocks) &&
         resp.stocks.every(
            (item: any) =>
               typeof item === 'object' && item !== null && typeof item.stock === 'string'
         )
      );
   }
   private readonly METADATA_URL = `https://brapi.dev/api/quote/list?token=${process.env.BRAPI_TOKEN}`;

   constructor() {}

   async import() {
      await this.importAllAssets();
   }

   async importAllAssets(): Promise<void> {
      const type = 'fund';
      const limit = 1000;
      const page = 1;

      try {
         const url = `${this.METADATA_URL}&search=&sortBy=name&sortOrder=asc&limit=${limit}&page=${page}&type=${type}&sector=`;
         const response = await axios.get(url);

         console.log(response.data);

         if (!response || !response.data || !this.isStocksApiResponse(response.data)) {
            throw new Error('Returned type from brapi is not valid');
         }

         const assetsFromApi: IAssetsFromApi[] = response.data.stocks;

         const assets = assetsFromApi.map((asset) => ({
            ticker: asset.stock,
            name: asset.name,
            close: asset.close,
            change: asset.change,
            volume: asset.volume,
            market_cap: asset.market_cap,
            logo: asset.logo,
            sector: asset.sector,
            type: asset.type as IAsset['type'],
         }));

         await this.saveMarketData(assets);
      } catch (err: any) {
         console.error(err.message);
      }
   }

   async saveMarketData(assets: IAsset[]) {
      for (const asset of assets) {
         const ticker = asset.ticker;

         if (!ticker) {
            console.error('"ticker" was not found in assets data sent to saveMarketData() method.');
            continue;
         }

         const assetToSave = {
            ticker: asset.ticker,
            name: asset.name,
            close: asset.close,
            change: asset.change,
            volume: asset.volume,
            market_cap: asset.market_cap,
            logo: asset.logo,
            sector: asset.sector,
            type: asset.type,
         };
         try {
            await AssetRepository.createOrUpdate(ticker, assetToSave);
            console.log('Ticker saved: ', ticker);
         } catch (err) {
            console.error('Error saving asset:', assetToSave, err);
         }
      }
      return true;
   }
}

export default FinancialMarketDataService;
