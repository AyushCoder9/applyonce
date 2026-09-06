/** Shared upload contract for the API, worker and UI. */
export const MAX_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const DOCUMENT_MIMES = ['application/pdf','image/jpeg','image/png','image/webp'] as const;
export const documentTypeForKey = (key:string) => ({'identity.photo':'photo','identity.signature':'signature','education.class10.marksheet':'marksheet_10','education.class12.marksheet':'marksheet_12','education.graduation.certificate':'degree','category.certificate':'category_cert','family.income_certificate':'income_cert','category.domicile_certificate':'domicile_cert'} as Record<string,string>)[key];
const sections:Record<string,string[]> = {aadhaar:['identity','address'],pan:['identity'],photo:['identity'],signature:['identity'],passport:['identity'],dl:['identity','address'],marksheet_10:['identity','education'],marksheet_12:['identity','education'],degree:['identity','education'],category_cert:['identity','category'],income_cert:['identity','family'],domicile_cert:['identity','category'],bank_passbook:['identity','bank']};
export const documentAllowed = (scope:readonly string[],type:string) => scope.includes('*') || !!sections[type]?.every(s=>scope.includes(s));
/** Content sniffing, not antivirus. A production malware scanner is still a separate integration. */
export function detectedMime(bytes:Uint8Array):string|null {
  const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
  if(ascii(0,5)==='%PDF-') return 'application/pdf';
  if(bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff) return 'image/jpeg';
  if(bytes[0]===0x89&&ascii(1,4)==='PNG'&&bytes[4]===13&&bytes[5]===10) return 'image/png';
  if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP') return 'image/webp';
  return null;
}
