import { App } from "../main";
import Loading from "./Loading";
import GameController from "./GameProcessControll/GameController";

export enum eGameScene {
    loading,
    game,
    error
}

/** 控制遊戲場景 */
export default class GameStateController {

    private static currentScene: eGameScene;

    /**
     * 切換遊戲場景
     * @param scene 要切換的場景 
     */
    public static async swtichGameScene(scene: eGameScene) {

        return new Promise<void>(async (res, rej) =>{

            if (scene != this.currentScene) {
                switch (scene) {
                    case eGameScene.loading:
                        await Loading.initLoading();
                        break;
                    case eGameScene.game:
                        GameController.getInstance().init();
                        break;
                    case eGameScene.error:
                        App.stage.removeChildren();
                        break;
                }
                this.currentScene = scene
                res()
            }else{
                rej()
            }
        })
    }
}