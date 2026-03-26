import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	INodeTypeDescription,
} from 'n8n-workflow';
import { spaceFields, spaceOperations } from './SpaceDescription';
import {
	getUser,
	getUserSpaces,
	medullarApiRequest,
	getChatsForSpace,
	askSpace,
	addRecordToSpace,
} from './GenericFunctions';
import { NodeOperationError } from 'n8n-workflow';

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
		inputs: ['main'],
		outputs: ['main'],
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

	methods = {
		loadOptions: {
			async getUserSpaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const spaces = await getUserSpaces.call(this);
				return (spaces ?? []).map(
					(s: unknown): INodePropertyOptions => {
						const space = (s ?? {}) as Record<string, unknown>;
						const uuid = typeof space.uuid === 'string' ? space.uuid : '';
						const name =
							(typeof space.name === 'string' && space.name) ||
							(typeof space.display_name === 'string' && space.display_name) ||
							uuid;

						return {
							name,
							value: uuid,
							description: typeof space.description === 'string' ? space.description : undefined,
						};
					},
				);
			},
			async getChatsForSpace(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const spaceId = this.getNodeParameter('spaceId', 0) as string;
				if (!spaceId) return [];

				const chats = await getChatsForSpace.call(this, spaceId);
				return (chats ?? []).map(
					(c: unknown): INodePropertyOptions => {
						const chat = (c ?? {}) as Record<string, unknown>;
						const uuid = typeof chat.uuid === 'string' ? chat.uuid : '';
						const name = (typeof chat.name === 'string' && chat.name) || uuid;

						return {
							name,
							value: uuid,
							description: undefined,
						};
					},
				);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const length = items.length;
		let responseData;
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		// For each item, make an API call to create a contact
		for (let i = 0; i < length; i++) {
			try {
				if (resource === 'space') {
					const userData = await getUser.call(this); // Get user data

					if (operation === 'list-space') {
						// List all spaces for the user
						responseData = await getUserSpaces.call(this);

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(responseData as IDataObject[]),
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
					} else if (operation === 'create-new-space') {
						const spaceName = this.getNodeParameter('spaceName', i) as string;

						const spaceListResponse = await medullarApiRequest.call(
							this,
							'POST',
							'/spaces/',
							'ai',
							{ name: spaceName, company: { uuid: userData.company.uuid } },
							{},
						);

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(spaceListResponse as IDataObject),
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
					} else if (operation === 'rename-space') {
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const spaceName = this.getNodeParameter('spaceName', i) as string;

						const spaceResponse = await medullarApiRequest.call(
							this,
							'PATCH',
							`/spaces/${spaceId}/`,
							'ai',
							{ name: spaceName },
							{},
						);

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(spaceResponse as IDataObject),
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
					} else if (operation === 'delete-space') {
						const spaceId = this.getNodeParameter('spaceId', i) as string;

						const spaceResponse = await medullarApiRequest.call(
							this,
							'DELETE',
							`/spaces/${spaceId}/`,
							'ai',
							{},
							{},
						);

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(spaceResponse as IDataObject),
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
					} else if (operation === 'ask-space') {
						// Ask a question to a space
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const chatId = this.getNodeParameter('chatId', i) as string;
						const chatMode = this.getNodeParameter('chatMode', i) as string;
						const deepAnalysis = (this.getNodeParameter('deepAnalysis', i) as boolean) || false;
						const message = this.getNodeParameter('message', i) as string;
						const reasoningEffort = this.getNodeParameter('reasoningEffort', i) as string;

						try {
							const messageResponse = await askSpace.call(
								this,
								spaceId,
								chatId,
								chatMode,
								deepAnalysis,
								reasoningEffort,
								message,
							);

							const executionData = this.helpers.constructExecutionMetaData(
								this.helpers.returnJsonArray(messageResponse as IDataObject),
								{ itemData: { item: i } },
							);

							returnData.push(...executionData);
						} catch (e: unknown) {
							const message = e instanceof Error ? e.message : String(e);
							throw new NodeOperationError(this.getNode(), `Ask Space failed: ${message}`);
						}
					} else if (operation === 'add-record') {
						// Add a record to a space
						const spaceId = this.getNodeParameter('spaceId', i) as string;
						const sourceType = this.getNodeParameter('sourceType', i) as string;
						const content = this.getNodeParameter('content', i) as string;
						const url = this.getNodeParameter('url', i) as string;

						const record = await addRecordToSpace.call(this, {
							spaceId,
							sourceType,
							content,
							url,
						});

						const executionData = this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray(record as IDataObject),
							{ itemData: { item: i } },
						);

						returnData.push(...executionData);
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
