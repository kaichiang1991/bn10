import GameSpineManager from "../../System/Assets/Spine/GameSpineManager";
import { App } from "../../main";
import { eSymbolState, eSymbolConfig, eSymbolName, posYArr, posXArr, eSymbolLayer } from "./SymbolDef";
import { Point, spine, Container, IPoint } from "pixi.js-legacy";
import { eLayer } from "../../System/Config/GameConfig";
import Debug from "../../Lib/Debug";
import SpineManager from "../../System/Assets/Spine/SpineManager";

export default class Symbol {

    public spine: spine.Spine;          // 一般 symbol
    private upperSpine: spine.Spine     // 上層的 spine
    private stickTrackIndex: number;
    private winTrackIndex: number;
    private boxTrackIndex: number

    public stickSpine: spine.Spine;     // stick symbol 要貼在上層
    private isStick: boolean;           // 是否有 stick symbol

    private originPos: Point;

    public symbol: number;              // 目前 symbol id

    /**
     * 初始化Symbol
     * @param parent 父節點
     * @param vertical 
     * @param horizon 
     * @param symbol 
     */
    public async init(parent: Container, vertical: number, horizon: number, symbol: number, down: boolean = true): Promise<Symbol> {
        this.symbol = symbol;

        this.spine = await GameSpineManager.playSymbol(parent, this.getSymbolAnimName(symbol, eSymbolState.normal));
        this.spine.position.set(0, posYArr[horizon])

        if(down){
            // 紀錄初始位置
            this.originPos = new Point()
            this.spine.toGlobal(App.stage.position, this.originPos)
            
            // 紀錄每個撥放的軌道
            this.stickTrackIndex = 0
            this.winTrackIndex = 1
            this.boxTrackIndex = 2
        }

        return this
    }

    public end(){
        if(this.spine){
            SpineManager.endSpine(GameSpineManager.getFullUrl('Symbol'), this.spine)
            this.spine = null
        }
        
        if(this.upperSpine){
            SpineManager.endSpine(GameSpineManager.getFullUrl('Symbol'), this.upperSpine)
            this.upperSpine = null
        }
    }

    /**
     * 設定普通的 symbol
     * @param _symbol symbol id
     */
    public setNormalSymbol(_symbol: number){
        this.symbol = _symbol;
        this.playNormalSymbol(_symbol == eSymbolName.WD);
    }
    
    /**
     * 設定模糊的 symbol
     * @param _symbol symbol id
     */
    public setBlurSymbol(_symbol: number){
        this.symbol = _symbol;
        this.playBlurSymbol();
    }
    
    /**
     * 設定結果的 symbol
     * @param _symbol symbol id
     */
    public async setResultSymbol(_symbol: number){
        this.symbol = _symbol;
        this.playResultSymbol();
    }

    /**
     * 撥放得獎動畫
     * 完成一遍時會回傳
     */
    public async playWinAnimation(times: number): Promise<void>{
        return new Promise<void>(async (res, rej) =>{

            this.spine.visible = false
            let animName: string = this.getSymbolAnimName(this.symbol, eSymbolState.win);
            let track;
            if(!this.upperSpine){
                this.upperSpine = await GameSpineManager.playSymbol(App.stage, animName, true)
                track = this.upperSpine.state.tracks[0]
            }else{
                track = SpineManager.setAnimationWithIndex(this.upperSpine, this.winTrackIndex, animName, true)            
            }

            this.upperSpine.position.set(this.originPos.x, this.originPos.y)
            this.upperSpine.zIndex = eLayer.winSymbol
            this.upperSpine.state.timeScale = 1

            let loopCount: number = 0
            track.listener = {
                complete: ()=>{
                    loopCount++
                    if(loopCount == times){
                        track.listener = null
                        res()
                    }
                }
            }
        })
    }

    /**
     * 撥放得獎框動畫
     * @param lineNo 線號
     */
    public async playWinBox(lineNo: number): Promise<void>{
        
        let animName: string = `Symbol_Box_0${lineNo}`;
        let track;
        if(!this.upperSpine){
            this.upperSpine = await GameSpineManager.playSymbol(App.stage, animName, true)
            track = this.upperSpine.state.tracks[0]
        }else{
            track = SpineManager.setAnimationWithIndex(this.upperSpine, this.boxTrackIndex, animName, true)
        }
    
        this.upperSpine.position.set(this.originPos.x, this.originPos.y)
        this.upperSpine.zIndex = eLayer.symbolBox

        // 同時撥放一般symbol
        animName = this.getSymbolAnimName(this.symbol, eSymbolState.normal);
        SpineManager.setAnimationWithIndex(this.upperSpine, this.winTrackIndex, animName, false)
        SpineManager.setAnimation(this.spine, animName, false)
        this.upperSpine.state.timeScale = 0
        this.spine.state.timeScale = 0
    }

    /**
     * 關閉得獎框動畫
     * @param reset 是否要重設，預設為否
     */
    public clearWinBox(clear: boolean = false){
        if(this.upperSpine){
            this.upperSpine.state.setEmptyAnimation(this.boxTrackIndex, 0)
            if(clear){
                SpineManager.endSpine(GameSpineManager.getFullUrl('Symbol'), this.upperSpine)
                this.upperSpine = null
            }
            // this.upperSpine.parent && this.upperSpine.parent.removeChild(this.upperSpine)
        }
    }

