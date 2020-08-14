import AssetLoader from "../AssetLoader"
import LocalizationManager, { eLanguage, eLanguageMap } from "../../LocalizationManager";
import Debug from "../../../Lib/Debug";
import { BaseTexture, Texture, spine, Container } from "pixi.js-legacy";
import { appConfig } from "../../Config/GameConfig";

export interface ISpineConfig{
    pos?: PIXI.IPoint,
    timeScale?: number,
    loop?: boolean,
}

export default class SpineManager{

    private static readonly spineLists: Object = {
        'img/panda/BaseUI.json' : 2,
        'img/panda/Symbol.json': 45,
        'img/panda/Line.json': 1,
        'img/panda/ReelExpect.json': 2,
        'img/panda/BigWin.json': 2,
        'img/panda/PandaJump.json': 1,
        'img/panda/BaseUIMask.json': 1
    }

    private static exclusiveLists: Array<string> = [
        'img/panda/PandaJump.json',
        'img/panda/Symbol.json',
    ]
    
    private static spinePool: SpinePool;

    public static setLangauge(_language: string){
        this.spineLists[`img/panda/${eLanguageMap[LocalizationManager.getLanguage()]}/Word.json`] = 2
        this.spineLists[`img/panda/${eLanguageMap[LocalizationManager.getLanguage()]}/PayTable.json`] = 1
    }

    public static async loadSpines(){
        let list: Array<string> = Object.keys(this.spineLists).map(list => appConfig.assetPrefix + list)
        await AssetLoader.loadAsset(list, (lists)=> this.setAlphaModeToPMA(lists));
    }

    public static async init(){
        this.spinePool = await new SpinePool().init(this.spineLists)  
    }

    public static async playNewSpine(parent: Container, url: string, animName: string, loop: boolean = false){
        let spine: spine.Spine = await this.spinePool.get(url)

        parent.addChild(spine)
        this.setAnimation(spine, animName, loop)
        spine.visible = true
        return spine
    }

    public static endSpine(url: string, spine: spine.Spine){
        this.spinePool.put(url, spine)
    }

    private static setAlphaModeToPMA(lists: Array<string>){

        let list: Array<string> = this.exclusiveLists.map(list => appConfig.assetPrefix + list)
        let mapBaseTextureArr = Object.keys(PIXI.utils.BaseTextureCache).map(name =>{
            if(lists.find(_list => name.indexOf(_list) > -1 && list.indexOf(_list) < 0) ){
                return PIXI.utils.BaseTextureCache[name]
            }
        })

        mapBaseTextureArr.forEach((baseTexture: BaseTexture) =>{
            baseTexture && ( baseTexture.alphaMode = PIXI.ALPHA_MODES.PMA);
        })
    }
    
    public static async createSpine(url: string){
        let res = await AssetLoader.getAsset(url);
        let _spine: spine.Spine = new spine.Spine(res.spineData)
        return _spine
    }

    public static setAnimation(spine: spine.Spine, animName: string, loop: boolean): spine.core.TrackEntry{
        let trackIndex: number = 0
        return this.setAnimationWithIndex(spine, trackIndex, animName, loop)
    }

    public static setAnimationWithLatestTrack(spine: spine.Spine, animName: string, loop: boolean){
        return this.setAnimationWithIndex(spine, this.getLatestTrackIndex(spine), animName, loop)
    }

    public static setAnimationWithIndex(spine: spine.Spine, trackIndex: number, animName: string, loop: boolean): spine.core.TrackEntry{
        if(!spine){
            Debug.Warn('setAnimationWithIndex:', 'no spine')
            return
        }
        this.resetSpine(spine)
        let track = spine.state.setAnimation(trackIndex, animName, loop)
        return track
    }
        
