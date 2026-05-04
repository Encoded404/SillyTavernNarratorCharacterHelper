import './style.css';

type NarratorMode = 'status' | 'enable' | 'disable' | 'toggle' | 'preview';

type NarratorCharacterState = {
	enabled: boolean;
	instructions: string;
	updatedAt: string;
};

type TemplateSettings = {
	characterDescriptionTemplate: string;
	personalityTemplate: string;
	scenarioTemplate: string;
	firstMessageTemplate: string;
	exampleMessagesTemplate: string;
	creatorNotesTemplate: string;
	systemPromptTemplate: string;
	postHistoryInstructionsTemplate: string;
	tagsTemplate: string;
	characterBookTemplate: string;
	worldInfoTemplate: string;
	narratorInstructionsTemplate: string;
	rosterTemplate: string;
	briefingHeaderTemplate: string;
};

type NarratorSettings = {
	promptTitle: string;
	includeDisabledMembers: boolean;
	includeCharacterBook: boolean;
	includeLinkedWorldInfo: boolean;
	includeDescription: boolean;
	includePersonality: boolean;
	includeScenario: boolean;
	includeFirstMessage: boolean;
	includeExampleMessages: boolean;
	includeCreatorNotes: boolean;
	includeSystemPrompt: boolean;
	includePostHistoryInstructions: boolean;
	includeTags: boolean;
	promptPosition: number;
	promptDepth: number;
	maxBookEntries: number;
	maxBookEntryLength: number;
	maxWorldEntries: number;
	maxWorldEntryLength: number;
} & TemplateSettings;

type NarratorRuntimeContext = {
	characters?: Array<CharacterRecord>;
	groups?: Array<GroupRecord>;
	characterId?: number;
	this_chid?: number;
	groupId?: string | null;
	name1?: string;
	name2?: string;
	saveSettingsDebounced?: () => void;
	saveMetadataDebounced?: () => void;
	setExtensionPrompt?: (
		name: string,
		prompt: string,
		position: number,
		depth: number,
		scan: boolean,
		role: number,
	) => void;
	writeExtensionField?: (characterId: number, key: string, value: unknown) => Promise<void>;
	unshallowGroupMembers?: (groupId: string) => Promise<void>;
	loadWorldInfo?: (name: string) => Promise<WorldInfoFile | null | undefined>;
	eventSource?: {
		on: (eventName: string, handler: (...args: unknown[]) => void) => void;
	};
	eventTypes?: Record<string, string>;
	event_types?: Record<string, string>;
	SlashCommandParser?: {
		addCommandObject: (command: unknown) => void;
	};
	SlashCommand?: {
		fromProps: (props: Record<string, unknown>) => unknown;
	};
	SlashCommandArgument?: {
		fromProps: (props: Record<string, unknown>) => unknown;
	};
	SlashCommandNamedArgument?: {
		fromProps: (props: Record<string, unknown>) => unknown;
	};
	SlashCommandEnumValue?: new (...args: unknown[]) => { value: string };
	ARGUMENT_TYPE?: Record<string, string>;
	commonEnumProviders?: Record<string, (...args: unknown[]) => () => Array<{ value: string }>>;
	enumTypes?: Record<string, string>;
	constants?: {
		unset?: string;
	};
	toastr?: {
		warning: (message: string, title?: string) => void;
		success: (message: string, title?: string) => void;
		info: (message: string, title?: string) => void;
	};
};

type CharacterRecord = {
	avatar: string;
	name: string;
	description?: string;
	personality?: string;
	scenario?: string;
	first_mes?: string;
	mes_example?: string;
	creator_notes?: string;
	system_prompt?: string;
	post_history_instructions?: string;
	tags?: string[];
	data?: {
		description?: string;
		personality?: string;
		scenario?: string;
		first_mes?: string;
		mes_example?: string;
		creator_notes?: string;
		system_prompt?: string;
		post_history_instructions?: string;
		tags?: string[];
		character_book?: WorldInfoBook;
		extensions?: Record<string, unknown> & {
			world?: string;
			narrator_character_helper?: NarratorCharacterState;
		};
	};
	json_data?: string;
};

type GroupRecord = {
	id: string;
	name: string;
	members: string[];
	disabled_members: string[];
};

type WorldInfoBookEntry = {
	uid?: string | number;
	id?: string | number;
	key?: string[];
	keys?: string[];
	secondary_keys?: string[];
	comment?: string;
	content?: string;
	constant?: boolean;
	selective?: boolean;
	insertion_order?: number;
	enabled?: boolean;
	position?: string | number;
	order?: number;
	extensions?: Record<string, unknown>;
};

type WorldInfoBook = {
	name?: string;
	entries?: Record<string, WorldInfoBookEntry> | WorldInfoBookEntry[];
};

type WorldInfoFile = {
	entries?: Record<string, WorldInfoBookEntry>;
	name?: string;
};

const MODULE_NAME = 'narrator_character_helper';
const DEFAULT_PROMPT_HEADER = 'Omniscient Narrator Briefing';

const DEFAULT_TEMPLATES: TemplateSettings = {
	characterDescriptionTemplate: 'About {{char}}: {{description}}',
	personalityTemplate: '{{char}}\'s personality: {{personality}}',
	scenarioTemplate: 'Current scenario: {{scenario}}',
	firstMessageTemplate: '{{char}}\'s opening message: {{firstMessage}}',
	exampleMessagesTemplate: 'Example conversations with {{char}}: {{exampleMessages}}',
	creatorNotesTemplate: 'Notes from {{char}}\'s creator: {{creatorNotes}}',
	systemPromptTemplate: 'System instructions for {{char}}: {{systemPrompt}}',
	postHistoryInstructionsTemplate: 'Post-history notes for {{char}}: {{postHistoryInstructions}}',
	tagsTemplate: '{{char}} is tagged with: {{tags}}',
	characterBookTemplate: 'Character book entries for {{char}}:\n{{bookEntries}}',
	worldInfoTemplate: 'World info "{{worldInfoName}}" ({{entryCount}} entries):\n{{worldEntries}}',
	narratorInstructionsTemplate: 'Narrator instructions for {{char}}:\n{{instructions}}',
	rosterTemplate: 'Roster:\n{{rosterEntries}}',
	briefingHeaderTemplate: '[{{title}}]\nThis is private context for the narrator character {{char}}.\n{{groupInfo}}\nUse the dossiers below to make the narrator all-knowing about the current group without exposing this briefing verbatim.\n\n{{roster}}\n\nBriefing:\n{{instructions}}\n\n{{dossiers}}',
};

