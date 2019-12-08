import * as http from 'http';
import * as request from 'request';

const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
var   messageResolver: (msg: any) => void;

const httpServer:http.Server = http.createServer(
   (req,res) => {
     let body = '';
     req.on('data', (chunk:string) => body += chunk );
     req.on('end',  () => { messageResolver(JSON.parse(body));
                            res.write("OK");
                            res.end(); } );
   }
);

async function waitForMessage():Promise<any>{
   let promise = new Promise<any>( resolve => messageResolver = resolve );
   return promise;
}

async function sendMessage (host:string, port:number,msg:any) {
    let resolver: () => void;
    const promise = new Promise( resolve => resolver = resolve );
    const httpInfo = { url: `http://${host}:${port}`
                 , headers: httpHeaders
                    , body: msg
                    , json: true };
    request.post( httpInfo, () => resolver() );
    return promise;
}

//
// berekenen van sum van divisors
function getSumOfDivisors(numberToCheck:number):number{
   let   sumDivisors = 0;
   const halfOfNumberToCheck = Math.ceil(numberToCheck/2);
   for ( let i=halfOfNumberToCheck; i>0; i-- ){
      if ( numberToCheck%i === 0 ){
         sumDivisors += i;
         if ( sumDivisors > numberToCheck ) break;
      }
   }
   return sumDivisors;
}

async function processNumbers(host:string,port:number){
   const calcMessagesArray:any[] = [];
   let msg = await waitForMessage();
   while (true){
      if ( msg.name && msg.name === 'CALC') {
         calcMessagesArray.push(msg);
         msg = await waitForMessage();
      }
      if ( msg.name && msg.name === 'BYE') {
         for ( const calc of calcMessagesArray ){
            for ( let i=calc.valueToCalculateFrom; i<=calc.valueToCalculateTo; i++){
               const sumOfDivisors = getSumOfDivisors(i);
               if ( i === sumOfDivisors ){
                  const resultMsg= {name:'RESULT',portFrom:port,valueToCalculate:i,sumOfDivisors:sumOfDivisors};
                  await sendMessage(calc.hostFrom, calc.portFrom,resultMsg);
               }
            }
         }
         await sendMessage(msg.hostFrom,msg.portFrom, {name:'BYE',hostFrom:host,portFrom:port});
         setTimeout( () => httpServer.close(), 50 );
         break;
      }
   }
}

function starter(pars:string[]){
  console.log(`start sumOfDivisor ${pars[2]} server for port ${pars[3]}`);
  if (pars[2] && pars[3]) {
    const host:string = pars[2];
    const port:number = Number(pars[3]);
    httpServer.listen(port);
    processNumbers(host,port);
  }
}

starter(process.argv);
