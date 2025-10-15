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
				resource: ['space'],
			},
		},
		options: [
			{
				name: 'Add Space Record',
				value: 'add-record',
				description: 'Adds a Record into a Space',
				action: 'Add record to space',
			},
			{
				name: 'Ask Space',
				value: 'ask-space',
				description: 'Ask anything to a Space',
				action: 'Ask a question to a space',
			},
			{
				name: 'Create Space',
				value: 'create-new-space',
				description: 'Create a new Space',
				action: 'Create new space',
			},
			{
				name: 'Delete Space',
				value: 'delete-space',
				description: 'Delete a Space',
				action: 'Delete a space',
			},
			{
				name: 'List Spaces',
				value: 'list-space',
				description: 'List all user Spaces',
				action: 'List all spaces',
			},
			{
				name: 'Rename Space',
				value: 'rename-space',
				description: 'Rename a Space',
				action: 'Rename a space',
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
	/*                                 space:rename                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space Name or ID',
		name: 'spaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUserSpaces',
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['rename-space'],
				resource: ['space'],
			},
		},
		default: '',
		description:
			'Choose one of your Spaces to rename. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'New Space Name',
		name: 'spaceName',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['rename-space'],
				resource: ['space'],
			},
		},
		default: '',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 space:delete                               */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space Name or ID',
		name: 'spaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUserSpaces',
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['delete-space'],
				resource: ['space'],
			},
		},
		default: '',
		description:
			'Choose one of your Spaces to delete. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},

	/* -------------------------------------------------------------------------- */
	/*                                 space:add                                  */
	/* -------------------------------------------------------------------------- */
	{
		displayName: 'Space Name or ID',
		name: 'spaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUserSpaces',
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['add-record'],
				resource: ['space'],
			},
		},
		default: '',
		description:
			'Choose one of your Spaces to add a Record to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
		displayName: 'Space Name or ID',
		name: 'spaceId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getUserSpaces',
		},
		required: true,
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: '',
		description:
			'Choose one of your Spaces to chat with. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},
	{
		displayName: 'Chat Name or ID',
		name: 'chatId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getChatsForSpace',
			loadOptionsDependsOn: ['spaceId'],
		},
		displayOptions: {
			show: {
				operation: ['ask-space'],
				resource: ['space'],
			},
		},
		default: '',
		description:
			'Optional. Choose a chat in this space. If empty, a default chat named "automated" will be created. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
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
				name: 'MedullaryAI Agent (xAI Grok)',
				value: 'single_agent_xai',
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
			{
				name: 'MedullaryAI Search Agent',
				value: 'search_agent',
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
