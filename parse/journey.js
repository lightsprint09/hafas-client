'use strict'

const createParseJourneyPart = require('./journey-part')

const clone = obj => Object.assign({}, obj)

const createParseJourney = (profile, stations, lines, remarks) => {
	const parsePart = createParseJourneyPart(profile, stations, lines, remarks)

	// todo: c.sDays
	// todo: c.dep.dProgType, c.arr.dProgType
	// todo: c.conSubscr
	// todo: c.trfRes x vbb-parse-ticket
	const parseJourney = (j) => {
		const parts = j.secL.map(part => parsePart(j, part))
		const res = {
			parts,
			origin: parts[0].origin,
			destination: parts[parts.length - 1].destination,
			departure: parts[0].departure,
			arrival: parts[parts.length - 1].arrival
		}
		if (parts.some(p => p.cancelled)) {
			res.cancelled = true
			res.departure = res.arrival = null
		}

		return res
	}

	return parseJourney
}

module.exports = createParseJourney