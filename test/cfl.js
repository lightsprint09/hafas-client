'use strict'

const tapePromise = require('tape-promise').default
const tape = require('tape')
const isRoughlyEqual = require('is-roughly-equal')

const {createWhen} = require('./lib/util')
const co = require('./lib/co')
const createClient = require('..')
const cflProfile = require('../p/cfl')
const products = require('../p/cfl/products')
const createValidate = require('./lib/validate-fptf-with')
const testJourneysStationToStation = require('./lib/journeys-station-to-station')
const testJourneysStationToAddress = require('./lib/journeys-station-to-address')
const testJourneysStationToPoi = require('./lib/journeys-station-to-poi')
const testEarlierLaterJourneys = require('./lib/earlier-later-journeys')
const journeysFailsWithNoProduct = require('./lib/journeys-fails-with-no-product')
const testDepartures = require('./lib/departures')

const when = createWhen('Europe/Berlin', 'de-DE')

const validate = createValidate({
	when,
	products
}, {})

const test = tapePromise(tape)
const client = createClient(cflProfile)

const ettelbruck = '9258199'
const luxembourg = '9217081'

test('journeys – Ettelbruck to Luxembourg', co(function* (t) {
	const journeys = yield client.journeys(ettelbruck, luxembourg, {
		results: 3,
		departure: when,
		passedStations: true
	})

	yield testJourneysStationToStation({
		test: t,
		journeys,
		validate,
		fromId: ettelbruck,
		toId: luxembourg
	})
	t.end()
}))

// todo: journeys, only one product

test('journeys – fails with no product', (t) => {
	journeysFailsWithNoProduct({
		test: t,
		fetchJourneys: client.journeys,
		fromId: ettelbruck,
		toId: luxembourg,
		when,
		products
	})
	t.end()
})

test('Luxembourg to 9071 Ettelbruck, Rue des Romains 4', co(function*(t) {
	const rueDeRomain = {
		type: 'location',
		address: '9071 Ettelbruck, Rue des Romains 4',
		latitude: 49.847469,
		longitude: 6.097608
	}

	const journeys = yield client.journeys(luxembourg, rueDeRomain, {
		results: 3,
		departure: when
	})

	yield testJourneysStationToAddress({
		test: t,
		journeys,
		validate,
		fromId: luxembourg,
		to: rueDeRomain
	})
	t.end()
}))

test('Luxembourg to Kloster Unser Lieben Frauen', co(function*(t) {
	const centreHospitalier = {
		type: 'location',
		id: '140701020',
		name: 'Ettelbruck, Centre Hospitalier du Nord',
		latitude: 49.853096,
		longitude: 6.094075
	}
	const journeys = yield client.journeys(luxembourg, centreHospitalier, {
		results: 3,
		departure: when
	})

	yield testJourneysStationToPoi({
		test: t,
		journeys,
		validate,
		fromId: luxembourg,
		to: kloster
	})
	t.end()
}))

// todo: journeys: via works – with detour
// todo: without detour

test('earlier/later journeys', co(function* (t) {
	yield testEarlierLaterJourneys({
		test: t,
		fetchJourneys: client.journeys,
		validate,
		fromId: luxembourg,
		toId: ettelbruck
	})

	t.end()
}))

test('journey leg details', co(function* (t) {
	const journeys = yield client.journeys(luxembourg, ettelbruck, {
		results: 1, departure: when
	})

	const p = journeys[0].legs[0]
	t.ok(p.id, 'precondition failed')
	t.ok(p.line.name, 'precondition failed')
	const leg = yield client.journeyLeg(p.id, p.line.name, {when})

	validate(t, leg, 'journeyLeg', 'leg')
	t.end()
}))

test('departures at Ettelbruck.', co(function*(t) {
	const departures = yield client.departures(ettelbruck, {
		duration: 20, when
	})

	yield testDepartures({
		test: t,
		departures,
		validate,
		id: ettelbruck
	})
	t.end()
}))

test('departures with station object', co(function* (t) {
	const deps = yield client.departures({
		type: 'station',
		id: ettelbruck,
		name: 'Ettelbruck',
		location: {
			type: 'location',
			latitude: 49.847298,
			longitude: 6.106157
		}
	}, {when})

	validate(t, deps, 'departures', 'departures')
	t.end()
}))

// todo: nearby

test('locations named Ettelbruck', co(function*(t) {
	const locations = yield client.locations('Ettelbruck', {
		results: 20
	})

	validate(t, locations, 'locations', 'locations')
	t.ok(locations.length <= 20)

	t.ok(locations.find(s => s.type === 'station'))
	t.ok(locations.find(s => s.id && s.name)) // POIs
	t.ok(locations.some((loc) => {
		return (
			loc.id === ettelbruck ||
			loc.id === '00' + ettelbruck // todo: trim IDs
		)
	}))

	t.end()
}))

test('station Ettelbruck', co(function* (t) {
	const s = yield client.station(ettelbruck)

	validate(t, s, 'station', 'station')
	t.equal(s.id, ettelbruck)

	t.end()
}))

test('radar', co(function* (t) {
	const vehicles = yield client.radar({
		north: 49.9,
		west: 6.05,
		south: 49.8,
		east: 6.15
	}, {
		duration: 5 * 60, when, results: 10
	})

	validate(t, vehicles, 'movements', 'vehicles')
	t.end()
}))
