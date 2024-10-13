export class ClashHandler {
    // This should probably be a singleton?
    constructor() {
        this.intRegex = /^(\+|-)?\d+(\.d+)?$/

    }

    dataFormat (data, outer=true) {
        let doc = document.createElement("div");
        if (outer)
            doc.classList.add("hidden-data");

        var datum
        for (let pair of Object.entries(data)) {
            if (typeof(pair[1]) === "object") {
                datum = this.dataFormat(pair[1], false);
            } else {
                datum = document.createElement("span");
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
            else if (element.tagName === "DIV") {
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

    clashCalc(base, coinPower, rolls) {
        return base + coinPower * rolls.reduce((a,b) => a+b, 0)
    }

    calcImages(coin_order) {
        const tail_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/tails.png" width=16/>`
        const head_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/heads.png" width=16/>`
        const unused_img = `<img class="chat-coin-img unused-coin" src="systems/foundry-quintessence-system/assets/tails.png" width=16/>`

        var res = ""
        for(const x of coin_order){
            if (x === 1)
                res += head_img;
            else if (x === -1)
                res += unused_img;
            else
                res += tail_img;
        }
        return res;
    }

    historyConvert() {
        const winner = this.data.init.coins ? this.data.init : this.data.tar;
        const coins = winner.coins;
        const rolled = this.data.rolled;
        let history = this.data.history;
        const rolls = []

        let i = 0;
        for (i; i < rolled; i++) {
            rolls.unshift(history & 1);
            history >>= 1;
        }
        console.log(rolls)
        for (i; i < coins; i++) {
            rolls.push(-1);
        }
        console.log(rolls)
        return rolls

    }

    iterateOnce (message) {
        // Retrieve Data
        const dataDiv = message.find(".hidden-data")[0];
        this.data = this.dataDecode(dataDiv);

        // Iterate a damage or a clash depending on remaining coins
        if (this.data.init.coins <= 0 ||
            this.data.tar.coins  <= 0) {
            const type = this.attackOnce()
            this.createClashMessage(this.data, type);
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
        while (this.data.init.coins && this.data.tar.coins) {
            this.clashOnce();
        }
        // TODO get coins and damage
        const coins = this.data.init.winner ? this.data.init.coins : this.data.tar.coins;
        var sync = clashType.attack;
        while (sync != clashType.final) {
            sync = this.attackOnce();
        }

        // TODO write a chat message
        this.createClashMessage(this.data, clashType.final);
    }

    clashOnce () {
        if (this.data.init.coins === 0 || this.data.init.coins === 0) return;

        // Get rolls
        this.data.init.rolls = this.roll(this.data.init.coins, 0.5);
        this.data.tar.rolls = this.roll(this.data.tar.coins, 0.5);

        // Get clash totals
        this.data.init.total = this.clashCalc(this.data.init.base, this.data.init.coinPower, this.data.init.rolls);
        this.data.tar.total = this.clashCalc(this.data.tar.base, this.data.tar.coinPower, this.data.tar.rolls);

        // Adjust coins
        this.data.init.winner = false;
        this.data.tar.winner = false;
        if (this.data.init.total > this.data.tar.total) {
            this.data.tar.coins--;
            this.data.init.winner = true;
        } else if (this.data.init.total < this.data.tar.total) {
            this.data.init.coins--;
            this.data.tar.winner = true;
        }
    }

    attackOnce() {
        // Needs this for unopposed strikes
        const winner = this.data.init.coins ? this.data.init : this.data.tar;
        this.data.init.winner = winner === this.data.init ? true : false;
        this.data.tar.winner = winner === this.data.tar ? true : false;

        // Lots of default values because undefined stuff can exist in this weird shift I have
        const roll = this.rollOnce(0.5)
        const base = winner.base;
        const coinPower = winner.coinPower;
        const coins = winner.coins;
        this.data.rolled = this.data.rolled === undefined ? 1 : this.data.rolled + 1;
        this.data.history = this.data.history === undefined ? 0 : this.data.history;
        this.data.damage = this.data.damage === undefined ? 0 : this.data.damage;
        this.data.incr = this.data.incr === undefined ? base : this.data.incr;

        this.data.history <<= 1; // Oh I hate this with all my heart, but if I parse full JSONs in this I will cry
        this.data.history += roll
        this.data.incr += coinPower * roll;
        this.data.damage += this.data.incr;

        if (this.data.rolled >= coins)
            return clashType.final
        return clashType.attack
    }

    createClashMessage(data=this.data, type=clashType.init){
        // Host element encompassing chatmessage
        let content = document.createElement("div");
        content.classList.add("clash-message");

        //Format the data
        content.appendChild(this.dataFormat(data));
        // Get the two combatants
        content.appendChild(this.clashTitle(data));

        // If this is init., treat things as all tails
        if (type == clashType.init) {
            data.init.rolls = this.roll(data.init.coins, 0);
            data.tar.rolls = this.roll(data.tar.coins, 0);
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
${data.init.name}
<span class="resource-input-seperator"> vs </span>
${data.tar.name}`
        return title
    }

    clashWindow(data, type) {
        // Create window that is a 2-column grid
        let window = document.createElement("div");
        window.classList.add("grid-2col");

        // Init.iator's window
        let initWindow
        let tarWindow
        if (type === clashType.clash || type === clashType.init){
            initWindow = this.clashFrame(data.init)
            tarWindow = this.clashFrame(data.tar)
        } else if (type === clashType.attack || type === clashType.final) {
            initWindow = this.attackFrame(data.init);
            tarWindow = this.attackFrame(data.tar);
        }

        window.appendChild(initWindow);
        window.appendChild(tarWindow);
        return window;
    }

    clashFrame(charData) {
        const window = document.createElement("div");
        window.classList.add("clash-message-column");
        window.appendChild(this._h1(charData.name));

        window.appendChild(this._h2(charData.total));
        window.appendChild(this._clashVis(charData.base, charData.coinPower, charData.rolls));

        if (charData.winner)
            window.classList.add("clash-winner")
        else
            window.classList.add("clash-loser")

        return window;
    }

    attackFrame(charData) {
        const window = document.createElement("div");
        window.classList.add("clash-message-column");
        window.appendChild(this._h1(charData.name));


        if (charData.winner) {
            window.classList.add("clash-winner")
            window.appendChild(this._h2(this.data.damage));
            window.appendChild(this._h3(this.data.incr));
            window.appendChild(this._clashVis(charData.base, charData.coinPower, this.historyConvert()));
        } else {
            window.classList.add("clash-loser")
        }

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

    _h3(name) {
        let element = document.createElement("h3");
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
