export interface IMarketDocumentFromBMF {
  id: number;
  ticker?: string;
  fundDescription: string;
  documentCategory: string;
  documentType: string;
  documentSubtype: string;
  referenceDate: Date // e.g. "30/05/2025"
  deliveryDate: string;  // e.g. "04/07/2025 18:58"
  status: string; // Example: "AC"
  statusDescription: string;
  analyzed: 'Y' | 'N';
  documentStatus: string; // Example: "A"
  topics: string[] | null;
  highPriority: boolean;
  referenceDateFormat: string; // Could be number (1, 2, 3)
  version: number;
  modality: string;
  modalityDescription: string;
  tradingName: string;
  additionalInformation: string;
  structuredFile: string;
  documentStructureFormat: string | null;
  administratorName: string | null;
  administratorCnpj: string | null;
  fundCnpj: string | null;
  fundId: number | null;
  templateId: number;
  notificationAgreementSelectId: number | null;
  agreementItemSelectId: number;
  isActiveFundOnB3: boolean;
  managingEntityId: number | null;
  publicOffering: string | null;
  issuanceNumber: number | null;
  requestType: string | null;
  dda: string | null;
  negotiationCode: string | null;
  fundOrClass: string | null;
  firstViewName: string | null;
}