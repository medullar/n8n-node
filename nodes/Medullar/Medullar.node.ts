import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType } from 'n8n-workflow';
import { spaceFields, spaceOperations } from './SpaceDescription';
import { getUserSpaces } from './GenericFunctions';

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
					if (operation === 'list-space') {
						responseData = await getUserSpaces.call(this);
						returnData.push(responseData);
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
