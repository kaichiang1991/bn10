import ParticleManager, { IParticleConfig } from "./ParticleManager";
import { App } from "../../../main";
import { appConfig } from "../../Config/GameConfig";
import Debug from "../../../Lib/Debug";
import { Point, interaction, Container } from "pixi.js-legacy";
import * as particles from "pixi-particles"

export enum eParticleEvent{
    slideFollowCursor,
}
export default class GameParticleManager{

    private static emitterUrlMap = {
        'bigwin': 'img/particle/BigWin_Emitter.json'
    }

    private static spriteUrlMap = {
        'coin': 'img/particle/BigWinCoin.json'
    }

    // 儲存每個事件
    private static eventMap: Object = new Object();

    private static coinParticle: particles.Emitter

    /**
     * 取得完整的粒子的 url
     * @param atlas urlMap 裡面的 key 值
     */
    private static getParticleUrl(atlas: string): string{
        let url: string;
        Object.keys(this.emitterUrlMap).forEach(name => {
            if(name == atlas){
                url = appConfig.assetPrefix + this.emitterUrlMap[name];
            }
        });
        if(url == undefined){
            Debug.Error('particle get full url(particle) fail', atlas);
        }
        return url;
    }
        
    /**
     * 取得完整的圖片的 url
     * @param atlas urlMap 裡面的 key 值
     */
    private static getSpriteUrl(atlas: string): string{
        let url: string;
        Object.keys(this.spriteUrlMap).forEach(name => {
            if(name == atlas){
                url = appConfig.assetPrefix + this.spriteUrlMap[name];
            }
        });
        if(url == undefined){
            Debug.Error('particle get full url(sprite) fail', atlas);
        }
        return url;
    }
    
    public static async playCoinParticle(parent: Container, zIndex: number, pos: Point){
        let config: IParticleConfig = {
            pos: pos,
            // lifeTimes: -1,
            // completeCallback: ()=> console.log('complete')
        }
        
        this.coinParticle = await ParticleManager.playAnimatedParticle(this.getParticleUrl('bigwin'), this.getSpriteUrl('coin'), parent, zIndex, config)
        return this.coinParticle
    }
    
    public static endCoinParticle(){
        if(!this.coinParticle || !this.coinParticle.parent)
            return

        this.coinParticle.emit = false
        this.coinParticle.parent.parent.removeChild(this.coinParticle.parent)
    }

    /** 使指定的粒子跟著滑鼠走 */
    public static followCursor(emitter: particles.Emitter, eventName: eParticleEvent){
        this.eventMap[eventName] = (event: interaction.InteractionEvent) =>{
            let pos = event.data.global
            emitter.spawnPos.set(pos.x, pos.y)
        }
        App.stage.on('pointermove', this.eventMap[eventName])
    }

    public static disableFollowCursor(eventName: eParticleEvent){
        this.eventMap[eventName] && App.stage.off('pointermove', this.eventMap[eventName])
    }
}