export default class Debug{
    
    public static objLog: Object = new Object();

    /**
     * 寫入log (同一個 key 值，會 push 進去)
     * @param name log key值
     * @param log 內容
     */
    public static WriteLog(name: string, log: any){
        if(process.env.NODE_ENV == 'production')
            return;
        
        if(!this.objLog[name]){
            this.objLog[name] = new Array<any>();
            this.objLog[name].push(log)
        }else{
            this.objLog[name].push(log)
        }
    }

    public static Log(log: string, ...arg: Array<any>){
        let argStatement: string = '';
        while(arg.length > 0){
            argStatement = argStatement.concat(arg.shift(), ' ')
        }

        console.log(log, argStatement);    
    }

    public static Warn(log: string, ...arg: Array<any>){
        let argStatement: string = '';
        while(arg.length > 0){
            argStatement = argStatement.concat(arg.shift(), ' ')
        }

        console.warn(log, argStatement);    
    }

    public static Error(log: string, ...arg: Array<any>){
        let argStatement: string = '';
        while(arg.length > 0){
            argStatement = argStatement.concat(arg.shift(), '\n')
        }

        console.error(log, '\n', argStatement);
        window.alert(log + '\n' + argStatement)
    }


}