import { App } from "../main";
import { Graphics } from "pixi.js-legacy";
import Debug from "./Debug";
import GameSlotData from "../Game/GameSlotData/GameSlotData";
import GameDataRequest from "../System/Network/GameDataRequest";

/** 測試用 */
export default class AppDebug{
    
    public static setDebug(){

        let graphic = new Graphics()
        .beginFill(0x003333, 0.5)
        .drawStar(0, 0, 5, 100)
        .endFill();

        graphic.name = 'debug';
        graphic.zIndex = 500
        graphic.position.set(1200, 100)

        App.stage.addChild(graphic)
        
        graphic.interactive = true;
        graphic.on('pointerdown', ()=>{
            console.log(
                'debug log', Debug.objLog,
            )
            GameSlotData.printAll()
            debugger
        })
    }
}