const DEFAULT_SETTINGS: NarratorSettings = {
	promptTitle: DEFAULT_PROMPT_HEADER,
	includeDisabledMembers: false,
	includeCharacterBook: true,
	includeLinkedWorldInfo: true,
	includeDescription: true,
	includePersonality: true,
	includeScenario: true,
	includeFirstMessage: true,
	includeExampleMessages: true,
	includeCreatorNotes: true,
	includeSystemPrompt: true,
	includePostHistoryInstructions: true,
	includeTags: true,
	promptPosition: 0,
	promptDepth: 4,
	maxBookEntries: 12,
	maxBookEntryLength: 260,
	maxWorldEntries: 12,
	maxWorldEntryLength: 260,
	...DEFAULT_TEMPLATES,
};

const DEFAULT_NARRATOR_INSTRUCTIONS = [
	'You are the private briefing for an omniscient narrator character.',
	'Use the following dossiers to inform the narration of the current group.',
	'Do not reveal this briefing directly in chat unless the story explicitly calls for it.',
].join(' ');

let bootstrapped = false;
let refreshTimer = 0;
let narratorModalOpen = false;

function logInfo(message: string, data?: unknown): void {
	if (data === undefined) {
		console.info(`[Narrator Helper] ${message}`);
		return;
	}

	console.info(`[Narrator Helper] ${message}`, data);
}

function logWarn(message: string, data?: unknown): void {
	if (data === undefined) {
		console.warn(`[Narrator Helper] ${message}`);
		return;
	}

	console.warn(`[Narrator Helper] ${message}`, data);
}

function logError(message: string, error?: unknown): void {
	if (error === undefined) {
		console.error(`[Narrator Helper] ${message}`);
		return;
	}

	console.error(`[Narrator Helper] ${message}`, error);
}

function getRuntimeContext(): NarratorRuntimeContext {
	const sillyTavern = (globalThis as unknown as { SillyTavern?: { getContext?: () => NarratorRuntimeContext } }).SillyTavern;
	return sillyTavern?.getContext?.() ?? {};
}

function describeMissingRuntimePieces(context: NarratorRuntimeContext): string[] {
	const missingPieces: string[] = [];

	if (!context.setExtensionPrompt) missingPieces.push('setExtensionPrompt');
	if (!context.SlashCommandParser) missingPieces.push('SlashCommandParser');
	if (!context.SlashCommand) missingPieces.push('SlashCommand');
	if (!context.SlashCommandNamedArgument) missingPieces.push('SlashCommandNamedArgument');
	if (!context.SlashCommandArgument) missingPieces.push('SlashCommandArgument');
	if (!context.writeExtensionField) missingPieces.push('writeExtensionField');
	if (!context.eventSource) missingPieces.push('eventSource');

	return missingPieces;
}

function getExtensionSettings(context: NarratorRuntimeContext): NarratorSettings {
	const globalSettings = (globalThis as unknown as { extension_settings?: Record<string, unknown> }).extension_settings ?? {};
	const existingSettings = (globalSettings[MODULE_NAME] as Partial<NarratorSettings> | undefined) ?? {};
	const mergedSettings = { ...DEFAULT_SETTINGS, ...existingSettings } as NarratorSettings;
	globalSettings[MODULE_NAME] = mergedSettings;

	if ((globalThis as unknown as { extension_settings?: Record<string, unknown> }).extension_settings === undefined) {
		(globalThis as unknown as { extension_settings?: Record<string, unknown> }).extension_settings = globalSettings;
	}

	return mergedSettings;
}

function injectNarratorButtonIntoCharacterPanel(): void {
	const buttonRow = document.querySelector('.form_create_bottom_buttons_block.buttons_block');

	if (!buttonRow) {
		logInfo('Narrator button: character edit panel button row not found. The panel may not be open yet.');
		return;
	}

	if (buttonRow.querySelector('#narrator-helper-char-panel-btn')) {
		return;
	}

	const btn = document.createElement('div');
	btn.id = 'narrator-helper-char-panel-btn';
	btn.className = 'menu_button menu_button_icon';
	btn.setAttribute('title', 'Open Narrator Settings');
	btn.innerHTML = '<i class="fa-fw fa-solid fa-feather-pointed"></i><span>Narrator</span>';
	btn.addEventListener('click', () => {
		const context = getRuntimeContext();
		const charId = getCurrentCharacterId(context);
		if (charId !== undefined) {
			openNarratorModal(charId);
		} else {
			toastrWarning('No character is currently selected. Open a character card first.');
		}
	});

	buttonRow.appendChild(btn);
	logInfo('Narrator button injected into character edit panel.');
}

function toastrWarning(message: string): void {
	const t = (globalThis as unknown as { toastr?: { warning: (msg: string, title?: string) => void } }).toastr;
	t?.warning?.(message, 'Narrator Helper');
}

function openNarratorModal(characterId: number): void {
	if (narratorModalOpen) {
		return;
	}

	narratorModalOpen = true;

	const context = getRuntimeContext();
	const characters = getCharacters(context);
	const character = characters[characterId];
	if (!character) {
		narratorModalOpen = false;
		return;
	}

	const narratorState = getNarratorState(character);
	const settings = getExtensionSettings(context);

	const modalContent = buildNarratorModalHtml(character, narratorState, settings);

	const stContext = (globalThis as unknown as { SillyTavern?: { getContext?: () => NarratorRuntimeContext & { Popup?: new (content: string, type: number, defaultResult: string, options: Record<string, unknown>) => { show: () => Promise<unknown> }; POPUP_TYPE?: Record<string, number>; POPUP_RESULT?: Record<string, unknown> } } }).SillyTavern;
	const { Popup, POPUP_TYPE, POPUP_RESULT } = stContext?.getContext?.() ?? {};

	if (!Popup || !POPUP_TYPE || !POPUP_RESULT) {
		narratorModalOpen = false;
		return;
	}

	const popup = new Popup(
		modalContent,
		POPUP_TYPE.TEXT,
		'',
		{
			wide: true,
			large: true,
			okButton: 'Save & Close',
			cancelButton: 'Cancel',
			allowVerticalScrolling: true,
		},
	);

	void popup.show().then((result: unknown) => {
		narratorModalOpen = false;

		if (result === POPUP_RESULT.AFFIRMATIVE) {
			void saveModalSettings(characterId);
		}
	});

	setTimeout(() => {
		attachModalEvents(characterId);
	}, 100);
}

