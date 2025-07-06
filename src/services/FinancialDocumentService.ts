import axios from "axios"
import { IMarketDocument } from "interfaces/IMarketDocument"
import { IMarketDcumentFromBMFBovespa } from "interfaces/IMarketDcumentFromBMFBovespa"
import { fiis } from "../data/fii"

class FinancialDocumentService {

    constructor() {}

    async importFromBMFBovespa(): Promise<IMarketDocument[]> {

        try {
            const url = "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?d=1&s=0&l=10&o%5B0%5D%5BdataEntrega%5D=desc&tipoFundo=1&idCategoriaDocumento=0&idTipoDocumento=0&idEspecieDocumento=0&isSession=true&_=1751666002042"
            const response = await axios.get(url)

            const marketDocumentDataFromBMFBovespa: IMarketDcumentFromBMFBovespa[] = response.data.data
            
            const marketDocumentData: IMarketDocument[] = marketDocumentDataFromBMFBovespa
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
                    
                }).filter(item => item.ticker !== null)

            return marketDocumentData
        }
        catch(err) {
            throw new Error('It was not possible to get market documents from BMF.')
        }
    }

    async importMarketDocument() {
        const marketDocumentData = await this.importFromBMFBovespa()

        // console.log(marketDocumentData)

        marketDocumentData.map(document => {
            console.log('Trading Name:', document.ticker, document.tradingName)
        })
    }

    async getDocumentFromUrl(url: string): Promise<boolean> {
        const file = await axios.get('https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=939855')

        console.log(file)

        return true
    }
}

export default FinancialDocumentService