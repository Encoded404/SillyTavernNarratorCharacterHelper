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

type CapturedModalValues = {
	enabled: boolean;
	instructions: string;
	promptPosition: number;
	promptDepth: number;
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
	maxBookEntries: number;
	maxBookEntryLength: number;
	maxWorldEntries: number;
	maxWorldEntryLength: number;
};

type NarratorRuntimeContext = {
	characters?: Array<CharacterRecord>;
	groups?: Array<GroupRecord>;
	characterId?: number | string;
	this_chid?: number | string;
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
		emit: (eventName: string, ...args: unknown[]) => Promise<void>;
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

type WorldInfoForceActivateEntry = {
	world: string;
	uid: string | number;
};

type CharLoreSetting = {
	name: string;
	extraBooks?: string[];
};

const MODULE_NAME = 'narrator_character_helper';
const MODULE_BRIEFING = `${MODULE_NAME}_briefing`;
const MODULE_ROSTER = `${MODULE_NAME}_roster`;
const MODULE_DOSSIERS = `${MODULE_NAME}_dossiers`;
const MODULE_META = `${MODULE_NAME}_meta`;
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
let narratorModalRoot: HTMLElement | null = null;
let capturedModalValues: CapturedModalValues | null = null;
let originalNarratorLorebooks: CharLoreSetting | null = null;
let currentSpeakerId: number | undefined = undefined;

function getWorldInfo(): { charLore?: CharLoreSetting[] } | undefined {
	const worldInfo = (globalThis as unknown as { world_info?: { charLore?: CharLoreSetting[] } }).world_info;
	if (!worldInfo) {
		logInfo('getWorldInfo: world_info not found on globalThis.');
		return undefined;
	}
	return worldInfo;
}

function findNarratorCharacterInGroup(context: NarratorRuntimeContext): number | undefined {
	const group = getCurrentGroup(context);
	if (!group) {
		return undefined;
	}

	const characters = getCharacters(context);
	const enabledNarrators: number[] = [];

	for (const avatar of group.members) {
		if (group.disabled_members.includes(avatar)) {
			continue;
		}

		const character = characters.find((c) => c.avatar === avatar);
		if (!character) {
			continue;
		}

		const narratorState = getNarratorState(character);
		if (narratorState?.enabled) {
			const index = characters.indexOf(character);
			enabledNarrators.push(index);
		}
	}

	if (enabledNarrators.length === 0) {
		logInfo('findNarratorCharacterInGroup: no enabled narrator found in group.');
		return undefined;
	}

	if (enabledNarrators.length > 1) {
		logWarn(`findNarratorCharacterInGroup: multiple enabled narrators found (${enabledNarrators.length}). Using first one.`);
	}

	logInfo(`findNarratorCharacterInGroup: found narrator at index ${enabledNarrators[0]}`);
	return enabledNarrators[0];
}

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

function findModalElement<T extends HTMLElement>(id: string, fallbackSelector?: string): T | null {
	if (narratorModalRoot) {
		const found = narratorModalRoot.querySelector<T>(`#${id}`);
		if (found) return found;
	}

	if (fallbackSelector) {
		return document.querySelector<T>(fallbackSelector);
	}

	return document.getElementById(id) as T | null;
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
		logInfo(`Narrator button clicked. context.characterId=${JSON.stringify(context.characterId)}, context.this_chid=${JSON.stringify(context.this_chid)}`);

		let charId = getCurrentCharacterId(context);
		logInfo(`getCurrentCharacterId returned: ${charId}`);

		if (charId === undefined) {
			charId = getEditedCharacterIdFromPanel();
			logInfo(`getEditedCharacterIdFromPanel returned: ${charId}`);
		}

		if (charId !== undefined) {
			logInfo(`Opening narrator modal for character index ${charId}.`);
			openNarratorModal(charId);
		} else {
			logWarn('Could not determine which character is being edited. characterId and this_chid are undefined, and no #create_button_id element found.');
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

function getEditedCharacterIdFromPanel(): number | undefined {
	const context = getRuntimeContext();
	const characters = getCharacters(context);

	const createButtonId = (document.getElementById('create_button_id') as HTMLInputElement | null)?.value;
	if (createButtonId) {
		const index = characters.findIndex((c) => c.avatar === createButtonId);
		if (index !== -1) {
			logInfo(`Found edited character by #create_button_id: "${createButtonId}" at index ${index}`);
			return index;
		}
	}

	const avatarImg = document.querySelector<HTMLImageElement>('#avatar_div img');
	if (avatarImg?.src) {
		const avatarName = avatarImg.src.split('/').pop();
		if (avatarName) {
			const index = characters.findIndex((c) => c.avatar === avatarName || c.avatar === decodeURIComponent(avatarName));
			if (index !== -1) {
				logInfo(`Found edited character by #avatar_div img: "${avatarName}" at index ${index}`);
				return index;
			}
		}
	}

	const nameInput = (document.getElementById('character_name_pole') as HTMLInputElement | null)
		?? (document.getElementById('rm_character_name') as HTMLInputElement | null);
	if (nameInput?.value) {
		const charName = nameInput.value.trim();
		const matchingIndices = characters
			.map((c, i) => ({ character: c, index: i }))
			.filter(({ character }) => character.name === charName)
			.map(({ index }) => index);

		if (matchingIndices.length === 1) {
			logInfo(`Found edited character by name input: "${charName}" at index ${matchingIndices[0]}`);
			return matchingIndices[0];
		}

		if (matchingIndices.length > 1) {
			const tagsTextarea = document.getElementById('tags_textarea') as HTMLTextAreaElement | null;
			if (tagsTextarea?.value) {
				const panelTags = tagsTextarea.value
					.split(',')
					.map((t) => t.trim().toLowerCase())
					.filter(Boolean);

				for (const idx of matchingIndices) {
					const charTags = Array.isArray(characters[idx].tags) ? characters[idx].tags : [];
					const charTagsLower = charTags.map((t) => t.toLowerCase());
					const commonTags = panelTags.filter((t) => charTagsLower.includes(t));
					if (commonTags.length === panelTags.length && panelTags.length > 0) {
						logInfo(`Found edited character by name+tags: "${charName}" with tags [${panelTags.join(', ')}] at index ${idx}`);
						return idx;
					}
				}
			}

			logInfo(`Name "${charName}" matches ${matchingIndices.length} characters, could not disambiguate by tags.`);
		}
	}

	logWarn('Could not find edited character ID from panel DOM elements.');
	return undefined;
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

	setTimeout(() => {
		narratorModalRoot = document.querySelector('.narrator-helper-modal') as HTMLElement | null;
		attachModalEvents(characterId);
	}, 100);

	void popup.show().then((result: unknown) => {
		narratorModalOpen = false;

		if (result === POPUP_RESULT.AFFIRMATIVE) {
			capturedModalValues = captureModalValues();
			void saveModalSettings(characterId);
		}

		narratorModalRoot = null;
		capturedModalValues = null;
	});
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

            <label class="checkbox_label">
                <input id="narrator-enabled" type="checkbox" ${isEnabled ? 'checked' : ''} />
                <span>Enable narrator mode for ${character.name}</span>
            </label>

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

function captureModalValues(): CapturedModalValues | null {
	const enabledCheckbox = findModalElement<HTMLInputElement>('narrator-enabled', '.narrator-helper-modal #narrator-enabled');
	const instructionsTextarea = findModalElement<HTMLTextAreaElement>('narrator-instructions', '.narrator-helper-modal #narrator-instructions');
	const positionSelect = findModalElement<HTMLSelectElement>('prompt-position', '.narrator-helper-modal #prompt-position');
	const depthInput = findModalElement<HTMLInputElement>('prompt-depth', '.narrator-helper-modal #prompt-depth');
	const includeDisabled = findModalElement<HTMLInputElement>('include-disabled', '.narrator-helper-modal #include-disabled');
	const includeCharacterBook = findModalElement<HTMLInputElement>('include-books', '.narrator-helper-modal #include-books');
	const includeWorldInfo = findModalElement<HTMLInputElement>('include-world-info', '.narrator-helper-modal #include-world-info');
	const includeDescription = findModalElement<HTMLInputElement>('include-description', '.narrator-helper-modal #include-description');
	const includePersonality = findModalElement<HTMLInputElement>('include-personality', '.narrator-helper-modal #include-personality');
	const includeScenario = findModalElement<HTMLInputElement>('include-scenario', '.narrator-helper-modal #include-scenario');
	const includeFirstMessage = findModalElement<HTMLInputElement>('include-first-message', '.narrator-helper-modal #include-first-message');
	const includeExampleMessages = findModalElement<HTMLInputElement>('include-example-messages', '.narrator-helper-modal #include-example-messages');
	const includeCreatorNotes = findModalElement<HTMLInputElement>('include-creator-notes', '.narrator-helper-modal #include-creator-notes');
	const includeSystemPrompt = findModalElement<HTMLInputElement>('include-system-prompt', '.narrator-helper-modal #include-system-prompt');
	const includePostHistory = findModalElement<HTMLInputElement>('include-post-history', '.narrator-helper-modal #include-post-history');
	const includeTags = findModalElement<HTMLInputElement>('include-tags', '.narrator-helper-modal #include-tags');
	const maxBookEntries = findModalElement<HTMLInputElement>('max-book-entries', '.narrator-helper-modal #max-book-entries');
	const maxBookEntryLength = findModalElement<HTMLInputElement>('max-book-entry-length', '.narrator-helper-modal #max-book-entry-length');
	const maxWorldEntries = findModalElement<HTMLInputElement>('max-world-entries', '.narrator-helper-modal #max-world-entries');
	const maxWorldEntryLength = findModalElement<HTMLInputElement>('max-world-entry-length', '.narrator-helper-modal #max-world-entry-length');

	if (!enabledCheckbox && !instructionsTextarea) {
		logWarn('captureModalValues: no modal elements found.');
		return null;
	}

	return {
		enabled: enabledCheckbox?.checked ?? false,
		instructions: instructionsTextarea?.value ?? '',
		promptPosition: Number(positionSelect?.value) || DEFAULT_SETTINGS.promptPosition,
		promptDepth: Math.max(0, Number(depthInput?.value) || DEFAULT_SETTINGS.promptDepth),
		includeDisabledMembers: includeDisabled?.checked ?? false,
		includeCharacterBook: includeCharacterBook?.checked ?? false,
		includeLinkedWorldInfo: includeWorldInfo?.checked ?? false,
		includeDescription: includeDescription?.checked ?? false,
		includePersonality: includePersonality?.checked ?? false,
		includeScenario: includeScenario?.checked ?? false,
		includeFirstMessage: includeFirstMessage?.checked ?? DEFAULT_SETTINGS.includeFirstMessage,
		includeExampleMessages: includeExampleMessages?.checked ?? DEFAULT_SETTINGS.includeExampleMessages,
		includeCreatorNotes: includeCreatorNotes?.checked ?? DEFAULT_SETTINGS.includeCreatorNotes,
		includeSystemPrompt: includeSystemPrompt?.checked ?? DEFAULT_SETTINGS.includeSystemPrompt,
		includePostHistoryInstructions: includePostHistory?.checked ?? false,
		includeTags: includeTags?.checked ?? false,
		maxBookEntries: Number(maxBookEntries?.value) || DEFAULT_SETTINGS.maxBookEntries,
		maxBookEntryLength: Number(maxBookEntryLength?.value) || DEFAULT_SETTINGS.maxBookEntryLength,
		maxWorldEntries: Number(maxWorldEntries?.value) || DEFAULT_SETTINGS.maxWorldEntries,
		maxWorldEntryLength: Number(maxWorldEntryLength?.value) || DEFAULT_SETTINGS.maxWorldEntryLength,
	};
}

function attachModalEvents(characterId: number): void {
	const previewBtn = findModalElement('narrator-preview-btn', '.narrator-helper-modal #narrator-preview-btn');
	previewBtn?.addEventListener('click', async () => {
		const previewArea = findModalElement('narrator-preview-area', '.narrator-helper-modal #narrator-preview-area');
		const previewText = findModalElement<HTMLTextAreaElement>('narrator-preview-text', '.narrator-helper-modal #narrator-preview-text');
		if (!previewArea || !previewText) {
			return;
		}

		previewArea.style.display = 'block';
		previewText.value = 'Building preview...';
		try {
			previewText.value = await buildNarratorPrompt(getRuntimeContext());
		} catch (error) {
			console.error('Narrator prompt preview failed', error);
			previewText.value = `Preview failed: ${String(error)}`;
		}
	});

	const positionSelect = findModalElement<HTMLSelectElement>('prompt-position', '.narrator-helper-modal #prompt-position');
	const depthInput = findModalElement<HTMLInputElement>('prompt-depth', '.narrator-helper-modal #prompt-depth');
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

	const values = capturedModalValues ?? captureModalValues();
	if (!values) {
		logWarn('saveModalSettings: no values captured.');
		return;
	}

	await writeNarratorState(characterId, values.enabled, values.instructions);

	const settings = getExtensionSettings(context);
	settings.promptPosition = values.promptPosition;
	settings.promptDepth = values.promptDepth;
	settings.includeDisabledMembers = values.includeDisabledMembers;
	settings.includeCharacterBook = values.includeCharacterBook;
	settings.includeLinkedWorldInfo = values.includeLinkedWorldInfo;
	settings.includeDescription = values.includeDescription;
	settings.includePersonality = values.includePersonality;
	settings.includeScenario = values.includeScenario;
	settings.includeFirstMessage = values.includeFirstMessage;
	settings.includeExampleMessages = values.includeExampleMessages;
	settings.includeCreatorNotes = values.includeCreatorNotes;
	settings.includeSystemPrompt = values.includeSystemPrompt;
	settings.includePostHistoryInstructions = values.includePostHistoryInstructions;
	settings.includeTags = values.includeTags;
	settings.maxBookEntries = values.maxBookEntries;
	settings.maxBookEntryLength = values.maxBookEntryLength;
	settings.maxWorldEntries = values.maxWorldEntries;
	settings.maxWorldEntryLength = values.maxWorldEntryLength;

	context.saveSettingsDebounced?.();
}

function getCharacters(context: NarratorRuntimeContext): CharacterRecord[] {
	return Array.isArray(context.characters) ? context.characters : [];
}

function getGroups(context: NarratorRuntimeContext): GroupRecord[] {
	return Array.isArray(context.groups) ? context.groups : [];
}

	function getAllGroupMemberLorebookNames(context: NarratorRuntimeContext, excludeAvatar?: string): Set<string> {
		const lorebooks = new Set<string>();
		const group = getCurrentGroup(context);
		const characters = getCharacters(context);

		logInfo(`getAllGroupMemberLorebookNames: groupId=${context.groupId}, groupMembers=${group?.members?.length ?? 0}, characters=${characters.length}, excludeAvatar=${excludeAvatar ?? '(none)'}`);

		if (!group) {
			logInfo('getAllGroupMemberLorebookNames: no group, returning empty.');
			return lorebooks;
		}

		const memberAvatars = group.members.filter((avatar) => !group.disabled_members.includes(avatar) || avatar === getCurrentCharacter(context)?.avatar);
		logInfo(`getAllGroupMemberLorebookNames: active member avatars=${JSON.stringify(memberAvatars)}`);

		for (const avatar of memberAvatars) {
			if (avatar === excludeAvatar) {
				logInfo(`getAllGroupMemberLorebookNames: skipping narrator's own avatar "${avatar}"`);
				continue;
			}

			const character = characters.find((c) => c.avatar === avatar);
			if (!character) {
				logInfo(`getAllGroupMemberLorebookNames: no character found for avatar "${avatar}"`);
				continue;
			}

			if (character.data?.extensions?.world) {
				lorebooks.add(character.data.extensions.world);
				logInfo(`getAllGroupMemberLorebookNames: "${character.name}" has primary lorebook "${character.data.extensions.world}"`);
			} else {
				logInfo(`getAllGroupMemberLorebookNames: "${character.name}" has no primary lorebook.`);
			}

			const worldInfo = getWorldInfo();
			const charLore = worldInfo?.charLore;
			logInfo(`getAllGroupMemberLorebookNames: charLore array found, length=${charLore?.length ?? 0}`);
			if (charLore) {
				const charExtra = charLore.find((e) => e.name === avatar);
				if (charExtra?.extraBooks && Array.isArray(charExtra.extraBooks)) {
					for (const book of charExtra.extraBooks) {
						if (book) {
							lorebooks.add(book);
							logInfo(`getAllGroupMemberLorebookNames: "${character.name}" has extra lorebook "${book}"`);
						}
					}
				} else {
					logInfo(`getAllGroupMemberLorebookNames: "${character.name}" has no extra lorebooks.`);
				}
			}
		}

		logInfo(`getAllGroupMemberLorebookNames: total unique lorebooks=${[...lorebooks].join(', ') || '(none)'}`);
		return lorebooks;
	}

async function saveNarratorLorebooks(context: NarratorRuntimeContext): Promise<void> {
	let narratorCharacterIndex: number | undefined;

	if (context.groupId && currentSpeakerId !== undefined) {
		const characters = getCharacters(context);
		const speakerCharacter = characters[currentSpeakerId];
		if (speakerCharacter) {
			const narratorState = getNarratorState(speakerCharacter);
			if (narratorState?.enabled) {
				narratorCharacterIndex = currentSpeakerId;
				logInfo(`saveNarratorLorebooks: current speaker (chId=${currentSpeakerId}) is a narrator.`);
			} else {
				logInfo(`saveNarratorLorebooks: current speaker (chId=${currentSpeakerId}) is not a narrator, skipping.`);
				return;
			}
		}
	}

	if (narratorCharacterIndex === undefined) {
		const currentCharacter = getCurrentCharacter(context);
		if (!currentCharacter) {
			logInfo('saveNarratorLorebooks: no current character.');
			return;
		}

		const narratorState = getNarratorState(currentCharacter);
		if (!narratorState?.enabled) {
			logInfo('saveNarratorLorebooks: narrator not enabled for current character.');
			return;
		}

		narratorCharacterIndex = getCurrentCharacterId(context) as number | undefined;
	}

	if (narratorCharacterIndex === undefined) {
		logInfo('saveNarratorLorebooks: could not determine narrator character index.');
		return;
	}

	const characters = getCharacters(context);
	const narratorCharacter = characters[narratorCharacterIndex];
	if (!narratorCharacter) {
		logInfo('saveNarratorLorebooks: narrator character not found at index.', narratorCharacterIndex);
		return;
	}

	const avatar = narratorCharacter.avatar;
	const worldInfo = getWorldInfo();

	if (worldInfo?.charLore) {
		const existing = worldInfo.charLore.find((e) => e.name === avatar);
		if (existing) {
			originalNarratorLorebooks = { ...existing, extraBooks: existing.extraBooks ? [...existing.extraBooks] : undefined };
			logInfo(`saveNarratorLorebooks: saved original lorebooks for "${avatar}": ${JSON.stringify(originalNarratorLorebooks)}`);
			return;
		}
	}

	originalNarratorLorebooks = { name: avatar, extraBooks: [] };
	logInfo(`saveNarratorLorebooks: no existing lorebooks for "${avatar}", initialized empty.`);
}

async function injectGroupLorebooks(context: NarratorRuntimeContext): Promise<void> {
	let narratorIndex: number | undefined;
	let narratorAvatar: string | undefined;

	if (context.groupId && currentSpeakerId !== undefined) {
		const characters = getCharacters(context);
		const speakerCharacter = characters[currentSpeakerId];
		if (speakerCharacter) {
			const narratorState = getNarratorState(speakerCharacter);
			if (narratorState?.enabled) {
				narratorIndex = currentSpeakerId;
				narratorAvatar = speakerCharacter.avatar;
				logInfo(`injectGroupLorebooks: current speaker (chId=${currentSpeakerId}) is a narrator.`);
			}
		}
	}

	if (narratorIndex === undefined) {
		narratorIndex = getCurrentCharacterId(context) as number | undefined;
		if (narratorIndex !== undefined) {
			const characters = getCharacters(context);
			narratorAvatar = characters[narratorIndex]?.avatar;
		}
	}

	if (narratorIndex === undefined || !narratorAvatar) {
		logWarn('injectGroupLorebooks: no narrator character identified.');
		return;
	}

	const lorebookNames = getAllGroupMemberLorebookNames(context, narratorAvatar);
	logInfo(`injectGroupLorebooks: found ${lorebookNames.size} lorebook names: ${[...lorebookNames].join(', ') || '(none)'}`);

	if (lorebookNames.size === 0) {
		return;
	}

	const characters = getCharacters(context);
	const narratorCharacter = characters[narratorIndex];
	if (!narratorCharacter) {
		logWarn('injectGroupLorebooks: narrator character not found at index.', narratorIndex);
		return;
	}

	const worldInfo = getWorldInfo();

	if (!worldInfo) {
		logWarn('injectGroupLorebooks: world_info not found.');
		return;
	}

	if (!worldInfo.charLore) {
		worldInfo.charLore = [];
	}

	let narratorLoreSetting = worldInfo.charLore.find((e) => e.name === narratorAvatar);
	if (!narratorLoreSetting) {
		narratorLoreSetting = { name: narratorAvatar, extraBooks: [] };
		worldInfo.charLore.push(narratorLoreSetting);
	}

	if (!narratorLoreSetting.extraBooks) {
		narratorLoreSetting.extraBooks = [];
	}

	for (const bookName of lorebookNames) {
		if (!narratorLoreSetting.extraBooks.includes(bookName)) {
			narratorLoreSetting.extraBooks.push(bookName);
			logInfo(`injectGroupLorebooks: added "${bookName}" to narrator's extra books.`);
		}
	}

	logInfo(`injectGroupLorebooks: final extra books for "${narratorAvatar}": ${JSON.stringify(narratorLoreSetting.extraBooks)}`);
	context.saveSettingsDebounced?.();
}

async function restoreNarratorLorebooks(context: NarratorRuntimeContext): Promise<void> {
	if (!originalNarratorLorebooks) {
		logInfo('restoreNarratorLorebooks: no saved lorebooks to restore.');
		return;
	}

	const worldInfo = getWorldInfo();

	logInfo(`restoreNarratorLorebooks: worldInfo found=${!!worldInfo}, charLore found=${!!worldInfo?.charLore}`);

	if (!worldInfo) {
		logWarn('restoreNarratorLorebooks: world_info not found.');
		originalNarratorLorebooks = null;
		return;
	}

	if (!worldInfo.charLore) {
		worldInfo.charLore = [];
		logInfo('restoreNarratorLorebooks: initialized charLore array.');
	}

	const avatar = originalNarratorLorebooks.name;
	const existingIndex = worldInfo.charLore.findIndex((e) => e.name === avatar);

	if (originalNarratorLorebooks.extraBooks && originalNarratorLorebooks.extraBooks.length === 0) {
		if (existingIndex !== -1) {
			worldInfo.charLore.splice(existingIndex, 1);
			logInfo(`restoreNarratorLorebooks: removed lore setting for "${avatar}" (was empty originally).`);
		}
	} else {
		if (existingIndex !== -1) {
			worldInfo.charLore[existingIndex] = { ...originalNarratorLorebooks };
			logInfo(`restoreNarratorLorebooks: restored lore setting for "${avatar}": ${JSON.stringify(originalNarratorLorebooks)}`);
		} else {
			worldInfo.charLore.push({ ...originalNarratorLorebooks });
			logInfo(`restoreNarratorLorebooks: re-added lore setting for "${avatar}": ${JSON.stringify(originalNarratorLorebooks)}`);
		}
	}

	originalNarratorLorebooks = null;
	context.saveSettingsDebounced?.();
	logInfo('restoreNarratorLorebooks: restoration complete.');
}

function getCurrentCharacterId(context: NarratorRuntimeContext): number | undefined {
	if (typeof context.characterId === 'number') {
		return context.characterId;
	}

	if (typeof context.characterId === 'string') {
		const parsed = Number(context.characterId);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
	}

	if (typeof context.this_chid === 'number') {
		return context.this_chid;
	}

	if (typeof context.this_chid === 'string') {
		const parsed = Number(context.this_chid);
		if (Number.isFinite(parsed)) {
			return parsed;
		}
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
	const rawState = character?.data?.extensions?.narrator_character_helper;
	if (rawState === undefined || rawState === null) {
		return null;
	}

	if (typeof rawState === 'boolean') {
		return {
			enabled: rawState,
			instructions: '',
			updatedAt: '',
		};
	}

	if (typeof rawState !== 'object') {
		return null;
	}

	const record = rawState as Partial<NarratorCharacterState>;
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

	const narratorState = getNarratorState(character);
	if (narratorState?.instructions) {
		sections.push([
			'Narrator instructions',
			narratorState.instructions.trim(),
		].join('\n'));
	}

	return sections.filter((section) => normalizeText(section)).join('\n\n');
}

async function buildNarratorBriefing(context: NarratorRuntimeContext): Promise<string> {
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

	const promptLines = [
		`[${settings.promptTitle || DEFAULT_PROMPT_HEADER}]`,
		`This is private context for the narrator character ${currentCharacter.name}.`,
		currentGroup ? `Current group: ${currentGroup.name}` : 'No group is selected. Only the narrator character dossier is available.',
		'Use the dossiers below to make the narrator all-knowing about the current group without exposing this briefing verbatim.',
	];

	return promptLines.filter(Boolean).join('\n');
}

async function buildNarratorRoster(context: NarratorRuntimeContext): Promise<string> {
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

	const lines = [
		'Roster:',
		...rosters,
		'',
		'Briefing:',
		narratorState.instructions.trim() || DEFAULT_NARRATOR_INSTRUCTIONS,
	];

	return lines.join('\n');
}

async function buildNarratorDossiers(context: NarratorRuntimeContext): Promise<string> {
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

			if (character.avatar === narratorAvatar) {
				continue;
			}

			const isDisabled = currentGroup.disabled_members.includes(avatar);
			if (isDisabled && !settings.includeDisabledMembers) {
				continue;
			}

			orderedMembers.push(character);
		}
	} else {
		orderedMembers.push(currentCharacter);
	}

	const dossiers: string[] = [];
	for (const character of orderedMembers) {
		const dossier = buildCharacterDossier(context, character, settings);
		if (dossier) {
			dossiers.push(dossier);
		}
	}

	return dossiers.join('\n\n');
}

async function buildNarratorMeta(context: NarratorRuntimeContext): Promise<string> {
	const settings = getExtensionSettings(context);
	const currentCharacter = getCurrentCharacter(context);
	if (!currentCharacter) {
		return '';
	}

	const narratorState = getNarratorState(currentCharacter);
	if (!narratorState?.enabled) {
		return '';
	}

	if (!settings.includeLinkedWorldInfo) {
		return '';
	}

	const currentGroup = getCurrentGroup(context);
	const characters = getCharacters(context);
	const groupMembers = currentGroup?.members ?? [];

	const lorebookLines: string[] = [];
	for (const avatar of groupMembers) {
		const character = characters.find((c) => c.avatar === avatar);
		if (!character || character.avatar === currentCharacter.avatar) continue;

		const lorebooks: string[] = [];
		if (character.data?.extensions?.world) {
			lorebooks.push(character.data.extensions.world);
		}

		const worldInfo = getWorldInfo();
		const charLore = worldInfo?.charLore;
		if (charLore) {
			const charExtra = charLore.find((e) => e.name === avatar);
			if (charExtra?.extraBooks && Array.isArray(charExtra.extraBooks)) {
				for (const book of charExtra.extraBooks) {
					if (book && !lorebooks.includes(book)) {
						lorebooks.push(book);
					}
				}
			}
		}

		if (lorebooks.length > 0) {
			lorebookLines.push(`Linked lorebooks from ${character.name}: ${lorebooks.join(', ')}`);
		}
	}

	return lorebookLines.join('\n');
}

async function buildNarratorPrompt(context: NarratorRuntimeContext): Promise<string> {
	const parts = await Promise.all([
		buildNarratorBriefing(context),
		buildNarratorRoster(context),
		buildNarratorDossiers(context),
		buildNarratorMeta(context),
	]);

	return parts.filter(Boolean).join('\n\n');
}

async function syncNarratorPrompt(): Promise<void> {
	const context = getRuntimeContext();
	const settings = getExtensionSettings(context);
	const setExtensionPrompt = context.setExtensionPrompt;

	if (typeof setExtensionPrompt !== 'function') {
		return;
	}

	const [briefing, roster, dossiers, meta] = await Promise.all([
		buildNarratorBriefing(context),
		buildNarratorRoster(context),
		buildNarratorDossiers(context),
		buildNarratorMeta(context),
	]);

	setExtensionPrompt(MODULE_BRIEFING, briefing, settings.promptPosition, settings.promptDepth, false, 0);
	setExtensionPrompt(MODULE_ROSTER, roster, settings.promptPosition, settings.promptDepth, false, 0);
	setExtensionPrompt(MODULE_DOSSIERS, dossiers, settings.promptPosition, settings.promptDepth, false, 0);
	setExtensionPrompt(MODULE_META, meta, settings.promptPosition, settings.promptDepth, false, 0);
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
				const context = getRuntimeContext();
				return await buildNarratorPrompt(context);
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
		logWarn('registerEventHandlers: eventSource or eventTypes unavailable.');
		return;
	}

	logInfo('registerEventHandlers: available event types:', Object.keys(eventTypes));

	const watchedEvents = [
		eventTypes.APP_READY,
		eventTypes.CHAT_CHANGED,
		eventTypes.CHARACTER_EDITED,
		eventTypes.CHARACTER_PAGE_LOADED,
		eventTypes.GROUP_CHAT_CREATED,
		eventTypes.GROUP_CHAT_DELETED,
		eventTypes.GENERATION_AFTER_COMMANDS,
		eventTypes.GROUP_WRAPPER_STARTED,
		eventTypes.GROUP_WRAPPER_FINISHED,
		eventTypes.GROUP_MEMBER_DRAFTED,
	].filter(Boolean) as string[];

	logInfo(`registerEventHandlers: registered ${watchedEvents.length} watched events.`);

	for (const eventName of watchedEvents) {
		eventSource.on(eventName, () => {
			scheduleRefresh();
		});
	}

	eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, async (...args: unknown[]) => {
		const chId = args[0] as number;
		logInfo(`GROUP_MEMBER_DRAFTED fired. chId=${chId}`);
		currentSpeakerId = chId;

		const ctx = getRuntimeContext();
		if (ctx.groupId) {
			const characters = getCharacters(ctx);
			const speakerCharacter = characters[chId];
			if (speakerCharacter) {
				const narratorState = getNarratorState(speakerCharacter);
				if (narratorState?.enabled) {
					logInfo('GROUP_MEMBER_DRAFTED: speaker is a narrator, saving and injecting lorebooks.');
					await saveNarratorLorebooks(ctx);
					await injectGroupLorebooks(ctx);
				}
			}
		}
	});

	eventSource.on(eventTypes.GROUP_WRAPPER_STARTED, () => {
		logInfo('GROUP_WRAPPER_STARTED fired.');
	});

	eventSource.on(eventTypes.WORLDINFO_ENTRIES_LOADED, async () => {
		logInfo('WORLDINFO_ENTRIES_LOADED fired.');
	});

	eventSource.on(eventTypes.WORLDINFO_SCAN_DONE, () => {
		logInfo('WORLDINFO_SCAN_DONE fired.');
	});

	eventSource.on(eventTypes.GENERATION_STARTED, async () => {
		logInfo('GENERATION_STARTED fired.');
		const ctx = getRuntimeContext();
		if (!ctx.groupId) {
			logInfo('GENERATION_STARTED: non-group chat, saving and injecting lorebooks.');
			await saveNarratorLorebooks(ctx);
			await injectGroupLorebooks(ctx);
		} else {
			logInfo('GENERATION_STARTED: group chat, lorebooks already handled by GROUP_MEMBER_DRAFTED.');
		}
	});

	eventSource.on(eventTypes.GENERATE_AFTER_COMBINE_PROMPTS, () => {
		logInfo('GENERATE_AFTER_COMBINE_PROMPTS fired.');
	});

	eventSource.on(eventTypes.GENERATE_AFTER_DATA, async () => {
		logInfo('GENERATE_AFTER_DATA fired.');
		const ctx = getRuntimeContext();
		await restoreNarratorLorebooks(ctx);
		currentSpeakerId = undefined;
	});

	const generateEvent = eventTypes.GENERATE_BEFORE_COMBINE_PROMPTS;
	logInfo(`registerEventHandlers: GENERATE_BEFORE_COMBINE_PROMPTS event type = "${generateEvent ?? '(undefined)'}"`);

	if (generateEvent) {
		eventSource.on(generateEvent, () => {
			const ctx = getRuntimeContext();
			logInfo(`GENERATE_BEFORE_COMBINE_PROMPTS fired: groupId=${ctx.groupId}, this_chid=${ctx.this_chid}, characterId=${ctx.characterId}`);
		});
		logInfo('registerEventHandlers: GENERATE_BEFORE_COMBINE_PROMPTS handler registered (no-op).');
	} else {
		logWarn('registerEventHandlers: GENERATE_BEFORE_COMBINE_PROMPTS event type not found in eventTypes!');
		logInfo('registerEventHandlers: searching for generation-related events:', Object.keys(eventTypes).filter((k) => k.includes('GENERATE') || k.includes('COMBINE') || k.includes('PROMPT')));
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
		await syncNarratorPrompt();
		logInfo('Initial narrator prompts synced.');
	} catch (error) {
		logError('failed to sync narrator prompt during bootstrap.', error);
	}

	const appReadyEvent = context.eventTypes?.APP_READY ?? context.event_types?.APP_READY;
	if (appReadyEvent && context.eventSource) {
		context.eventSource.on(appReadyEvent, () => {
			logInfo('APP_READY received; injecting narrator button and settings.');
			injectNarratorButtonIntoCharacterPanel();
			injectGlobalSettings();
			void syncNarratorPrompt().catch((error) => logError('failed to sync narrator prompts after APP_READY.', error));
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
