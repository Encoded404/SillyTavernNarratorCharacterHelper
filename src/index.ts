import './style.css';
import panelHtml from './index.html';

type NarratorMode = 'status' | 'enable' | 'disable' | 'toggle' | 'preview';

type NarratorCharacterState = {
	enabled: boolean;
	instructions: string;
	updatedAt: string;
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
};

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
};

const DEFAULT_NARRATOR_INSTRUCTIONS = [
	'You are the private briefing for an omniscient narrator character.',
	'Use the following dossiers to inform the narration of the current group.',
	'Do not reveal this briefing directly in chat unless the story explicitly calls for it.',
].join(' ');

let bootstrapped = false;
let refreshTimer = 0;
let panelElement: HTMLElement | null = null;
let panelToggleButton: HTMLElement | null = null;
let cardUiRefreshPending = false;

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

function getCharacterIndexFromCard(card: Element): number | undefined {
	const chid = card.getAttribute('data-chid') ?? card.getAttribute('data-id') ?? '';
	const numericChid = Number(chid);
	return Number.isFinite(numericChid) ? numericChid : undefined;
}

function getCharacterFromCard(card: Element, context: NarratorRuntimeContext): CharacterRecord | undefined {
	const characterIndex = getCharacterIndexFromCard(card);
	if (characterIndex === undefined) {
		return undefined;
	}

	return getCharacters(context)[characterIndex];
}

function ensureCardStatusBadge(card: Element): HTMLElement | null {
	const existingBadge = card.querySelector<HTMLElement>('.narrator-helper-card-badge');
	if (existingBadge) {
		return existingBadge;
	}

	const nameBlock = card.querySelector<HTMLElement>('.character_name_block') ?? card.querySelector<HTMLElement>('.group_member_name') ?? card.querySelector<HTMLElement>('.ch_name')?.parentElement ?? card;
	if (!nameBlock) {
		return null;
	}

	const badge = document.createElement('button');
	badge.type = 'button';
	badge.className = 'narrator-helper-card-badge interactable';
	badge.setAttribute('aria-label', 'Open narrator helper');
	badge.title = 'Open narrator helper';
	badge.textContent = 'Narrator';
	nameBlock.appendChild(badge);
	return badge;
}

function updateCardBadge(card: Element, context: NarratorRuntimeContext): void {
	const character = getCharacterFromCard(card, context);
	const badge = ensureCardStatusBadge(card);
	if (!badge) {
		return;
	}

	if (!character) {
		badge.classList.remove('is-narrator');
		badge.textContent = 'Narrator';
		badge.title = 'Open narrator helper';
		return;
	}

	const narratorState = getNarratorState(character);
	const isNarrator = Boolean(narratorState?.enabled);
	badge.classList.toggle('is-narrator', isNarrator);
	badge.textContent = isNarrator ? 'Narrator ★' : 'Narrator';
	badge.title = isNarrator ? `Narrator enabled for ${character.name}` : `Mark ${character.name} as narrator`;
}

function renderCardUi(): void {
	const context = getRuntimeContext();
	const cards = document.querySelectorAll<HTMLElement>('#rm_print_characters_block .character_select, #rm_group_members .group_member, #rm_group_add_members .group_member');
	for (const card of cards) {
		updateCardBadge(card, context);
	}
}

function scheduleCardUiRefresh(): void {
	if (cardUiRefreshPending) {
		return;
	}

	cardUiRefreshPending = true;
	window.requestAnimationFrame(() => {
		cardUiRefreshPending = false;
		renderCardUi();
	});
}

function openNarratorPanelForCard(card: Element): void {
	const context = getRuntimeContext();
	const characterIndex = getCharacterIndexFromCard(card);
	if (characterIndex !== undefined) {
		panelElement ??= null;
		togglePanel(true);
		const select = ensurePanel().querySelector<HTMLSelectElement>('[data-role="character-select"]');
		if (select) {
			select.value = String(characterIndex);
		}
		updatePanelControls();
		return;
	}

	const currentCharacter = getCurrentCharacter(context);
	if (currentCharacter) {
		togglePanel(true);
		updatePanelControls();
	}
}

