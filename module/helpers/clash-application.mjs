import { getViewedActors } from './global.mjs';


export class ClashApplication extends FormApplication {

	constructor(obj) {
		super(obj);
	}

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ['form'],
			width: 800,
			height: 400,
			popOut: true,
			template: `systems/foundry-quintessence-system/templates/helpers/clash.hbs`,
			id: 'clash-application',
			title: 'Clashing Window',
			closeOnSubmit: true,
			submitOnClose: false,
			submitOnChange: false,
		});
	}

	/** @override */
	getData() {
		const context = super.getData();
        this.actors = getViewedActors();

		context.clash = this.object;
		context.skillLibrary = this.object.initiator.getSkills();
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
			this.object.initSkill = this.object.initiator.getSkills().find(item => item.id === id);
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
			this.object.tarSkill = this.object.target.getSkills().find(item => item.id === id);
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