function buildNarratorModalHtml(
	character: CharacterRecord,
	narratorState: NarratorCharacterState | null,
	settings: NarratorSettings,
): string {
	const isEnabled = narratorState?.enabled ?? false;
	const instructions = narratorState?.instructions ?? '';

	return `
		<div class="narrator-helper-modal">
			<div class="narrator-helper-modal__header">
				<h3><i class="fa-solid fa-feather-pointed"></i> Narrator Settings for ${character.name}</h3>
			</div>

			<div class="narrator-helper-modal__section">
				<div class="inline-drawer">
					<div class="inline-drawer-toggle inline-drawer-header">
						<b>Narrator Status</b>
						<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
					</div>
					<div class="inline-drawer-content">
						<label class="checkbox_label">
							<input id="narrator-enabled" type="checkbox" ${isEnabled ? 'checked' : ''} />
							<span>Enable narrator mode for ${character.name}</span>
						</label>
					</div>
				</div>
			</div>

			<div class="narrator-helper-modal__section">
				<div class="inline-drawer">
					<div class="inline-drawer-toggle inline-drawer-header">
						<b>Narrator Instructions</b>
						<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
					</div>
					<div class="inline-drawer-content">
						<p class="narrator-helper-modal__hint">Custom instructions for how this narrator should behave. Leave blank for defaults.</p>
						<textarea id="narrator-instructions" class="text_pole wide100p" rows="5" placeholder="Optional per-character narrator instructions...">${escapeHtml(instructions)}</textarea>
					</div>
				</div>
			</div>

			<div class="narrator-helper-modal__section">
				<div class="inline-drawer">
					<div class="inline-drawer-toggle inline-drawer-header">
						<b>Content Sources</b>
						<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
					</div>
					<div class="inline-drawer-content">
						<div class="narrator-helper-modal__checkbox-grid">
							<label class="checkbox_label"><input id="include-description" type="checkbox" ${settings.includeDescription ? 'checked' : ''} /><span>Description</span></label>
							<label class="checkbox_label"><input id="include-personality" type="checkbox" ${settings.includePersonality ? 'checked' : ''} /><span>Personality</span></label>
							<label class="checkbox_label"><input id="include-scenario" type="checkbox" ${settings.includeScenario ? 'checked' : ''} /><span>Scenario</span></label>
							<label class="checkbox_label"><input id="include-first-message" type="checkbox" ${settings.includeFirstMessage ? 'checked' : ''} /><span>First Message</span></label>
							<label class="checkbox_label"><input id="include-example-messages" type="checkbox" ${settings.includeExampleMessages ? 'checked' : ''} /><span>Example Messages</span></label>
							<label class="checkbox_label"><input id="include-creator-notes" type="checkbox" ${settings.includeCreatorNotes ? 'checked' : ''} /><span>Creator Notes</span></label>
							<label class="checkbox_label"><input id="include-system-prompt" type="checkbox" ${settings.includeSystemPrompt ? 'checked' : ''} /><span>System Prompt</span></label>
							<label class="checkbox_label"><input id="include-post-history" type="checkbox" ${settings.includePostHistoryInstructions ? 'checked' : ''} /><span>Post-History Instructions</span></label>
							<label class="checkbox_label"><input id="include-tags" type="checkbox" ${settings.includeTags ? 'checked' : ''} /><span>Tags</span></label>
							<label class="checkbox_label"><input id="include-books" type="checkbox" ${settings.includeCharacterBook ? 'checked' : ''} /><span>Character Books</span></label>
							<label class="checkbox_label"><input id="include-world-info" type="checkbox" ${settings.includeLinkedWorldInfo ? 'checked' : ''} /><span>Linked Lorebooks</span></label>
							<label class="checkbox_label"><input id="include-disabled" type="checkbox" ${settings.includeDisabledMembers ? 'checked' : ''} /><span>Muted Members</span></label>
						</div>
					</div>
				</div>
			</div>

			<div class="narrator-helper-modal__section">
				<div class="inline-drawer">
					<div class="inline-drawer-toggle inline-drawer-header">
						<b>Prompt Configuration</b>
						<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
					</div>
					<div class="inline-drawer-content">
						<div class="narrator-helper-modal__form-row">
							<label>Prompt Position
								<select id="prompt-position" class="text_pole">
									<option value="2" ${settings.promptPosition === 2 ? 'selected' : ''}>Before main prompt</option>
									<option value="0" ${settings.promptPosition === 0 ? 'selected' : ''}>After main prompt</option>
									<option value="1" ${settings.promptPosition === 1 ? 'selected' : ''}>In-chat at depth</option>
								</select>
							</label>
							<label>Depth
								<input id="prompt-depth" class="text_pole" type="number" min="0" max="9999" value="${settings.promptDepth}" ${settings.promptPosition !== 1 ? 'disabled' : ''} />
							</label>
						</div>
						<div class="narrator-helper-modal__form-row">
							<label>Max Book Entries
								<input id="max-book-entries" class="text_pole" type="number" min="1" max="100" value="${settings.maxBookEntries}" />
							</label>
							<label>Max Entry Length
								<input id="max-book-entry-length" class="text_pole" type="number" min="32" max="2000" value="${settings.maxBookEntryLength}" />
							</label>
						</div>
						<div class="narrator-helper-modal__form-row">
							<label>Max World Entries
								<input id="max-world-entries" class="text_pole" type="number" min="1" max="100" value="${settings.maxWorldEntries}" />
							</label>
							<label>Max World Entry Length
								<input id="max-world-entry-length" class="text_pole" type="number" min="32" max="2000" value="${settings.maxWorldEntryLength}" />
							</label>
						</div>
					</div>
				</div>
			</div>

			<div class="narrator-helper-modal__actions">
				<button id="narrator-preview-btn" class="menu_button menu_button_icon" type="button">
					<i class="fa-solid fa-eye"></i><span>Preview Briefing</span>
				</button>
			</div>

			<div id="narrator-preview-area" class="narrator-helper-modal__preview" style="display:none;">
				<textarea id="narrator-preview-text" class="text_pole wide100p" readonly rows="12"></textarea>
			</div>
		</div>
	`;
}

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

