export class ClashHander {
    // Does this actually need a constructor? Probably not
    constructor() {

    }

    dataFormat (data) {
        let doc = document.createElement("div");
        doc.classList.add("hidden-data");

        for (let [key, value] of Object.entries(data)) {
            const datum = document.createElement(span);
            datum.classList.add(key);
            datum.textContent = value;
            doc.appendChild(datum);
        }
        return doc;
    }

    dataDecode (div) {
        data = {}
        for (let element of div.children) {
            data[element.id] = element.textContent
        }
        return data;
    }

    roll(coins, headsProb) {
        var heads = [];
        for(let i = 0; i < coins; i++) {
            if (Math.random() < headsProb)
                heads.push(1);
            else
                heads.push(0);
        }
        return heads;
    }

    clashCalc(base, coinPower, rolls) {
        return base + coinPower * rolls.reduce((a,b) => a+b, 0)
    }

    calcImages(coin_order) {
        const tail_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/tails.png" width=16/>`
        const head_img = `<img class="chat-coin-img" src="systems/foundry-quintessence-system/assets/heads.png" width=16/>`

        var res = ""
        for(const x of coinList) {
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
        }
    }

    clashContinue () {

        // Get rolls
        this.data.initRolls = this.roll(this.data.initCoins, 0.5);
        this.data.tarRolls = this.roll(this.data.tarCoins, 0.5);

        // Get clash totals
        this.data.initTotal = this.clashCalc(this.data.initBase, this.data.initCoinPower, this.data.initRolls);
        this.data.tarTotal = this.clashCalc(this.data.tarBase, this.data.tarCoinPower, this.data.tarRolls);

        // Adjust coins
        this.data.initTotal > this.data.tarTotal ? this.data.tarCoins--;
        this.data.initTotal < this.data.tarTotal ? this.data.initCoins--;

        this.createClashMessage(this.data);
    }

    createClashMessage(data){
        let content = document.createElement("div");
        content.ClassList.add("clash-message");

        content.appendChild(this.dataFormat(data));
        content.appendChild(this.clashTitle(data));

        content.appendChild(this.clashWindow(data));
        content.appendChild(this.clashButtons());
        ChatMessage.create({
            content: content,
        })

    }

    clashTitle(data) {
        title = document.createElement("h1")
        title.textContent = `
${data.initName}
<span class="resource-input-seperator"> vs </span>
${data.tarName}`
        return title
    }

    initWindow(data) {
        let window = document.createElement("div");
        window.ClassList.add("grid-2col");

        // TODO More abstracting than this copy-paste garbage
        // Or not because I only need these two nerds
        let initWindow = document.createElement("div");
        initWindow.ClassList.add("clash-message-column");
        initWindow.appendChild(this._h1(data.initName));
        initWindow.appendChild(this._clashVis(data.initBase, data.initCoinPower, data.initRolls));

        let tarWindow = document.createElement("div");
        tarWindow.ClassList.add("clash-message-column");
        tarWindow.appendChild(this._h1(data.tarName));
        tarWindow.appendChild(this._clashVis(data.tarBase, data.tarCoinPower, data.tarRolls));

        window.appendChild(initWindow);
        window.appendChild(tarWindow);
        return window;
    }

    clashWindow(data) {
        let window = document.createElement("div");
        window.ClassList.add("grid-2col");

        // TODO More abstracting than this copy-paste garbage
        // Or not because I only need these two nerds
        let initWindow = document.createElement("div");
        initWindow.ClassList.add("clash-message-column");
        initWindow.appendChild(this._h1(data.initName));
        initWindow.appendChild(this._h2(data.initTotal));
        initWindow.appendChild(this._clashVis(data.initBase, data.initCoinPower, data.initRolls));

        let tarWindow = document.createElement("div");
        tarWindow.ClassList.add("clash-message-column");
        tarWindow.appendChild(this._h1(data.tarName));
        tarWindow.appendChild(this._h2(data.tarTotal));
        tarWindow.appendChild(this._clashVis(data.tarBase, data.tarCoinPower, data.tarRolls));

        if (data.initTotal > data.tarTotal) {
            initWindow.ClassList.add("clash-winner");
            tarWindow.ClassList.add("clash-loser");
        } else if (data.initTotal < data.tarTotal){
            initWindow.ClassList.add("clash-loser");
            tarWindow.ClassList.add("clash-winner");
        }

        window.appendChild(initWindow);
        window.appendChild(tarWindow);
        return window;
    }

    clashButtons() {
        let element = document.createElement("div");
        element.ClassList.add("grid-2col");
        element.appendChild(this._button("Start", "clash-continue"));
        element.appendChild(this._button("Skip To End", "clash-skip"));
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
        button.ClassList.add(elemClass);
        return button;
    }

    _clashVis(base, coinPower, rollsList) {
        let element = document.createElement("h3");
        const sign = coinPower < 0 ? "" : "+";
        const img = this.calcImages(rollsList);
        element.textContent = `${base} ${sign}${coinPower} ${img}`;
        return element;
    }


}
