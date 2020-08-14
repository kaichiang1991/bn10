import { spine, Container } from "pixi.js-legacy";
import { TimelineLite, TimelineMax } from "gsap";

export function killTween(tween: TimelineLite | TimelineMax){
    tween && tween.kill()
}

export function stopSpine(spine: spine.Spine){
    spine && (spine.visible = false)
}

export async function fadeOutContainer(container: Container, duration: number, clear: boolean = false){
    if(!container || !container.alpha)  return
    
    await new Promise<void>((res) =>{
        let tween: TimelineLite = new TimelineLite()
        tween.to(container, duration, {alpha: 0})
        tween.eventCallback('onComplete', ()=>{
            killTween(tween)
            if(clear){
                container.destroy && container.destroy()
            }else{
                container.visible = false
                container.alpha = 1
            }
            res()
        })
    })
}

export async function fadeInContainer(container: Container, duration: number){
    if(!container)  return
    
    container.visible = true
    await new Promise<void>((res) =>{
        let tween: TimelineLite = new TimelineLite()
        tween.from(container, duration, {alpha: 0})
        tween.eventCallback('onComplete', ()=>{
            killTween(tween)
            res()
        })
    })
}

export function mergeWinPosition(winPositionArr: Array<Array<Array<number>>>): Array<Array<number>>{
    let result: Array<Array<number>> = [
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0]
    ]

    for(let winPosition of winPositionArr){
        winPosition.forEach((column, columnIndex) =>{
            column.forEach((symbol, rowIndex) =>{
                result[columnIndex][rowIndex] = symbol || result[columnIndex][rowIndex] 
            })
        })
    }
    return result
}


export function decodeBase64(encodeStr: string): string{
    return atob(decodeURIComponent(encodeStr))
}

export function setNoSleep(flag: boolean){
    window.dispatchEvent(new CustomEvent("autoPlay", {
        detail: {
            auto: flag
        }
    }))
}