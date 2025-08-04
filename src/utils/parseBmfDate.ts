/**
 * Utilitário para converter datas no formato 'DD/MM/YYYY HH:mm' (ou apenas 'DD/MM/YYYY') para objeto Date.
 * Retorna null se a data não for válida.
 */
export function parseBmfDate(dateStr: string): Date | null {
   if (!dateStr || typeof dateStr !== 'string') return null;
   const [datePart, timePart] = dateStr.split(' ');
   const [day, month, year] = datePart.split('/').map(Number);
   let hours = 0,
      minutes = 0;
   if (timePart) {
      const [h, m] = timePart.split(':').map(Number);
      hours = h || 0;
      minutes = m || 0;
   }
   const date = new Date(year, month - 1, day, hours, minutes);
   return isNaN(date.getTime()) ? null : date;
}
