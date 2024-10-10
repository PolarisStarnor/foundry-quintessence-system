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

    /**
	 * Actually activate the Clash
	 * */
    trigger() {

        // If there is no target there is no clash.
		if (!this.target) {
            return;
        }

        const data = {
            initName: this.initiator.name,
            initBase: this.initSkill.getBasePower(),
            initCoins: this.initSkill.getCoinCount(),
            initCoinPower: this.initSkill.getCoinPower(),
            tarName: this.target.name,
            tarBase: this.tarSkill.getBasePower(),
            tarCoins: this.tarSkill.getCoinCount(),
            tarCoinPower: this.tarSkill.getCoinPower(),
        }

        const handler = new ClashHandler();
        handler.createClashMessage(data);

     }
}
