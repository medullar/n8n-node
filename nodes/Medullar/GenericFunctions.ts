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
	service = 'auth',
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
): Promise<any> {
	let options: IRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		uri: uri || `https://api.medullar.com/${service}/v1`,
		json: true,
	};
	options = Object.assign({}, options, option);

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
	const response = await medullarApiRequest.call(this, 'GET', 'auth', {}, {}, '/users/me/');

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
		'explorator',
		{},
		{ user: userData.uuid, limit: 1000, offset: 0 },
	);

	return spaceListResponse.results;
}
