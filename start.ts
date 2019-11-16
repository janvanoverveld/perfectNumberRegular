import * as child from 'child_process';
import * as fs from 'fs';

const tempLOGFOLDER = "log/";
var loggerTiming               = fs.createWriteStream( tempLOGFOLDER + 'timingResults.txt', { flags: 'w' });
var logTiming                  = (tekst:string) => { loggerTiming.write(tekst+'\r\n');};

const sleep:(ms:number) => void = async (m) => new Promise(resolve => setTimeout(resolve, m));

var perfectNumberResolver: (() => void) | null = null;

async function executePerfectNumberServer(host:string, port:number, totalNumbers:number, groupSize:number ){
   let promise = new Promise( resolve => perfectNumberResolver = resolve );
   console.log(`node perfectNumberServer.js ${host} ${port} ${totalNumbers} ${groupSize}`);
   child.exec( `node perfectNumberServer.js ${host} ${port} ${totalNumbers} ${groupSize}`
   , {cwd:`./js`}
   , (err,data) => { if (err){ console.log(`error executePerfectNumberServer`);
                               console.log(`${err}`); };
                     console.log(`resolve van perfectNumberServer`);
                     if (perfectNumberResolver) perfectNumberResolver();
                   } );
   return promise;
};

function executeSumOfDivisorServers(host:string, ports:number[]){
    for ( let i=0; i<ports.length; i++ ) {
       child.exec( `node sumOfDivisorsServer.js ${host} ${ports[i]}`
       , {cwd:`./js`}
       , (err,data) => { if (err){
                            console.log(`error with port ${ports[i]}`);
                            console.log(`${err}`);
                            console.log(`data with ${ports[i]}`);
                            console.log(`${data}`);
                         }
                         //console.log(`sumOfDivisorsServer.js is opgestart ${ports[i]}`);
                       } );
    }
};

var globalStartPortNumber=30000;

async function starter(numberOfNumberToCalculate:number, numberGroupSize:number){
   const localhost='localhost';
   const sumOfDivisorServers:number[] = [];
   const perfectNumberPort = globalStartPortNumber++;
   for ( let i=0; i< 5; i++ ) {
      //console.log(`pushing port ${globalStartPortNumber}`);
      sumOfDivisorServers.push(globalStartPortNumber++);
   }
   //console.log(`start execute divisors servers`);
   executeSumOfDivisorServers(localhost,sumOfDivisorServers);
   //console.log(`slapen`);
   // give divisors servers time to startup
   await sleep(100);
   //console.log(`starten perfect number server`);
   let bla1 = new Date();
   await executePerfectNumberServer (localhost,perfectNumberPort,numberOfNumberToCalculate,numberGroupSize);
   let bla2 = new Date();
   let timeDiff = bla2.getTime() - bla1.getTime();
   timeDiff /= 1000; // strip the ms
   const seconds = Math.round(timeDiff);
   console.log( `bla ${numberOfNumberToCalculate} : ${seconds} seconds`);
}

var timingResolver: ( (number) => void) | null = null;

async function startCountNumbers(totalNumbers:number,groupSize:number):Promise<number>{
   let promise = new Promise<number>( resolve => timingResolver = resolve );
   //console.log(`${totalNumbers}`);
   const startTime = new Date();
   starter(totalNumbers,groupSize).then(
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
   //console.log(`groupSize ${groupSize}`);
   let totalNumbers:number = 0;
   let timing=0;
   // 1
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 2
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 3
   /*
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 4
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 5
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 6
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 7
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 8
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   // 9
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   */
   // 10
   startCountNumbers(totalNumbers+=100000,groupSize).then( (t) => {
      const logText = `${groupSize};${totalNumbers};${t}`;
      console.log(logText);
      logTiming(logText);
      if (groupResolver) groupResolver();
   } );
   return promise;
}

async function startMulti(){
   //1
   await startGroup(100);
   await startGroup(1000);
   await startGroup(10000);
   //2
   /*
   await startGroup(100);
   await startGroup(1000);
   await startGroup(10000);
   //3
   await startGroup(100);
   await startGroup(1000);
   await startGroup(10000);
   //4
   await startGroup(100);
   await startGroup(1000);
   await startGroup(10000);
   //5
   await startGroup(100);
   await startGroup(1000);
   await startGroup(10000);
   */
}

startMulti();