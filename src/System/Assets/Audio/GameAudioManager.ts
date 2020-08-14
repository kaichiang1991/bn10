import AudioManager from "./AudioManager";
import Debug from "../../../Lib/Debug";
import sound from "pixi-sound";
import { appConfig } from "../../Config/GameConfig";
import EventHandler, { eEventName } from "../../../Game/EventHandler";

/** 管理遊戲音效 */
export default class GameAudioManager{

    private static currentMusic: sound.IMediaInstance
    private static currentMusicName: string

    private static currentEffectVolume: number = 1
    private static currentMusicVolume: number = 1
    
    private static audioEffectLists: Array<sound.IMediaInstance>;

    // 檔名和完整路徑的 mapping
    private static urlMap = {
        'SpinStop'          :'audio/SpinStop.mp3',
        'AllLine_H_Symbols' :'audio/AllLine_H_Symbols.mp3',
        'AllLine_N_Symbols' :'audio/AllLine_N_Symbols.mp3',
        'NG_Score'          :'audio/NG_Score.mp3',
        'FG_Score'          :'audio/FG_Score.mp3',
        'Score_End'         :'audio/Score_End.mp3',
        'ReelExpecting'     :'audio/ReelExpecting.mp3',
        'HitReel_3'         :'audio/HitReel_3.mp3',
        'HitReel_4'         :'audio/HitReel_4.mp3',
        'HitReel_5'         :'audio/HitReel_5.mp3',
        
        'NGtoFG'            :'audio/NGtoFG.mp3',
        'FGtoNG'            :'audio/FGtoNG.mp3',
        
        'BigWin_Score2'     :'audio/BigWin_Score2.mp3',
        'NG_Feature_BGM'    :'audio/NG_Feature_BGM.mp3',
        'NG_Feature_Hit'    :'audio/NG_Feature_Hit.mp3',
        'NG_BGM'            :'audio/NG_BGM.mp3',
        'FG_BGM'            :'audio/FG_BGM.mp3',
    }

   /**
     * 取得完整路徑
     * @param atlas 別名 
     */
    public static getFullUrl(atlas: string): string{
        let url: string;
        Object.keys(this.urlMap).forEach(name => {
            if(name == atlas){
                url = this.urlMap[name];
            }
        });
        if(url == undefined){
            Debug.Error('audio get full url fail', atlas);
        }
        return url;
    }
    
    /** 初始化 */
    public static init(){
        this.audioEffectLists = new Array<sound.IMediaInstance>()
        this.onRegisterEvent()
    }

    /** 註冊事件 */
    private static onRegisterEvent(){
        EventHandler.on(eEventName.setMusicVolume, (context) =>{
            let musicOn: boolean = context.musicOn, value: number = context.value
            this.setAudioMusicVolume(musicOn, value)
        })

        EventHandler.on(eEventName.setEffectVolume, (context) =>{
            let musicOn: boolean = context.musicOn, value: number = context.value
            this.setAudioEffectVolume(musicOn, value)
        })
    }

    /**
     * 撥放背景音樂 (只能同時存在一個背景音樂)
     * @param name 音檔檔名的map
     * @param loop 是否loop，預設為true
     */
    public static async playAudioMusic(name: string, loop: boolean = true, completeCallback?: Function){

        let url: string = this.getFullUrl(name);
        let _complete: Function = ()=>{
            if(!loop){
                this.clearCurrentMusic()
            }
            completeCallback && completeCallback()
        }

        if(!this.currentMusic){
            this.currentMusic = await AudioManager.playAudio(url, loop, this.currentMusicVolume, _complete)
            this.currentMusicName = url
        }else if(!this.isSameAudio(this.currentMusicName, name)){
            AudioManager.stopAudio(this.currentMusic)
            this.currentMusic = await AudioManager.playAudio(url, loop, this.currentMusicVolume, _complete)
            this.currentMusicName = url
        }else{
            AudioManager.resumeAudio(this.currentMusic)
        }

        return this.currentMusic
    }

    /** 暫停目前的背景音樂 */
    public static pauseCurrentMusic(){
        AudioManager.pauseAudio(this.currentMusic)
    }

    /** 繼續撥放目前的音效 ( 沒有停止的話 ) */
    public static resumeCurrentMusic(){
        AudioManager.resumeAudio(this.currentMusic)
    }

    /** 停止撥放目前的音效 */
    public static stopCurrentMusic(){
        AudioManager.stopAudio(this.currentMusic)
        this.clearCurrentMusic()        
    }

    /** 清除目前音樂的參照 */
    private static clearCurrentMusic(){
        this.currentMusic = null
        this.currentMusicName = null
    }

    /**
     * 撥放音效
     * @param name 音效名稱map
     * @param loop 是否循環
     * @param completeCallback 結束後的callback
     */
    public static async playAudioEffect(name: string, loop?: boolean, completeCallback?: Function): Promise<sound.IMediaInstance>{
        let url: string = this.getFullUrl(name)
        let _complete: Function = ()=>{
            // 從陣列中移出已經撥放完的音效
            let index: number = this.audioEffectLists.indexOf(instance)
            this.audioEffectLists.splice(index, 1)

            completeCallback && completeCallback()
        }
        let instance: sound.IMediaInstance = await AudioManager.playAudio(url, loop, this.currentEffectVolume, _complete)
        this.audioEffectLists.push(instance)
        return instance
    }

    /**
     * 暫停撥放指定的音效
     * @param audio 
     */
    public static pauseAudioEffect(audio: sound.IMediaInstance){
        AudioManager.pauseAudio(audio)
    }

    /**
     * 繼續撥放指定的音效
     * @param audio 
     */
    public static resumeAudioEffect(audio: sound.IMediaInstance){
        AudioManager.resumeAudio(audio)
    }

    /**
     * 停止撥放指定的音效
     * @param audio 
     */
    public static stopAudioEffect(audio: sound.IMediaInstance){
        AudioManager.stopAudio(audio)
    }

    /**
     * 設定全部音效音量
     * @param musicOn 
     * @param value 0 - 1
     */
    public static setAudioEffectVolume(musicOn: boolean, value: number){
        if(!musicOn){
            this.currentEffectVolume = 0
        }else{
            this.currentEffectVolume = value
        }
        this.audioEffectLists && this.audioEffectLists.forEach(audio => AudioManager.setAudioVolume(audio, this.currentEffectVolume))
    }

    /**
     * 設定音樂音量
     * @param musicOn 是否開啟音量
     * @param value 0 - 1
     */
    public static setAudioMusicVolume(musicOn: boolean, value: number){
        if(!musicOn){
            this.currentMusicVolume = 0
        }else{
            this.currentMusicVolume = value
        }
        AudioManager.setAudioVolume(this.currentMusic, this.currentMusicVolume)
    }
    
    /**
     * 判斷是不是同一個sound
     * @param sound  
     * @param compareName 要判斷的檔名
     */
    private static isSameAudio(toCompareName: string, compareName: string ): boolean{
        let _sound: sound.Sound = AudioManager.getAudioByName(toCompareName)
        if(!_sound)
            return false

        return _sound.url.indexOf(compareName) > -1
    }
}