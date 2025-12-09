import { getViewedActors } from './global.mjs';
const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api


export class ClashApplication extends HandlebarsApplicationMixin(ApplicationV2) {

    constructor(obj) {
        super(obj);
    }

    static DEFAULT_OPTIONS = {
        classes: ['doc'],
        position: {
            width: 800,
            height: 400,
        },
        window: {
            title: 'Clashing Window',
        },
        popOut: true,
        template: `systems/foundry-quintessence-system/templates/helpers/clash.hbs`,
        id: 'clash-application',
        closeOnSubmit: true,
        submitOnClose: false,
        submitOnChange: false,
        tag: 'form'
    }

    /** @override */
    async _prepareContext(options) {
        const context = super.getData();
        this.actors = getViewedActors();

        context.clash = this.actor;
        context.skillLibrary = this.actor.initiator.getSkills();
        context.actors = this.actors;

        // Send data for Handlebars to display
        return context;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html.on("change", ".clash-init-skill", (ev) => {
            const target = ev.currentTarget;
            const id = target.value;
            console.log(`Using skill ${id} as the initSkill`);
            if (id !== "-1")
                this.object.initSkill = this.object.initiator.getSkills().find(item => item.id === id);
            else
                this.object.initSkill = 0
            this.render(false);
        });

        html.on("change", '.clash-target', (ev) =>{
            const target = ev.currentTarget;
            const id = target.value;
            console.log(`Targetting Actor ${id}`);
            this.object.setTarget(this.actors.find(actor => actor.id === id));
            this.render(false);
        });

        html.on("change", '.clash-oppose', (ev) =>{
            const target = ev.currentTarget;
            const id = target.value;
            console.log(`Using skill ${id} as the tarSkill`);
            if (id !== "-1")
                this.object.tarSkill = this.object.target.getSkills().find(item => item.id === id);
            else
                this.object.tarSkill = 0
            this.render(false);
        });

        html.on("click", '.trigger-button', (ev) => this.submit());
    }

    async _updateObject(event, formData) {
        this.render();
    }

    // @Override
    submit() {
        super.submit()
        this.object.trigger();
    }



    /**
     * @override?
     */
}

window.ClashApplication = ClashApplication;
