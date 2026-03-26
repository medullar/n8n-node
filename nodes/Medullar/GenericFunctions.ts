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
	body: IDataObject = {},
	qs: IDataObject = {},
	option: IDataObject = {},
): Promise<unknown> {
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
		if (error.httpCode === '404') {
			const errorOptions = {
				message: `API not found`,
				description:
					'The requested resource could not be found. Please check your input parameters.',
			};
			throw new NodeApiError(this.getNode(), error as JsonObject, errorOptions);
		}

		if (error.httpCode === '401') {
			throw new NodeApiError(this.getNode(), error as JsonObject, {
				message: 'Authentication failed',
				description: 'Please check your credentials and try again.',
			});
		}

		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

type MedullarUser = IDataObject & {
	uuid: string;
	company: {
		uuid: string;
	};
};

export async function getUser(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<MedullarUser> {
	const response = await medullarApiRequest.call(this, 'GET', '/users/me/', 'auth', {}, {});

	const userData = response as Partial<MedullarUser> | null | undefined;

	if (!userData) {
		throw new Error('User data not found.');
	}

	if (!userData.company) {
		throw new Error('User does not belong to any company.');
	}

	if (!userData.uuid || !userData.company.uuid) {
		throw new Error('User data is missing required identifiers.');
	}

	return userData as MedullarUser;
}

export async function getUserSpaces(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
): Promise<IDataObject[]> {
	const userData = await getUser.call(this);

	const resp = await medullarApiRequest.call(
		this,
		'GET',
		'/spaces/',
		'ai',
		{},
		{ user: userData.uuid, limit: 1000, offset: 0 },
	);

	const results = (resp as { results?: unknown })?.results;
	return Array.isArray(results) ? (results as IDataObject[]) : [];
}

export async function getChatsForSpace(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	spaceId: string,
): Promise<IDataObject[]> {
	if (!spaceId) return [];

	const resp = await medullarApiRequest.call(
		this,
		'GET',
		`/chats/`,
		'ai',
		{},
		{ space: spaceId, limit: 1000, offset: 0 },
	);

	const results = (resp as { results?: unknown })?.results;
	return Array.isArray(results) ? (results as IDataObject[]) : [];
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

	const created = resp as { uuid?: unknown };
	if (typeof created.uuid !== 'string' || !created.uuid) {
		throw new Error('Failed to create chat: missing uuid in response.');
	}
	return created.uuid;
}

export async function askSpace(
	this: IExecuteFunctions | IHookFunctions | ILoadOptionsFunctions,
	spaceId: string,
	chatId: string | undefined,
	chatMode: string,
	deepAnalysis: boolean,
	reasoningEffort: string,
	message: string,
): Promise<unknown> {
	const finalChatId = await ensureChatForSpace.call(this, spaceId, chatId);

	if (!message.toLowerCase().includes('@medullar')) {
		message = `@medullar ${message}`;
	}

	const messageResponse = await medullarApiRequest.call(
		this,
		'POST',
		'/messages/get_response/',
		'ai',
		{
			chat: { uuid: finalChatId },
			text: message,
			use_reasoning: deepAnalysis,
			selected_mode: chatMode,
			reasoning_effort: reasoningEffort,
			source: 'external_api',
		},
		{ chat: spaceId },
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
): Promise<unknown> {
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

	const payload: IDataObject = {
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
