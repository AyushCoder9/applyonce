import { FIELDS } from '../../demo-exam-portal/src/lib/fields';
import {test,expect,type Page} from '@playwright/test';
const BASE=process.env.PLAYWRIGHT_BASE_URL??'http://localhost:3300';
const PORTAL=process.env.AUDIT_PORTAL_URL??'http://localhost:3301';
test.setTimeout(180000);
const pageErrors=new WeakMap<Page,string[]>();
test.beforeEach(async({page})=>{const errors:string[]=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(async({page})=>{expect(pageErrors.get(page)??[], 'Uncaught browser errors').toEqual([]);});
async function login(page:Page,phone='9876543210'){
 const headers={origin:BASE};
 expect((await page.request.post(`${BASE}/api/auth/phone-number/send-otp`,{headers,data:{phoneNumber:`+91${phone}`}})).ok()).toBe(true);
 expect((await page.request.post(`${BASE}/api/auth/phone-number/verify`,{headers,data:{phoneNumber:`+91${phone}`,code:'123456'}})).ok()).toBe(true);
}
async function pick(page:Page,label:string,option:string){const button=page.getByRole('button',{name:new RegExp(label)}).first();if(!await button.count())return;await button.click();await page.getByRole('option').filter({hasText:option}).first().click();}
async function fillConsent(page:Page){
 await page.getByTestId('consent-share').click();
 for(const [label,value] of [['Photograph','Sample photo'],['Signature','Sample signature'],['Current state','Uttar Pradesh']])await pick(page,label!,value!);
 for(const [label,value] of [['Current address line 1','12 Gomti Nagar'],['Current village / town / city','Lucknow'],['Current district','Lucknow'],['Current PIN code','226010']]){const input=page.getByLabel(label!);if(await input.count())await input.fill(value!);}
 for(const [label,value] of [['Exam city preference 1','Lucknow'],['Exam city preference 2','Delhi'],['Paper','Paper 1 (B.E./B.Tech)'],['Question paper medium','English']])await pick(page,label!,value!);
 await page.getByText('I declare the information is true').click();await page.getByTestId('consent-share').click();
 await expect(page.getByTestId('step-up')).toBeVisible();await page.locator('[data-testid="step-up"] input').first().fill('123456');
 await expect(page.getByTestId('consent-receipt')).toBeVisible();
}
test('readiness guide and mobile navigation',async({page},testInfo)=>{
 await login(page);await page.goto('/app/apply/bta-jee-2026');await expect(page.getByTestId('readiness-panel')).toBeVisible();
 await page.getByRole('button',{name:'What should I do first?'}).click();await expect(page.getByText('Local evidence guide',{exact:true})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('readiness-desktop.png'),fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.getByLabel('All pages',{exact:true}).first().click();await page.getByRole('navigation',{name:'All pages'}).getByRole('link',{name:'Documents'}).click();await expect(page).toHaveURL(/\/app\/documents$/);await expect(page.getByRole('heading',{name:'Documents',exact:true})).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('documents-mobile.png'),fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.setViewportSize({width:320,height:720});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test('BTA consent → refreshable review → preserved edit → submit → status callback',async({page},testInfo)=>{
 await login(page);await page.goto(`${PORTAL}/`);await page.getByRole('button',{name:/Apply with Praman/}).click();await expect(page.getByTestId('share-flow')).toBeVisible();
 await fillConsent(page);await page.getByTestId('return-now').click();await expect(page.getByRole('heading',{name:'Confirm your BTA-JEE 2026 application'})).toBeVisible();
 await page.reload();await expect(page.getByRole('button',{name:'Submit to BTA'})).toBeVisible();
 await page.getByRole('button',{name:'Edit before submitting'}).click();await page.getByLabel(/Candidate.*Name/i).fill('AARAV DEMO SHARMA');await page.getByRole('button',{name:'Done editing'}).click();await expect(page.getByText('AARAV DEMO SHARMA',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Submit to BTA'}).click();await expect(page.getByTestId('application-ref')).toBeVisible();await expect(page.getByText('Under review',{exact:true}).first()).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('bta-submitted.png'),fullPage:true});
 await page.reload();await expect(page.getByTestId('application-ref')).toBeVisible();await page.getByRole('button',{name:'Push: Admit card released'}).click();await expect(page.getByText('Admit card released',{exact:true}).first()).toBeVisible();
 await page.goto(`${BASE}/app/applications`);await expect(page.getByText('BTA-JEE 2026 Registration').first()).toBeVisible();
});
test('partner can switch organizations and reach each form console',async({page})=>{
 await login(page,'9000000001');await page.goto('/partner');await page.getByLabel('Organization',{exact:true}).selectOption({label:'Nova University'});await page.getByRole('button',{name:'Switch organization'}).click();await expect(page.getByText('Nova University',{exact:true}).first()).toBeVisible();await page.getByRole('link',{name:'Forms',exact:true}).click();await expect(page.getByText('Nova University B.Tech Admissions 2026').first()).toBeVisible();
 await page.getByLabel('Organization',{exact:true}).selectOption({label:'Bharat Test Agency'});await page.getByRole('button',{name:'Switch organization'}).click();
});


test('manual six-step application validates, preserves entries and submits',async({page})=>{
 await page.goto(`${PORTAL}/apply/manual`);
 await page.getByRole('button',{name:'Save & Next'}).click();
 await expect(page.getByText("Candidate's Full Name is required.",{exact:true})).toBeVisible();
 for(let step=1;step<=6;step++){
  for(const spec of FIELDS.filter(f=>f.step===step && (f.required || f.mustBeChecked))){
   const input=page.locator(`#${spec.id}`);
   if(spec.kind==='file'){
    const mime=spec.accept?.split(',')[0]??'application/pdf';
    const bytes=Buffer.alloc(Math.max(12,spec.minFileKB??1)*1024,32);
    bytes.write(mime==='application/pdf'?'%PDF-1.4':'\x89PNG\r\n\x1a\n','binary');
    await input.setInputFiles({name:spec.id+(mime==='application/pdf'?'.pdf':'.png'),mimeType:mime,buffer:bytes});
   }else if(spec.kind==='select')await input.selectOption(spec.options![0]!.value);
   else if(spec.kind==='checkbox'){if(spec.mustBeChecked)await input.check();}
   else await input.fill(spec.isDate?'14/03/2007':spec.isPhone?'9876543210':spec.isPincode?'226010':spec.kind==='email'?'demo@example.test':spec.kind==='number'?String(Math.max(spec.min??0,1)):spec.id==='apaar_id'?'123456789012':'DEMO');
  }
  await page.getByRole('button',{name:step===6?'Review Application':'Save & Next'}).click();
 }
 await expect(page.getByRole('heading',{name:'Review your application'})).toBeVisible();
 await page.getByRole('button',{name:'Final Submit'}).click();
 await expect(page.getByTestId('application-ref')).toBeVisible();
 await expect(page.getByText(/source: Manual form/)).toBeVisible();
});

test('partner creates, edits, publishes and archives a form',async({page})=>{
 await login(page,'9000000001');await page.goto('/partner/forms/new');
 const name=`Audit form ${Date.now()}`;
 await page.getByLabel('Form name',{exact:true}).fill(name);
 await page.getByLabel('Return URL',{exact:true}).fill(`${PORTAL}/api/praman/callback`);
 await page.locator('summary').filter({hasText:/^Identity/}).click();
 const fullName=page.getByRole('checkbox',{name:'Full name (as on Aadhaar)',exact:true});
 await page.locator('[data-slot="checkbox-content"]').filter({has:fullName}).click();await expect(fullName).toBeChecked();
 await pick(page,'Status','draft');
 await page.getByTestId('form-save').click();await expect(page.getByRole('heading',{name,exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Edit',exact:true}).click();await page.getByLabel('Description',{exact:true}).fill('Created through the audit browser workflow.');await page.getByTestId('form-save').click();
 await expect(page.getByText(/v2 · draft/)).toBeVisible();
 await page.getByRole('button',{name:'Publish',exact:true}).click();await expect(page.getByRole('button',{name:'Unpublish',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Archive',exact:true}).click();await expect(page.getByText(/v2 · archived/)).toBeVisible();
});

test('operations admin creates and toggles a persisted feature flag',async({page})=>{
 await login(page,'9000000000');await page.goto('/admin/flags');
 const key=`audit_${Date.now()}`;
 await page.getByPlaceholder('new_flag_key').fill(key);await page.getByRole('button',{name:'Add flag'}).click();
 const toggle=page.getByRole('switch',{name:`Toggle ${key}`});const control=page.locator('[data-slot="switch-content"]').filter({has:toggle});await expect(toggle).not.toBeChecked();await control.click();await expect(toggle).toBeChecked();
 await expect(page.getByText(`${key} on`,{exact:true})).toBeVisible();
 await page.reload();await expect(toggle).toBeChecked();await control.click();await expect(toggle).not.toBeChecked();await expect(page.getByText(`${key} off`,{exact:true})).toBeVisible();
});

test('notification switches persist and consent notices stay protected',async({page})=>{
 await login(page);await page.goto('/app/settings/notifications');
 const toggle=page.getByRole('switch',{name:'Applications via Email',exact:true});
 const control=page.locator('[data-slot="switch-content"]').filter({has:toggle});
 const initial=await toggle.isChecked();await control.click();await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText('Preferences saved',{exact:true})).toBeVisible();
 await page.reload();await expect(toggle).toBeChecked({checked:!initial});
 await expect(page.getByRole('switch',{name:'Consent via In-app',exact:true})).toBeDisabled();
 await control.click();await page.getByRole('button',{name:'Save',exact:true}).click();await expect(page.getByText('Preferences saved',{exact:true})).toBeVisible();
});
