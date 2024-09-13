import { ClashHandler } from './clash-handler.mjs';
import { getViewedActors } from './global.mjs';

/**
 * A core component of this system is the clashing, which should be automated by this object.
 */
export class Clash {
    constructor(initiator) {
        this.initiator = initiator;
        // TODO Kill someone if they try to make a clash for an actor without skills
        this.initSkill = this.initiator.getSkills()[0];
    }

    /**
	 * Set the target for
	 * */
    setTarget(target) {
        this.target = target;
        // TODO checking for skill-less actors
        this.tarSkill = this.target.getSkills()[0];
    }

    _step() {

    }

    /**
	 * Actually activate the Clash
	 * */
    trigger() {

        // If there is no target there is no clash.
		if (!this.target) {
            return;
        }

        const data = {
            initBase: this.initSkill.getBasePower(),
            initCoins: this.initSkill.getCoinCount(),
            initCoinPower: this.initSkill.getCoinPower(),
            tarBase: this.tarSkill.getBasePower(),
            tarCoins: this.tarSkill.getCoinCount(),
            tarCoinPower: this.tarSkill.getCoinPower(),
        }

        handler = ClashHandler();

//         const initCoinSign = initData.coinPower >= 0 ? "+" : "";
//         const tarCoinSign = tarData.coinPower >= 0 ? "+" : "";
//         const dataID = `data-target-id="${this.initiator.id}" data-initiator-id="${this.target.id}"`

//         const img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/tails.png" width=16/>`
//         const initImg = img.repeat(initData.coins);
//         const tarImg = img.repeat(tarData.coins);

//         ChatMessage.create({
//             content: `
// <div class="clash-message">

// <div class="hidden-data">
// 	<span class="initBase">${initData.base}</span>
// 	<span class="initCoins">${initData.coins}</span>
// 	<span class="initCoinPower">${initCoinSign}${initData.coinPower}</span>

// 	<span class="tarBase">${tarData.base}</span>
// 	<span class="tarCoins">${tarData.coins}</span>
// 	<span class="tarCoinPower">${tarCoinSign}${tarData.coinPower}</span>
// </div>

// <h1>
// 	${this.initiator.name}
// 	<span class="resource-input-seperator"> vs </span>
// 	${this.target.name}
// </h1>
// <div class="grid-2col">
// 	<div class="clash-message-column">
// 		<h1 class="initName">${this.initiator.name}</h1>
// 		<h3>
// 			<span class="initBase">${initData.base}</span>
// 			<span class="initCoinPower">${initCoinSign}${initData.coinPower}</span>
// 			${initImg}
// 		</h3>

// 	</div>
// 	<div class="clash-message-column">
// 		<h1 class="tarName">${this.target.name}</h1>
// 		<h3>
// 			<span class="tarBase">${tarData.base}</span>
// 			<span class="tarCoinPower">${tarCoinSign}${tarData.coinPower}</span>
// 			${tarImg}
// 		</h3>

// 	</div>
// </div>

// <div class="grid-2col">
// 	<button ${dataID} class="clash-continue">Start</button>
// 	<button ${dataID} class="clash-skip">Skip to End</button>
// </div>

// </div>
// `

//         });

//     }
}
