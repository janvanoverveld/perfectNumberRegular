import * as child from 'child_process';
import {perfectNumberServer} from './perfectNumberServer';
import {Message,CALC,RESULT,BYE} from './Messages';
import {sendMessage} from './sendMessage';

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
                         } else {
                            console.log(`server on port ${ports[i]} is finished`);
                            //console.log(`${data}`);
                            //console.log(`eind the output data of ${ports[i]}`);
                         }
                       } );
       //console.log(`eind sumOfDivisor server for port ${ports[i]}   ${new Date()} `);
    }
 };

async function starter(){
   console.time("perfectNumberTiming");
   const localhost='localhost';
   const perfectNumberPort=30000;
   const sumOfDivisorServers:number[] = [];
   const numberOfNumberToCalculate = 10000;
   const numberOfDivisorServers = 10;
   for ( let port=perfectNumberPort+1
           ; port <= perfectNumberPort + numberOfDivisorServers
           ; port++ ) {
              console.log(`pushing port ${port}`);
              sumOfDivisorServers.push(port);
   }
   executeSumOfDivisorServers(localhost,sumOfDivisorServers);
   perfectNumberServer.start(perfectNumberPort);
   console.log(`perfectNumberServer, versturen van getallen`);
   let index=0;
   for ( let i=0; i<numberOfNumberToCalculate; i++ ){
      //console.log(`perfectNumberServer, sending ${i}`);
      const msg = new CALC(localhost,perfectNumberPort,i);
      await sendMessage(localhost,sumOfDivisorServers[index] ,msg);
      if ( ++index === sumOfDivisorServers.length ) index = 0;
   }
   // indicate all numbers are send
   for ( let i=0; i < sumOfDivisorServers.length; i++){
      await sendMessage(localhost,sumOfDivisorServers[i], new BYE(localhost, perfectNumberPort) );
   }
   let byeCounter=0;
   console.log(`perfectNumberServer, wachten op getallen`);
   while ( byeCounter < numberOfDivisorServers ){
      //console.log(`perfectNumberServer, wachten op ${i}`);
      const msg = await perfectNumberServer.getMessage();
      if ( msg && msg.name === RESULT.name && (<RESULT>msg).sumOfDivisors === (<RESULT>msg).valueToCalculate )
         console.log(`perfect number ${(<RESULT>msg).valueToCalculate}`);
      if ( msg && msg.name === BYE.name ) byeCounter++;
   }
   perfectNumberServer.terminate();
   console.timeEnd("perfectNumberTiming");
}

starter();