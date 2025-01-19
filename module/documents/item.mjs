/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */

export class QuintessenceSystemItem extends Item {
    /**
     * Augment the basic Item data model with additional dynamic data.
     */
    prepareData() {
        // As with the actor class, items are documents that can have their data
        // preparation methods overridden (such as prepareBaseData()).
        super.prepareData();
    }

    /**
	 * Get some relevant information for clashes
	 */
    getBasePower() {
        const rollData = { ...this.system };
        if (!this.actor) return 0;
        rollData.actor = this.actor.getRollData();
        return rollData.base + rollData.actor.status.base_power_mod;
    }

    getCoinCount() {
        const rollData = { ...this.system };
        if (!this.actor) return 0;
        rollData.actor = this.actor.getRollData();
        return rollData.coins + rollData.actor.status.coin_count_mod;
    }

    getCoinPower() {
        const rollData = { ...this.system };
        // Quit early if there's no parent actor
        if (!this.actor) return 0;
        rollData.actor = this.actor.getRollData();
        return rollData.coin_power + rollData.actor.status.coin_power_mod;
    }

    getMaxPower() {
        return this.getBasePower() + this.getCoinCount() * this.getCoinPower();
    }

    /**
     * Prepare a data object which defines the data schema used by dice roll commands against this Item
     * @override
     */
    getRollData() {

        // Starts off by populating the roll data with a shallow copy of `this.system`
        const rollData = { ...this.system };

        // Quit early if there's no parent actor
        if (!this.actor) return rollData;

        // If present, add the actor's roll data
        rollData.actor = this.actor.getRollData();
        rollData.final_base_power = this.getBasePower();
        rollData.final_coin_count = this.getCoinCount();
        rollData.final_coin_power = this.getCoinPower();
        rollData.check = "@final_base_power + @final_coin_power * ((@final_coin_count)d2cs=2)";

        // Iteratively construct this garbage roll formula
		rollData.damage = "@final_coin_count * @final_base_power"
        for (let i = rollData.final_coin_count; i > 0; i--) {
            rollData.damage += "+" + i.toString() + "* @final_coin_power * 1d2cs=2";
        }

        return rollData;
    }

    /**
     * Handle clickable rolls.
     * @param {String} type   String identifying the check type
     * @private
     */
    async roll(type) {
        const item = this;

        // Initialize chat data.
        const speaker = ChatMessage.getSpeaker({ actor: this.actor });
        const rollMode = game.settings.get('core', 'rollMode');
        var label;

        // If there's no roll data, send a chat message.
        if (this.system.base === undefined ||
            this.system.coin_power === undefined ||
            this.system.coins === undefined) {
            ChatMessage.create({
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
                content: item.system.description ?? '',
            });
        }
        // Otherwise, create a roll and send a chat message from it.
        else {
            // Retrieve roll data.
            const rollData = this.getRollData();

            var roll;
            // Invoke the roll and submit it to chat.
			if (type === "damage") {
                roll = new Roll(rollData.damage, rollData);
                label = `${item.name} Damage`;
            } else if (type === "check") {
                roll = new Roll(rollData.check, rollData);
                label = `${item.name} Check`;
            } else {
                ChatMessage.create({
                    speaker: speaker,
                    rollMode: rollMode,
                    flavor: label,
                    content: "Something went terribly Wrong",
            	});
                return;
            }
            // If you need to store the value first, uncomment the next line.
            // const result = await roll.evaluate();
            roll.toMessage({
                speaker: speaker,
                rollMode: rollMode,
                flavor: label,
            });
            return roll;
        }
    }

}
