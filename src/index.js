import { app, h } from "hyperapp"
import { format, differenceInSeconds, subSeconds, addHours, getTime } from "date-fns"

const css = `
#eggtime {
    position: fixed;
    top: 0;
    left: 0;
    background: white;
    color: black;
    padding: 0.5em;
}

#eggtime .warning {
    color: red;
}

#eggtime .button {
    cursor: pointer;
    border: 1px solid black;
    padding: 0.2em;
    margin: 0.1em;
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
    firstPossibleChangeTime: null,
    lastPossibleChangeTime: null,
    minimized: false,
    hoursAfterChange: null
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
                firstPossibleChangeTime: state.lastTime,
                lastPossibleChangeTime: new Date(),
                hoursAfterChange: hoursRemaining
            }
        }
    },
    clearTimeChange: () => state => ({
        firstPossibleChangeTime: null,
        lastPossibleChangeTime: null,
        hoursAfterChange: null
    }),
    hide: () => state => ({ minimized: true }),
    show: () => state => ({ minimized: false })
}

const formatNull = (x, f) => (x === null || x === undefined) ? "[unknown]" : (f !== undefined ? f(x) : x)
const formatDate = date => format(date, "HH:mm:ss DD/MM/YY")
const warn = lines => <p className="warning">{lines.map(x => <p>{x}</p>)}</p> 
const midpoint = (d1, d2) => new Date((getTime(d1) + getTime(d2)) / 2)

const view = (state, actions) => {
    if (state.minimized) {
        console.log("DCETF minimized.")
        return <div className="show button" onclick={actions.show}>Show</div>
    }

    const firstChange = state.firstPossibleChangeTime
    const lastChange = state.lastPossibleChangeTime
    const changeRecorded = firstChange && lastChange
    return (<div>
        <div className="code">Code: {code}</div>
        <div className="hours">Life: {hoursRemaining}h remaining</div>
        <div className="hours last">Life was: {formatNull(state.lastHours)}h</div>

        <button className="refresh button" onclick={actions.toggleRefresh}>{state.refresh ? "Disable Refreshing" : "Enable Refreshing"}</button>

        <div className="time change">Changed between: {formatNull(firstChange, formatDate)} and {formatNull(lastChange, formatDate)}</div>

        {changeRecorded && <div className="time death">Approx ToD: {formatDate(addHours(midpoint(lastChange, firstChange), state.hoursAfterChange))}</div>}

        {changeRecorded && differenceInSeconds(lastChange, firstChange) > 15 && warn(["This is inaccurate - time interval too large.", "Use the autorefresh mode."])}

        <button className="clear button" onclick={actions.clearTimeChange}>Clear Change Time</button>

        <br />
        <button className="hide button" onclick={actions.hide}>Hide</button>
    </div>)
}

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
