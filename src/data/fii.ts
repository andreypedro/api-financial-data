export type FII = {
  tradingName: string;
  ticker: string | null;
  descricao: string;
};

export const fiis: FII[] = [
  {
    tradingName: "FII NAUI",
    ticker: "NAUI11",
    descricao: "Life Capital Partners Fundo de Investimento Imobiliário",
  },
  {
    tradingName: "FII TOPP",
    ticker: "TOPP11",
    descricao: "RBR Top Offices Fundo de Investimento Imobiliário",
  },
  {
    tradingName: "FII RB CAP I",
    ticker: "FIIP11",
    descricao: "RB Capital Renda I Fundo de Investimento Imobiliário",
  },
  {
    tradingName: "FII CPHBC UR",
    ticker: null,
    descricao: "Fundo imobiliário não identificado ou com ticker não disponível",
  },
  {
    tradingName: "FII LEGATUS",
    ticker: "LASC11",
    descricao: "Legatus Shoppings Fundo de Investimento Imobiliário",
  },
  {
    tradingName: "FII MAGM",
    ticker: null,
    descricao: "Fundo imobiliário não identificado ou com ticker não disponível",
  },
  {
    tradingName: "FIAGRO VCRA",
    ticker: "VCRA11",
    descricao: "Vectis Datagro Crédito Agronegócio FIAGRO",
  },
  {
    tradingName: "FII LIFE",
    ticker: "LIFE11",
    descricao: "Life Capital Partners Fundo de Investimento Imobiliário",
  },
];