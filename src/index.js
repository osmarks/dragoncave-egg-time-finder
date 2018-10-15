import { app, h } from "hyperapp"

const css = `
#eggtime {
    position: fixed;
    top: 0;
    left: 0;
    background: white;
    color: black;
    padding: 0.5em;
}
`

const head = document.head || document.getElementsByTagName('head')[0]
const style = document.createElement('style')
style.appendChild(document.createTextNode(css))
head.appendChild(style)

function getCapture(text, regex, def) {
    const result = text.match(regex);
    if (result === null || result === undefined) {
        if (def === undefined) {
            throw new Error("Text did not match regex.");
        } else {
            return def;
        }
    }
    else { return result[1]; }
}

// Get all important dragony information
const text = document.body.textContent;
const days = parseInt(getCapture(text, /in: (\d+) day/, 0));
const hours = parseInt(getCapture(text, /and (\d+) hour/, 0));
const code = getCapture(text, /\(([0-9A-Za-z]{5})/);
const hoursRemaining = (days * 24) + hours;

const state = {

}

const actions = {

}
const view = (state, actions) => <div>Hi!</div>

const mountingEl = document.getElementById("eggtime") || document.createElement("div")
mountingEl.id = "eggtime"
document.body.appendChild(mountingEl)
const main = app(state, actions, view, mountingEl)

console.log("DC Egg Time running.")