function attachCardUiEvents(): void {
	if (document.body.dataset.narratorHelperCardUi === '1') {
		return;
	}

	document.body.dataset.narratorHelperCardUi = '1';

	document.addEventListener('click', (event) => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const badge = target.closest('.narrator-helper-card-badge');
		if (!badge) {
			return;
		}

		const card = badge.closest('.character_select, .group_member');
		if (!card) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		openNarratorPanelForCard(card);
	});
}

function saveExtensionSettings(context: NarratorRuntimeContext): void {
	context.saveSettingsDebounced?.();
	(globalThis as unknown as { saveSettingsDebounced?: () => void }).saveSettingsDebounced?.();
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

function getNarratorField(character: CharacterRecord | undefined): string {
	return normalizeText(getNarratorState(character)?.instructions ?? '');
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
	renderPanel();
}

function updatePanelControls(): void {
	const context = getRuntimeContext();
	if (!panelElement) {
		return;
	}

	const settings = getExtensionSettings(context);
	const characters = getCharacters(context);
	const currentCharacter = getCurrentCharacter(context);
	const currentGroup = getCurrentGroup(context);

	const select = panelElement.querySelector<HTMLSelectElement>('[data-role="character-select"]');
	const status = panelElement.querySelector<HTMLElement>('[data-role="active-status"]');
	const groupStatus = panelElement.querySelector<HTMLElement>('[data-role="group-status"]');
	const instructions = panelElement.querySelector<HTMLTextAreaElement>('[data-role="instructions"]');
	const preview = panelElement.querySelector<HTMLTextAreaElement>('[data-role="preview"]');
	const position = panelElement.querySelector<HTMLSelectElement>('[data-role="position-select"]');
	const depth = panelElement.querySelector<HTMLInputElement>('[data-role="depth-input"]');
	const includeDisabled = panelElement.querySelector<HTMLInputElement>('[data-role="include-disabled"]');
	const includeCharacterBook = panelElement.querySelector<HTMLInputElement>('[data-role="include-books"]');
	const includeWorldInfo = panelElement.querySelector<HTMLInputElement>('[data-role="include-world-info"]');
	const includeDescription = panelElement.querySelector<HTMLInputElement>('[data-role="include-description"]');
	const includePersonality = panelElement.querySelector<HTMLInputElement>('[data-role="include-personality"]');
	const includeScenario = panelElement.querySelector<HTMLInputElement>('[data-role="include-scenario"]');
	const includeFirstMessage = panelElement.querySelector<HTMLInputElement>('[data-role="include-first-message"]');
	const includeExampleMessages = panelElement.querySelector<HTMLInputElement>('[data-role="include-example-messages"]');
	const includeCreatorNotes = panelElement.querySelector<HTMLInputElement>('[data-role="include-creator-notes"]');
	const includeSystemPrompt = panelElement.querySelector<HTMLInputElement>('[data-role="include-system-prompt"]');
	const includePostHistory = panelElement.querySelector<HTMLInputElement>('[data-role="include-post-history"]');
	const includeTags = panelElement.querySelector<HTMLInputElement>('[data-role="include-tags"]');
	const maxBookEntries = panelElement.querySelector<HTMLInputElement>('[data-role="max-book-entries"]');
	const maxBookEntryLength = panelElement.querySelector<HTMLInputElement>('[data-role="max-book-entry-length"]');
	const maxWorldEntries = panelElement.querySelector<HTMLInputElement>('[data-role="max-world-entries"]');
	const maxWorldEntryLength = panelElement.querySelector<HTMLInputElement>('[data-role="max-world-entry-length"]');

	if (select) {
		const activeCharacterId = getCurrentCharacterId(context);
		const selectedValue = activeCharacterId === undefined ? '' : String(activeCharacterId);
		const existingValue = select.value;

		select.innerHTML = '';
		for (const [index, character] of characters.entries()) {
			const option = document.createElement('option');
			option.value = String(index);
			const narratorState = getNarratorState(character);
			const narratorMark = narratorState?.enabled ? ' ★' : '';
			option.textContent = `${character.name}${narratorMark}`;
			select.appendChild(option);
		}

		select.value = selectedValue || existingValue || select.value;
	}

	if (status) {
		if (currentCharacter) {
			const narratorState = getNarratorState(currentCharacter);
			status.textContent = narratorState?.enabled
				? `Active narrator: ${currentCharacter.name}`
				: `Selected character: ${currentCharacter.name} (not marked as narrator)`;
		} else {
			status.textContent = 'No character selected.';
		}
	}

	if (groupStatus) {
		if (currentGroup) {
			const disabledCount = currentGroup.disabled_members.length;
			groupStatus.textContent = `Current group: ${currentGroup.name} (${currentGroup.members.length} members, ${disabledCount} muted)`;
		} else {
			groupStatus.textContent = 'No group selected.';
		}
	}

	if (instructions) {
		instructions.value = getNarratorField(currentCharacter);
	}

	if (position) {
		position.value = String(settings.promptPosition);
	}

	if (depth) {
		depth.value = String(settings.promptDepth);
		depth.disabled = settings.promptPosition !== 1;
	}

	if (includeDisabled) includeDisabled.checked = settings.includeDisabledMembers;
	if (includeCharacterBook) includeCharacterBook.checked = settings.includeCharacterBook;
	if (includeWorldInfo) includeWorldInfo.checked = settings.includeLinkedWorldInfo;
	if (includeDescription) includeDescription.checked = settings.includeDescription;
	if (includePersonality) includePersonality.checked = settings.includePersonality;
	if (includeScenario) includeScenario.checked = settings.includeScenario;
	if (includeFirstMessage) includeFirstMessage.checked = settings.includeFirstMessage;
	if (includeExampleMessages) includeExampleMessages.checked = settings.includeExampleMessages;
	if (includeCreatorNotes) includeCreatorNotes.checked = settings.includeCreatorNotes;
	if (includeSystemPrompt) includeSystemPrompt.checked = settings.includeSystemPrompt;
	if (includePostHistory) includePostHistory.checked = settings.includePostHistoryInstructions;
	if (includeTags) includeTags.checked = settings.includeTags;
	if (maxBookEntries) maxBookEntries.value = String(settings.maxBookEntries);
	if (maxBookEntryLength) maxBookEntryLength.value = String(settings.maxBookEntryLength);
	if (maxWorldEntries) maxWorldEntries.value = String(settings.maxWorldEntries);
	if (maxWorldEntryLength) maxWorldEntryLength.value = String(settings.maxWorldEntryLength);

	if (preview && !preview.value.trim()) {
		preview.placeholder = 'Click Preview briefing to generate the current narrator dossier.';
	}
}

function scheduleRefresh(): void {
	if (refreshTimer) {
		window.clearTimeout(refreshTimer);
	}

	refreshTimer = window.setTimeout(() => {
		void syncNarratorPrompt().catch((error) => {
			console.error('Narrator helper refresh failed', error);
		});
		updatePanelControls();
	}, 50);
}

function attachPanelEvents(): void {
	if (!panelElement) {
		return;
	}

	const context = getRuntimeContext();
	const characters = getCharacters(context);

	const select = panelElement.querySelector<HTMLSelectElement>('[data-role="character-select"]');
	const instructions = panelElement.querySelector<HTMLTextAreaElement>('[data-role="instructions"]');
	const preview = panelElement.querySelector<HTMLTextAreaElement>('[data-role="preview"]');
	const position = panelElement.querySelector<HTMLSelectElement>('[data-role="position-select"]');
	const depth = panelElement.querySelector<HTMLInputElement>('[data-role="depth-input"]');
	const includeDisabled = panelElement.querySelector<HTMLInputElement>('[data-role="include-disabled"]');
	const includeCharacterBook = panelElement.querySelector<HTMLInputElement>('[data-role="include-books"]');
	const includeWorldInfo = panelElement.querySelector<HTMLInputElement>('[data-role="include-world-info"]');
	const includeDescription = panelElement.querySelector<HTMLInputElement>('[data-role="include-description"]');
	const includePersonality = panelElement.querySelector<HTMLInputElement>('[data-role="include-personality"]');
	const includeScenario = panelElement.querySelector<HTMLInputElement>('[data-role="include-scenario"]');
	const includeFirstMessage = panelElement.querySelector<HTMLInputElement>('[data-role="include-first-message"]');
	const includeExampleMessages = panelElement.querySelector<HTMLInputElement>('[data-role="include-example-messages"]');
	const includeCreatorNotes = panelElement.querySelector<HTMLInputElement>('[data-role="include-creator-notes"]');
	const includeSystemPrompt = panelElement.querySelector<HTMLInputElement>('[data-role="include-system-prompt"]');
	const includePostHistory = panelElement.querySelector<HTMLInputElement>('[data-role="include-post-history"]');
	const includeTags = panelElement.querySelector<HTMLInputElement>('[data-role="include-tags"]');
	const maxBookEntries = panelElement.querySelector<HTMLInputElement>('[data-role="max-book-entries"]');
	const maxBookEntryLength = panelElement.querySelector<HTMLInputElement>('[data-role="max-book-entry-length"]');
	const maxWorldEntries = panelElement.querySelector<HTMLInputElement>('[data-role="max-world-entries"]');
	const maxWorldEntryLength = panelElement.querySelector<HTMLInputElement>('[data-role="max-world-entry-length"]');
	const openButton = panelElement.querySelector<HTMLButtonElement>('[data-action="open"]');
	const closeButton = panelElement.querySelector<HTMLButtonElement>('[data-action="close"]');
	const enableButton = panelElement.querySelector<HTMLButtonElement>('[data-action="enable"]');
	const disableButton = panelElement.querySelector<HTMLButtonElement>('[data-action="disable"]');
	const clearButton = panelElement.querySelector<HTMLButtonElement>('[data-action="clear"]');
	const saveInstructionsButton = panelElement.querySelector<HTMLButtonElement>('[data-action="save-instructions"]');
	const previewButton = panelElement.querySelector<HTMLButtonElement>('[data-action="preview"]');
	const refreshButton = panelElement.querySelector<HTMLButtonElement>('[data-action="refresh"]');

	const updateRuntimeSetting = (patch: Partial<NarratorSettings>) => {
		const settings = getExtensionSettings(context);
		Object.assign(settings, patch);
		saveExtensionSettings(context);
		scheduleRefresh();
	};

	select?.addEventListener('change', () => {
		updatePanelControls();
	});

	includeDisabled?.addEventListener('change', () => updateRuntimeSetting({ includeDisabledMembers: includeDisabled.checked }));
	includeCharacterBook?.addEventListener('change', () => updateRuntimeSetting({ includeCharacterBook: includeCharacterBook.checked }));
	includeWorldInfo?.addEventListener('change', () => updateRuntimeSetting({ includeLinkedWorldInfo: includeWorldInfo.checked }));
	includeDescription?.addEventListener('change', () => updateRuntimeSetting({ includeDescription: includeDescription.checked }));
	includePersonality?.addEventListener('change', () => updateRuntimeSetting({ includePersonality: includePersonality.checked }));
	includeScenario?.addEventListener('change', () => updateRuntimeSetting({ includeScenario: includeScenario.checked }));
	includeFirstMessage?.addEventListener('change', () => updateRuntimeSetting({ includeFirstMessage: includeFirstMessage.checked }));
	includeExampleMessages?.addEventListener('change', () => updateRuntimeSetting({ includeExampleMessages: includeExampleMessages.checked }));
	includeCreatorNotes?.addEventListener('change', () => updateRuntimeSetting({ includeCreatorNotes: includeCreatorNotes.checked }));
	includeSystemPrompt?.addEventListener('change', () => updateRuntimeSetting({ includeSystemPrompt: includeSystemPrompt.checked }));
	includePostHistory?.addEventListener('change', () => updateRuntimeSetting({ includePostHistoryInstructions: includePostHistory.checked }));
	includeTags?.addEventListener('change', () => updateRuntimeSetting({ includeTags: includeTags.checked }));
	maxBookEntries?.addEventListener('change', () => updateRuntimeSetting({ maxBookEntries: Number(maxBookEntries.value) || DEFAULT_SETTINGS.maxBookEntries }));
	maxBookEntryLength?.addEventListener('change', () => updateRuntimeSetting({ maxBookEntryLength: Number(maxBookEntryLength.value) || DEFAULT_SETTINGS.maxBookEntryLength }));
	maxWorldEntries?.addEventListener('change', () => updateRuntimeSetting({ maxWorldEntries: Number(maxWorldEntries.value) || DEFAULT_SETTINGS.maxWorldEntries }));
	maxWorldEntryLength?.addEventListener('change', () => updateRuntimeSetting({ maxWorldEntryLength: Number(maxWorldEntryLength.value) || DEFAULT_SETTINGS.maxWorldEntryLength }));

	position?.addEventListener('change', () => {
		const nextPosition = Number(position.value);
		updateRuntimeSetting({ promptPosition: nextPosition });
		if (depth) {
			depth.disabled = nextPosition !== 1;
		}
	});

	depth?.addEventListener('change', () => updateRuntimeSetting({ promptDepth: Math.max(0, Number(depth.value) || DEFAULT_SETTINGS.promptDepth) }));

	openButton?.addEventListener('click', () => togglePanel(true));
	closeButton?.addEventListener('click', () => togglePanel(false));
	refreshButton?.addEventListener('click', () => {
		updatePanelControls();
		void syncNarratorPrompt();
	});

	enableButton?.addEventListener('click', async () => {
		const selectedCharacterId = getSelectedCharacterIdFromPanel();
		if (selectedCharacterId === undefined) {
			return;
		}

		const instructionsText = normalizeText(panelElement?.querySelector<HTMLTextAreaElement>('[data-role="instructions"]')?.value ?? DEFAULT_NARRATOR_INSTRUCTIONS);
		await writeNarratorState(selectedCharacterId, true, instructionsText);
	});

	disableButton?.addEventListener('click', async () => {
		const selectedCharacterId = getSelectedCharacterIdFromPanel();
		if (selectedCharacterId === undefined) {
			return;
		}

		const instructionsText = normalizeText(instructions?.value ?? '');
		await writeNarratorState(selectedCharacterId, false, instructionsText);
	});

	clearButton?.addEventListener('click', async () => {
		const selectedCharacterId = getSelectedCharacterIdFromPanel();
		if (selectedCharacterId === undefined) {
			return;
		}

		const character = characters[selectedCharacterId];
		if (!character || typeof context.writeExtensionField !== 'function') {
			return;
		}

		await context.writeExtensionField(selectedCharacterId, MODULE_NAME, context.constants?.unset ?? '__@@UNSET@@__');
		await syncNarratorPrompt();
		updatePanelControls();
	});

	saveInstructionsButton?.addEventListener('click', async () => {
		const selectedCharacterId = getSelectedCharacterIdFromPanel();
		if (selectedCharacterId === undefined) {
			return;
		}

		const existing = getNarratorState(characters[selectedCharacterId]);
		const nextState: NarratorCharacterState = {
			enabled: existing?.enabled ?? false,
			instructions: normalizeText(instructions?.value ?? ''),
			updatedAt: new Date().toISOString(),
		};

		if (typeof context.writeExtensionField === 'function') {
			await context.writeExtensionField(selectedCharacterId, MODULE_NAME, nextState);
			await syncNarratorPrompt();
			updatePanelControls();
		}
	});

	previewButton?.addEventListener('click', async () => {
		const output = preview;
		if (!output) {
			return;
		}

		output.value = 'Building preview...';
		try {
			output.value = await buildNarratorPrompt(context);
		} catch (error) {
			console.error('Narrator prompt preview failed', error);
			output.value = `Preview failed: ${String(error)}`;
		}
	});

	instructions?.addEventListener('input', () => {
		if (!instructions) {
			return;
		}

		const selectedCharacterId = getSelectedCharacterIdFromPanel();
		if (selectedCharacterId === undefined) {
			return;
		}

		const activeState = getNarratorState(characters[selectedCharacterId]) ?? {
			enabled: false,
			instructions: '',
			updatedAt: '',
		};

		activeState.instructions = instructions.value;
		activeState.updatedAt = new Date().toISOString();
		if (typeof context.writeExtensionField === 'function') {
			void context.writeExtensionField(selectedCharacterId, MODULE_NAME, activeState).then(() => {
				void syncNarratorPrompt();
			}).catch((error) => {
				console.error('Failed to save narrator instructions', error);
			});
		}
	});
}

function getSelectedCharacterIdFromPanel(): number | undefined {
	if (!panelElement) {
		return getCurrentCharacterId(getRuntimeContext());
	}

	const select = panelElement.querySelector<HTMLSelectElement>('[data-role="character-select"]');
	if (!select?.value) {
		return getCurrentCharacterId(getRuntimeContext());
	}

	const numericValue = Number(select.value);
	return Number.isFinite(numericValue) ? numericValue : undefined;
}

function createPanel(): HTMLElement {
	const container = document.createElement('div');
	container.innerHTML = panelHtml.trim();
	const root = container.firstElementChild as HTMLElement | null;

	if (!root) {
		throw new Error('Failed to initialize narrator helper panel');
	}

	return root;
}

function ensurePanel(): HTMLElement {
	if (panelElement) {
		return panelElement;
	}

	panelElement = document.getElementById('narrator-helper-panel') ?? createPanel();
	if (!panelElement.isConnected) {
		document.body.appendChild(panelElement);
	}

	attachPanelEvents();
	updatePanelControls();
	return panelElement;
}

function ensureMenuButton(): boolean {
	if (panelToggleButton?.isConnected) {
		return true;
	}

	const menu = document.getElementById('extensionsMenu');
	if (!menu) {
		return false;
	}

	const existing = menu.querySelector('#narrator-helper-menu-item');
	if (existing) {
		panelToggleButton = existing as HTMLElement;
		return true;
	}

	const menuItem = document.createElement('div');
	menuItem.id = 'narrator-helper-menu-item';
	menuItem.className = 'list-group-item flex-container flexGap5 narrator-helper-menu-item';
	menuItem.innerHTML = '<div class="fa-fw fa-solid fa-feather-pointed extensionsMenuExtensionButton"></div><span>Narrator Helper</span>';
	menuItem.title = 'Open the narrator character helper';
	menuItem.addEventListener('click', () => togglePanel());
	menu.prepend(menuItem);
	panelToggleButton = menuItem;
	return true;
}

function togglePanel(forceOpen?: boolean): void {
	const root = ensurePanel();
	const shouldOpen = forceOpen ?? root.classList.contains('is-hidden');
	root.classList.toggle('is-hidden', !shouldOpen);
	root.setAttribute('aria-hidden', String(!shouldOpen));

	if (shouldOpen) {
		updatePanelControls();
	}
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
}

function injectStyles(): void {
	if (document.getElementById('narrator-helper-root-style')) {
		return;
	}

	const style = document.createElement('style');
	style.id = 'narrator-helper-root-style';
	style.textContent = `
		.narrator-helper-panel {
			position: fixed;
			right: 24px;
			top: 84px;
			z-index: 10000;
			width: min(760px, calc(100vw - 32px));
			max-height: calc(100vh - 110px);
			overflow: auto;
			border-radius: 24px;
			padding: 22px;
			color: #f4f1ea;
			background:
				radial-gradient(circle at top right, rgba(255, 198, 77, 0.18), transparent 36%),
				radial-gradient(circle at bottom left, rgba(82, 205, 255, 0.14), transparent 42%),
				linear-gradient(180deg, rgba(16, 20, 29, 0.97), rgba(11, 14, 20, 0.98));
			border: 1px solid rgba(255, 255, 255, 0.12);
			box-shadow: 0 28px 80px rgba(0, 0, 0, 0.42);
			backdrop-filter: blur(16px);
		}

		.narrator-helper-panel.is-hidden {
			display: none;
		}

		.narrator-helper-panel__header {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 16px;
			margin-bottom: 18px;
		}

		.narrator-helper-panel__eyebrow {
			margin: 0 0 6px;
			color: #f2c66d;
			font-size: 0.72rem;
			letter-spacing: 0.18em;
			text-transform: uppercase;
		}

		.narrator-helper-panel__title {
			margin: 0;
			font-size: 1.5rem;
			line-height: 1.1;
		}

		.narrator-helper-panel__subtitle {
			margin: 8px 0 0;
			color: rgba(244, 241, 234, 0.78);
			max-width: 56ch;
		}

		.narrator-helper-panel__close,
		.narrator-helper-menu-item {
			cursor: pointer;
		}

		.narrator-helper-panel__close {
			border: none;
			background: rgba(255, 255, 255, 0.08);
			color: inherit;
			width: 38px;
			height: 38px;
			border-radius: 999px;
			font-size: 1.35rem;
		}

		.narrator-helper-panel__status {
			display: grid;
			gap: 8px;
			margin-bottom: 18px;
			padding: 14px 16px;
			border-radius: 18px;
			background: rgba(255, 255, 255, 0.05);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.narrator-helper-panel__status span {
			color: rgba(244, 241, 234, 0.92);
		}

		.narrator-helper-panel__grid {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 12px;
			margin-bottom: 18px;
		}

		.narrator-helper-panel__grid label,
		.narrator-helper-panel__field {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.narrator-helper-panel__grid label span,
		.narrator-helper-panel__field span,
		.narrator-helper-panel__field small {
			color: rgba(244, 241, 234, 0.88);
		}

		.narrator-helper-panel__grid select,
		.narrator-helper-panel__grid input,
		.narrator-helper-panel__grid textarea,
		.narrator-helper-panel__field textarea,
		.narrator-helper-panel__field input,
		.narrator-helper-panel__field select {
			width: 100%;
			box-sizing: border-box;
			border-radius: 16px;
			border: 1px solid rgba(255, 255, 255, 0.12);
			background: rgba(6, 9, 13, 0.72);
			color: #fff;
			padding: 10px 12px;
		}

		.narrator-helper-panel__wide {
			grid-column: 1 / -1;
		}

		.narrator-helper-panel__flags {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px 12px;
			margin-bottom: 18px;
		}

		.narrator-helper-panel__flag {
			display: flex;
			align-items: flex-start;
			gap: 10px;
			padding: 12px 14px;
			border-radius: 18px;
			background: rgba(255, 255, 255, 0.04);
			border: 1px solid rgba(255, 255, 255, 0.08);
		}

		.narrator-helper-panel__flag input {
			margin-top: 4px;
		}

		.narrator-helper-panel__flag strong {
			display: block;
		}

		.narrator-helper-panel__actions {
			display: flex;
			flex-wrap: wrap;
			gap: 10px;
			margin-bottom: 18px;
		}

		.narrator-helper-panel__actions button,
		.narrator-helper-panel__toolbar button {
			border: none;
			border-radius: 999px;
			padding: 10px 14px;
			color: #091018;
			background: linear-gradient(135deg, #f5cb67, #7de0ff);
			font-weight: 700;
			cursor: pointer;
		}

		.narrator-helper-panel__actions button:nth-child(2) {
			background: linear-gradient(135deg, #f0a44d, #ff7f66);
		}

		.narrator-helper-panel__actions button:nth-child(3) {
			background: linear-gradient(135deg, #9ca3af, #e5e7eb);
		}

		.narrator-helper-panel__actions button:nth-child(4) {
			background: linear-gradient(135deg, #7cdb9a, #4ce0b3);
		}

		.narrator-helper-panel__actions button:nth-child(5) {
			background: linear-gradient(135deg, #9f7aea, #6ee7ff);
		}

		.narrator-helper-panel__actions button:nth-child(6) {
			background: linear-gradient(135deg, #e5b84d, #f4f1ea);
		}

		.narrator-helper-panel__preview {
			display: flex;
			flex-direction: column;
			gap: 8px;
		}

		.narrator-helper-panel__preview textarea {
			min-height: 240px;
			resize: vertical;
			font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
			line-height: 1.45;
		}

		.narrator-helper-menu-item .extensionsMenuExtensionButton {
			color: #f5cb67;
		}

		@media (max-width: 760px) {
			.narrator-helper-panel {
				right: 12px;
				left: 12px;
				width: auto;
				top: 64px;
				max-height: calc(100vh - 84px);
			}

			.narrator-helper-panel__grid,
			.narrator-helper-panel__flags {
				grid-template-columns: 1fr;
			}
		}
	`;

	document.head.appendChild(style);
}

function renderPanel(): void {
	ensurePanel();
	updatePanelControls();
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
	injectStyles();
	ensurePanel();
	ensureMenuButton();
	attachCardUiEvents();
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
	renderPanel();

	const menuWatcher = window.setInterval(() => {
		if (ensureMenuButton()) {
			window.clearInterval(menuWatcher);
		}
	}, 1000);

	const appReadyEvent = context.eventTypes?.APP_READY ?? context.event_types?.APP_READY;
	if (appReadyEvent && context.eventSource) {
		context.eventSource.on(appReadyEvent, () => {
			logInfo('APP_READY received; refreshing narrator helper state.');
			ensureMenuButton();
			renderPanel();
			scheduleCardUiRefresh();
			void syncNarratorPrompt().catch((error) => logError('failed to sync narrator prompt after APP_READY.', error));
		});
	} else {
		logWarn('APP_READY hook was not registered because event source or event type map is unavailable.');
	}
}

void bootstrap();

export { bootstrap as init, narratorHelperGenerateInterceptor };