    /**
     * 關閉得獎動畫
     * @param reset 是否要重設，預設為否 
     */
    public clearWinAnimation(clear: boolean){
        if(this.upperSpine){
            this.upperSpine.state.setEmptyAnimation(this.winTrackIndex, 0)
            if(clear){
                SpineManager.endSpine(GameSpineManager.getFullUrl('Symbol'), this.upperSpine)
                this.upperSpine = null
            }
            // this.upperSpine.parent && this.upperSpine.parent.removeChild(this.upperSpine)
        }
    }

    /**
     * 清除全部得獎效果 (獎框 + 獎圖)
     * 並恢復一般 symbol 的顯示
     */
    public clearWinEffect(){
        this.clearWinAnimation(true)
        this.clearWinBox(true)
        this.spine.visible = true;
    }

    /** 撥放一般圖片 */
    public async playNormalSymbol(loop: boolean = false) {
        if(!this.spine || (this.symbol == null))
            return;
        
        SpineManager.setAnimation(this.spine, this.getSymbolAnimName(this.symbol, eSymbolState.normal), loop)
        this.spine.state.timeScale = 1
        this.spine.zIndex = eLayer.normalSymbol + eSymbolLayer[eSymbolName[this.symbol]]        // 根據定義調整圖層
        if(this.isStick){
            this.spine.visible = false
        }
    }

    /** 撥放模糊圖片 */
    public async playBlurSymbol(loop: boolean = false) {
        if(!this.spine || (this.symbol == null))
            return;
        
        this.spine.state.timeScale = 1
        SpineManager.setAnimation(this.spine, this.getSymbolAnimName(this.symbol, eSymbolState.blur), loop)
        this.spine.zIndex = eLayer.normalSymbol + eSymbolLayer[eSymbolName[this.symbol]]
    }

    /** 撥放落定動畫 */
    public async playResultSymbol() {
        if(!this.spine || (this.symbol == null))
            return;
        
        if(!this.hasEndSpinAnim(this.symbol))
            return;
            
            // ToDo 還沒做
        if(this.upperSpine){
            Debug.Warn('playResultSymbol', 'upperSpine already exist')
        }

        // this.spine.visible = false;
        // this.winSpine.visible = true
        // this.winSpine.state.timeScale = 1;
        // let track = SpineManager.setAnimation(this.winSpine, this.getSymbolAnimName(this.symbol, eSymbolState.normal), false)
        // track.listener = {
        //     complete: ()=>{
        //         this.winSpine.visible = false;
        //         this.spine.visible = true
        //         track.listener = null;
        //     }
        // }
    }
    
    /**
     * 撥放stick的symbol  (正常流程下)
     */
    public async playStickSymbol(){
        if(this.upperSpine){
            Debug.Warn('playStickSymbol', 'upperSpine already exist')
            return
        }
        
        // ToDo 還沒做
        // if(!this.stickSpine){
        //     Debug.Error('play stick symbol.', 'no stickSpine')
        //     return
        // }

        // SpineManager.setAnimation(this.stickSpine, this.getSymbolAnimName(this.symbol, eSymbolState.normal), false)
        // // 用spine的位置來調整winSpine的位置
        // this.stickSpine.visible = true
        // this.stickSpine.zIndex = eLayer.sitckSymbol
        // this.isStick = true
    }

    /**
     * 撥放指定的symbol動畫 (任意時刻)
     * @param symbol 
     */
    public async playSpecifyStickSymbol(symbol: number){

        if(this.isStick){
            return;
        }

        let inAnim: string = this.getSymbolAnimName(symbol, eSymbolState.jumpOut), loopAnim: string = this.getSymbolAnimName(symbol, eSymbolState.jumpOutLoop)
        if(!this.upperSpine){
            this.upperSpine = await GameSpineManager.playSymbol(App.stage, inAnim, false)
        }else{
            SpineManager.setAnimationWithIndex(this.upperSpine, this.stickTrackIndex, inAnim, true)
        }

        SpineManager.addAnimationWithIndex(this.upperSpine, this.stickTrackIndex, loopAnim, true)

        this.upperSpine.zIndex = eLayer.sitckSymbol
        this.upperSpine.position.set(this.originPos.x, this.originPos.y)
        this.upperSpine.state.timeScale = 1

        this.isStick = true;
    }

    /**
     * 清除stick符號的顯示
     */
    public clearStickSymbol(){
        this.isStick = false
        this.spine.visible = true
        if(this.upperSpine){
            SpineManager.endSpine(GameSpineManager.getFullUrl('Symbol'), this.upperSpine)
            this.upperSpine = null
            // this.upperSpine.state.setEmptyAnimation(this.stickTrackIndex, 0)
            // this.upperSpine.parent && this.upperSpine.parent.removeChild(this.upperSpine)
        }
    }

    /**
     * 取得動畫的名稱
     * @param symbol 要撥放的symbol動畫
     * @param state 狀態
     */
    private getSymbolAnimName(symbol: number, state: eSymbolState): string {
        let name: string;
        let seq: string;
        switch (state) {
            case eSymbolState.normal:
                seq = '00';
                break;
            case eSymbolState.blur:
                seq = '01';
                break;
            case eSymbolState.win:
                seq = '02';
                break;
            case eSymbolState.jumpOut:
                seq = '03';
                break;
            case eSymbolState.jumpOutLoop:
                seq = '04';
                break;
        }

        name = `Symbol_${eSymbolName[symbol]}_${seq}`
        if(eSymbolName[symbol] == undefined){
            console.log(symbol)
        }
        return name
    }

    /**
     * 判斷是否有落定動畫
     * @param symbol 
     */
    private hasEndSpinAnim(symbol: number): boolean{
        let result: boolean = false;
        // switch(symbol){
        //     case eSymbolName.WD:
        //         result = true;
        //         break;
        // }
        return result
    }
}