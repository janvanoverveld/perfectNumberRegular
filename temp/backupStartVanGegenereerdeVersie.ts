import * as child from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const mediatorFileName = 'mediator.js';
const logDir = './log';

const tempLOGFOLDER = "log/";
var loggerPerfectNumberResults = fs.createWriteStream( tempLOGFOLDER + 'perfectNumberResults.txt', { flags: 'w' });
var logPerfectNumberResults    = (tekst:string) => { loggerPerfectNumberResults.write(tekst+'\r\n');};
var loggerTiming               = fs.createWriteStream( tempLOGFOLDER + 'timingResults.txt', { flags: 'w' });
var logTiming                  = (tekst:string) => { loggerTiming.write(tekst+'\r\n');};


if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

function writeLogFile(fileName:string,data:string){
    const logFileName=`${__dirname}/../log/${fileName.substr(0,fileName.indexOf('.'))}.log`;
    fs.writeFile( logFileName
    ,             data
    ,             (err) => { if(err) { console.log(`fs error bij ${fileName}`);
                                       console.log(`${err}`); }
                             else {
                                console.log(`logfile ${logFileName}  for ${fileName} was created`);
                                if (fileName!==mediatorFileName) process.stdout.write(data);
                             }
                           } );
}

var resolver: (() => void) | null = null;

async function executeStartP(maxNumbers:number,groupSize:number):Promise<void>{
    let promise = new Promise<void>( resolve => resolver = resolve );
    console.log(`start startP.js ${new Date()} ${maxNumbers}  ${groupSize}  `);
    const parameters = [`${__dirname}/startP.js`];
    parameters.push(`${maxNumbers}`);
    parameters.push(`${groupSize}`);
    child.execFile( 'node'
    , parameters
    , (err,data) => { if (err){
                         console.log(`error bij startP.js`);
                         console.log(`${err}`);
                         writeLogFile('startP.js',err.message);
                      }
                      else writeLogFile('startP.js',data);
                      if (resolver) resolver();
                     } );
    console.log(`eind executeNodeProcess startP.js`);
    return promise;
};

function executeNodeProcess(fileName:string){
    console.log(`start ${fileName}   ${new Date()} `);
    const parameters = [`${__dirname}/${fileName}`];
    child.execFile( 'node'
    , parameters
    , (err,data) => { if (err){
                         console.log(`error bij ${fileName}`);
                         console.log(`${err}`);
                         writeLogFile(fileName,err.message);
                      }
                         else writeLogFile(fileName,data);
                    } );
    console.log(`eind executeNodeProcess ${fileName}`);
};

var timingResolver: ( (number) => void) | null = null;

async function startCountNumbers(totalNumbers:number,groupSize:number):Promise<number>{
   let promise = new Promise<number>( resolve => timingResolver = resolve );
   executeNodeProcess(mediatorFileName);
   const startupLocalProtocolFiles = fs.readdirSync(__dirname).filter((f)=>f.includes('start'));
   for ( const startFile of startupLocalProtocolFiles ){
       if ( startFile !== 'start.js' && startFile !== 'startP.js' ) global.setTimeout( () => executeNodeProcess( startFile ), 500 );
   }
   //console.log(`${totalNumbers}`);
   const startTime = new Date();
   executeStartP(totalNumbers,groupSize).then(
      () => {
         const endTime  = new Date();
         let timeDiff = endTime.getTime() - startTime.getTime();
         timeDiff /= 1000; // strip the ms
         const seconds = Math.round(timeDiff);
         console.log( `${totalNumbers} : ${seconds} seconds`);
         if ( timingResolver ) timingResolver(seconds);
      }
   )
   return promise;
}

var groupResolver: ( () => void) | null = null;

async function startGroup(groupSize:number){
   let promise = new Promise<void>( resolve => groupResolver = resolve );
   console.log(`groupSize ${groupSize}`);
   let totalNumbers:number = 0;
   let timing=0;
   //
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   //
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   //
   //timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   //logTiming(`${groupSize};${totalNumbers};${timing}`);
   //
   //timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   //logTiming(`${groupSize};${totalNumbers};${timing}`);
   //
   startCountNumbers(totalNumbers+=100000,groupSize).then( (t) => {
      logTiming(`${groupSize};${totalNumbers};${t}`);
      if (groupResolver) groupResolver();
   } );
   return promise;
}

async function startMulti(){
    let groupSize:number = 100;
    await startGroup(groupSize);
}

startMulti();
