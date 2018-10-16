import { app, h } from "hyperapp"
import dayjs from "dayjs"

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
    const result = text.match(regex)
    if (result === null || result === undefined) {
        if (def === undefined) {
            throw new Error("Text did not match regex.")
        } else {
            return def
        }
    }
    else { return result[1] }
}

// Get all important dragony information
const text = document.body.textContent
const days = parseInt(getCapture(text, /in: (\d+) day/, 0))
const hours = parseInt(getCapture(text, /and (\d+) hour/, 0))
const code = getCapture(window.location.pathname, /\/([0-9A-Za-z]{5})/)
const hoursRemaining = (days * 24) + hours

function load(name, defaultval) {
    try {
        const data = JSON.parse(localStorage[name], (k, v) => {
            if (typeof v === "string") {
                const d = Date.parse(v)
                if (!isNaN(d)) {
                    return new Date(d)
                } else {
                    return v
                }
            } else {
                return v
            }
        })
        console.log("Loaded", data)
        return data
    } catch(e) {
        console.log("Failed to parse stored data!")
        return defaultval
    }
}

function save(name, val) {
    localStorage[name] = JSON.stringify(val)
}

const state = {
    refresh: false,
    lastHours: null,
    changeStartTime: null,
    changeEndTime: null
}

const actions = {
    toggleRefresh: () => (state, actions) => {
        return { refresh: !state.refresh }
    },
    save: () => state => {
        console.log("Saved", state)
        save(code, {
            ...state,
            lastTime: new Date(),
            lastHours: hoursRemaining
        })
    },
    load: () => state => {
        const loaded = load(code, {})
        return {
            ...state,
            ...loaded
        }
    },
    refreshIfEnabled: () => state => {
        if (state.refresh) {
            setTimeout(() => window.location.reload(), 2000)
        }
    },
    detectTimeChange: () => state => {
        if (state.lastHours !== null && state.lastHours !== hoursRemaining) {
            return {
                changeStartTime: state.lastTime,
                changeEndTime: new Date()
            }
        }
    },
    clearTimeChange: () => state => {
        return {
            changeStartTime: null,
            changeEndTime: null
        }
    }
}

const formatNull = (x, f) => (x === null || x === undefined) ? "[unknown]" : (f !== undefined ? f(x) : x)
const formatDate = date => dayjs(date).format("HH:mm:ss")

const view = (state, actions) => (<div>
        <div className="code">Code: {code}</div>
        <div className="hours">Life: {hoursRemaining}h remaining</div>
        <div className="hours last">Life was: {formatNull(state.lastHours)}h</div>
        <button className="refresh" onclick={actions.toggleRefresh}>{state.refresh ? "Disable Refreshing" : "Enable Refreshing"}</button>
        <div className="time change">Changed between: {formatNull(state.changeStartTime, formatDate)} and {formatNull(state.changeEndTime, formatDate)}</div>
        <button className="clear" onclick={actions.clearTimeChange}>Clear Change Time</button>
    </div>)

if (hoursRemaining > 0) { // don't run on grown dragons
    const mountingEl = document.getElementById("eggtime") || document.createElement("div")
    mountingEl.id = "eggtime"
    document.body.appendChild(mountingEl)
    const main = app(state, actions, view, mountingEl)

    main.load()
    main.detectTimeChange()
    window.onbeforeunload = main.save

    console.log("DC Egg Time Finder running.")

    main.refreshIfEnabled()
}