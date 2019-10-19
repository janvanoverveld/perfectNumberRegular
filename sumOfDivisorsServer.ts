import * as http from 'http';
import {CALC,RESULT,Message, BYE} from './Messages';
import {sendMessage} from './sendMessage';

const messages:Message[] = [];
var resolver: ((item: Message) => void) | null = null;

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

async function getMessage(): Promise<Message> {
    let promise = new Promise<Message>((resolve, reject) => resolver = resolve );
    tryResolve();
    return promise;
}

function tryResolve(): void {
   if ( resolver ) {
       let item: Message|undefined = undefined;
       item = messages.shift();
       if (item) {
           resolver(item);
           resolver = null;
       }
   }
}

async function processNumbers(host:string,port:number){
   let msg = await getMessage();
   while (true){
      if (msg.name === CALC.name) {
         const calcMessage = <CALC> msg;
         const mapWithSumOfDivisors:Map<number,number>=new Map();
         for ( let i = calcMessage.valueToCalculateFrom; i <= calcMessage.valueToCalculateTo; i++ ){
            mapWithSumOfDivisors.set(i,getSumOfDivisors(i));
         }
         //console.log(`sumOfDivisorServer, sending calculated number ${numberToProcess.valueToCalculate}  and the summation of divisors is ${sumOfDivisors}`);
         for ( let [key,value] of mapWithSumOfDivisors ){
            if (key === value ){
               const resultMsg:RESULT=new RESULT(host,port,key,value);
               await sendMessage(calcMessage.hostFrom,calcMessage.portFrom,resultMsg);
            }
         }
         msg = await getMessage();
      }
      if ( msg.name === BYE.name) {
         const byeMessage = <BYE> msg;
         await sendMessage(byeMessage.hostFrom,byeMessage.portFrom, new BYE(host,port));
         terminate();
         break;
      }
   }
}

function httpSumOfDivisorServerFunction(req:http.IncomingMessage,res:http.ServerResponse):void {
   const httpHeaders = {'cache-control':'no-cache','Content-Type':'application/json','charset':'utf-8'};
   if ( req.method === 'POST' ) {
      let postData:string;
      req.on('data', (data) => { postData = (postData===undefined)?data: postData+data; });
      req.on('end',  () => { try { //console.log(`sumOfDivisorServer, bericht ontvangen  ${postData}`);
                                   messages.push(JSON.parse(postData));
                                   tryResolve();
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
const start:(port:number)=>void = (p) => httpSumOfDivisorServer.listen(p);
const terminate: () => void = () => httpSumOfDivisorServer.close();

const sumOfDivisorsServer = { start: start
,                         terminate: terminate
}

function starter(pars:string[]){
  console.log(`start sumOfDivisor ${pars[2]} server for port ${pars[3]}`);
  if (pars[2] && pars[3]) {
    const host:string = pars[2];
    const port:number = Number(pars[3]);
    sumOfDivisorsServer.start(port);
    processNumbers(host,port);
  }
}

starter(process.argv);
