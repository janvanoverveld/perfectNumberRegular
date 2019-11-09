import * as child from 'child_process';
import {perfectNumberServer} from './perfectNumberServer';
import {Message,CALC,RESULT,BYE} from './Messages';
import {sendMessage} from './sendMessage';
import * as fs from 'fs';

const tempLOGFOLDER = "log/";
var loggerPerfectNumberResults = fs.createWriteStream( tempLOGFOLDER + 'perfectNumberResults.txt', { flags: 'w' });
var logPerfectNumberResults    = (tekst:string) => { loggerPerfectNumberResults.write(tekst+'\r\n');};
var loggerTiming               = fs.createWriteStream( tempLOGFOLDER + 'timingResults.txt', { flags: 'w' });
var logTiming                  = (tekst:string) => { loggerTiming.write(tekst+'\r\n');};

//const sleep:(ms:number) => void = async (m) => new Promise(resolve => setTimeout(resolve, m));

function executeSumOfDivisorServers(host:string, ports:number[]){
    for ( let i=0; i<ports.length; i++ ) {
       //console.log(`start sumOfDivisor ${host} server for port ${ports[i]}   ${new Date()} `);
       child.exec( `node sumOfDivisorsServer.js ${host} ${ports[i]}`
       , {cwd:`./js`}
       , (err,data) => { if (err){
                            console.log(`error with port ${ports[i]}`);
                            console.log(`${err}`);
                            console.log(`data with ${ports[i]}`);
                            console.log(`${data}`);
                         }
                           //else {
                            //console.log(`server on port ${ports[i]} is finished`);
                            //console.log(`${data}`);
                            //console.log(`eind the output data of ${ports[i]}`);
                           //}
                       } );
       //console.log(`eind sumOfDivisor server for port ${ports[i]}   ${new Date()} `);
    }
};

var resolver: (() => void) | null = null;

async function starter(numberOfNumberToCalculate:number, numberGroupSize:number){
   let promise = new Promise<void>( resolve => resolver = resolve );
   const localhost='localhost';
   const perfectNumberPort=30000;
   const sumOfDivisorServers:number[] = [];
   const numberOfDivisorServers = 5;
   for ( let port=perfectNumberPort+1
           ; port <= perfectNumberPort + numberOfDivisorServers
           ; port++ ) {
              //console.log(`pushing port ${port}`);
              sumOfDivisorServers.push(port);
   }
   executeSumOfDivisorServers(localhost,sumOfDivisorServers);
   //console.time("perfectNumberTiming");
   perfectNumberServer.start(perfectNumberPort);
   //console.log(`perfectNumberServer, versturen van getallen`);
   let index=0;
   for ( let i=0; i<numberOfNumberToCalculate; i += numberGroupSize ){
      //console.log(`perfectNumberServer, sending ${i}`);
      const msg = new CALC(localhost,perfectNumberPort,i,(i+numberGroupSize-1));
      await sendMessage(localhost,sumOfDivisorServers[index],msg);
      if ( ++index === sumOfDivisorServers.length ) index = 0;
   }
   // indicate all numbers are send
   for ( let i=0; i < sumOfDivisorServers.length; i++){
      await sendMessage(localhost,sumOfDivisorServers[i], new BYE(localhost, perfectNumberPort) );
   }
   let byeCounter=0;
   //console.log(`perfectNumberServer, wachten op getallen`);
   const perfectNumberArray:number[] = [];
   while ( byeCounter < numberOfDivisorServers ){
      //console.log(`perfectNumberServer, wachten op ${i}`);
      const msg = await perfectNumberServer.getMessage();
      if ( msg && msg.name === RESULT.name && (<RESULT>msg).sumOfDivisors === (<RESULT>msg).valueToCalculate )
         //console.log(`perfect number ${(<RESULT>msg).valueToCalculate}`);
         perfectNumberArray.push((<RESULT>msg).valueToCalculate);
      if ( msg && msg.name === BYE.name ) byeCounter++;
   }
   perfectNumberServer.terminate().then( () => {
      //console.log(`${perfectNumberArray}`);
      logPerfectNumberResults(`${numberOfNumberToCalculate}-${numberGroupSize}-->${perfectNumberArray}`);
      if (resolver) resolver();
   });
   //console.timeEnd("perfectNumberTiming");
   return promise;
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
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
   //
   timing = await startCountNumbers(totalNumbers+=100000,groupSize);
   logTiming(`${groupSize};${totalNumbers};${timing}`);
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