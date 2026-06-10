import { parsePhoneNumber, isValidPhoneNumber, getCountries } from '../max/index.js'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	})
}

function validate(phone, country) {
	if (!phone) {
		return json({ error: 'Missing required param: phone' }, 400)
	}

	try {
		const parsed = parsePhoneNumber(phone, country?.toUpperCase())

		if (!parsed) {
			return json({ valid: false })
		}

		return json({
			valid: parsed.isValid(),
			possible: parsed.isPossible(),
			number: parsed.number,
			country: parsed.country ?? null,
			countryCallingCode: parsed.countryCallingCode,
			nationalNumber: parsed.nationalNumber,
			nationalFormatted: parsed.formatNational(),
			internationalFormatted: parsed.formatInternational(),
			uri: parsed.getURI(),
			type: parsed.getType() ?? null,
		})
	} catch (e) {
		return json({ valid: false, error: e.message })
	}
}

async function handleValidate(request) {
	const url = new URL(request.url)

	if (request.method === 'POST') {
		const body = await request.json().catch(() => null)
		if (!body) {
			return json({ error: 'Invalid JSON body' }, 400)
		}
		return validate(body.phone, body.country)
	}

	return validate(url.searchParams.get('phone'), url.searchParams.get('country'))
}

export default {
	async fetch(request, env) {
		const url = new URL(request.url)

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS })
		}

		if (url.pathname === '/api/validate') {
			return handleValidate(request)
		}

		if (url.pathname === '/api/countries') {
			return json(getCountries())
		}

		return env.ASSETS.fetch(request)
	},
}
