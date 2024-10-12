export class ClashHandler {
    // This should probably be a singleton?
    constructor() {
        this.intRegex = /^(\+|-)?\d+(\.d+)?$/

    }

    dataFormat (data) {
        let doc = document.createElement("div");
        doc.classList.add("hidden-data");

        for (let pair of Object.entries(data)) {
            if (typeof(pair[1]) === "object") {
                const datum = this.dataFormat(pair[1]);
            } else {
                const datum = document.createElement("span");
                datum.textContent = pair[1];
            }
            datum.classList.add(pair[0]);
            doc.appendChild(datum);
        }
        return doc;
    }

    dataDecode (div) {
        let data = {}
        for (let element of div.children) {
            if (this.intRegex.test(element.textContent))
                // NOTE: Everything in javascript is a float anyway so this should be fine riiiiiight?
                data[$(element).attr('class')] = parseFloat(element.textContent, 10)
            else if (this.element.tagName === "DIV") {
                data[$(element).attr('class')] = this.dataDecode(element);
            } else
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
            this.attackOnce()
            this.createClashMessage(this.data, clashType.attack);
        } else {
            this.clashOnce();
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
        // get winner
        const initWin = data.initCoins ? true : false;
        // get coins and damage
        const rolls = initWin
              ? this.roll(this.data.initCoins, 0.5)
              : this.roll(this.data.tarCoins, 0.5);
        const damage = initWin
              ? this.damageCalc(this.data.initBase, this.data.initCoinPower, rolls)
              : this.damageCalc(this.data.initBase, this.data.initCoinPower, rolls);

        // TODO write a chat message
        this.clashWindow(this.data, clashType.final);
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

    attackOnce() {
        // When this function is called, assume that one of the two coins are 0
        const initWin = this.data.initCoins ? true : false;
        const roll = this.rollOnce(0.5);
        this.data.rolled = this.data.rolled === undefined
            ? 1
            : this.data.rolled + 1;
    }

    createClashMessage(data=this.data, type=clashType.init){
        // Host element encompassing chatmessage
        let content = document.createElement("div");
        content.classList.add("clash-message");

        //Format the data
        content.appendChild(this.dataFormat(data));
        // Get the two combatants
        content.appendChild(this.clashTitle(data));

        // If this is init, treat things as all tails
        if (type == clashType.init) {
            data.initRolls = this.roll(data.initCoins, 0);
            data.tarRolls = this.roll(data.tarCoins, 0);
        }

        //Make the window
        content.appendChild(this.clashWindow(data, type));

        // If the clash is not fnished, prepare buttons to continue
        if (type != clashType.final)
            content.appendChild(this.clashButtons());

        //Create the message
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
        // Create window that is a 2-column grid
        let window = document.createElement("div");
        window.classList.add("grid-2col");

        // Initiator's window
        const initWindow = this.initWindow(data, type, false)
        const tarWindow = this.tarWindow(data, type, false)

        window.appendChild(initWindow);
        window.appendChild(tarWindow);
        return window;
    }

    initWindow(data, type, winner) {
        const window = document.createElement("div");
        window.classList.add("clash-message-column");
        window.appendChild(this._h1(data.initName));
        if (type == clashType.clash)
            window.appendChild(this._h2(data.initTotal));
        window.appendChild(this._clashVis(data.initBase, data.initCoinPower, data.initRolls));

        if (winner)
            window.classList.add("clash-winner")
        else
            window.classList.add("clash-loser")

        return window;
    }

    // Probably hilariously scuffed implementation because of how I did the two windows
    tarWindow(data, type, winner) {
        const window = document.createElement("div");
        window.classList.add("clash-message-column");
        window.appendChild(this._h1(data.tarName));
        if (type == clashType.clash)
            window.appendChild(this._h2(data.tarTotal));
        window.appendChild(this._clashVis(data.tarBase, data.tarCoinPower, data.tarRolls));

        if (winner)
            window.classList.add("clash-winner")
        else
            window.classList.add("clash-loser")

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
    attack: 2,
    final: 3
}
