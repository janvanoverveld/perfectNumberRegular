import * as http from 'http';
import {TO_CALC,SUM_OF_DIVISORS} from './Messages';
import {sendMessage} from './sendMessage';

var sumOfDivisorServerHost='localhost';
var sumOfDivisorServerPortNumber=0;

function getSumOfDivisors(numberToCheck:number):number{
    const halfOfNumberToCheck = Math.ceil(numberToCheck/2) + 1;
    let   sumDivisors = 0;
    for ( let j=1; j<numberToCheck; j++){
       if (numberToCheck%j===0) sumDivisors += j;
       if (halfOfNumberToCheck<j) break;
    }
    return sumDivisors;
}

var sumOfDivisorsServerActive:boolean = true;

const numberArray:TO_CALC[] = [];

function processNumbers(){
   const numberToProcess = numberArray.shift();
   if (numberToProcess){
      if (numberToProcess.valueToCalculate === -1) terminate();
      else {
        const sumOfDivisors = getSumOfDivisors(numberToProcess.valueToCalculate);
        //console.log(`sumOfDivisorServer, sending calculated number ${numberToProcess.valueToCalculate}  and the summation of divisors is ${sumOfDivisors}`);
        const msg:SUM_OF_DIVISORS=new SUM_OF_DIVISORS(sumOfDivisorServerHost,sumOfDivisorServerPortNumber,numberToProcess.valueToCalculate,sumOfDivisors);
        sendMessage(numberToProcess.hostFrom,numberToProcess.portFrom,msg);
        setImmediate( () => processNumbers() );
      }
   } else {
      if (!sumOfDivisorsServerActive) return;
      setTimeout( () => processNumbers(), 2000 );
   }
}

function httpSumOfDivisorServerFunction(req:http.IncomingMessage,res:http.ServerResponse):void {
   const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
   if ( req.method === 'POST' ) {
      let postData:string;
      req.on('data', (data) => { postData = (postData===undefined)?data: postData+data; });
      req.on('end',  () => { try { //console.log(`sumOfDivisorServer, bericht ontvangen  ${postData}`);
                                   numberArray.push(JSON.parse(postData));
                                   res.writeHead(200, "OK", httpHeaders);
                                   res.end();
                             }
                             catch (err) {
                                   res.writeHead(400, "wrong message", httpHeaders);
                             } } );
      return;
   }
   res.writeHead(404, "page not found", httpHeaders);
}

const httpSumOfDivisorServer:http.Server = http.createServer(httpSumOfDivisorServerFunction);

function start(host:string, port:number){
    sumOfDivisorServerHost = host;
    sumOfDivisorServerPortNumber = port;
    httpSumOfDivisorServer.listen(sumOfDivisorServerPortNumber);
    processNumbers();
}

function terminate(){
        setTimeout(
           () => { sumOfDivisorsServerActive = false;
            httpSumOfDivisorServer.close();
                   console.log(`sum of Divisor ${sumOfDivisorServerHost} Server for port ${sumOfDivisorServerPortNumber} is being terminated`);
                 }, 5000 );
}

const sumOfDivisorsServer = {
    start: start
,   terminate:terminate
}

function starter(pars:string[]){
  console.log(`start sumOfDivisor ${pars[2]} server for port ${pars[3]}`);
  if (pars[2] && pars[3]) {
    const host:string = pars[2];
    const port:number = Number(pars[3]);
    sumOfDivisorsServer.start(host,port);
  }
}

starter(process.argv);
