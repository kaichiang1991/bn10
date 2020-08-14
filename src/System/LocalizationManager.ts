import GameSpineManager from "./Assets/Spine/GameSpineManager";
import Loading from "../Game/Loading";
import SpineManager from "./Assets/Spine/SpineManager";
import GameAssetManager from "./Assets/GameAssetManager";
import AssetLoader from "./Assets/AssetLoader";
import { appConfig } from "./Config/GameConfig";

// 語言的定義
// 語言的定義
export enum eLanguage {
    CHS = 'zh-cn',
    ENG = 'en',
    VI = 'vi',
    TH = 'th',
    
    default = ENG,
}

// 對應語系的資料夾名稱
export enum eLanguageMap{
    'zh-cn' = 'CHS',
    'en'    = 'ENG',
    'vi'    = 'VI',
    'th'    = 'TH'
}

// 多語系的分類
enum eTextType{
    game = 'game',
    system = 'system'
}

/** 多語系的管理 */
export default class LocalizationManager{

    private static language: string;
    private static jsonData;

    /**
     * 初始化多語系，並決定要使用的文本
     * @param _language 
     */
    public static async init(_language: string){
        this.language = eLanguage.default;
        if(Object.values(eLanguage).includes(_language as eLanguage)){
            this.language = _language
        }

        let url: string = `${appConfig.assetPrefix}language/${this.language}.json`;
        await AssetLoader.loadAsset([url])
        let res = await AssetLoader.getAsset(url)
        this.jsonData = res.data;

        GameAssetManager.setLangauge(this.language)
        Loading.setLangugae(this.language)
        GameSpineManager.setLanguage(this.language)
        SpineManager.setLangauge(this.language)
    }

    /** 取得遊戲語系 */
    public static getLanguage(): string{
        if(!this.language)
            this.language = eLanguage.default;
        return this.language;
    }

    /**
     * 取得遊戲內的文本 
     * @id 文本的編號 / 代碼
     */
    public static gameText(id: string | number): string{
        return this.getText(eTextType.game, id.toString());
    }

    /**
     * 取得系統的文本 
     * @id 文本的編號 / 代碼
     */
    public static systemText(id: string | number): string{
        return this.getText(eTextType.system, id.toString())
    }
    
    /**
     * 取得文本
     * @param type 文本種類
     * @param id 編號 / 代碼
     */
    private static getText(type: eTextType, id: string): string{
        let str: string = this.jsonData[type][id];
        return str;
    }
}