    private static getLatestTrackIndex(_spine: spine.Spine): number{
        if(!_spine || !_spine.state){
            Debug.Error('getLatestTrackIndex fail')
            return -1;
        }
        
        let trackIndex: number = _spine.state.tracks.length
        for(let i = trackIndex - 1; i >=0; i--){        // 找出沒有在用的index
            if(_spine.state.tracks[i] == null || _spine.state.tracks[i].animation == spine.core.AnimationState.emptyAnimation)
                trackIndex = i;
            else
                break
        }
        return trackIndex
    }
    
    /**
     * 接著目前動畫，新增一組動畫在 track 0
     * @param spine 要新增的spine
     * @param animName 動畫名稱
     * @param loop 是否loop
     * @param delay 銜接時延遲多久 (s)
     * @param mixDuration 兩個動畫的交疊時間 (s)
     */
    public static addAnimation(spine: spine.Spine, animName: string, loop: boolean, delay: number = 0, mixDuration: number = 0): spine.core.TrackEntry{
        let trackIndex: number = 0;
        return this.addAnimationWithIndex(spine, trackIndex, animName, loop, delay, mixDuration)
    }

    /**
     * 接著目前動畫，新增一組動畫在指定 track
     * @param spine 要新增的spine
     * @param animName 動畫名稱
     * @param loop 是否loop
     * @param delay 銜接時延遲多久 (s)
     * @param mixDuration 兩個動畫的交疊時間 (s)
     */
    public static addAnimationWithIndex(spine: spine.Spine, trackIndex: number, animName: string, loop: boolean, delay: number = 0, mixDuration: number = 0): spine.core.TrackEntry{
        if(!spine){
            Debug.Warn('addAnimationWithIndex:', 'no spine')
            return
        }

        let currentAnim: spine.core.Animation = spine.state.getCurrent(trackIndex).animation;
        (mixDuration != 0) && spine.stateData.setMix(currentAnim.name, animName, mixDuration)
        return spine.state.addAnimation(trackIndex, animName, loop, delay)
    }

    /**
     * 重新計時spine的動畫
     * (因為spine裡面的lastTime變數不能更改，所以用這種方式重設他的時間)
     * @param _spine 要重設的spine
     */
    public static async resetSpine(_spine: spine.Spine){
        spine.Spine.globalAutoUpdate = false
        _spine.autoUpdateTransform()
        spine.Spine.globalAutoUpdate = true
    }

    /**
     * 強制spine動畫跳到最後
     * @param spine 要設定的spine
     */
    public static setSpineAnimationToEnd(spine: spine.Spine){
        spine.state.tracks[0].trackTime = spine.state.tracks[0].trackEnd;
    }
}

class SpinePool{

    private objSpine: Object;

    public async init(objList: Object){

        this.objSpine = new Object()
        let url: string

        for(let i = 0; i< Object.keys(objList).length; i++){
            let key: string = Object.keys(objList)[i]
            url = appConfig.assetPrefix + key;
            let arr: Array<spine.Spine> = new Array<spine.Spine>()
            for(let j = 0; j < objList[key]; j++){
                let spine: spine.Spine = await SpineManager.createSpine(url)
                spine.visible = false
                arr.push(spine)
            }
            this.objSpine[key] = arr
        }
        return this
    }

    public async get(key: string){
        let spine: spine.Spine
        if(this.objSpine && this.objSpine[key].length > 0){
            spine = this.objSpine[key].pop()
        }else{
            Debug.Log('SpinePool get fail', key)
            spine = await SpineManager.createSpine(appConfig.assetPrefix + key)
            spine.visible = false
        }
        return spine
    }

    public put(key: string, spine: spine.Spine){
        if(!this.objSpine || !this.objSpine[key]){
            Debug.Warn('SpinePool put fail', key)
            return
        }

        this.reset(spine)
        this.objSpine[key].push(spine)
    }

    public reset(spine: spine.Spine){
        spine.state.timeScale = 1
        spine.name = ''
        // 清空動畫 和 listener
        spine.state.setEmptyAnimations(0)
        spine.autoUpdateTransform()
        spine.state.clearListeners()
        
        // 從畫布上將容器移除
        spine.removeAllListeners()
        spine.parent && spine.parent.removeChild(spine)
    }
}