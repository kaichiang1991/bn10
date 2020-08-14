import SpineManager, { ISpineConfig } from "./SpineManager";
import { App } from "../../../main";
import Debug from "../../../Lib/Debug";
import { Container, spine, Graphics } from "pixi.js-legacy";
import { eLayer, appConfig, eBigWinLayer } from "../../Config/GameConfig";
import { eLanguage, eLanguageMap } from "../../LocalizationManager";
import { eBigWinType } from "../../../Game/Win/BigWin/BigWinManager";
import { TimelineLite } from "gsap";
import Sleep from "../../../Lib/Sleep";
import { killTween } from "../../../Lib/Tool";

export default class GameSpineManager{

    // url 對應的完整路徑
    private static urlMap = {
        'BaseUI'            :'img/panda/BaseUI.json',
        'Symbol'            :'img/panda/Symbol.json',
        'ReelExpect'        :'img/panda/ReelExpect.json',
        'Line'              :'img/panda/Line.json',
        'FreeGameAnimation' :'img/panda/FreeGameAnimation.json',
        'FreeGameUI'        :'img/panda/FreeGameUI.json',
        'BigWin'            :'img/panda/BigWin.json',
        'PandaJump'         :'img/panda/PandaJump.json',
        'BaseUIMask'        :'img/panda/BaseUIMask.json',
    }


    private static baseGameUI: spine.Spine;
    public static get BaseGameUI(): spine.Spine {return this.baseGameUI}
    private static baseGameWord: spine.Spine;

    private static freeGameUI: spine.Spine;
    public static get FreeGameUI(): spine.Spine {return this.freeGameUI}
    private static freeGameWord: spine.Spine
    private static freeGameTitleWord: spine.Spine

    private static gameUIBlack: Graphics;
    private static UIBlackFadeTween: TimelineLite;
    private static pandaJump: spine.Spine;

    // BigWin
    private static bigWin: spine.Spine
    private static bigWinBg: spine.Spine

    private static line: spine.Spine
    private static singleLineTrackIndex: number
    private static UIMask: spine.Spine

    /**
     * 設定語言
     * @param language 
     */
    public static setLanguage(language: string){
        this.urlMap['Loading']  = `img/panda/${eLanguageMap[language]}/Loading.json`
        this.urlMap['Word']  = `img/panda/${eLanguageMap[language]}/Word.json`
        this.urlMap['PayTable']  = `img/panda/${eLanguageMap[language]}/PayTable.json`
    }

    /**
     * 取得完整的 url
     * @param atlas urlMap 裡面的 key 值
     */
    public static getFullUrl(atlas: string): string{
        let url: string;
        Object.keys(this.urlMap).forEach(name => {
            if(name == atlas){
                url = this.urlMap[name];
            }
        });
        if(url == undefined){
            Debug.Error('spine get full url fail', atlas);
        }
        return url;
    }
 
    /** 撥放 loading 動畫 */
    public static async playLoading(){
        let url: string = appConfig.assetPrefix + this.getFullUrl('Loading');
        let spine: spine.Spine = await SpineManager.createSpine(url)
        spine.state.setAnimation(0, 'LoadingBackground', true)
        return spine;
    }

    /** 撥放 baseGameUI */
    public static async playBaseGameUI(){

        this.closeFreeGameUI();

        if(this.baseGameUI){
            Debug.Warn('playBaseGameUI. UI exist')
            return;
        }

        let parent = App.stage;
        let url: string = this.getFullUrl('BaseUI');
        this.baseGameUI = await SpineManager.playNewSpine(parent, url, 'BaseGameBackground', false);
        this.baseGameUI.zIndex = eLayer.GameBackground;
        this.baseGameUI.sortableChildren = true
        this.baseGameUI.name = 'baseGameUI'
        SpineManager.setAnimationWithLatestTrack(this.baseGameUI, 'BaseGameUI', true)
        
        url = this.getFullUrl('Word')
        this.baseGameWord = await SpineManager.playNewSpine(parent, url, 'Logo_Idle', true)
        this.baseGameWord.zIndex = eLayer.Logo
        this.baseGameWord.name = 'baseGameWord'
    }

