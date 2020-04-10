import React, { Component, Fragment } from "react"
import { Redirect, Link } from 'react-router-dom';
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.min.css'
import { Input, Button, Popover, PopoverHeader, PopoverBody } from 'reactstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import './styles/app.css'

import Select from 'react-select'
import AsyncSelect from 'react-select/async'
import moment from 'moment-timezone'

import countriesData from '../data/country.json'
import countriesV2 from '../data/output_15k.json'

import { setLocal, makeUnique, isValidName, isNameValid } from './helpers'

const saveData = async (teamName, data) => {
  const options = {
      method: 'POST',
      url: `https://f23le7ruh6.execute-api.ap-south-1.amazonaws.com/dev/write-doc?name=${teamName}`,
      data: data
    }

    return axios(options).then((res) => {
      console.log(res.data)
      return true
    }).catch((e) => {
      console.log('Error in saving ', e)
      return false
    })
}

const readLists = async (teamName) => {
  return axios.get(`https://f23le7ruh6.execute-api.ap-south-1.amazonaws.com/dev/read-doc?name=${teamName}`)
    .then((res) => {
      if (res.status === 200) {
        if(res.data && res.data.response && res.data.response.zones) {
          console.log(res.data.response.zones)
          return res.data.response.zones
        }
        return null
      }
      return null
    })
    .catch((e) => {
      return null
    })
}

const countryName = (code = "IN") => countriesData.countries[code.toUpperCase()].name


class App extends Component {
  constructor(props) {
    super(props)
    
    const lists = []
    const countries = countriesV2
    const options = []

    this.state = {
      options: options,
      lists: lists,
      value: "",
      popover: false,
      shareButton: false,
      shareButtonText: "Share",
      shareError: "",
      redirect: false,
    }

    this.handleCountry = this.handleCountry.bind(this)
    this.loadOptions = this.loadOptions.bind(this)
    this.deleteCountry = this.deleteCountry.bind(this)
    this.handleForm = this.handleForm.bind(this)
    this.toggle = this.toggle.bind(this)
  }

  toggle() {
    this.setState({popover: !this.state.popover})
  }

  handleCountry(e) {
    this.state.lists.unshift({ country: e.label, timeZone: e.timeZone })
    this.state.lists = makeUnique(this.state.lists)

    this.setState({
      lists: [...new Set(this.state.lists)],
      value: ""
    }, () => {
      if (this.props.fromTeam &&
        this.props.match &&
        this.props.match.params &&
        this.props.match.params.id) {
        const teamName = this.props.match.params.id
        saveData(teamName, this.state.lists)
          .catch(e => console.log(e))
      } else if(!this.props.fromTeam) {
        setLocal('items', this.state.lists)
      }
    })
  }

  deleteCountry(name) {
    const lists = this.state.lists.filter(l => l.country != name)
    this.setState({lists: lists}, () => {
      if (this.props.fromTeam &&
        this.props.match &&
        this.props.match.params &&
        this.props.match.params.id) {
        const teamName = this.props.match.params.id
        saveData(teamName, this.state.lists)
          .catch(e => console.log(e))
      } else if(!this.props.fromTeam) {
        setLocal('items', this.state.lists)
      }
    })
  }

  async handleForm(e) {
    e.preventDefault()
    this.setState({shareButton: true, shareButtonText: "Creating link..!"})

    const formData = new FormData(e.target)
    const teamName = formData.get('teamName')

    const isRegexValid = isNameValid(teamName)
    
    if (!isRegexValid) {
      this.setState({shareError: "Name can only be alpha numeric..!", shareButton: false, shareButtonText: "Share"})
      return
    }

    const isValid = await isValidName(teamName)

    if (!isValid) {
      this.setState({shareError: "Name is already taken. Please try someother name", shareButton: false, shareButtonText: "Share"})
      return
    }

    const listsFromLocal = localStorage.getItem('items')
    const lists = listsFromLocal ? JSON.parse(listsFromLocal) : [{"country":"Chennai  - India","timeZone":"Asia/Kolkata"}]

    console.log('Share with others', teamName)

    const isSaveData = await saveData(teamName, lists)
    
    if (!isSaveData) {
      this.setState({shareError: "Some other occured. Please try again later..!", shareButton: false, shareButtonText: "Share"})
      return
    }

    this.setState({redirect: true, teamName: teamName})
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

  async componentDidMount() {
    let lists = []
    if (this.props.match && this.props.match.params && this.props.match.params.id) {
      const savedData = await readLists(this.props.match.params.id)
      if (savedData) lists = savedData
    } else {
      const listsFromLocal = localStorage.getItem('items')
      lists = listsFromLocal ? JSON.parse(listsFromLocal) : [{"country":"Chennai  - India","timeZone":"Asia/Kolkata"}]
    }
    
    this.setState({lists: lists})

    this.interval = setInterval(() => {
      this.setState({lists: this.state.lists})
    }, 1000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    if (this.state.redirect) {
      window.location = `/team/${this.state.teamName}`
    }
    return (
      <div className="container">
        <div className="row">
          <div className="col-md-10 offset-md-1">
            <h3 className="text-center" id="title">TimeZone Track </h3>

            <div id="country" className="">
              <Button id="share" type="button" color="primary" className={`${this.props.fromTeam ? 'd-none' : ''}`}>
                Share this page with your team
              </Button>

              <Popover placement="bottom" isOpen={this.state.popover} target="share" fade={false} toggle={this.toggle}>
                <PopoverHeader>Share with your team</PopoverHeader>
                <PopoverBody>
                  <form onSubmit={this.handleForm}>
                    <Input type="text" placeholder="Enter some unique name" name="teamName" autoFocus={true}/>
                    <p id="share-error-red">{this.state.shareError}</p>
                    <Input type="submit" value={this.state.shareButtonText} className="btn btn-outline-primary" disabled={this.state.shareButton}/>
                  </form>
                </PopoverBody>
              </Popover>

              <AsyncSelect className="text-center" cacheOptions loadOptions={this.loadOptions} placeholder={"Search for your City"} onChange={this.handleCountry} noOptionsMessage={() => "Search for your City"} value={this.state.value}/>
            </div>

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

    if (lists.length > 0) {
      return (
        <div className="cards">
          {lists}
        </div>
      )
    } else {
      return (
        <h5 className="text-center" id="loading">Loading..! </h5>
      )
    }
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
