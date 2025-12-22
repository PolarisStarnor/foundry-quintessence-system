import {
    onManageActiveEffect,
    prepareActiveEffectCategories,
} from '../helpers/effects.mjs';

import {
    getViewedActors
} from '../helpers/global.mjs';

import {
    Clash
} from '../helpers/clash.mjs';

import {
    ClashApplication
} from '../helpers/clash-application.mjs';

const { HandlebarsApplicationMixin } = foundry.applications.api
const { ActorSheetV2 } = foundry.applications.sheets
const { TextEditor } = foundry.applications.ux
const { duplicate } = foundry.utils

/**
 * Extend the basic ActorSheet with some very simple modifications
 */
export class QuintessenceSystemActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
    /**
     * Non-method configurations
     */
    static DEFAULT_OPTIONS = {
        tag: 'form',
        classes: ['foundry-quintessence-system', 'sheet', 'actor'],
        window: {
            resizable: true,
            title: 'Actor Sheet'
        },
        position: {
            width: 600,
            height: 600,
        },
        tabs: [
            {
                navSelector: '.sheet-tabs',
                initial: 'skills',
            },
        ],
        form: {
            handler: QuintessenceSystemActorSheet.formHandler,
            submitOnChange: false,
            closeOnSubmit: false
        },
        actions: {
            createItem: QuintessenceSystemActorSheet.createItem,
            deleteItem: QuintessenceSystemActorSheet.deleteItem,
            editItem: QuintessenceSystemActorSheet.editItem,
            skillRoll: QuintessenceSystemActorSheet.skillRoll,
        }
    }

    static TABS = {
        primary: {
            tabs: [
                {id: 'skills', label: "Skills", group: "primary"},
                {id: 'passives', label: "Passives", group: "primary"},
                {id: 'items', label: "Items", group: "primary"},
                {id: 'effects', label: "Effects", group: "primary"},
            ],
            initial: 'skills'
        }
    }

    static PARTS = {
        header: {
            template: 'systems/foundry-quintessence-system/templates/actor/actor-character-sheet.hbs'
        },
        tabs: {
            template: 'templates/generic/tab-navigation.hbs',
        },
        skills: {
            template: 'systems/foundry-quintessence-system/templates/actor/parts/actor-skills.hbs',
            scrollable: ['']
        },
        passives: {
            template: 'systems/foundry-quintessence-system/templates/actor/parts/actor-passives.hbs',
            scrollable: ['']
        },
        items: {
            template: 'systems/foundry-quintessence-system/templates/actor/parts/actor-items.hbs',
            scrollable: ['']
        },
        effects: {
            template: 'systems/foundry-quintessence-system/templates/actor/parts/actor-effects.hbs',
            scrollable: ['']
        },
    }

    /* -------------------------------------------- */

    /** @override */
    async _prepareContext(options) {
        // Retrieve the data structure from the base sheet. You can inspect or log
        // the context variable to see the structure, but some key properties for
        // sheets are the actor object, the data object, whether or not it's
        // editable, the items array, and the effects array.
        const context = super._prepareContext(options);

        // Use a safe clone of the actor data for further operations.
        const actorData = this.document.toObject(false);

        // Add the actor's data to context.data for easier access, as well as flags.
        context.system = actorData.system;
        context.flags = actorData.flags;

        // Adding a pointer to CONFIG.QUINTESSENCE_SYS
        context.config = CONFIG.QUINTESSENCE_SYS;

        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
            this.actor.system.biography,
            {
                // Whether to show secret blocks in the finished html
                secrets: this.document.isOwner,
                // Necessary in v11, can be removed in v12
                async: true,
                // Data to fill in for inline rolls
                rollData: this.actor.getRollData(),
                // Relative UUID resolution
                relativeTo: this.actor,
            }
        );

        // Prepare active effects
        context.effects = prepareActiveEffectCategories(
            // A generator that returns all effects stored on the actor
            // as well as any items
            this.actor.allApplicableEffects()
        );

        // Prepare Tabs
        context.tabs = this._prepareTabs("primary");

        return context;
    }

    async _preparePartContext(partId, context) {

        // All Parts do this
        context.tab = context.tabs[partId];

        // Part-sensitive processing
        switch (partId) {
            case "skills":
            this._prepareSkills(context);
            case "passives":
            this._preparePassives(context);
            case "items":
            this._prepareGear(context);
            case "effects":
        }
        return context
    }

    static async formHandler(event, form, formData) {
        // TODO
        console.log(event);
        console.log(form);
        console.log(formData);

        return
    }

    /**
     * Organize and classify Skills for Actor sheets.
     *
     * @param {object} context The context object to mutate
     */
    _prepareSkills(context) {

        // Initialize containers.
        const skills = [];

        // Iterate through items, allocating to containers
        for (let i of this.document.items) {
            i.img = i.img || Item.DEFAULT_ICON;
            // Append to skills.
            if (i.type === 'skill') {
                skills.push(i);
            }
        }
        // Assign and return
        context.skills = skills;
    }

    /**
     * Organize and classify Items for Actor sheets.
     *
     * @param {object} context The context object to mutate
     */
    _prepareGear(context) {

        // Initialize containers.
        const gear = [];

        // Iterate through items, allocating to containers
        for (let i of this.document.items) {
            i.img = i.img || Item.DEFAULT_ICON;
            // Append to items.
            if (i.type === 'item') {
                gear.push(i);
            }
        }
        // Assign and return
        context.gear = gear;
    }

    /**
     * Organize and classify Passives for Actor sheets.
     *
     * @param {object} context The context object to mutate
     */
    _preparePassives(context) {

        // Initialize containers.
        const passives = [];

        // Iterate through items, allocating to containers
        for (let i of this.document.items) {
            // Append to abilities.
            if (i.type === 'passive') {
                passives.push(i);
            }
        }
        // Assign and return
        context.passives = passives;
    }

    /* -------------------------------------------- */

    /** @override */
    _onRender(context, options) {
        // super._onRender(context, options);
        // const html = $(this.element); // Thing to keep JQuery or smth


        // // Active Effect management
        // html.on('click', '.effect-control', (ev) => {
        //     const row = ev.currentTarget.closest('li');
        //     const document =
        //           row.dataset.parentId === this.actor.id
        //           ? this.actor
        //           : this.actor.items.get(row.dataset.parentId);
        //     onManageActiveEffect(ev, document);
        // });

        // // Rollable abilities.
        // html.on('click', '.rollable', this._onRoll.bind(this));

        // // Drag events for macros.
        // if (this.actor.isOwner) {
        //     let handler = (ev) => this._onDragStart(ev);
        //     html.find('li.item').each((i, li) => {
        //         if (li.classList.contains('inventory-header')) return;
        //         li.setAttribute('draggable', true);
        //         li.addEventListener('dragstart', handler, false);
        //     });
        // }

        // // Clash Dialog
        // html.on('click', '.clashable', this._clashDialog.bind(this));
    }

    /**
     * Create a dialog for clashing with other characters
     *
     */
    async _clashDialog(event) {
        event.preventDefault();
        const clash = new Clash(this.actor)
        clash.setTarget(getViewedActors()[0]); // Low effort default target
        const app = new ClashApplication(clash);
        app.render(true);
    }

    static createItem(event, target) {
        event.preventDefault();
        // Get the type of item to create.
        const type = target.dataset.type;
        // Grab any data associated with this control.
        const data = duplicate(target.dataset);
        // Initialize a default name.
        const name = `New ${type.capitalize()}`;
        // Prepare the item object.
        const itemData = {
            name: name,
            type: type,
            system: data,
        };
        return Item.create(itemData, { parent: this.actor });
    }

    static editItem(event, target) {
        event.preventDefault();
        const element = $(target)
        const li = element.parents('.item');
        const item = this.actor.items.get(li.data('itemId'));
        item.sheet.render(true)
    }

    static deleteItem(event, target) {
        event.preventDefault();
        const element = $(target)
        const li = element.parents('.item');
        const item = this.actor.items.get(li.data('itemId'));
        item.delete();
        li.slideUp(200,() => this.render(false));
    }

    // static editItem(event, target) {

    // }

    /**
     * Handle clickable rolls.
     * @param {Event} event   The originating click event
     * @private
     */
    skillRoll(event, target) {
        console.log("roll")
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        // Handle item rolls.
        if (dataset.rollType) {
            const itemId = element.closest('.item').dataset.itemId;
            const item = this.actor.items.get(itemId);
            if (dataset.rollType == 'skill-check') {
                if (item) return item.roll("check");
            }else if (dataset.rollType == 'skill-damage') {
                if (item) return item.roll("damage");
            }
        }


        // Handle rolls that supply the formula directly.
        if (dataset.roll) {
            let label = dataset.label ? `[ability] ${dataset.label}` : '';
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rollMode: game.settings.get('core', 'rollMode'),
            });
            return roll;
        }
    }

}
