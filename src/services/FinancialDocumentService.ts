import axios from "axios"
import { IMarketDocument } from "entities/MarketDocument";
import { IMarketDcumentFromBMF_PTBR } from "interfaces/IMarketDocumentFromBMF_PTBR"
import { fiis } from "../data/fii"

type IMarketDocumentUsable = Pick<IMarketDocument, 'id' | 'ticker' | 'fundDescription' | 'tradingName'>

class FinancialDocumentService {

    constructor() {}

    async importFromBMFBovespa(): Promise<IMarketDocumentUsable[]> {
        
        // type-guard.
        function isValidResponse(
        resp: unknown
        ): resp is { data: { data: IMarketDcumentFromBMF_PTBR[] } } {
        return (
            typeof resp === 'object' &&
            resp !== null &&
            'data' in resp &&
            typeof (resp as any).data === 'object' &&
            (resp as any).data !== null &&
            'data' in (resp as any).data &&
            Array.isArray((resp as any).data.data)
        );
        }

        try {
            const url = "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?d=1&s=0&l=10&o%5B0%5D%5BdataEntrega%5D=desc&tipoFundo=1&idCategoriaDocumento=0&idTipoDocumento=0&idEspecieDocumento=0&isSession=true&_=1751666002042"
            const response: unknown = await axios.get(url)

            if(!isValidResponse(response)) {
                throw new Error('Returned type from bmf is not valid')
            }

            const marketDocumentDataFromBMFBovespa: IMarketDcumentFromBMF_PTBR[] = response.data.data
            
            const marketDocumentData: IMarketDocumentUsable[] = marketDocumentDataFromBMFBovespa
                .filter(document => document.nomePregao != '')
                .map(document => {
                    const matchedFii = fiis.find(fii => fii.tradingName === document.nomePregao);
                    const ticker = matchedFii?.ticker || null 

                    return {
                        id: document.id,
                        ticker: ticker as string,
                        fundDescription: document.descricaoFundo,
                        tradingName: document.nomePregao
                    }
                    
                })

            return marketDocumentData
        }
        catch(err) {
            throw new Error('It was not possible to get market documents from BMF.')
        }
    }

    async importMarketDocument() {
        const marketDocumentData = await this.importFromBMFBovespa();
        const { v4: uuidv4 } = await import('uuid');
        const MarketDocumentRepository = (await import('../repositories/MarketDocumentRepository')).default;

        for (const document of marketDocumentData) {
            const docToSave = {
                id: uuidv4(),
                externalId
                ticker: document.ticker,
                fundDescription: document.fundDescription,
                tradingName: document.tradingName
            };
            try {
                await MarketDocumentRepository.create(docToSave);
                console.log('Saved to Mongo:', docToSave);
            } catch (err) {
                console.error('Error saving document:', docToSave, err);
            }
        }
    }

    async getDocumentFromUrl(url: string): Promise<boolean> {
        const file = await axios.get('https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=939855')

        console.log(file)

        return true
    }
}

export default FinancialDocumentService