    /**
     * 撥放期待框動畫
     * @param column 在第幾輪
     */
    public static async playReelExpect(column: number): Promise<spine.Spine>{
        let parent = App.stage;
        let url: string = this.getFullUrl('ReelExpect');
        let reelExpect = await SpineManager.playNewSpine(parent, url, `ReelExpect_0${column+1}`, true)
        reelExpect.zIndex = eLayer.reelExpect
        reelExpect.name = 'reelExpect'
        return reelExpect;
    }

    /** 撥放特殊機制的熊貓動畫 */
    public static async playPandaJump(){
        if(this.pandaJump){
            Debug.Warn('playPandaJump', 'pandaJump exist.')
            return
        }
        
        let animName: string = 'PandaJump'
        let parent = App.stage;
        let url: string = this.getFullUrl('PandaJump')
        this.pandaJump = await SpineManager.playNewSpine(parent, url, animName)
        this.pandaJump.zIndex = eLayer.pandaJump
        this.pandaJump.name = 'pandaJump'
    }

    public static endPandaJump(){
        if(this.pandaJump){
            SpineManager.endSpine(this.getFullUrl('PandaJump'), this.pandaJump)
            this.pandaJump = null
        }
    }

    /**
     * 撥放 symbol 動畫
     * @param _parent 父節點
     * @param symbolAnim 動畫名稱
     * @param config 
     */
    public static async playSymbol(_parent: Container, symbolAnim: string, loop: boolean = false): Promise<PIXI.spine.Spine>{
        
        let url: string = this.getFullUrl('Symbol');
        let symbol: PIXI.spine.Spine = await SpineManager.playNewSpine(_parent, url, symbolAnim, loop)
        return symbol;
    }

    /**
     * 撥放蓋住盤面的黑色UI
     * 原本是用Spine做，現已移除，改用程式
     */
    public static async playGameUIBlack(){

        // ToDo
        if(!this.gameUIBlack){
            this.gameUIBlack = new Graphics()
            .beginFill(0x000000, 0.8)
            .drawRect(215, 98, 857, 492)
            .endFill()

        }else{
            // 強制關掉fadeTween 避免visible後繼續衰減alpha
            if(this.UIBlackFadeTween && this.UIBlackFadeTween.isActive()){
                this.UIBlackFadeTween.kill();
                this.UIBlackFadeTween = null;
            }
        }

        let gameUI: spine.Spine = this.baseGameUI? this.baseGameUI: this.freeGameUI
        gameUI.addChild(this.gameUIBlack)
        this.gameUIBlack.alpha = 1
        this.gameUIBlack.visible = true
    }

    /** 關閉黑色UI的顯示 */
    public static async clearGameUIBlack(){
        if(this.gameUIBlack && this.gameUIBlack.alpha != 0){

            // 淡出
            if(!this.UIBlackFadeTween){
                this.UIBlackFadeTween = new TimelineLite()
            }

            this.UIBlackFadeTween.to(this.gameUIBlack, 0.5, {alpha: 0})
            this.UIBlackFadeTween.eventCallback('onComplete', ()=>{
                killTween(this.UIBlackFadeTween)
                this.gameUIBlack.visible = false;
                this.gameUIBlack.alpha = 1;
            })
        }
    }

    /**
     * 撥放線獎
     * @param parent 父節點
     * @param lineAnim 動畫名稱
     */
    public static playLine(lineAnim: string){
        if(!this.line){
            Debug.Error('playLine fail', 'no line')
            return
        }
        return SpineManager.setAnimationWithLatestTrack(this.line, lineAnim, false)       
    }