function attachModalEvents(characterId: number): void {
	const context = getRuntimeContext();

	const previewBtn = document.getElementById('narrator-preview-btn');
	previewBtn?.addEventListener('click', async () => {
		const previewArea = document.getElementById('narrator-preview-area');
		const previewText = document.getElementById('narrator-preview-text') as HTMLTextAreaElement | null;
		if (!previewArea || !previewText) {
			return;
		}

		previewArea.style.display = 'block';
		previewText.value = 'Building preview...';
		try {
			previewText.value = await buildNarratorPrompt(context);
		} catch (error) {
			console.error('Narrator prompt preview failed', error);
			previewText.value = `Preview failed: ${String(error)}`;
		}
	});

	const positionSelect = document.getElementById('prompt-position') as HTMLSelectElement | null;
	const depthInput = document.getElementById('prompt-depth') as HTMLInputElement | null;
	positionSelect?.addEventListener('change', () => {
		if (depthInput) {
			depthInput.disabled = positionSelect.value !== '1';
		}
	});
}

async function saveModalSettings(characterId: number): Promise<void> {
	const context = getRuntimeContext();
	const characters = getCharacters(context);
	const character = characters[characterId];
	if (!character) {
		return;
	}

	const enabledCheckbox = document.getElementById('narrator-enabled') as HTMLInputElement | null;
	const instructionsTextarea = document.getElementById('narrator-instructions') as HTMLTextAreaElement | null;

	const enabled = enabledCheckbox?.checked ?? false;
	const instructions = instructionsTextarea?.value ?? '';

	await writeNarratorState(characterId, enabled, instructions);

	const positionSelect = document.getElementById('prompt-position') as HTMLSelectElement | null;
	const depthInput = document.getElementById('prompt-depth') as HTMLInputElement | null;
	const includeDisabled = document.getElementById('include-disabled') as HTMLInputElement | null;
	const includeCharacterBook = document.getElementById('include-books') as HTMLInputElement | null;
	const includeWorldInfo = document.getElementById('include-world-info') as HTMLInputElement | null;
	const includeDescription = document.getElementById('include-description') as HTMLInputElement | null;
	const includePersonality = document.getElementById('include-personality') as HTMLInputElement | null;
	const includeScenario = document.getElementById('include-scenario') as HTMLInputElement | null;
	const includeFirstMessage = document.getElementById('include-first-message') as HTMLInputElement | null;
	const includeExampleMessages = document.getElementById('include-example-messages') as HTMLInputElement | null;
	const includeCreatorNotes = document.getElementById('include-creator-notes') as HTMLInputElement | null;
	const includeSystemPrompt = document.getElementById('include-system-prompt') as HTMLInputElement | null;
	const includePostHistory = document.getElementById('include-post-history') as HTMLInputElement | null;
	const includeTags = document.getElementById('include-tags') as HTMLInputElement | null;
	const maxBookEntries = document.getElementById('max-book-entries') as HTMLInputElement | null;
	const maxBookEntryLength = document.getElementById('max-book-entry-length') as HTMLInputElement | null;
	const maxWorldEntries = document.getElementById('max-world-entries') as HTMLInputElement | null;
	const maxWorldEntryLength = document.getElementById('max-world-entry-length') as HTMLInputElement | null;

	const settings = getExtensionSettings(context);
	settings.promptPosition = Number(positionSelect?.value) || DEFAULT_SETTINGS.promptPosition;
	settings.promptDepth = Math.max(0, Number(depthInput?.value) || DEFAULT_SETTINGS.promptDepth);
	settings.includeDisabledMembers = includeDisabled?.checked || false;
	settings.includeCharacterBook = includeCharacterBook?.checked || false;
	settings.includeLinkedWorldInfo = includeWorldInfo?.checked || false;
	settings.includeDescription = includeDescription?.checked || false;
	settings.includePersonality = includePersonality?.checked || false;
	settings.includeScenario = includeScenario?.checked || false;
	settings.includeFirstMessage = includeFirstMessage?.checked ?? DEFAULT_SETTINGS.includeFirstMessage;
	settings.includeExampleMessages = includeExampleMessages?.checked ?? DEFAULT_SETTINGS.includeExampleMessages;
	settings.includeCreatorNotes = includeCreatorNotes?.checked ?? DEFAULT_SETTINGS.includeCreatorNotes;
	settings.includeSystemPrompt = includeSystemPrompt?.checked ?? DEFAULT_SETTINGS.includeSystemPrompt;
	settings.includePostHistoryInstructions = includePostHistory?.checked ?? false;
	settings.includeTags = includeTags?.checked ?? false;
	settings.maxBookEntries = Number(maxBookEntries?.value) || DEFAULT_SETTINGS.maxBookEntries;
	settings.maxBookEntryLength = Number(maxBookEntryLength?.value) || DEFAULT_SETTINGS.maxBookEntryLength;
	settings.maxWorldEntries = Number(maxWorldEntries?.value) || DEFAULT_SETTINGS.maxWorldEntries;
	settings.maxWorldEntryLength = Number(maxWorldEntryLength?.value) || DEFAULT_SETTINGS.maxWorldEntryLength;

	context.saveSettingsDebounced?.();
}

function getCharacters(context: NarratorRuntimeContext): CharacterRecord[] {
	return Array.isArray(context.characters) ? context.characters : [];
}

function getGroups(context: NarratorRuntimeContext): GroupRecord[] {
	return Array.isArray(context.groups) ? context.groups : [];
}

function getCurrentCharacterId(context: NarratorRuntimeContext): number | undefined {
	if (typeof context.characterId === 'number') {
		return context.characterId;
	}

	if (typeof context.this_chid === 'number') {
		return context.this_chid;
	}

	return undefined;
}

function getCurrentCharacter(context: NarratorRuntimeContext): CharacterRecord | undefined {
	const characterId = getCurrentCharacterId(context);
	return characterId === undefined ? undefined : getCharacters(context)[characterId];
}

function getCurrentGroup(context: NarratorRuntimeContext): GroupRecord | undefined {
	if (!context.groupId) {
		return undefined;
	}

	return getGroups(context).find((group) => group.id === context.groupId);
}

function getNarratorState(character: CharacterRecord | undefined): NarratorCharacterState | null {
	const state = character?.data?.extensions?.narrator_character_helper;
	if (state === undefined || state === null) {
		return null;
	}

	if (typeof state === 'boolean') {
		return {
			enabled: state,
			instructions: '',
			updatedAt: '',
		};
	}

	if (typeof state !== 'object') {
		return null;
	}

	const record = state as Partial<NarratorCharacterState>;
	return {
		enabled: Boolean(record.enabled),
		instructions: String(record.instructions ?? ''),
		updatedAt: String(record.updatedAt ?? ''),
	};
}

