import AssetLoader from "../AssetLoader"
import { LoaderResource, sound } from "pixi.js-legacy";
import Debug from "../../../Lib/Debug";
import { appConfig } from "../../Config/GameConfig";

/** 控制音效 */
export default class AudioManager{

    private static readonly audioLists: Array<string> = [
        'audio/SpinStop.mp3'            ,
        'audio/AllLine_H_Symbols.mp3'   ,
        'audio/AllLine_N_Symbols.mp3'   ,
        'audio/NG_Score.mp3'            ,
        'audio/FG_Score.mp3'            ,
        'audio/Score_End.mp3'           ,
        'audio/ReelExpecting.mp3'       ,
        'audio/HitReel_3.mp3'           ,
        'audio/HitReel_4.mp3'           ,
        'audio/HitReel_5.mp3'           ,
        
        'audio/NGtoFG.mp3'              ,
        'audio/FGtoNG.mp3'              ,
        
        'audio/BigWin_Score2.mp3'       ,
        'audio/NG_Feature_BGM.mp3'      ,
        'audio/NG_Feature_Hit.mp3'      ,
        
        'audio/NG_BGM.mp3'              ,
        'audio/FG_BGM.mp3'              ,
    ]

    /** 同時只會出現一次的音效 (e.g. BGM) */
    private static readonly singleLists: Array<string> = [
        'audio/NG_BGM.mp3'              ,
        'audio/FG_BGM.mp3'              ,
    ]

    private static audioInstance: AudioInstance;

    /** 讀取音樂 */
    public static async loadAudios(){
        let fileName: Array<string> = this.audioLists.map(list => appConfig.assetPrefix + list)
        await AssetLoader.loadAsset(fileName);
        await this.init();
    }   

    /** 初始化音樂 */
    private static async init(){
        this.audioInstance = await new AudioInstance().init(this.audioLists, this.singleLists)
    }

    /**
     * 根據音效名稱取得音效
     * @param name 路徑 ( 不包含前綴 )
     */
    public static getAudioByName(name: string): sound.Sound{
        if(!this.audioInstance)
            return null
        return this.audioInstance.getSound(name)
    }

    /**
     * 撥放音效
     * @param audioName 音效名稱 ( 不包含前綴 )
     * @param loop      是否loop
     * @param volume    音量 0 - 1
     * @param complete  撥放完成後要呼叫的函式
     */
    public static async playAudio(audioName: string, loop?: boolean, volume?: number, complete?: Function){
        let sound: sound.Sound = this.audioInstance.getSound(audioName), instance: sound.IMediaInstance
        let config: sound.PlayOptions = {
            loop: loop || false,
            volume: (volume == undefined)? 1: volume,
            complete: (_sound: sound.Sound) =>{
                complete && complete()
            }
        }

        // 撥放音效
        if(sound){
            instance = await sound.play(config)
        }
        return instance
    }

    /**
     * 根據名稱暫停所有同名音效
     * @param name 音效名稱 ( 不包含前綴 )
     */
    public static pauseAudioBySoundName(name: string){
        let sound: sound.Sound = this.audioInstance.getSound(name)
        if(sound){
            sound.pause()
        }
    }

    /**
     * 根據名稱繼續所有同名音效
     * @param name 音效名稱 ( 不包含前綴 )
     */
    public static resumeAudioBySoundName(name: string){
        let sound: sound.Sound = this.audioInstance.getSound(name)
        if(sound){
            sound.paused && sound.resume()
        }
    }

    /**
     * 根據名稱繼續停止同名音效 ( 不會執行一開始設定的callback )
     * @param name 音效名稱 ( 不包含前綴 )
     */
    public static stopAudioBySoundName(name: string){
        let sound: sound.Sound = this.audioInstance.getSound(name)
        if(sound){
            sound.stop()
        }
    }

    /**
     * 暫停指定音效
     * @param instance 
     */
    public static pauseAudio(instance: sound.IMediaInstance){
        if(instance && !instance.paused){
            instance.paused = true
        }
    }

    /**
     * 繼續撥放指定音效
     * @param instance 
     */
    public static resumeAudio(instance: sound.IMediaInstance){
        if(instance && instance.paused){
            instance.paused = false
        }
    }

    /**
     * 停止指定音效
     * @param instance 
     */
    public static stopAudio(instance: sound.IMediaInstance){
        if(instance){
            instance.stop()
        }
    }

    /**
     * 設定指定音效的音量
     * @param instance 
     * @param value 0 - 1
     */
    public static setAudioVolume(instance: sound.IMediaInstance, value: number){
        if(instance){
            instance.volume = value
        }
    }

    /**
     * 根據名稱設定同名音效的音量
     * @param name 
     * @param value 0 - 1
     */
    public static setAudioVolumeBySoundName(name: string, value: number){
        let sound: sound.Sound = this.audioInstance.getSound(name)
        if(sound){
            sound.volume = value
        }
    }

    /**
     * 設置所有音效的音量
     * @param value 0 - 1
     */
    public static setAllAudioVolume(value: number){
        if(!this.audioInstance){
            return
        }
        let allSound: Array<sound.Sound> = this.audioInstance.getAllSound()
        for(let key in allSound){
            allSound[key].volume = value
        }
    }
}


class AudioInstance{

    private audios: Array<sound.Sound>;

    /**
     * 初始化
     * @param audioLists 所有音效
     * @param singleInstanceList 只有單個instance的list
     */
    public async init(audioLists: Array<string>, singleInstanceList: Array<string>): Promise<AudioInstance>{
        let name: string, fullUrl: string, res: LoaderResource
        this.audios = new Array<sound.Sound>()
        for(let i = 0; i < audioLists.length; i++){
            name = audioLists[i]
            fullUrl = appConfig.assetPrefix + name
            res = await AssetLoader.getAsset(fullUrl)
            this.audios[name] = res.sound

            // 指定只會同時撥放一次的sound (e.g. BGM)
            if(singleInstanceList.indexOf(name) > -1){
                this.audios[name].singleInstance = true
            }
        }
        return this
    }

    /**
     * 根據名稱取得音效
     * @param name 音效名稱 ( 不包含前綴 )
     */
    public getSound(name: string): sound.Sound{
        if(!this.audios || !this.audios[name]){
            Debug.Warn('getSound fail', name, this.audios)
            return null
        }
        return this.audios[name]
    }

    /** 取得所有音效 */
    public  getAllSound(): Array<sound.Sound>{
        return this.audios
    }
}
