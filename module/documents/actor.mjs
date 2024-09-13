/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class QuintessenceSystemActor extends Actor {

	passTurn() {
		// Update actor's statuses when turn passes
		const systemData = actorData.system;
		const status = systemData.status;

        // Stuff that absolutely does not stack at the end of a turn
        status.coin_count_mod = 0;
        status.coin_power_mod = 0;
        status.base_power_mod = 0;
        status.paralysis = 0;
        status.haste = 0;
        status.bind = 0;

        // Stuff Meant to stack until the end of a turn
        status.burn *= 0.5;
        status.bleed *= 0.5;
        status.sinking *= 0.5;
        status.rupture *= 0.5;
        status.tremor *= 0.5;

	}
	
	/** @override */
	prepareData() {
		// Prepare data for the actor. Calling the super version of this executes
		// the following, in order: data reset (to clear active effects),
		// prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
		// prepareDerivedData().
		super.prepareData();
	}

	/** @override */
	prepareBaseData() {
		// Data modifications in this step occur before processing embedded
		// documents or derived data.
	}

	/**
	 * @override
	 * Augment the actor source data with additional dynamic data. Typically,
	 * you'll want to handle most of your calculated/derived data in this step.
	 * Data calculated in this step should generally not exist in template.json
	 * (such as ability modifiers rather than ability scores) and should be
	 * available both inside and outside of character sheets (such as if an actor
	 * is queried and has a roll executed directly from it).
	 */
	prepareDerivedData() {
		const actorData = this;
		const systemData = actorData.system;
		const flags = actorData.flags.foundryquintessencesystem || {};

		// Make separate methods for each Actor type (character, npc, etc.) to keep
		// things organized.
		this._prepareCharacterData(actorData);
	}

	/**
	 * Prepare Character type specific data
	 */
	_prepareCharacterData(actorData) {
		if (actorData.type !== 'character') return;

		// Make modifications to data here. For example:
		const systemData = actorData.system;
		const status = systemData.status;

		// // Loop through ability scores, and add their modifiers to our sheet output.
		// for (let [key, ability] of Object.entries(systemData.abilities)) {
		//	 // Calculate the modifier using d20 rules.
		//	 // ability.mod = Math.floor((ability.value - 10) / 2);
		// }
	}
	/**
	 * Override getRollData() that's supplied to rolls.
	 */
	getRollData() {
		// Starts off by populating the roll data with a shallow copy of `this.system`
		const data = { ...this.system };

		// Prepare character roll data.
		this._getCharacterRollData(data);

		return data;
	}

    getSkills() {
        const skills = []
        for (const item of this.items) {
            if (item.type == "skill") skills.push(item);
        }
        return skills;
    }

	/**
	 * Prepare character roll data.
	 */
	_getCharacterRollData(data) {
		if (this.type !== 'character') return;

		// Copy the ability scores to the top level, so that rolls can use
		// formulas like `@str.mod + 4`.
		if (data.abilities) {
			for (let [k, v] of Object.entries(data.abilities)) {
				data[k] = foundry.utils.deepClone(v);
			}
		}

		// // Add level for easier access, or fall back to 0.
		// if (data.attributes.level) {
		//	 data.lvl = data.attributes.level.value ?? 0;
		// }
	}
}