    public static playSingleLine(lineAnim: string){
        if(!this.line){
            Debug.Error('playSingleLine fail', 'no line')
            return
        }

        this.endSingleLine()

        let track = this.playLine(lineAnim)
        this.singleLineTrackIndex = track.trackIndex
    }

    /** 預先取得 line 的 spine，避免呼叫playLine時沒有line */
    public static async initLine(){
        let parent: Container = App.stage
        let url: string = this.getFullUrl('Line');
        this.line = await SpineManager.playNewSpine(parent, url, 'Line_01', false);
        this.line.zIndex = eLayer.Line;  
        this.line.state.clearTracks()
        this.singleLineTrackIndex = -1
    }

    public static endSingleLine(){
        if(!this.line || this.singleLineTrackIndex == -1){
            return
        }
        this.line.state.setEmptyAnimation(this.singleLineTrackIndex, 0)
        this.singleLineTrackIndex = -1
    }

    /** 結束Line演出，將this.line節點放回pool裡面 */
    public static endLine(){
        if(this.line){
            SpineManager.endSpine(this.getFullUrl('Line'), this.line)
            this.line = null
        }
        this.singleLineTrackIndex = -1
    }
    
    public static async initLineBackground(){
        let parent = App.stage
        let url: string = this.getFullUrl('BaseUIMask')
        this.UIMask = await SpineManager.playNewSpine(parent, url, 'BaseGameMask_1_1')
        this.UIMask.zIndex = eLayer.LineBackground
        this.UIMask.state.clearTracks()
        this.UIMask.name = 'uimask'
    }

    public static clearLineBackground(){
        if(this.UIMask){
            SpineManager.endSpine(this.getFullUrl('BaseUIMask'), this.UIMask)
            this.UIMask = null
        }
    }

    public static clearLineBackgroundTrack(){
        if(this.UIMask){
            this.UIMask.state.setEmptyAnimations(0)
        }
    }

    public static playLineBackground(animNameArr: Array<string>){
        if(!this.UIMask){
            Debug.Error('playLineBackground fail', 'no UIMask')
            return
        }
        for(let animName of animNameArr){
            SpineManager.setAnimationWithLatestTrack(this.UIMask, animName, false)
        }
    }
    
    /** 撥放 FreeGame 次數的提示 */
    public static async playFreeGameHint(parent: Container){
        if(this.freeGameTitleWord){
            Debug.Warn('playFreeGameHint', 'freeGameTitleWord already exist')
            return
        }

        let url: string = this.getFullUrl('Word')
        this.freeGameTitleWord = await SpineManager.playNewSpine(parent, url, 'Congratulations', false)
        SpineManager.addAnimation(this.freeGameTitleWord, 'CongratulationsLoop', true)
    }

    public static clearFreeGameHint(){
        if(this.freeGameTitleWord){
            SpineManager.endSpine(this.getFullUrl('Word'), this.freeGameTitleWord)
            this.freeGameTitleWord = null
        }
    }

    /** 撥放 freeGame 最後的贏分提示 */
    public static async playFreeGameWin(parent: Container){
        if(this.freeGameTitleWord){
            Debug.Warn('playFreeGameWin', 'freeGameTitleWord already exist')
            return
        }

        let url: string = this.getFullUrl('Word')
        this.freeGameTitleWord = await SpineManager.playNewSpine(parent, url, 'FreeGameWin', false)
        SpineManager.addAnimation(this.freeGameTitleWord, 'FreeGameWinLoop', true)
    }

    public static clearFreeGameWin(){
        if(this.freeGameTitleWord){
            SpineManager.endSpine(this.getFullUrl('Word'), this.freeGameTitleWord)
            this.freeGameTitleWord = null
        }
    }
    
