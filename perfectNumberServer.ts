import * as http from 'http';
import {SUM_OF_DIVISORS} from './Messages';

const numberAndSumOfDivisorArray:SUM_OF_DIVISORS[] = [];

function httpPerfectNumberServerFunction(req:http.IncomingMessage,res:http.ServerResponse):void {
   const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
   if ( req.method === 'POST' ) {
      let postData:string;
      req.on('data', (data) => { postData = (postData===undefined)?data: postData+data; });
      req.on('end',  () => { try { //console.log(`perfectNumberServer, bericht ontvangen  ${postData}`);
                                   const numberWithSumOfDivisors:SUM_OF_DIVISORS = JSON.parse(postData);
                                   numberAndSumOfDivisorArray.push(numberWithSumOfDivisors);
                                   tryResolver();
                                   //numberArray.push(JSON.parse(postData).numberToCalculate);
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

var httpServerPerfectNumber:http.Server = http.createServer(httpPerfectNumberServerFunction);

function start(port:number){
   httpServerPerfectNumber.listen(port);
}

function terminate(){
        setTimeout(
           () => { httpServerPerfectNumber.close();
                   console.log('perfectNumberServer, server is afgebroken, het protocol wordt nu geeindigd');
                 }, 5000 );
}

const perfectNumberServer = {
    start: start
,   terminate:terminate
}

let resolver: ((item: SUM_OF_DIVISORS) => void) | null = null;

function tryResolver() {
   if ( resolver ) {
      const item = numberAndSumOfDivisorArray.shift();
      if (item) resolver(item);
   }
}

async function getNumberWithDivisor(): Promise<SUM_OF_DIVISORS> {
   let promise = new Promise<SUM_OF_DIVISORS>( resolve => resolver = resolve );
   tryResolver();
   return promise;
}

export {getNumberWithDivisor,perfectNumberServer}

