// Import document classes.
import { QuintessenceSystemActor } from './documents/actor.mjs';
import { QuintessenceSystemItem } from './documents/item.mjs';
// Import sheet classes.
import { QuintessenceSystemActorSheet } from './sheets/actor-sheet.mjs';
import { QuintessenceSystemItemSheet } from './sheets/item-sheet.mjs';
// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from './helpers/templates.mjs';
import { QUINTESSENCE_SYS } from './helpers/config.mjs';
import { ClashHandler } from './helpers/clash-handler.mjs';

/* -------------------------------------------- */
/*  Functions for Chat Buttons?                 */
/* -------------------------------------------- */
/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    game.foundryquintessencesystem = {
        QuintessenceSystemActor,
        QuintessenceSystemItem,
        rollItemMacro,
    };

    // Add custom constants for configuration.
    CONFIG.QUINTESSENCE_SYS = QUINTESSENCE_SYS;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '@speed.min + 1d(@speed.max - @speed.min) + @status.haste - @status.bind',
        decimals: 2,
    };

    // Define custom Document classes
    CONFIG.Actor.documentClass = QuintessenceSystemActor;
    CONFIG.Item.documentClass = QuintessenceSystemItem;

    // Active Effects are never copied to the Actor,
    // but will still apply to the Actor from within the Item
    // if the transfer property on the Active Effect is true.
    CONFIG.ActiveEffect.legacyTransferral = false;

    // Register sheet application classes
    Actors.unregisterSheet('core', ActorSheet);
    Actors.registerSheet('foundry-quintessence-system', QuintessenceSystemActorSheet, {
        makeDefault: true,
        label: 'QUINTESSENCE_SYS.SheetLabels.Actor',
    });
    Items.unregisterSheet('core', ItemSheet);
    Items.registerSheet('foundry-quintessence-system', QuintessenceSystemItemSheet, {
        makeDefault: true,
        label: 'QUINTESSENCE_SYS.SheetLabels.Item',
    });

    // Preload Handlebars templates.
    return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
    return str.toLowerCase();
});

Handlebars.registerHelper('basePower', function ( item ) {
    return item.getBasePower === undefined ? 0 : item.getBasePower();
});

Handlebars.registerHelper('coinCount', function ( item ) {
    return item.getCoinCount === undefined ? 0 : item.getCoinCount();
});

Handlebars.registerHelper('coinPower', function ( item ) {
    return item.getCoinPower === undefined ? 0 : item.getCoinPower();
});

Handlebars.registerHelper('skillLibrary', function ( actor ) {
    return actor.getSkills();
});

Handlebars.registerHelper('maxPower', function ( item ) {
    return item.getMaxPower === undefined ? 0 : item.getMaxPower();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */


Hooks.once('ready', function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));

    const clashHandler = new ClashHandler()
    $(document).on('click', '.clash-continue', function () {
        clashHandler.iterateOnce($(this).closest(".clash-message"));
    });
    $(document).on('click', '.clash-skip', function () {
        clashHandler.iterateAll($(this).closest(".clash-message"));
    });
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== 'Item') return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn(
            'You can only create macro buttons for owned Items'
        );
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.foundryquintessencesystem.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(
        (m) => m.name === item.name && m.command === command
    );
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: 'script',
            img: item.img,
            command: command,
            flags: { 'foundry-quintessence-system.itemMacro': true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid,
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then((item) => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(
                `Could not find item ${itemName}. You may need to delete and recreate this macro.`
            );
        }

        // Trigger the item roll
        item.roll();
    });
}

