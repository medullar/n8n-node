import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export const API_URL = 'https://api.medullar.com';

export class MedullarApi implements ICredentialType {
	name = 'medullarApi';
	displayName = 'Medullar API';
	documentationUrl = 'https://documentation.medullar.com/';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
			typeOptions: {
				password: true,
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: `${API_URL}/auth/v1`,
			url: '/users/me/',
		},
	};
}
