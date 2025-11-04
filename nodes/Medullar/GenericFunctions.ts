import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	ILoadOptionsFunctions,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

import { API_URL } from '../../credentials/MedullarApi.credentials';

export async function medullarApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	uri: string,
	service = 'auth',
	body: any = {},
	qs: IDataObject = {},
	option: IDataObject = {},
): Promise<any> {
	let options: IHttpRequestOptions = {
		headers: {
			'Content-Type': 'application/json',
		},
		method,
		body,
		qs,
		url: `${API_URL}/${service}/v1/${uri}`,
		json: true,
	};
	options = Object.assign({}, options, option);

	try {
		if (Object.keys(body as IDataObject).length === 0) {
			delete options.body;
		}
		return await this.helpers.httpRequestWithAuthentication.call(this, 'medullarApi', options);
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

	const resp = await medullarApiRequest.call(
		this,
		'GET',
		'/spaces/',
		'ai',
		{},
		{ user: userData.uuid, limit: 1000, offset: 0 },
	);

	return Array.isArray(resp?.results) ? resp.results : [];
}

export async function getChatsForSpace(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	spaceId: string,
): Promise<any[]> {
	if (!spaceId) return [];

	const resp = await medullarApiRequest.call(
		this,
		'GET',
		`/chats/`,
		'ai',
		{},
		{ space: spaceId, limit: 1000, offset: 0 },
	);

	return Array.isArray(resp?.results) ? resp.results : [];
}

export async function ensureChatForSpace(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	spaceId: string,
	chatId?: string,
): Promise<string> {
	if (chatId) return chatId;

	const resp = await medullarApiRequest.call(
		this,
		'POST',
		'/chats/',
		'ai',
		{ name: 'automated', space: { uuid: spaceId } },
		{},
	);

	return resp.uuid;
}

export async function askSpace(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	spaceId: string,
	chatId: string | undefined,
	chatMode: string,
	deepAnalysis: boolean,
	message: string,
): Promise<any> {
	const finalChatId = await ensureChatForSpace.call(this, spaceId, chatId);

	const messageResponse = await medullarApiRequest.call(
		this,
		'POST',
		'/messages/get_response/',
		'ai',
		{
			chat: { uuid: finalChatId },
			text: message,
			is_bot: false,
			is_reasoning_selected: deepAnalysis,
			selected_mode: chatMode,
			source: 'external_api',
		},
		{ chat: finalChatId },
	);

	return messageResponse;
}

type AddRecordParams = {
	spaceId: string;
	sourceType: 'text' | 'url' | 'image' | 'file' | string;
	content?: string;
	url?: string;
};

export async function addRecordToSpace(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	params: AddRecordParams,
): Promise<any> {
	const { spaceId, sourceType } = params;

	if (!spaceId) throw new Error('Space ID is required');
	if (!sourceType) throw new Error('Source type is required');

	if (sourceType === 'text' && !params.content) {
		throw new Error('Content is required when source type is "text".');
	}
	if (sourceType === 'url' && !params.url) {
		throw new Error('URL is required when source type is "url".');
	}

	const userData = await getUser.call(this);

	const payload: any = {
		spaces: [{ uuid: spaceId }],
		company: { uuid: userData.company.uuid },
		user: { uuid: userData.uuid },
		source: sourceType,
		data: {
			content: params.content ?? undefined,
			url: params.url ?? undefined,
		},
	};

	const resp = await medullarApiRequest.call(this, 'POST', '/records/', 'ai', payload, {});

	return resp;
}
