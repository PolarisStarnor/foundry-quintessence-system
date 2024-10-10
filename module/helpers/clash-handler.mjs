export class ClashHandler {
	// Does this actually need a constructor? Probably not
	constructor() {
		this.intRegex = /^(\+|-)?\d+$/

	}

	dataFormat (data) {
		let doc = document.createElement("div");
		doc.classList.add("hidden-data");

		for (let pair of Object.entries(data)) {
			const datum = document.createElement("span");
			datum.classList.add(pair[0]);
			datum.textContent = pair[1];
			doc.appendChild(datum);
		}
		return doc;
	}

	dataDecode (div) {
		let data = {}
		for (let element of div.children) {
			if (this.intRegex.test(element.textContent))
				data[$(element).attr('class')] = parseInt(element.textContent, 10)
			else
				data[$(element).attr('class')] = element.textContent
		}
		return data;
	}

	roll(coins, headsProb) {
		var heads = [];
		for(let i = 0; i < coins; i++) {
			heads.push(Math.random() < headsProb ? 1 : 0);
		}
		return heads;
	}

	rollOnce(headsProb) {
		return Math.random() < headsProb ? 1 : 0;
	}

    damageCalc(base, coinPower, rolls) {
        var total = base;
        var incr = base;
        for (const roll of rolls) {
            incr += roll * coinPower;
            total += incr;
        }
        return total;
    }

	clashCalc(base, coinPower, rolls) {
		return base + coinPower * rolls.reduce((a,b) => a+b, 0)
	}

	calcImages(coin_order) {
		const tail_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/tails.png" width=16/>`
		const head_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/heads.png" width=16/>`

		var res = ""
		for(const x of coin_order){
			if (x)
				res += head_img;
			else
				res += tail_img;
		}
		return res;
	}

	iterateOnce (message) {
		// Retrieve Data
		const dataDiv = message.find(".hidden-data")[0];
		this.data = this.dataDecode(dataDiv);

		// Iterate a damage or a clash depending on remaining coins
		if (this.data.initCoins <= 0 ||
			this.data.tarCoins  <= 0) {
			this.attackContinue()
		} else {
			this.clashContinue()
			this.createClashMessage(this.data, clashType.clash);
		}
	}

	iterateAll(message) {
		// Retrieve Data
		const dataDiv = message.find(".hidden-data")[0];
		this.data = this.dataDecode(dataDiv);

        // Finish all Clashes
        while (this.data.initCoins && this.data.tarCoins) {
            this.clashOnce();
        }
        const initWin = data.initCoins ? true : false;
        const rolls = initWin
              ? this.roll(this.data.initCoins, 0.5)
              : this.roll(this.data.tarCoins, 0.5);
        const damage = initWin
              ? this.damageCalc(this.data.initBase, this.data.initCoinPower, rolls)
              : this.damageCalc(this.data.initBase, this.data.initCoinPower, rolls);

	}

	clashOnce () {

		// Get rolls
		this.data.initRolls = this.roll(this.data.initCoins, 0.5);
		this.data.tarRolls = this.roll(this.data.tarCoins, 0.5);

		// Get clash totals
		this.data.initTotal = this.clashCalc(this.data.initBase, this.data.initCoinPower, this.data.initRolls);
		this.data.tarTotal = this.clashCalc(this.data.tarBase, this.data.tarCoinPower, this.data.tarRolls);

		// Adjust coins
		this.data.initTotal > this.data.tarTotal ? this.data.tarCoins-- : null;
		this.data.initTotal < this.data.tarTotal ? this.data.initCoins-- : null;
	}

	attackContinue() {
		// When this function is called, assume that one of the two coins are 0
        const initWin = data.initCoins ? true : false;
		roll = this.rollOnce(0.5);
		if (this.data.initRolled === undefined)
			this.data.initRolled = 1;
		else
			this.data.initRolled += 1

	}

	createClashMessage(data=this.data, type=clashType.init){
		let content = document.createElement("div");
		content.classList.add("clash-message");

		content.appendChild(this.dataFormat(data));
		content.appendChild(this.clashTitle(data));

		if (type == clashType.init) {
			data.initRolls = this.roll(data.initCoins, 0);
			data.tarRolls = this.roll(data.tarCoins, 0);
		}
		content.appendChild(this.clashWindow(data, type));
		content.appendChild(this.clashButtons());
		console.log(content);
		console.log(data);
		ChatMessage.create({
			content: content.outerHTML,
		})
	}

	clashTitle(data) {
		let title = document.createElement("h1")
		title.innerHTML = `
${data.initName}
<span class="resource-input-seperator"> vs </span>
${data.tarName}`
		return title
	}

	clashWindow(data, type) {
		let window = document.createElement("div");
		window.classList.add("grid-2col");

		// TODO More abstracting than this copy-paste garbage
		// Or not because I only need these two nerds
		let initWindow = document.createElement("div");
		initWindow.classList.add("clash-message-column");
		initWindow.appendChild(this._h1(data.initName));
		if (type == clashType.init)
			initWindow.appendChild(this._h2(data.initTotal));
		initWindow.appendChild(this._clashVis(data.initBase, data.initCoinPower, data.initRolls));

		let tarWindow = document.createElement("div");
		tarWindow.classList.add("clash-message-column");
		tarWindow.appendChild(this._h1(data.tarName));
		if (type == clashType.init)
			tarWindow.appendChild(this._h2(data.tarTotal));
		tarWindow.appendChild(this._clashVis(data.tarBase, data.tarCoinPower, data.tarRolls));

		if (data.initTotal > data.tarTotal) {
			initWindow.classList.add("clash-winner");
			tarWindow.classList.add("clash-loser");
		} else if (data.initTotal < data.tarTotal){
			initWindow.classList.add("clash-loser");
			tarWindow.classList.add("clash-winner");
		} else if (type != clashType.init) {
			tarWindow.classList.add("clash-loser");
			initWindow.classList.add("clash-loser");
		}

		window.appendChild(initWindow);
		window.appendChild(tarWindow);
		return window;
	}

	clashButtons() {
		let element = document.createElement("div");
		element.classList.add("grid-2col");
		element.appendChild(this._button("Continue", "clash-continue"));
		element.appendChild(this._button("Skip To End", "clash-skip"));
		return element;
	}

	_h1(name) {
		let element = document.createElement("h1");
		element.textContent = name;
		return element;
	}

	_h2(name) {
		let element = document.createElement("h2");
		element.textContent = name;
		return element;
	}

	_button(text, elemClass) {
		let button = document.createElement("button");
		button.textContent = text;
		button.classList.add(elemClass);
		return button;
	}

	_clashVis(base, coinPower, rollsList) {
		let element = document.createElement("h3");
		const sign = coinPower < 0 ? "" : "+";
		const img = this.calcImages(rollsList);
		element.innerHTML = `${base} ${sign}${coinPower} ${img}`;
		return element;
	}


}

const clashType = {
	init: 0,
	clash: 1,
	attack: 2
}
