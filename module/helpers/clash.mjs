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

        const init = new clashDatum(
            this.initiator.name,
            this.initSkill.getBasePower === undefined ? 0 : this.initSkill.getBasePower(),
            this.initSkill.getCoinCount === undefined ? 0 : this.initSkill.getCoinCount(),
            this.initSkill.getCoinPower === undefined ? 0 : this.initSkill.getCoinPower()
        );

        const tar = new clashDatum(
            this.target.name,
            this.tarSkill.getBasePower === undefined ? 0 : this.tarSkill.getBasePower(),
            this.tarSkill.getCoinCount === undefined ? 0 : this.tarSkill.getCoinCount(),
            this.tarSkill.getCoinPower === undefined ? 0 : this.tarSkill.getCoinPower()
        );

        const data = {
            init: init,
            tar: tar
        }

        const handler = new ClashHandler();
        handler.createClashMessage(data);

    }
}


class clashDatum {
    constructor(name, base, coins, coinPower) {
        this.name = name;
        this.base = base;
        this.coins = coins;
        this.coinPower = coinPower
    }
}
