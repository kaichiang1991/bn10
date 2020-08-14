import { decodeBase64 } from "../../Lib/Tool";

/** url 需要解析的結構 */
class urlParameter{
    public token: string;
    public language: string;
    public gameServer: string;
    public betQuery: string;
    public exitUrl: string

    constructor(_token: string, _language: string, _gameServer: string, _betQuery: string, _exitUrl: string){
        this.token = _token;
        this.language = _language;
        this.gameServer = _gameServer
        this.betQuery = _betQuery
        this.exitUrl = _exitUrl
    }
}

export let gameUrlParameter: urlParameter;

// 預設的參數
enum eDefaultPara{
    token = '',
    language = 'en',
}

export default class urlParser{

    /** 解析 url，並存入 gameUrlParameter */
    public static parseUrl(){

        let urlParser = PIXI.utils.url;
        let urlObj = urlParser.parse(document.URL)
        let obj = {token: eDefaultPara.token, language: eDefaultPara.language}

        let query: string = urlObj.query;
        if(query){     
            let tokens: Array<string> = query.split('&')
            tokens.forEach(token =>{
                let arg: Array<string> = token.split('=');
                obj[arg[0]] = arg[1]
            })
        }

        let _gameServer: string, _betQuery: string;
        if(obj['s']){                   // 有收到從server來的資訊
            let decode: string = decodeBase64(obj['s'])
            _gameServer = decode.split(',')[0]
            _betQuery = decode.split(',')[1]
        }else if(envGameServer){        // 利用環境給的
            _gameServer = envGameServer.trim()
        }else{                          // 使用預設值
            _gameServer = '192.168.1.193:12201'
        }

        let _exitUrl: string = ''       // 離開按鈕傳送的 url
        if(obj['r']){
            _exitUrl = decodeBase64(obj['r'])    
        }
        // 把字串拼起來
        _gameServer = ((location.protocol == 'http:')? 'ws://' : 'wss://') + _gameServer + '/gameserver'

        gameUrlParameter = new urlParameter(obj['token'], obj['language'], _gameServer, _betQuery, _exitUrl)
    }
} 