import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export async function medullarApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	uri: string,
	service = 'auth',
	body: any = {},
	qs: IDataObject = {},
	option: IDataObject = {},
): Promise<any> {
	let options: IRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: `https://api.medullar.com/${service}/v1/${uri}`,
		json: true,
	};
	options = Object.assign({}, options, option);

	this.logger.debug(`Medullar API Request: ${method} ${options.uri}`);

	try {
		if (Object.keys(body as IDataObject).length === 0) {
			delete options.body;
		}
		return await this.helpers.requestWithAuthentication.call(this, 'medullarApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export async function getUser(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<any> {
	const response = await medullarApiRequest.call(this, 'GET', '/users/me/', 'auth', {}, {});

	const userData = response;

	if (!userData) {
		throw new Error('User data not found.');
	}

	if (!userData.company) {
		throw new Error('User does not belong to any company.');
	}

	return userData;
}

export async function getUserSpaces(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<any> {
	const userData = await getUser.call(this);

	const spaceListResponse = await medullarApiRequest.call(
		this,
		'GET',
		'/spaces/',
		'explorator',
		{},
		{ user: userData.uuid, limit: 1000, offset: 0 },
	);

	return spaceListResponse.results;
}