    /** 撥放freeGame的UI */
    public static async playFreeGameUI(){

        this.closeBaseGameUI();

        if(this.freeGameUI){
            Debug.Warn('playFreeGameUI. UI exist')
            return;
        }

        let parent = App.stage;
        let url: string = this.getFullUrl('BaseUI');
        this.freeGameUI = await SpineManager.playNewSpine(parent, url, 'FreeGameBackground');
        this.freeGameUI.zIndex = eLayer.GameBackground;
        this.freeGameUI.sortableChildren = true
        SpineManager.setAnimationWithLatestTrack(this.freeGameUI, 'FreeGameUI', true)

        if(this.freeGameWord){
            Debug.Warn('playFreeGameUI. UI word exist')
            return;
        }

        url = this.getFullUrl('Word');
        this.freeGameWord = await SpineManager.playNewSpine(parent, url, 'FreeGameTimesTitle')
        this.freeGameWord.zIndex = eLayer.FreeGameTimesNumber
    }

    /** 撥放 payTable */
    public static async playPayTable(): Promise<spine.Spine>{
        let parent = App.stage;
        let url: string = this.getFullUrl('PayTable');
        let payTable: PIXI.spine.Spine = await SpineManager.playNewSpine(parent, url, 'PayTable_1');
        payTable.parent.removeChild(payTable)
        return payTable;
    }
    
    /** 預先取得 big win 的 spine */
    public static async initBigWinAnim(parent: Container){
        let url: string = this.getFullUrl('BigWin');
        this.bigWinBg = await SpineManager.playNewSpine(parent, url, 'BigWin_01');
        this.bigWinBg.state.clearTracks()
        this.bigWinBg.zIndex = eBigWinLayer.glow
        this.bigWinBg.position.set(0)

        this.bigWin = await SpineManager.playNewSpine(parent, url, 'BigWin_01')
        this.bigWin.state.clearTracks()
        this.bigWin.position.set(appConfig.size.width /2, appConfig.size.height /2 - 111)
        this.bigWin.zIndex = eBigWinLayer.word
    }

    public static async playBigWinGlow(){
        if(!this.bigWinBg){
            Debug.Error('playBigWinGlow fail', 'no bigwinBg')
            return
        }
        SpineManager.setAnimationWithLatestTrack(this.bigWinBg, 'Glow', true)

        await Sleep(500)
        SpineManager.setAnimationWithLatestTrack(this.bigWinBg, 'ShockWave', false)
        return this.bigWinBg
    }

    /**
     * 透過bigWin的型態來撥放bigWin演出
     * 若已有spine，則直接使用切換動畫的方式
     * @param type bigWin / megawin / hugewin
     */
    public static async playBigWinByType(type: eBigWinType){
        
        if(!this.bigWinBg){
            Debug.Error('playBigWinByType fail', 'no bigwin')
            return
        }

        let animPrefixArr = ['BigWin_01', 'BigWin_02', 'BigWin_03', 'BigWin_04']
        SpineManager.setAnimationWithLatestTrack(this.bigWin, `${animPrefixArr[type]}`, true)
        return this.bigWin
    }

    public static async endBigWin(){
        if(this.bigWinBg){
            SpineManager.endSpine(this.getFullUrl('BigWin'), this.bigWinBg)
            this.bigWinBg = null
        }

        if(this.bigWin){
            SpineManager.endSpine(this.getFullUrl('BigWin'), this.bigWin)
            this.bigWin = null
        }
    }
    
    /** 清除 freeGame UI */
    private static closeFreeGameUI(){
        if(this.freeGameUI){
            SpineManager.endSpine(this.getFullUrl('BaseUI'), this.freeGameUI)
            this.freeGameUI = null
        }

        if(this.freeGameWord){
            SpineManager.endSpine(this.getFullUrl('Word'), this.freeGameWord)
            this.freeGameWord = null
        }
    }

    /** 清除 baseGame UI */
    private static closeBaseGameUI(){
        if(this.baseGameUI){
            SpineManager.endSpine(this.getFullUrl('BaseUI'), this.baseGameUI)
            this.baseGameUI = null
        }

        if(this.baseGameWord){
            SpineManager.endSpine(this.getFullUrl('Word'), this.baseGameWord)
            this.baseGameWord = null
        }
    }
}