function normalizeText(value: unknown): string {
	if (typeof value !== 'string') {
		return '';
	}

	return value.trim();
}

function truncateText(value: string, maxLength: number): string {
	const text = value.trim();
	if (!text || text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function replaceCommonMacros(text: string, characterName: string, context: NarratorRuntimeContext): string {
	const userName = normalizeText(context.name1) || 'User';
	return text
		.replace(/\{\{\s*char\s*\}\}/gi, characterName)
		.replace(/\{\{\s*name\s*\}\}/gi, characterName)
		.replace(/\{\{\s*user\s*\}\}/gi, userName);
}

function formatListItem(label: string, value: string): string {
	const text = normalizeText(value);
	if (!text) {
		return '';
	}

	return `- ${label}: ${text}`;
}

function summarizeEntries(entries: WorldInfoBookEntry[], limit: number, maxLength: number, characterName: string, context: NarratorRuntimeContext): string {
	if (!entries.length) {
		return '';
	}

	const previewLines: string[] = [];
	for (const entry of entries.slice(0, limit)) {
		const keyList = Array.isArray(entry.keys) ? entry.keys : Array.isArray(entry.key) ? entry.key : [];
		const comment = normalizeText(entry.comment ?? '');
		const content = truncateText(replaceCommonMacros(normalizeText(entry.content), characterName, context), maxLength);
		const headerParts = [keyList.length ? keyList.join(', ') : 'entry'];

		if (comment) {
			headerParts.push(comment);
		}

		previewLines.push(`- ${headerParts.join(' | ')}`);

		if (content) {
			previewLines.push(`  Content: ${content}`);
		}
	}

	if (entries.length > limit) {
		previewLines.push(`- ... ${entries.length - limit} more entr${entries.length - limit === 1 ? 'y' : 'ies'} omitted`);
	}

	return previewLines.join('\n');
}

function getBookEntries(book: WorldInfoBook | undefined): WorldInfoBookEntry[] {
	if (!book?.entries) {
		return [];
	}

	if (Array.isArray(book.entries)) {
		return book.entries.filter((entry): entry is WorldInfoBookEntry => Boolean(entry));
	}

	return Object.values(book.entries).filter((entry): entry is WorldInfoBookEntry => Boolean(entry));
}

async function summarizeWorldInfoFile(context: NarratorRuntimeContext, worldInfoName: string, characterName: string, settings: NarratorSettings): Promise<string> {
	const loader = context.loadWorldInfo;
	if (!worldInfoName || typeof loader !== 'function') {
		return '';
	}

	const data = await loader(worldInfoName);
	const entries = Object.values(data?.entries ?? {}).filter((entry): entry is WorldInfoBookEntry => Boolean(entry));
	if (!entries.length) {
		return '';
	}

	return [
		`World Info: ${worldInfoName} (${entries.length} entr${entries.length === 1 ? 'y' : 'ies'})`,
		summarizeEntries(entries, settings.maxWorldEntries, settings.maxWorldEntryLength, characterName, context),
	].filter(Boolean).join('\n');
}

function buildCharacterDossier(context: NarratorRuntimeContext, character: CharacterRecord, settings: NarratorSettings): string {
	const characterName = normalizeText(character.name) || normalizeText(character.avatar) || 'Unknown';
	const characterData = character.data ?? {};
	const sections: string[] = [];

	sections.push(`Character: ${characterName}`);
	sections.push(formatListItem('Avatar', character.avatar));

	if (settings.includeDescription) {
		sections.push(formatListItem('Description', normalizeText(character.description ?? characterData.description)));
	}

	if (settings.includePersonality) {
		sections.push(formatListItem('Personality', normalizeText(character.personality ?? characterData.personality)));
	}

	if (settings.includeScenario) {
		sections.push(formatListItem('Scenario', normalizeText(character.scenario ?? characterData.scenario)));
	}

	if (settings.includeFirstMessage) {
		sections.push(formatListItem('First message', normalizeText(character.first_mes ?? characterData.first_mes)));
	}

	if (settings.includeExampleMessages) {
		sections.push(formatListItem('Example messages', normalizeText(character.mes_example ?? characterData.mes_example)));
	}

	if (settings.includeCreatorNotes) {
		sections.push(formatListItem('Creator notes', normalizeText(characterData.creator_notes)));
	}

	if (settings.includeSystemPrompt) {
		sections.push(formatListItem('System prompt', normalizeText(characterData.system_prompt)));
	}

	if (settings.includePostHistoryInstructions) {
		sections.push(formatListItem('Post-history instructions', normalizeText(characterData.post_history_instructions)));
	}

	if (settings.includeTags) {
		const tags = Array.isArray(character.tags ?? characterData.tags) ? (character.tags ?? characterData.tags ?? []) : [];
		sections.push(formatListItem('Tags', tags.join(', ')));
	}

	if (settings.includeCharacterBook) {
		const characterBook = characterData.character_book;
		const bookEntries = getBookEntries(characterBook);
		if (bookEntries.length) {
			sections.push([
				`Character book: ${normalizeText(characterBook?.name) || 'embedded character book'} (${bookEntries.length} entr${bookEntries.length === 1 ? 'y' : 'ies'})`,
				summarizeEntries(bookEntries, settings.maxBookEntries, settings.maxBookEntryLength, characterName, context),
			].filter(Boolean).join('\n'));
		}
	}

	if (settings.includeLinkedWorldInfo) {
		const linkedWorldInfo = normalizeText(characterData.extensions?.world);
		if (linkedWorldInfo) {
			sections.push(`Linked lorebook: ${linkedWorldInfo}`);
		}
	}

	const narratorState = getNarratorState(character);
	if (narratorState?.instructions) {
		sections.push([
			'Narrator instructions',
			narratorState.instructions.trim(),
		].join('\n'));
	}

	return sections.filter((section) => normalizeText(section)).join('\n\n');
}

async function buildNarratorPrompt(context: NarratorRuntimeContext): Promise<string> {
	const settings = getExtensionSettings(context);
	const currentCharacter = getCurrentCharacter(context);
	if (!currentCharacter) {
		return '';
	}

	const narratorState = getNarratorState(currentCharacter);
	if (!narratorState?.enabled) {
		return '';
	}

	const currentGroup = getCurrentGroup(context);

	if (currentGroup && typeof context.unshallowGroupMembers === 'function') {
		await context.unshallowGroupMembers(currentGroup.id);
	}

	const characters = getCharacters(context);
	const groupMembers = currentGroup?.members ?? [];
	const narratorAvatar = currentCharacter.avatar;

	const orderedMembers: CharacterRecord[] = [];
	if (currentGroup) {
		for (const avatar of groupMembers) {
			const character = characters.find((candidate) => candidate.avatar === avatar);
			if (!character) {
				continue;
			}

			const isDisabled = currentGroup.disabled_members.includes(avatar);
			if (isDisabled && avatar !== narratorAvatar && !settings.includeDisabledMembers) {
				continue;
			}

			orderedMembers.push(character);
		}
	} else {
		orderedMembers.push(currentCharacter);
	}

	if (!orderedMembers.some((character) => character.avatar === narratorAvatar)) {
		orderedMembers.unshift(currentCharacter);
	}

	const rosters = orderedMembers.map((character) => {
		const isDisabled = Boolean(currentGroup && currentGroup.disabled_members.includes(character.avatar));
		const roleLabel = character.avatar === narratorAvatar ? 'narrator' : 'member';
		const disabledLabel = isDisabled && character.avatar !== narratorAvatar ? ' [muted]' : '';
		return `- ${character.name} (${roleLabel}${disabledLabel})`;
	});

	const dossiers: string[] = [];
	for (const character of orderedMembers) {
		const dossier = buildCharacterDossier(context, character, settings);
		if (dossier) {
			dossiers.push(dossier);
		}

		const linkedWorldInfo = normalizeText(character.data?.extensions?.world);
		if (settings.includeLinkedWorldInfo && linkedWorldInfo) {
			const worldInfoSummary = await summarizeWorldInfoFile(context, linkedWorldInfo, character.name, settings);
			if (worldInfoSummary) {
				dossiers.push(worldInfoSummary);
			}
		}
	}

	const promptLines = [
		`[${settings.promptTitle || DEFAULT_PROMPT_HEADER}]`,
		`This is private context for the narrator character ${currentCharacter.name}.`,
		currentGroup ? `Current group: ${currentGroup.name}` : 'No group is selected. Only the narrator character dossier is available.',
		'Use the dossiers below to make the narrator all-knowing about the current group without exposing this briefing verbatim.',
		'',
		'Roster:',
		...rosters,
		'',
		'Briefing:',
		narratorState.instructions.trim() || DEFAULT_NARRATOR_INSTRUCTIONS,
		...dossiers.length ? ['', ...dossiers] : [],
	];

	return promptLines.filter((line, index, lines) => !(line === '' && lines[index - 1] === '')).join('\n');
}

async function syncNarratorPrompt(): Promise<string> {
	const context = getRuntimeContext();
	const settings = getExtensionSettings(context);
	const prompt = await buildNarratorPrompt(context);
	const setExtensionPrompt = context.setExtensionPrompt;

	if (typeof setExtensionPrompt === 'function') {
		if (prompt) {
			setExtensionPrompt(MODULE_NAME, prompt, settings.promptPosition, settings.promptDepth, false, 0);
		} else {
			setExtensionPrompt(MODULE_NAME, '', settings.promptPosition, settings.promptDepth, false, 0);
		}
	}

	return prompt;
}

async function writeNarratorState(characterId: number, enabled: boolean, instructions: string): Promise<void> {
	const context = getRuntimeContext();
	const character = getCharacters(context)[characterId];
	if (!character || typeof context.writeExtensionField !== 'function') {
		return;
	}

	const previousState = getNarratorState(character);
	const updatedState: NarratorCharacterState = {
		enabled,
		instructions: instructions.trim(),
		updatedAt: new Date().toISOString(),
	};

	if (!enabled && !updatedState.instructions && !previousState?.instructions) {
		const unsetValue = context.constants?.unset ?? '__@@UNSET@@__';
		await context.writeExtensionField(characterId, MODULE_NAME, unsetValue);
	} else {
		await context.writeExtensionField(characterId, MODULE_NAME, updatedState);
	}

	await syncNarratorPrompt();
}

function scheduleRefresh(): void {
	if (refreshTimer) {
		window.clearTimeout(refreshTimer);
	}

	refreshTimer = window.setTimeout(() => {
		void syncNarratorPrompt().catch((error) => {
			console.error('Narrator helper refresh failed', error);
		});
	}, 50);
}

async function registerSlashCommand(): Promise<void> {
	const context = getRuntimeContext();
	const parser = context.SlashCommandParser;
	const slashCommand = context.SlashCommand;
	const namedArgument = context.SlashCommandNamedArgument;
	const unnamedArgument = context.SlashCommandArgument;
	const enumValueCtor = context.SlashCommandEnumValue;
	const argumentTypes = context.ARGUMENT_TYPE;
	const enumProviders = context.commonEnumProviders;
	const enumTypes = context.enumTypes;

	if (!parser || !slashCommand || !namedArgument || !unnamedArgument || !enumValueCtor || !argumentTypes || !enumProviders || !enumTypes) {
		return;
	}

	const toEnumValue = (value: string, description?: string) => new enumValueCtor(value, description ?? null, enumTypes.enum);

	parser.addCommandObject(slashCommand.fromProps({
		name: 'narrator',
		aliases: ['omniscient', 'nar-helper'],
		returns: 'status text or narrator prompt preview',
		callback: async (args: Record<string, unknown>) => {
			const action = String(args.action ?? 'status').trim().toLowerCase() as NarratorMode;
			const characterName = String(args.char ?? '').trim();
			const targetCharacter = resolveCharacterByName(characterName);
			const targetCharacterId = targetCharacter?.id;

			if (action === 'preview') {
				return await syncNarratorPrompt();
			}

			if (action === 'status') {
				return getStatusText(targetCharacterId);
			}

			if (targetCharacterId === undefined) {
				getRuntimeContext().toastr?.warning('Select a character first to change narrator status.', 'Narrator Helper');
				return '';
			}

			const existingState = getNarratorState(getCharacters(getRuntimeContext())[targetCharacterId]) ?? {
				enabled: false,
				instructions: '',
				updatedAt: '',
			};

			if (action === 'enable') {
				await writeNarratorState(targetCharacterId, true, existingState.instructions || DEFAULT_NARRATOR_INSTRUCTIONS);
				return `${resolveCharacterLabel(targetCharacterId)} marked as narrator.`;
			}

			if (action === 'disable') {
				await writeNarratorState(targetCharacterId, false, existingState.instructions);
				return `${resolveCharacterLabel(targetCharacterId)} narrator flag cleared.`;
			}

			if (action === 'toggle') {
				await writeNarratorState(targetCharacterId, !existingState.enabled, existingState.instructions || DEFAULT_NARRATOR_INSTRUCTIONS);
				return `${resolveCharacterLabel(targetCharacterId)} narrator flag ${existingState.enabled ? 'disabled' : 'enabled'}.`;
			}

			return getStatusText(targetCharacterId);
		},
		namedArgumentList: [
			namedArgument.fromProps({
				name: 'action',
				description: 'Choose what the narrator command should do.',
				typeList: [argumentTypes.STRING],
				defaultValue: 'status',
				enumList: [
					toEnumValue('status', 'Show narrator status'),
					toEnumValue('enable', 'Mark the character as narrator'),
					toEnumValue('disable', 'Clear narrator mode without deleting the stored instructions'),
					toEnumValue('toggle', 'Flip narrator mode on or off'),
					toEnumValue('preview', 'Generate the current narrator briefing'),
				],
			}),
			namedArgument.fromProps({
				name: 'char',
				description: 'Character name or avatar key. Defaults to the current character.',
				typeList: [argumentTypes.STRING],
				enumProvider: enumProviders.characters('character'),
			}),
		],
		helpString: `
			<div>
				Marks a character as a narrator / omniscient entity and previews the generated group briefing.
			</div>
			<div>
				<strong>Examples</strong>
				<ul>
					<li><code>/narrator action=enable char="Chloe"</code></li>
					<li><code>/narrator action=status</code></li>
					<li><code>/narrator action=preview</code></li>
				</ul>
			</div>
		`,
	}));
}

function resolveCharacterByName(characterName: string): { id: number; character: CharacterRecord } | undefined {
	const context = getRuntimeContext();
	const characters = getCharacters(context);

	if (characterName) {
		const byAvatarIndex = characters.findIndex((character) => character.avatar === characterName);
		if (byAvatarIndex !== -1) {
			return { id: byAvatarIndex, character: characters[byAvatarIndex] };
		}

		const byNameIndex = characters.findIndex((character) => character.name === characterName);
		if (byNameIndex !== -1) {
			return { id: byNameIndex, character: characters[byNameIndex] };
		}
	}

	const currentCharacterId = getCurrentCharacterId(context);
	if (currentCharacterId === undefined) {
		return undefined;
	}

	const currentCharacter = characters[currentCharacterId];
	return currentCharacter ? { id: currentCharacterId, character: currentCharacter } : undefined;
}

function resolveCharacterLabel(characterId: number): string {
	const context = getRuntimeContext();
	const character = getCharacters(context)[characterId];
	return character?.name ?? `Character ${characterId}`;
}

function getStatusText(characterId?: number): string {
	const context = getRuntimeContext();
	const character = characterId === undefined ? getCurrentCharacter(context) : getCharacters(context)[characterId];

	if (!character) {
		return 'No character selected.';
	}

	const state = getNarratorState(character);
	if (state?.enabled) {
		return `${character.name} is marked as a narrator.`;
	}

	return `${character.name} is not marked as a narrator.`;
}

async function narratorHelperGenerateInterceptor(): Promise<void> {
	await syncNarratorPrompt();
}

function registerEventHandlers(): void {
	const context = getRuntimeContext();
	const eventSource = context.eventSource;
	const eventTypes = context.eventTypes ?? context.event_types;

	if (!eventSource || !eventTypes) {
		return;
	}

	const watchedEvents = [
		eventTypes.APP_READY,
		eventTypes.CHAT_CHANGED,
		eventTypes.CHARACTER_EDITED,
		eventTypes.CHARACTER_PAGE_LOADED,
		eventTypes.GROUP_CHAT_CREATED,
		eventTypes.GROUP_CHAT_DELETED,
		eventTypes.GENERATE_BEFORE_COMBINE_PROMPTS,
		eventTypes.GENERATION_AFTER_COMMANDS,
		eventTypes.GROUP_WRAPPER_STARTED,
		eventTypes.GROUP_WRAPPER_FINISHED,
		eventTypes.GROUP_MEMBER_DRAFTED,
	].filter(Boolean) as string[];

	for (const eventName of watchedEvents) {
		eventSource.on(eventName, () => {
			scheduleRefresh();
		});
	}

	eventSource.on(eventTypes.CHARACTER_EDITED, () => {
		logInfo('CHARACTER_EDITED event received, attempting to inject narrator button.');
		setTimeout(() => {
			injectNarratorButtonIntoCharacterPanel();
		}, 200);
	});

	eventSource.on(eventTypes.CHARACTER_PAGE_LOADED, () => {
		logInfo('CHARACTER_PAGE_LOADED event received, attempting to inject narrator button.');
		setTimeout(() => {
			injectNarratorButtonIntoCharacterPanel();
		}, 300);
	});
}

function injectGlobalSettings(): void {
	const settingsContainer = document.getElementById('extensions_settings2') ?? document.getElementById('extensions_settings');
	if (!settingsContainer) {
		logWarn('Global settings: neither #extensions_settings2 nor #extensions_settings found.');
		return;
	}

	if (document.getElementById('narrator-helper-global-settings')) {
		return;
	}

	const context = getRuntimeContext();
	const settings = getExtensionSettings(context);

	const settingsHtml = `
		<div id="narrator-helper-global-settings" class="narrator-helper-settings">
			<div class="inline-drawer">
				<div class="inline-drawer-toggle inline-drawer-header">
					<b>Narrator Helper</b>
					<div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
				</div>
				<div class="inline-drawer-content">
					<div class="narrator-helper-settings__section">
						<h4>Output Templates</h4>
						<p class="narrator-helper-settings__hint">Templates control how character information is formatted in the narrator briefing. Use <code>{{char}}</code>, <code>{{description}}</code>, etc. as placeholders.</p>

						<label>Character Description
							<input id="tpl-character-description" class="text_pole wide100p" type="text" value="${escapeHtml(settings.characterDescriptionTemplate)}" />
						</label>
						<label>Personality
							<input id="tpl-personality" class="text_pole wide100p" type="text" value="${escapeHtml(settings.personalityTemplate)}" />
						</label>
						<label>Scenario
							<input id="tpl-scenario" class="text_pole wide100p" type="text" value="${escapeHtml(settings.scenarioTemplate)}" />
						</label>
						<label>First Message
							<input id="tpl-first-message" class="text_pole wide100p" type="text" value="${escapeHtml(settings.firstMessageTemplate)}" />
						</label>
						<label>Example Messages
							<input id="tpl-example-messages" class="text_pole wide100p" type="text" value="${escapeHtml(settings.exampleMessagesTemplate)}" />
						</label>
						<label>Creator Notes
							<input id="tpl-creator-notes" class="text_pole wide100p" type="text" value="${escapeHtml(settings.creatorNotesTemplate)}" />
						</label>
						<label>System Prompt
							<input id="tpl-system-prompt" class="text_pole wide100p" type="text" value="${escapeHtml(settings.systemPromptTemplate)}" />
						</label>
						<label>Post-History Instructions
							<input id="tpl-post-history" class="text_pole wide100p" type="text" value="${escapeHtml(settings.postHistoryInstructionsTemplate)}" />
						</label>
						<label>Tags
							<input id="tpl-tags" class="text_pole wide100p" type="text" value="${escapeHtml(settings.tagsTemplate)}" />
						</label>
						<label>Character Book
							<textarea id="tpl-character-book" class="text_pole wide100p" rows="2">${escapeHtml(settings.characterBookTemplate)}</textarea>
						</label>
						<label>World Info
							<textarea id="tpl-world-info" class="text_pole wide100p" rows="2">${escapeHtml(settings.worldInfoTemplate)}</textarea>
						</label>
						<label>Narrator Instructions
							<textarea id="tpl-narrator-instructions" class="text_pole wide100p" rows="2">${escapeHtml(settings.narratorInstructionsTemplate)}</textarea>
						</label>
						<label>Roster
							<textarea id="tpl-roster" class="text_pole wide100p" rows="2">${escapeHtml(settings.rosterTemplate)}</textarea>
						</label>
						<label>Briefing Header
							<textarea id="tpl-briefing-header" class="text_pole wide100p" rows="3">${escapeHtml(settings.briefingHeaderTemplate)}</textarea>
						</label>

						<div class="narrator-helper-settings__actions">
							<button id="narrator-reset-templates-btn" class="menu_button" type="button">Reset to Defaults</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;

	settingsContainer.appendChild(document.createRange().createContextualFragment(settingsHtml));

	attachGlobalSettingsEvents();
	logInfo('Global narrator settings injected into extensions panel.');
}

function attachGlobalSettingsEvents(): void {
	const context = getRuntimeContext();

	const templateFields: Array<[string, keyof TemplateSettings]> = [
		['tpl-character-description', 'characterDescriptionTemplate'],
		['tpl-personality', 'personalityTemplate'],
		['tpl-scenario', 'scenarioTemplate'],
		['tpl-first-message', 'firstMessageTemplate'],
		['tpl-example-messages', 'exampleMessagesTemplate'],
		['tpl-creator-notes', 'creatorNotesTemplate'],
		['tpl-system-prompt', 'systemPromptTemplate'],
		['tpl-post-history', 'postHistoryInstructionsTemplate'],
		['tpl-tags', 'tagsTemplate'],
		['tpl-character-book', 'characterBookTemplate'],
		['tpl-world-info', 'worldInfoTemplate'],
		['tpl-narrator-instructions', 'narratorInstructionsTemplate'],
		['tpl-roster', 'rosterTemplate'],
		['tpl-briefing-header', 'briefingHeaderTemplate'],
	];

	for (const [elementId, settingKey] of templateFields) {
		const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement | null;
		element?.addEventListener('change', () => {
			const settings = getExtensionSettings(context);
			(settings as Record<string, unknown>)[settingKey] = element.value;
			context.saveSettingsDebounced?.();
		});
	}

	const resetBtn = document.getElementById('narrator-reset-templates-btn');
	resetBtn?.addEventListener('click', () => {
		const settings = getExtensionSettings(context);
		for (const [elementId, settingKey] of templateFields) {
			const element = document.getElementById(elementId) as HTMLInputElement | HTMLTextAreaElement | null;
			if (element) {
				element.value = DEFAULT_TEMPLATES[settingKey];
				(settings as Record<string, unknown>)[settingKey] = DEFAULT_TEMPLATES[settingKey];
			}
		}
		context.saveSettingsDebounced?.();
		(globalThis as unknown as { toastr?: { info: (message: string, title?: string) => void } }).toastr?.info('Templates reset to defaults.');
	});
}

async function bootstrap(): Promise<void> {
	if (bootstrapped) {
		logInfo('bootstrap skipped because the extension is already initialized.');
		return;
	}

	logInfo('bootstrap started.');
	const context = getRuntimeContext();
	const missingPieces = describeMissingRuntimePieces(context);
	if (missingPieces.length) {
		logWarn('runtime context is missing pieces that the extension can use later:', missingPieces);
	}

	if (!context.SlashCommandParser || !context.SlashCommand || !context.setExtensionPrompt) {
		logWarn('waiting for SillyTavern runtime hooks before finishing initialization.');
		window.setTimeout(() => {
			void bootstrap();
		}, 500);
		return;
	}

	bootstrapped = true;
	logInfo('runtime hooks detected; initializing UI, prompt pipeline, and slash command.');
	injectGlobalSettings();
	registerEventHandlers();
	try {
		await registerSlashCommand();
		logInfo('STscript command registered: /narrator (available in the slash-command parser / prompt tools).');
	} catch (error) {
		logError('failed to register slash command.', error);
	}

	try {
		const prompt = await syncNarratorPrompt();
		logInfo(prompt ? 'initial narrator prompt synced.' : 'no narrator prompt was injected because no active narrator is marked.');
	} catch (error) {
		logError('failed to sync narrator prompt during bootstrap.', error);
	}

	const appReadyEvent = context.eventTypes?.APP_READY ?? context.event_types?.APP_READY;
	if (appReadyEvent && context.eventSource) {
		context.eventSource.on(appReadyEvent, () => {
			logInfo('APP_READY received; injecting narrator button and settings.');
			injectNarratorButtonIntoCharacterPanel();
			injectGlobalSettings();
			void syncNarratorPrompt().catch((error) => logError('failed to sync narrator prompt after APP_READY.', error));
		});
	} else {
		logWarn('APP_READY hook was not registered because event source or event type map is unavailable.');
	}

	logInfo('Scheduling initial narrator button injection attempt in 1 second.');
	setTimeout(() => {
		logInfo('Attempting initial narrator button injection.');
		injectNarratorButtonIntoCharacterPanel();
	}, 1000);
}

void bootstrap();

export { bootstrap as init, narratorHelperGenerateInterceptor };
