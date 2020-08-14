import AnimationManager, { IAnimationConfig } from "./AnimationManager";
import { App } from "../../../main";

export default class GameAnimationManager{

    /** 播放BIBO動畫的測試 */
    public static async playBIBOAnimation(){
        let parent: PIXI.Container = App.stage;

        let config: IAnimationConfig = {
            pos: new PIXI.Point(500, 200),
            loop: true,
            animSpeed: 0.3,
        }
        
        let anim: PIXI.AnimatedSprite = await AnimationManager.playAnimation(parent, 'assets/img/BIBO/BIBO.json', "BIBO", config);
        App.stage.buttonMode = true;
        App.stage.interactive = true;
        anim.interactive = true;
        anim.on('pointerdown', ()=>{
            if(anim.playing)
                anim.stop();
            else
                anim.play();
        })
    }
}