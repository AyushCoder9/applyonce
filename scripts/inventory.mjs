import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=[...new Set(execFileSync('git',['ls-files','-co','--exclude-standard'],{encoding:'utf8'}).trim().split('\n'))].filter(f=>/\.(tsx?|mjs|md|json|css|sql|ya?ml)$/.test(f)&&!f.startsWith('graphify-out/')&&!f.includes('lock.')&&!f.includes('audit-results')&&!f.endsWith('source-inventory.json'));
const inventory=[];
for(const file of files){try{const source=await readFile(file,'utf8');inventory.push({file,lines:source.split('\n').length,sha256:createHash('sha256').update(source).digest('hex'),kind:file.endsWith('.md')?'documentation':'source/configuration',route:/\/(page|route)\.tsx?$/.test(file),exports:[...source.matchAll(/export\s+(?:async\s+)?(?:function|const|class|type|interface)\s+(\w+)/g)].map(m=>m[1]),headings:file.endsWith('.md')?[...source.matchAll(/^#{1,3}\s+(.+)$/gm)].map(m=>m[1]):undefined,attention:[...source.matchAll(/^.*(?:TODO|FIXME|Coming soon|not implemented|placeholder|stub).*$/gm)].slice(0,10).map(m=>m[0].slice(0,220))});}catch{}}
await writeFile('docs/source-inventory.json',JSON.stringify({at:new Date().toISOString(),files:inventory.length,lines:inventory.reduce((n,f)=>n+f.lines,0),inventory},null,2)+'\n');
console.log(`Read ${inventory.length} source/configuration/documentation files; ${inventory.reduce((n,f)=>n+f.lines,0)} lines. Inventory is coverage metadata, not a claim that every behavior was runtime-tested.`);
