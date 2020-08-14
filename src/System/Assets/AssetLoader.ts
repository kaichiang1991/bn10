import { LoaderResource, Loader } from "pixi.js-legacy";
// import "pixi-sound"
// import "pixi-spine"
import { App } from "../../main"
import Debug from "../../Lib/Debug";

export default class AssetLoader{
    
    private static errorLists: Array<string>;

    /**
     * 讀取資源
     * @param lists 檔案的陣列列表
     * @param callback 讀取完的 callback
     * @param option 
     */
    public static async loadAsset(lists: Array<string>, callback?: Function, option?: any): Promise<void>{
        return new Promise<void>((res, rej) =>{

            // 載入列表中的檔案
            lists.forEach(list =>{
                App.loader.add(list, option)
                .onError.add((err, loader, resource) => this.loadError(err, loader, resource))
            })

            App.loader.load((loader, resource) =>{
                callback && callback(lists)
                this.loadComplete(res, rej)
            })           
        })
    }

    /**
     * 讀取錯誤時處理
     * @param err 
     * @param loader 
     * @param resource 
     */
    private static loadError(err, loader: Loader, resource: LoaderResource ){

        if(this.errorLists == undefined){
            this.errorLists = new Array<string>();
        }
        // 把錯誤的url存起來
        if(this.errorLists.indexOf(resource.url) < 0)
            this.errorLists.push(resource.url)
    }

    /**
     * 讀取完成後的處理
     * @param successFunc 
     * @param failFunc 
     */
    private static loadComplete(successFunc: Function, failFunc: Function){

        // 判斷有沒有錯誤
        if(this.errorLists && this.errorLists.length > 0){
            Debug.Error('load asest fail', ...this.errorLists)
            // failFunc();
        }else{

        }
        successFunc();
        this.errorLists = undefined;
    }

    /**
     * 取得資源
     * 若還沒讀取則重新讀取
     * @param name 資源的路徑 (完整 url)
     */
    public static async getAsset(name: string): Promise<LoaderResource>{

        let result: LoaderResource = App.loader.resources[name];
        if(!result){
            Debug.Warn('get asset no result.', name)
            Debug.Warn('asset reload');
            await this.loadAsset([name]);
            result = App.loader.resources[name];
        }
        return result;
    }

}