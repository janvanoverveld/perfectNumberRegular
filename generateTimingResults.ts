import * as fs from 'fs';
import * as child from 'child_process';

const tempLOGFOLDER = "log/";
var loggerTiming               = fs.createWriteStream( tempLOGFOLDER + 'timingResults.txt', { flags: 'w' });
var logTiming                  = (tekst:string) => { loggerTiming.write(tekst+'\r\n');};
var loggerPerfectNumberResults = fs.createWriteStream( tempLOGFOLDER + 'perfectNumberResults.txt', { flags: 'w' });
var logPerfectNumberResults    = (tekst:string) => { loggerPerfectNumberResults.write(tekst+'\r\n');};

var resolver: (() => void) | null = null;

async function executeStartScript(groupsize:number, totalNumbers:number){
  let promise = new Promise<void>( resolve => resolver = resolve);
  child.exec( `node start.js ${totalNumbers} ${groupsize}`
       , {cwd:`./js`}
       , (err,data) => { if (err){
                            console.log(`error with ${groupsize} ${totalNumbers}`);
                            console.log(`${err}`);
                         } else {
                            console.log(`finished ${groupsize} ${totalNumbers}`);
                            logPerfectNumberResults(`${groupsize} ${totalNumbers}`);
                            logPerfectNumberResults(`${data}`);
                         }
                         if ( resolver ) resolver();
                       } );
  return promise;
};

async function starter(){
   logTiming('bla1');
   await executeStartScript(100,1000);
   logTiming('bla2');   
   //await executeStartScript(100,2000);
   //await executeStartScript(100,3000);
}

// starter();
//logica zit nu in start.ts



