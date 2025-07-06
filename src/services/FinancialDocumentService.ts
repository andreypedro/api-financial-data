import axios from "axios"

interface FinancialDocument {
    ticker: string
    category: 'UPDATE' | 'REPORT'
    summary: string
    description: string
}

/*
// https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosCVM?paginaCertificados=false&tipoFundo=1
UPDATE THE INTERFACE:

{
      "id": 940464,
      "descricaoFundo": "LIFE CAPITAL PARTNERS FUNDO DE INVESTIMENTOS IMOBILIÁRIOS",
      "categoriaDocumento": "Relatórios",
      "tipoDocumento": "Relatório Gerencial",
      "especieDocumento": "",
      "dataReferencia": "30/05/2025",
      "dataEntrega": "04/07/2025 18:58",
      "status": "AC",
      "descricaoStatus": "Ativo com visualização",
      "analisado": "N",
      "situacaoDocumento": "A",
      "assuntos": null,
      "altaPrioridade": false,
      "formatoDataReferencia": "3",
      "versao": 1,
      "modalidade": "AP",
      "descricaoModalidade": "Apresentação",
      "nomePregao": "FII LIFE",
      "informacoesAdicionais": "FII LIFE;",
      "arquivoEstruturado": "",
      "formatoEstruturaDocumento": null,
      "nomeAdministrador": null,
      "cnpjAdministrador": null,
      "cnpjFundo": null,
      "idFundo": null,
      "idTemplate": 0,
      "idSelectNotificacaoConvenio": null,
      "idSelectItemConvenio": 0,
      "indicadorFundoAtivoB3": false,
      "idEntidadeGerenciadora": null,
      "ofertaPublica": null,
      "numeroEmissao": null,
      "tipoPedido": null,
      "dda": null,
      "codSegNegociacao": null,
      "fundoOuClasse": null,
      "nomePrimeiraVisualizacao": null
    },
*/

class FinancialDocumentService {

    constructor() {}

    async import(): Promise<FinancialDocument[]> {
        // here the code

        const url = "https://fnet.bmfbovespa.com.br/fnet/publico/pesquisarGerenciadorDocumentosDados?d=1&s=0&l=10&o%5B0%5D%5BdataEntrega%5D=desc&tipoFundo=1&idCategoriaDocumento=0&idTipoDocumento=0&idEspecieDocumento=0&isSession=true&_=1751666002042"
        const response = await axios.get<FinancialDocument[]>(url)

        const financialDocumentList = response.data
        
        return financialDocumentList
    }

    async getDocumentFromUrl(url: string): Promise<boolean> {
        const file = await axios.get('https://fnet.bmfbovespa.com.br/fnet/publico/downloadDocumento?id=939855')

        console.log(file)

        return true
    }
}

export default FinancialDocumentService