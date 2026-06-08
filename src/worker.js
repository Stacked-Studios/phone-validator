import { parsePhoneNumber, isValidPhoneNumber, getCountries } from '../min/index.js'

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
	})
}

function handleValidate(url) {
	const phone = url.searchParams.get('phone')
	const country = url.searchParams.get('country')?.toUpperCase() || undefined

	if (!phone) {
		return json({ error: 'Missing required query param: phone' }, 400)
	}

	try {
		const parsed = parsePhoneNumber(phone, country)

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

export default {
	async fetch(request, env) {
		const url = new URL(request.url)

		if (request.method === 'OPTIONS') {
			return new Response(null, { status: 204, headers: CORS_HEADERS })
		}

		if (url.pathname === '/api/validate') {
			return handleValidate(url)
		}

		if (url.pathname === '/api/countries') {
			return json(getCountries())
		}

		return env.ASSETS.fetch(request)
	},
}
