export abstract class Message {
    constructor(public name:string, public hostFrom:string, public portFrom:number){};
}

export class TO_CALC extends Message{
    constructor(public hostFrom:string, public portFrom:number, public valueToCalculate:number){
        super(TO_CALC.name, hostFrom, portFrom);
    }
}

export class SUM_OF_DIVISORS extends Message {
    constructor(public hostFrom:string, public portFrom:number, public valueToCalculate:number, public sumOfDivisors:number){
        super(SUM_OF_DIVISORS.name,hostFrom,portFrom);
    }
}