import type { INodeProperties } from 'n8n-workflow';

export const spaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		default: 'list-space',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['file'],
			},
		},
		options: [
			{
				name: 'Add Space Record',
				value: 'add-record',
				description: 'Adds a Record into a Space',
				action: 'Add',
			},
			{
				name: 'Create Space',
				value: 'create-new-space',
				description: 'Create a new Space',
				action: 'Create',
			},
			{
				name: 'List Spaces',
				value: 'list-space',
				description: 'List all user Spaces',
				action: 'List',
			},
			{
				name: 'Ask Space',
				value: 'ask-space',
				description: 'Ask anything to a Space',
				action: 'List',
			},
		],
	},
];

export const spaceFields: INodeProperties[] = [
	/* -------------------------------------------------------------------------- */
	/*                                 space:create                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space Name',
		name: 'spaceName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['create-new-space'],
				resource: ['space'],
			},
		},
		default: '',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 space:add                                  */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space ID',
		name: 'spaceId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['add-record'],
				resource: ['space'],
			},
		},
		default: '',
		description: 'ID of the Space to add a Record to',
	},
	{
		displayName: 'Source Type',
		name: 'sourceType',
		type: 'options',
		required: true,
		options: [
			{
				name: 'URL',
				value: 'url',
			},
			{
				name: 'Text',
				value: 'text',
			},
			{
				name: 'Image',
				value: 'image',
			},
			{
				name: 'File',
				value: 'file',
			},
		],
		displayOptions: {
			show: {
				operation: ['add-record'],
				resource: ['space'],
			},
		},
		default: 'text',
		description: 'Type of source to add to the Space',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['add-record'],
				resource: ['space'],
			},
		},
		description: 'Optional. Content of the record. Required if source type is Text.',
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				operation: ['add-record'],
				resource: ['space'],
			},
		},
		description: 'Optional. URL of the record. Required if source type is URL.',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 space:ask                                  */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space ID',
		name: 'spaceId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: '',
		description: 'ID of the Space to add a Record to',
	},
	{
		displayName: 'Chat Mode',
		name: 'chatMode',
		type: 'options',
		required: true,
		options: [
			{
				name: 'MedullaryAI Agent',
				value: 'single_agent',
			},
			{
				name: 'MedullaryAI Chat',
				value: 'chat',
			},
			{
				name: 'MedullaryAI Fact Check',
				value: 'fact_check_agent',
			},
			{
				name: 'MedullaryAI Researcher',
				value: 'research_agent',
			},
			{
				name: 'MedullaryAI Sales Researcher',
				value: 'sales_research_agent',
			},
		],
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: 'single_agent',
		description: 'Select chat mode',
	},
	{
		displayName: 'Deep Analysis',
		name: 'deepAnalysis',
		type: 'boolean',
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: false,
		description:
			'Whether to enable Deep Analysis to get more accurate results but slower response time',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: '',
		description: 'Message to send to the Space',
	},
];
