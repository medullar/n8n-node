import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './SpaceDescription';
import { getUser, getUserSpaces, medullarApiRequest } from './GenericFunctions';

export class Medullar implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Medullar',
		name: 'medullar',
		icon: 'file:medullar_icon.svg',
		group: ['transform'],
		version: 1,
		description: 'AI-powered discovery & insight platform that acts as your extended digital mind.',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		defaults: {
			name: 'Medullar',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'medullarApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Space',
						value: 'space',
					},
				],
				default: 'space',
				noDataExpression: true,
				required: true,
				description: 'Interact with a Medullar Space',
			},
			...spaceOperations,
			...spaceFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		this.logger.debug(`Medullar: Executing operation ${operation} on resource ${resource}`);

		// For each item, make an API call to create a contact
		for (let i = 0; i < length; i++) {
			try {
				if (resource === 'space') {
					const userData = await getUser.call(this); // Get user data

					if (operation === 'list-space') {
						// List all spaces for the user
						responseData = await getUserSpaces.call(this);
						returnData.push(responseData);
					} else if (operation === 'create-new-space') {
						const spaceName = this.getNodeParameter('spaceName', i) as string;

						const spaceListResponse = await medullarApiRequest.call(
							this,
							'POST',
							'/spaces/',
							'explorator',
							{ name: spaceName, company: { uuid: userData.company.uuid } },
							{},
						);
						returnData.push(spaceListResponse);
					} else if (operation === 'ask-space') {
						// Ask a question to a space
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						let chatId = this.getNodeParameter('chatId', i) as string;
						const chatMode = this.getNodeParameter('chatMode', i) as string;
						const deepAnalysis = (this.getNodeParameter('deepAnalysis', i) as boolean) || false;
						const message = this.getNodeParameter('message', i) as string;

						if (chatId == null || chatId === '') {
							const chatResponse = await medullarApiRequest.call(
								this,
								'POST',
								'/chats/',
								'explorator',
								{ name: 'automated', space: { uuid: spaceId } },
								{},
							);
							chatId = chatResponse.uuid;
						}

						const messageResponse = await medullarApiRequest.call(
							this,
							'POST',
							'/messages/',
							'explorator',
							{
								name: 'automated',
								chat: { uuid: chatId },
								text: message,
								user_email: userData.email,
								user_uuid: userData.uuid,
								user_name: userData.name,
								is_bot: false,
								is_reasoning_selected: deepAnalysis,
								selected_mode: chatMode,
								source: 'external_api',
							},
							{ chat: chatId },
						);

						returnData.push(messageResponse);
					} else if (operation === 'add-record') {
						// Add a record to a space
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const sourceType = this.getNodeParameter('sourceType', i) as string;
						let content = this.getNodeParameter('content', i) as string;
						let url = this.getNodeParameter('url', i) as string;

						const spaceResponse = await medullarApiRequest.call(
							this,
							'POST',
							`/records/`,
							'explorator',
							{
								spaces: [{ uuid: spaceId }],
								company: { uuid: userData.company.uuid },
								user: { uuid: userData.uuid },
								source: sourceType,
								data: {
									content,
									url,
								},
							},
						);
						returnData.push(spaceResponse);
					}
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const executionErrorData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionErrorData);
					continue;
				}
				throw error;
			}
		}

		// Map data to n8n data structure
		return [this.helpers.returnJsonArray(returnData)];
	}
}
