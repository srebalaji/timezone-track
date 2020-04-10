import axios from 'axios'

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

const isValidName = async (teamName) => {
  return axios.get(`https://f23le7ruh6.execute-api.ap-south-1.amazonaws.com/dev/exists-doc?name=${teamName}`)
    .then((res) => {
      if (res.status === 200) {
        return true
      }
      return false
    })
    .catch((e) => {
      return false
    })
}

const isNameValid = (teamName) => {
	const letters = /^[0-9a-zA-Z]+$/
	if (teamName.match(letters)) {
		return true
	}
	return false
}

export {
	setLocal,
	makeUnique,
	isValidName,
	isNameValid,
}
