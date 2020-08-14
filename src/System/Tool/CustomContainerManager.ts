import { Container, Point, Rectangle, Graphics } from "pixi.js-legacy"
import Debug from "../../Lib/Debug";
import { eLayer, appConfig } from "../Config/GameConfig";

interface IContainerConfig{
    _pos: Point,
    _zIndex: number,
    _interactive: boolean,
    _hitArea?: Rectangle,
    [propName: string]: any         // ToDo 之後想到有甚麼再補
}

export enum eContainerType{
    winCont             = 'winCont',
    fullScreenCover     = 'fullScreenCover',
    blackFullScreen     = 'blackFullScreen'
}

let config: Object = {
    [eContainerType.winCont]: { _pos: new Point(751, 333), _zIndex: eLayer.WinBG},
    [eContainerType.fullScreenCover]: { _pos: new Point(0, 0), _zIndex: eLayer.fullScreenCover, _interactive: true, _hitArea: new Rectangle(0, 0, appConfig.size.width, appConfig.size.height)},
    [eContainerType.blackFullScreen]: { _pos: new Point(0, 0), _zIndex: eLayer.fullScreenCover, _interactive: true, _hitArea: new Rectangle(0, 0, appConfig.size.width, appConfig.size.height)},
}


export default class CustomContainerManager{

    private static objContainer: Object;

    public static init(){
        this.objContainer = new Object()
        Object.keys(eContainerType).forEach(type =>{
            let cont: Container = new Container()
            cont.name = `customContainer_${type}`
            this.objContainer[type] = cont
            
        })

        this.setContainerProp()
    }

    public static getContainer(type: eContainerType): Container{
        if(!this.objContainer || !this.objContainer[type]){
            Debug.Error('getContainer fail', this.objContainer, type)
            return null
        }
        this.objContainer[type].visible = true
        return this.objContainer[type]
    }

    public static putContainer(type: eContainerType){
        if(!this.objContainer){
            Debug.Error('putContainer', 'no objContainer')
            return
        }
        this.resetOne(type)
    }

    private static resetOne(type: eContainerType){
        let cont: Container = this.objContainer[type]
        // 清除監聽
        cont.removeAllListeners()
        // 從父節點拔除
        cont.parent && cont.parent.removeChild(cont)
        cont.removeChildren()
        // 恢復原始設定
        this.setContainerOne(type)
    }

    private static setContainerProp(){
        Object.keys(eContainerType).forEach(key =>{
            this.setContainerOne(key)
        })
    }

    private static setContainerOne(type: eContainerType | string){
        let _config: IContainerConfig = config[type]
        if(!_config){
            Debug.Warn('setContainerProp fail', type)
            return
        }

        // 指定預設值
        let pos: Point = _config._pos || new Point(0, 0)
        let zIndex: number = _config._zIndex || 0
        let interactive: boolean = _config._interactive || false
        let hitArea: Rectangle = _config._hitArea || null

        let cont: Container = this.objContainer[type]
        cont.position.set(pos.x, pos.y)
        cont.zIndex = zIndex
        cont.interactive = interactive
        cont.hitArea = hitArea
        cont.sortableChildren = true

        // 特殊情形
        if(type == eContainerType.blackFullScreen){
            let black: Graphics = new Graphics()
            .beginFill(0x000000, 0.7)
            .drawRect(0, 0, appConfig.size.width, appConfig.size.height)
            .endFill()
            cont.addChild(black)
        }
    }
}