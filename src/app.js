import React, { Component, Fragment } from "react"

import 'bootstrap/dist/css/bootstrap.min.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './styles/app.css'

import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import moment from 'moment-timezone'

import countriesData from '../data/country.json'

// import countriesV2 from '../timezone-data/output.json'
import countriesV2 from '../data/output_15k.json'

const setLocal = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const makeUnique = (items) => {
  const arr = []
  return items.filter((i) => {
    if(!arr.includes(i.country)) {
      arr.push(i.country)
      return true
    }
    return false
  })
}

const countryName = (code = "IN") => countriesData.countries[code.toUpperCase()].name


class App extends Component {
  constructor(props) {
    super(props)
    const listsFromLocal = localStorage.getItem('items')
    const lists = listsFromLocal ? JSON.parse(listsFromLocal) : [{"country":"Chennai  - India","timeZone":"Asia/Kolkata"}]
    const countries = countriesV2
    const options = []
    // const options = Object.values(countries.countries).map((country) => {
    //   return {
    //     value: `${country.abbr} - ${country.code}`,
    //     label: country.name,
    //     timeZone: country.zones[0],
    //   }
    // })

    this.state = {
      options: options,
      lists: lists,
      value: ""
    }
    this.handleCountry = this.handleCountry.bind(this)
    this.loadOptions = this.loadOptions.bind(this)
    this.deleteCountry = this.deleteCountry.bind(this)
  }

  handleCountry(e) {
    this.state.lists.unshift({ country: e.label, timeZone: e.timeZone })
    this.state.lists = makeUnique(this.state.lists)

    this.setState({
      lists: [...new Set(this.state.lists)],
      value: ""
    }, () => {
      setLocal('items', this.state.lists)
    })
  }

  deleteCountry(name) {
    const lists = this.state.lists.filter(l => l.country != name)
    this.setState({lists: lists}, () => {
      setLocal('items', this.state.lists)
    })
  }

  loadOptions(input, callback) {
    const countries = countriesV2
    const reg = new RegExp(`^${input}`, "gi")
    const data = countries.filter(c => c.city.match(reg)) || countries.slice(0, 10)
    // console.log(data)
    const output = data.slice(0, 60).map((d) => ({
      value: `${d.city} - ${d.code}`,
      label: `${d.city.split('-')[0]} - ${countryName(d.code)}`,
      timeZone: d.timezone
    }))
    callback(output)
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState({lists: this.state.lists})
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <h3 className="text-center" id="title">TimeZone Track </h3>
            <AsyncSelect id="country" className="text-center" cacheOptions loadOptions={this.loadOptions} placeholder={"Search for your City"} onChange={this.handleCountry} noOptionsMessage={() => "Search for your City"} value={this.state.value}/>
            <List lists={this.state.lists} deleteCountry={this.deleteCountry}/>
          </div>
        </div>
      </div>
    )
  }
}

class List extends Component {
  constructor(props) {
    super(props)
    this.state = {

    }
  }

  render() {
    const lists = this.props.lists.map((list) => {
      return (
        <Card countryName={list.country} timezone={list.timeZone} deleteCountry={this.props.deleteCountry} key={list.country}/>
      )
    })
    return (
      <div className="cards">
        {lists}
      </div>
    )
  }
}

class Card extends Component {
  constructor(props) {
    super(props)

    this.state = {
      showClose: "none"
    }
    this.handleMouseEvent = this.handleMouseEvent.bind(this)
  }

  handleMouseEvent(e) {
    if (e.type == "mouseenter") {
      this.setState({showClose: "block"})
    } else if(e.type == "mouseleave") {
      this.setState({showClose: "none"})
    }
  }

  deleteCountry(name, e) {
    this.props.deleteCountry(name)
  }

  render() {
    const timezone = this.props.timezone
    return(
      <div className="row">
        <div className="col-sm-8 offset-md-2">
          <div className="card" key={this.props.countryName} onMouseEnter={this.handleMouseEvent} onMouseLeave={this.handleMouseEvent}>
            <div className="card-body">
              <div style={{"minHeight": "18px"}} className="">
                { this.state.showClose && <FontAwesomeIcon icon={faTimes} className="pointer" style={{display: this.state.showClose, "marginLeft": "auto", "marginRight": 0}} onClick={this.deleteCountry.bind(this, this.props.countryName)} key={this.props.countryName}/> }
              </div>
              <div className="row">
                <div className="col-sm-6" style={{textAlign: "center"}}>
                  <h4 id="country-name">{this.props.countryName}</h4>
                  <p id="timezone">{timezone}</p>
                </div>
                <div className="col-sm-6 pull-right" style={{textAlign: "center"}}>
                  <h5 id="time" style={{display: "block"}}>
                    {moment().tz(timezone).format('MMM Do, hh:mm A')} <br/>
                    <Diffhours timezone={timezone}/>
                  </h5>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function Diffhours(props) {
  const now = moment.utc()
  const currentTimezone = moment().tz(moment.tz.guess(true)).utcOffset(now, true)
  const selectedTimezone = moment().tz(props.timezone).utcOffset(now, true)
  // console.log(currentTimezone, selectedTimezone)
  
  // calculate the difference in hours
  let hours = moment.duration(selectedTimezone.diff(currentTimezone)).asHours()
  let signalHours = ""

  if (hours == 0) hours = ""
  if (hours > 0) { hours = `+${parseFloat(hours).toPrecision(2)} hrs`; signalHours = "signal-green" }
  if (hours < 0) { hours = `${parseFloat(hours).toPrecision(2)} hrs`; signalHours = "app-red" }
  return <p className={`small-p small-padding app-red small-letter-spacing ${signalHours ? signalHours : ""}`}>{hours}</p>
}

export default App;
