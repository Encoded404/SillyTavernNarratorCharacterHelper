# SillyTavern Extension Development Guide

A comprehensive guide based on real-world extension development experience, covering implementation details, common problems, data structures, and best practices.

---

## Table of Contents

1. [Project Structure & Build System](#1-project-structure--build-system)
2. [Module Imports & Webpack Configuration](#2-module-imports--webpack-configuration)
3. [SillyTavern Runtime Context](#3-sillytavern-runtime-context)
4. [Data Storage Locations](#4-data-storage-locations)
5. [Event System](#5-event-system)
6. [Character & Group Data](#6-character--group-data)
7. [World Info / Lorebook System](#7-world-info--lorebook-system)
8. [Extension Prompts](#8-extension-prompts)
9. [Settings & Persistence](#9-settings--persistence)
10. [UI Injection Patterns](#10-ui-injection-patterns)
11. [Slash Commands](#11-slash-commands)
12. [Common Problems & Solutions](#12-common-problems--solutions)
13. [Best Practices Checklist](#13-best-practices-checklist)

---

## 1. Project Structure & Build System

### Basic Structure

```
your-extension/
├── src/
│   ├── index.ts          # Main entry point
│   ├── style.css         # Styles (optional)
│   └── *.html            # Templates (optional)
├── dist/                  # Built output (gitignore this)
├── manifest.json          # Extension metadata
├── webpack.config.js      # Build configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies
```

### Webpack Configuration for SillyTavern

```javascript
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TerserPlugin from 'terser-webpack-plugin';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

export default {
    entry: path.join(__dirname, 'src/index.ts'),
    output: {
        path: path.join(__dirname, 'dist/'),
        filename: 'index.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.html$/,
                use: { loader: 'html-loader' },
            },
        ],
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: { comments: false },
                },
            }),
        ],
    },
    // CRITICAL: Enable ES module output for SillyTavern compatibility
    experiments: {
        outputModule: true,
    },
    // CRITICAL: Use ES module externals for SillyTavern imports
    externalsType: 'module',
    externals: {
        '../../../../scripts/world-info.js': '../../../../scripts/world-info.js',
        '../../../../script.js': '../../../../script.js',
        '../../../../scripts/extensions.js': '../../../../scripts/extensions.js',
        '../../../../scripts/utils.js': '../../../../scripts/utils.js',
        '../../../../scripts/group-chats.js': '../../../../scripts/group-chats.js',
        '../../../../scripts/characters.js': '../../../../scripts/characters.js',
    },
};
```

> **TL;DR:** You MUST have `experiments.outputModule: true` and `externalsType: 'module'` for SillyTavern extensions. Without these, your imports will fail at runtime.

### TypeScript Configuration

```json
{
    "compilerOptions": {
        "target": "ES6",
        "module": "ESNext",
        "moduleResolution": "Bundler",
        "outDir": "./out",
        "strict": true,
        "esModuleInterop": true,
        "sourceMap": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": ["src/**/*.ts", "src/**/*.tsx", "globals.d.ts"],
    "exclude": ["node_modules", "dist", "bin"]
}
```

### Manifest.json Structure

```json
{
    "display_name": "Your Extension Name",
    "loading_order": 10,
    "description": "What your extension does",
    "author": "Your Name",
    "version": "1.0.0",
    "home_page": "https://github.com/your/repo",
    "help_page": "https://github.com/your/repo/wiki",
    "auto_update": true,
    "requires": [],
    "optional": [],
    "js": "dist/index.js",
    "css": "dist/style.css",
    "placeholder": false,
    "shadow": false,
    "world_info_extensions": ["your-extension-key"]
}
```

> **TL;DR:** The `js` field must point to your built `dist/index.js`. Set `loading_order` appropriately (lower = loads earlier). `world_info_extensions` registers your extension as a WI provider.

---

## 2. Module Imports & Webpack Configuration

### Importing SillyTavern Modules

SillyTavern modules are resolved at runtime through the extension loader. Use `@ts-ignore` comments to suppress TypeScript errors:

```typescript
// @ts-ignore - SillyTavern modules resolved at runtime via webpack externals
import { world_info, charSetAuxWorlds } from '../../../../scripts/world-info.js';
// @ts-ignore
import { saveSettingsDebounced, eventSource, event_types, characters, selected_group, groups } from '../../../../script.js';
// @ts-ignore
import { getContext } from '../../../../scripts/extensions.js';
// @ts-ignore
import { getCharaFilename } from '../../../../scripts/utils.js';
// @ts-ignore
import { Popup, POPUP_TYPE, POPUP_RESULT } from '../../../../scripts/popup.js';
```

### Key Module Exports

#### `../../../../scripts/world-info.js`
| Export | Type | Description |
|--------|------|-------------|
| `world_info` | `object` | Main world info state object containing `charLore`, `globalSelect`, etc. |
| `charSetAuxWorlds(fileName, books)` | `function` | Sets auxiliary lorebooks for a character |
| `charUpdateAddAuxWorld(characterKey, names)` | `function` | Adds auxiliary lorebooks to a character |
| `charUpdatePrimaryWorld(name)` | `function` | Sets primary lorebook for current character |
| `getWorldInfoPrompt()` | `function` | Generates WI prompt for current context |
| `loadWorldInfo(name)` | `function` | Loads a world info file by name |
| `saveWorldInfo(name, data)` | `function` | Saves a world info file |

#### `../../../../script.js`
| Export | Type | Description |
|--------|------|-------------|
| `eventSource` | `object` | Event emitter/listener system |
| `event_types` | `object` | Event name constants |
| `saveSettingsDebounced()` | `function` | Debounced settings save |
| `characters` | `array` | All character records |
| `groups` | `array` | All group records |
| `selected_group` | `string` | Current group ID |
| `this_chid` | `number` | Current character index |
| `name1` | `string` | User name |
| `name2` | `string` | Current character name |
| `extension_prompts` | `object` | Extension prompt storage |
| `setExtensionPrompt()` | `function` | Set extension prompt |

#### `../../../../scripts/extensions.js`
| Export | Type | Description |
|--------|------|-------------|
| `getContext()` | `function` | Returns full runtime context object |
| `extension_settings` | `object` | All extension settings storage |
| `saveMetadataDebounced()` | `function` | Save character/group metadata |

#### `../../../../scripts/utils.js`
| Export | Type | Description |
|--------|------|-------------|
| `getCharaFilename(chId, options)` | `function` | Get character filename/avatar key |
| `debounce(fn, delay)` | `function` | Debounce utility |
| `uuidv4()` | `function` | Generate UUID |
| `escapeHtml(text)` | `function` | HTML escape utility |

> **TL;DR:** Always use `@ts-ignore` for SillyTavern imports. The externals in webpack.config.js handle runtime resolution. Import from `extensions.js` to get `getContext()` which provides the most complete API access.

---

## 3. SillyTavern Runtime Context

### Getting Context

```typescript
import { getContext } from '../../../../scripts/extensions.js';

const context = getContext();
```

### Context Properties

```typescript
type RuntimeContext = {
    // Character/Group State
    characters: CharacterRecord[];
    groups: GroupRecord[];
    characterId: number | string;      // Current character index
    groupId: string | null;            // Current group ID
    chatId: string;                    // Current chat ID
    
    // Names
    name1: string;                     // User name
    name2: string;                     // Character name
    
    // Settings
    saveSettingsDebounced: () => void;
    saveMetadataDebounced: () => void;
    maxContext: number;
    
    // Events
    eventSource: {
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        emit: (event: string, ...args: unknown[]) => Promise<void>;
    };
    eventTypes: Record<string, string>;
    
    // Extension System
    setExtensionPrompt: (
        name: string,
        prompt: string,
        position: number,
        depth: number,
        scan: boolean,
        role: number
    ) => void;
    writeExtensionField: (
        characterId: number,
        key: string,
        value: unknown
    ) => Promise<void>;
    
    // Generation
    generate: () => Promise<void>;
    sendGenerationRequest: () => Promise<void>;
    stopGeneration: () => void;
    
    // Chat Manipulation
    addOneMessage: (message: object) => void;
    deleteMessage: (index: number) => void;
    deleteLastMessage: () => void;
    
    // Slash Commands
    SlashCommandParser: typeof SlashCommandParser;
    SlashCommand: typeof SlashCommand;
    SlashCommandArgument: typeof SlashCommandArgument;
    SlashCommandNamedArgument: typeof SlashCommandNamedArgument;
    SlashCommandEnumValue: typeof SlashCommandEnumValue;
    ARGUMENT_TYPE: Record<string, string>;
    commonEnumProviders: Record<string, Function>;
    
    // Popup System
    Popup: typeof Popup;
    POPUP_TYPE: Record<string, number>;
    POPUP_RESULT: Record<string, string>;
    callGenericPopup: Function;
    
    // Utilities
    t: (key: string) => string;        // Translation
    translate: Function;
    getCurrentLocale: () => string;
    renderExtensionTemplateAsync: Function;
    
    // Tokenizers
    tokenizers: Record<string, object>;
    getTokenCountAsync: (text: string, model: string) => Promise<number>;
    
    // API
    mainApi: string;                   // Current API type
    extensionSettings: object;         // Extension settings namespace
    getRequestHeaders: () => object;
    
    // Character Operations
    getCharacters: () => CharacterRecord[];
    getOneCharacter: (index: number) => CharacterRecord;
    selectCharacterById: (id: number) => void;
    
    // Group Operations
    unshallowGroupMembers: (groupId: string) => Promise<void>;
    
    // World Info
    loadWorldInfo: (name: string) => Promise<WorldInfoFile>;
    
    // Constants
    constants: {
        unset: string;                 // Value to clear extension fields
    };
    
    // Notifications
    toastr: {
        warning: (msg: string, title?: string) => void;
        success: (msg: string, title?: string) => void;
        info: (msg: string, title?: string) => void;
        error: (msg: string, title?: string) => void;
    };
};
```

> **TL;DR:** `getContext()` is your primary API access point. It provides everything you need: characters, groups, events, settings, generation controls, and utilities. Cache this reference early in your extension initialization.

---

## 4. Data Storage Locations

### Extension Settings (Global)

```typescript
// Access via extension_settings object
import { extension_settings } from '../../../../scripts/extensions.js';

// Your extension's settings namespace
const settings = extension_settings['your_extension_key'] ?? {};

// Save settings (debounced)
const context = getContext();
context.saveSettingsDebounced();
```

**Storage Location:** `public/settings.json` under `extension_settings.your_extension_key`

### Character Extension Fields (Per-Character)

```typescript
// Write to character's extension data
await context.writeExtensionField(characterId, 'your_extension_key', {
    enabled: true,
    customData: 'value',
});

// Read from character's extension data
const character = characters[characterId];
const extensionData = character.data?.extensions?.your_extension_key;
```

**Storage Location:** Character JSON file under `data.extensions.your_extension_key`

### World Info / Lorebook State

```typescript
import { world_info } from '../../../../scripts/world-info.js';

// View current state
const charLore = world_info.charLore;  // Character auxiliary lorebooks
const globalSelect = world_info.globalSelect;  // Globally selected lorebooks

// Modify state (then save)
world_info.charLore.push({ name: 'character.png', extraBooks: ['lore1', 'lore2'] });
saveSettingsDebounced();
```

**Storage Location:** `public/settings.json` under `world_info` object

### Chat Metadata

```typescript
// Save chat-specific data
await context.saveMetadataDebounced();

// Access current chat metadata
const context = getContext();
const chatMetadata = context.chatMetadata;
```

**Storage Location:** Chat file metadata section

### Character Data Structure

```typescript
type CharacterRecord = {
    avatar: string;           // Filename (e.g., "character.png")
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
        // ... duplicate of above for newer format
        extensions?: {
            world?: string;           // Primary lorebook name
            your_extension_key?: any; // Your extension's data
        };
        character_book?: WorldInfoBook;  // Embedded character book
    };
    chat?: string;            // Current chat file ID
    json_data?: string;       // Raw JSON if loaded from file
};
```

> **TL;DR:** Use `extension_settings` for global settings, `writeExtensionField` for per-character data, and `world_info` for lorebook configuration. Always call `saveSettingsDebounced()` after modifying `world_info`.

---

## 5. Event System

### Event Types Reference

```typescript
import { event_types } from '../../../../script.js';

// Common Event Types
const events = {
    // App Lifecycle
    APP_READY: 'app_ready',
    
    // Character Events
    CHARACTER_EDITED: 'character_edit',
    CHARACTER_PAGE_LOADED: 'character_page_loaded',
    CHARACTER_DELETED: 'character_deleted',
    CHARACTER_LOADED: 'character_loaded',
    
    // Group Events
    GROUP_CHAT_CREATED: 'group_chat_created',
    GROUP_CHAT_DELETED: 'group_chat_deleted',
    GROUP_MEMBER_DRAFTED: 'group_member_drafted',  // Speaker selected in group
    GROUP_WRAPPER_STARTED: 'group_wrapper_started',
    GROUP_WRAPPER_FINISHED: 'group_wrapper_finished',
    
    // Generation Events
    GENERATION_STARTED: 'generation_started',
    GENERATION_ENDED: 'generation_ended',
    GENERATION_AFTER_DATA: 'generate_after_data',
    GENERATION_AFTER_COMMANDS: 'generation_after_commands',
    GENERATE_BEFORE_COMBINE_PROMPTS: 'generate_before_combine_prompts',
    GENERATE_AFTER_COMBINE_PROMPTS: 'generate_after_combine_prompts',
    CHAT_COMPLETION_PROMPT_READY: 'chat_completion_prompt_ready',
    
    // Chat Events
    CHAT_CHANGED: 'chat_changed',
    MESSAGE_SENT: 'message_sent',
    MESSAGE_DELETED: 'message_deleted',
    
    // World Info Events
    WORLDINFO_ENTRIES_LOADED: 'worldinfo_entries_loaded',
    WORLDINFO_SCAN_DONE: 'worldinfo_scan_done',
    WORLD_INFO_ACTIVATED: 'world_info_activated',
    WORLDINFO_SETTINGS_UPDATED: 'worldinfo_settings_updated',
    
    // Extension Events
    EXTENSION_SETTINGS_UPDATED: 'extension_settings_updated',
};
```

### Registering Event Handlers

```typescript
function registerEventHandlers(): void {
    const context = getContext();
    const { eventSource, eventTypes } = context;
    
    if (!eventSource || !eventTypes) {
        console.error('Event system not available');
        return;
    }
    
    // Single event
    eventSource.on(eventTypes.CHAT_CHANGED, () => {
        console.log('Chat changed');
    });
    
    // Multiple events
    const watchedEvents = [
        eventTypes.APP_READY,
        eventTypes.CHAT_CHANGED,
        eventTypes.CHARACTER_EDITED,
    ].filter(Boolean) as string[];
    
    for (const eventName of watchedEvents) {
        eventSource.on(eventName, () => {
            // Handle event
        });
    }
    
    // Event with arguments
    eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, (...args: unknown[]) => {
        const chId = args[0] as number;  // Character index
        console.log(`Group member drafted: ${chId}`);
    });
    
    // World Info events with data
    eventSource.on(eventTypes.WORLDINFO_ENTRIES_LOADED, (...args: unknown[]) => {
        const data = args[0] as {
            globalLore: Entry[];
            characterLore: Entry[];
            chatLore: Entry[];
            personaLore: Entry[];
        };
        console.log('WI entries loaded:', data);
    });
    
    eventSource.on(eventTypes.WORLD_INFO_ACTIVATED, (...args: unknown[]) => {
        const entries = args[0] as Array<{
            world?: string;
            uid?: string | number;
            comment?: string;
            content?: string;
        }>;
        console.log('Activated entries:', entries);
    });
}
```

### Emitting Custom Events

```typescript
// Emit your own events for other extensions
await eventSource.emit('your_extension_custom_event', {
    data: 'value',
    timestamp: Date.now(),
});
```

> **TL;DR:** Use `eventSource.on()` to listen and `eventSource.emit()` to broadcast. Key events for extensions: `GENERATION_STARTED`, `GENERATION_AFTER_DATA`, `GROUP_MEMBER_DRAFTED`, `WORLD_INFO_ACTIVATED`. Event arguments vary by event type - check SillyTavern source for specifics.

---

## 6. Character & Group Data

### Getting Characters

```typescript
const context = getContext();

// All characters
const allCharacters = context.characters ?? getContext().getCharacters();

// Current character
const currentCharId = context.characterId;  // or context.this_chid
const currentCharacter = allCharacters[currentCharId as number];

// Find character by avatar/name
const findByAvatar = (avatar: string) => 
    allCharacters.find(c => c.avatar === avatar);

const findByName = (name: string) => 
    allCharacters.find(c => c.name === name);
```

### Getting Groups

```typescript
const context = getContext();

// All groups
const allGroups = context.groups ?? [];

// Current group
const currentGroupId = context.groupId;  // or selected_group
const currentGroup = allGroups.find(g => g.id === currentGroupId);

// Group members
if (currentGroup) {
    const memberAvatars = currentGroup.members;
    const disabledAvatars = currentGroup.disabled_members;
    
    // Get full character records
    const members = memberAvatars
        .filter(avatar => !disabledAvatars.includes(avatar))
        .map(avatar => findByAvatar(avatar))
        .filter(Boolean);
}
```

### Group Member Drafting (Critical for Group Chats)

```typescript
// In group chats, the "current speaker" changes with each message
// Listen for GROUP_MEMBER_DRAFTED to know who's speaking

eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, (...args: unknown[]) => {
    const chId = args[0] as number;
    const characters = getContext().characters;
    const speaker = characters[chId];
    
    console.log(`Current speaker: ${speaker?.name}`);
    
    // This is where you should handle per-generation logic for groups
    // NOT in GENERATION_STARTED for group chats
});
```

### Character Filename Utility

```typescript
import { getCharaFilename } from '../../../../scripts/utils.js';

// Get filename for current character
const fileName = getCharaFilename(null);

// Get filename for specific character
const fileName = getCharaFilename(characterIndex);

// Get filename by avatar key
const fileName = getCharaFilename(null, { manualAvatarKey: 'character.png' });

// This strips the extension: "character.png" -> "character"
```

> **TL;DR:** For group chats, ALWAYS use `GROUP_MEMBER_DRAFTED` event to identify the current speaker, not `context.characterId`. The `this_chid` / `characterId` is unreliable in group contexts. Use `getCharaFilename()` for consistent character key generation.

---

## 7. World Info / Lorebook System

### World Info Data Structure

```typescript
import { world_info } from '../../../../scripts/world-info.js';

type WorldInfoState = {
    globalSelect: string[];      // Globally selected lorebook names
    charLore: CharLoreSetting[]; // Per-character auxiliary lorebooks
};

type CharLoreSetting = {
    name: string;        // Character filename WITHOUT extension (e.g., "character")
    extraBooks?: string[]; // Additional lorebook names
};
```

### Native Lorebook Modification API

```typescript
import { 
    world_info, 
    charSetAuxWorlds,
    charUpdateAddAuxWorld,
    charUpdatePrimaryWorld 
} from '../../../../scripts/world-info.js';
import { saveSettingsDebounced } from '../../../../script.js';

// SET auxiliary lorebooks (replaces existing)
charSetAuxWorlds('character', ['lore1', 'lore2', 'lore3']);

// ADD auxiliary lorebooks (appends to existing)
charUpdateAddAuxWorld('character', ['lore4']);

// SET primary lorebook
charUpdatePrimaryWorld('main-lorebook');

// Manual modification (use native functions above when possible)
const charLoreKey = 'character';  // filename without extension
const existing = world_info.charLore?.find(e => e.name === charLoreKey);

if (existing) {
    existing.extraBooks = ['lore1', 'lore2'];
} else {
    world_info.charLore?.push({
        name: charLoreKey,
        extraBooks: ['lore1', 'lore2'],
    });
}

// CRITICAL: Must call after modifying world_info
saveSettingsDebounced();
```

### Reading Character Lorebooks

```typescript
// Get all lorebooks for a character
function getCharacterLorebooks(avatar: string): string[] {
    const lorebooks: string[] = [];
    const character = findByAvatar(avatar);
    
    // Primary lorebook
    if (character?.data?.extensions?.world) {
        lorebooks.push(character.data.extensions.world);
    }
    
    // Auxiliary lorebooks
    const charLoreKey = avatar.replace(/\.[^/.]+$/, '');
    const charExtra = world_info.charLore?.find(e => e.name === charLoreKey);
    if (charExtra?.extraBooks) {
        lorebooks.push(...charExtra.extraBooks);
    }
    
    return lorebooks;
}
```

### Loading Lorebook Content

```typescript
import { loadWorldInfo } from '../../../../scripts/world-info.js';

// Load a lorebook file
const lorebook = await loadWorldInfo('my-lorebook');

// Lorebook structure
type WorldInfoFile = {
    name?: string;
    entries?: Record<string, WorldInfoEntry> | WorldInfoEntry[];
};

type WorldInfoEntry = {
    uid?: string | number;
    key?: string[];
    keys?: string[];
    secondary_keys?: string[];
    content?: string;
    comment?: string;
    constant?: boolean;
    selective?: boolean;
    insertion_order?: number;
    enabled?: boolean;
    position?: string | number;  // 'before', 'after', 'depth'
    extensions?: Record<string, unknown>;
};
```

### Timing for Lorebook Injection

```typescript
// CORRECT: Save/restore around generation
eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, (...args) => {
    const chId = args[0] as number;
    // Save current state
    saveOriginalLorebooks();
    // Inject temporary lorebooks
    injectTemporaryLorebooks();
});

eventSource.on(eventTypes.GENERATE_AFTER_DATA, () => {
    // Restore original state AFTER generation completes
    restoreOriginalLorebooks();
});

// WRONG: Don't modify lorebooks in these events
// - GENERATION_STARTED (too late for group chats)
// - CHAT_COMPLETION_PROMPT_READY (prompt already built)
```

> **TL;DR:** Use `charSetAuxWorlds()` and `charUpdateAddAuxWorld()` instead of manually modifying `world_info.charLore`. Always call `saveSettingsDebounced()` after changes. For temporary modifications: save state in `GROUP_MEMBER_DRAFTED`, restore in `GENERATE_AFTER_DATA`. Character lorebook keys are filenames WITHOUT extension.

---

## 8. Extension Prompts

### Setting Extension Prompts

```typescript
const context = getContext();

context.setExtensionPrompt(
    'your_extension_module_name',  // Unique module identifier
    'Prompt content here',         // The actual prompt text
    0,                             // Position: 0=after, 1=in-chat, 2=before
    4,                             // Depth (for in-chat position)
    false,                         // Scan for WI keywords
    0                              // Role: 0=system, 1=assistant, 2=user
);
```

### Prompt Position Values

| Value | Name | Description |
|-------|------|-------------|
| `0` | `AFTER_MAIN_PROMPT` | After main character/scene prompt |
| `1` | `IN_CHAT` | Inside chat history at specified depth |
| `2` | `BEFORE_MAIN_PROMPT` | Before main prompt (highest priority) |

### Prompt Depth

- Only applies when position = `1` (IN_CHAT)
- Controls how far back in chat history the prompt is inserted
- `0` = most recent, higher = further back
- Typical values: `2-4`

### Prompt Role

| Value | Role | Use Case |
|-------|------|----------|
| `0` | System | Instructions, character definitions |
| `1` | Assistant | Example responses |
| `2` | User | Example user inputs |

### Removing Extension Prompts

```typescript
// Set empty prompt to effectively remove
context.setExtensionPrompt('your_module', '', 0, 0, false, 0);

// Or use the unset constant if available
const unsetValue = context.constants?.unset ?? '__@@UNSET@@__';
context.setExtensionPrompt('your_module', unsetValue, 0, 0, false, 0);
```

### Best Practices

```typescript
// Use unique module names to avoid conflicts
const MODULE_BRIEFING = 'your_extension_briefing';
const MODULE_ROSTER = 'your_extension_roster';
const MODULE_DOSSIERS = 'your_extension_dossiers';

// Group related prompts
function syncPrompts(): void {
    const context = getContext();
    const settings = getSettings();
    
    context.setExtensionPrompt(MODULE_BRIEFING, buildBriefing(), settings.position, settings.depth, false, 0);
    context.setExtensionPrompt(MODULE_ROSTER, buildRoster(), settings.position, settings.depth, false, 0);
    context.setExtensionPrompt(MODULE_DOSSIERS, buildDossiers(), settings.position, settings.depth, false, 0);
}

// Debounce prompt updates to avoid excessive regeneration
const syncPromptsDebounced = debounce(syncPrompts, 50);
```

> **TL;DR:** Use `setExtensionPrompt(name, content, position, depth, scan, role)`. Position `0` = after main prompt, `2` = before. Use unique module names. Debounce updates. Set empty string to remove prompts.

---

## 9. Settings & Persistence

### Extension Settings Structure

```typescript
// Global extension settings namespace
import { extension_settings } from '../../../../scripts/extensions.js';

type YourExtensionSettings = {
    enabled: boolean;
    customOption1: string;
    customOption2: number;
    // ... your settings
};

// Get settings with defaults
function getSettings(): YourExtensionSettings {
    const defaults: YourExtensionSettings = {
        enabled: false,
        customOption1: 'default',
        customOption2: 42,
    };
    
    const stored = extension_settings['your_extension_key'] as Partial<YourExtensionSettings> | undefined;
    return { ...defaults, ...stored };
}

// Save settings
function saveSettings(settings: YourExtensionSettings): void {
    extension_settings['your_extension_key'] = settings;
    getContext().saveSettingsDebounced();
}
```

### Per-Character Extension Data

```typescript
// Store data specific to a character
async function saveCharacterData(
    characterId: number,
    data: YourCharacterData
): Promise<void> {
    const context = getContext();
    await context.writeExtensionField(characterId, 'your_extension_key', data);
}

// Read character-specific data
function getCharacterData(characterId: number): YourCharacterData | null {
    const characters = getContext().characters;
    const character = characters[characterId];
    return character?.data?.extensions?.your_extension_key ?? null;
}

// Clear character data
async function clearCharacterData(characterId: number): Promise<void> {
    const context = getContext();
    const unsetValue = context.constants?.unset ?? '__@@UNSET@@__';
    await context.writeExtensionField(characterId, 'your_extension_key', unsetValue);
}
```

### Settings UI Pattern

```typescript
function injectSettingsUI(): void {
    const container = document.getElementById('extensions_settings2') 
        ?? document.getElementById('extensions_settings');
    
    if (!container || document.getElementById('your-extension-settings')) {
        return;
    }
    
    const settings = getSettings();
    
    const html = `
        <div id="your-extension-settings" class="your-extension-settings">
            <div class="inline-drawer">
                <div class="inline-drawer-toggle inline-drawer-header">
                    <b>Your Extension</b>
                    <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                </div>
                <div class="inline-drawer-content">
                    <label>
                        Enable Feature
                        <input type="checkbox" ${settings.enabled ? 'checked' : ''} 
                               data-setting="enabled" />
                    </label>
                    <label>
                        Custom Option
                        <input type="text" class="text_pole" 
                               value="${escapeHtml(settings.customOption1)}"
                               data-setting="customOption1" />
                    </label>
                </div>
            </div>
        </div>
    `;
    
    container.appendChild(document.createRange().createContextualFragment(html));
    
    // Attach event listeners
    container.querySelectorAll('[data-setting]').forEach(el => {
        el.addEventListener('change', () => {
            const setting = (el as HTMLElement).dataset.setting!;
            const value = el instanceof HTMLInputElement 
                ? (el.type === 'checkbox' ? el.checked : el.value)
                : el.value;
            
            settings[setting as keyof YourExtensionSettings] = value as never;
            saveSettings(settings);
        });
    });
}
```

### Debounced Saves

```typescript
import { debounce } from '../../../../scripts/utils.js';

// Create debounced save function
const saveSettingsDebounced = debounce((settings: YourExtensionSettings) => {
    extension_settings['your_extension_key'] = settings;
    getContext().saveSettingsDebounced();
}, 500);

// Use in UI event handlers
input.addEventListener('input', (e) => {
    settings.customOption1 = (e.target as HTMLInputElement).value;
    saveSettingsDebounced(settings);
});
```

> **TL;DR:** Store global settings in `extension_settings['your_key']`. Store per-character data with `writeExtensionField()`. Always call `saveSettingsDebounced()` after modifications. Use `constants.unset` or `'__@@UNSET@@__'` to clear character data.

---

## 10. UI Injection Patterns

### Character Panel Button

```typescript
function injectCharacterPanelButton(): void {
    const buttonRow = document.querySelector('.form_create_bottom_buttons_block.buttons_block');
    
    if (!buttonRow || buttonRow.querySelector('#your-extension-btn')) {
        return;
    }
    
    const btn = document.createElement('div');
    btn.id = 'your-extension-btn';
    btn.className = 'menu_button menu_button_icon';
    btn.setAttribute('title', 'Open Your Extension');
    btn.innerHTML = '<i class="fa-fw fa-solid fa-icon-name"></i><span>Your Extension</span>';
    btn.addEventListener('click', () => {
        const characterId = getCurrentCharacterId();
        if (characterId !== undefined) {
            openYourModal(characterId);
        } else {
            getContext().toastr?.warning('No character selected', 'Your Extension');
        }
    });
    
    buttonRow.appendChild(btn);
}

// Listen for panel open events
eventSource.on(eventTypes.CHARACTER_EDITED, () => {
    setTimeout(injectCharacterPanelButton, 200);
});

eventSource.on(eventTypes.CHARACTER_PAGE_LOADED, () => {
    setTimeout(injectCharacterPanelButton, 300);
});
```

### Using SillyTavern's Popup System

```typescript
import { Popup, POPUP_TYPE, POPUP_RESULT } from '../../../../scripts/popup.js';

function openYourModal(characterId: number): void {
    const context = getContext();
    const { Popup, POPUP_TYPE, POPUP_RESULT } = context;
    
    if (!Popup || !POPUP_TYPE || !POPUP_RESULT) {
        return;
    }
    
    const content = buildModalContent(characterId);
    
    const popup = new Popup(
        content,
        POPUP_TYPE.TEXT,
        '',
        {
            wide: true,
            large: true,
            okButton: 'Save & Close',
            cancelButton: 'Cancel',
            allowVerticalScrolling: true,
        }
    );
    
    popup.show().then((result: unknown) => {
        if (result === POPUP_RESULT.AFFIRMATIVE) {
            // User clicked OK/Save
            saveModalData(characterId);
        }
        // User clicked Cancel or closed modal
    });
}
```

### Modal Content Template

```typescript
function buildModalContent(characterId: number): string {
    const character = getContext().characters[characterId];
    const data = getCharacterData(characterId);
    
    return `
        <div class="your-extension-modal">
            <div class="your-extension-modal__header">
                <h3><i class="fa-solid fa-icon"></i> Settings for ${character.name}</h3>
            </div>
            
            <label class="checkbox_label">
                <input id="your-enabled" type="checkbox" ${data?.enabled ? 'checked' : ''} />
                <span>Enable for this character</span>
            </label>
            
            <div class="your-extension-modal__section">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Advanced Options</b>
                        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <label>
                            Custom Value
                            <input id="your-custom" class="text_pole" type="text" 
                                   value="${escapeHtml(data?.custom ?? '')}" />
                        </label>
                    </div>
                </div>
            </div>
            
            <div class="your-extension-modal__actions">
                <button id="your-preview-btn" class="menu_button" type="button">
                    Preview
                </button>
            </div>
        </div>
    `;
}
```

### Getting Current Character ID

```typescript
function getCurrentCharacterId(): number | undefined {
    const context = getContext();
    
    // Try characterId first
    if (typeof context.characterId === 'number') {
        return context.characterId;
    }
    
    // Try parsing string
    if (typeof context.characterId === 'string') {
        const parsed = Number(context.characterId);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    
    // Fallback to this_chid
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
```

### DOM Element Queries

```typescript
// Get edited character from panel DOM
function getEditedCharacterFromPanel(): number | undefined {
    const characters = getContext().characters;
    
    // Method 1: create_button_id input
    const createButtonId = (document.getElementById('create_button_id') as HTMLInputElement)?.value;
    if (createButtonId) {
        const index = characters.findIndex(c => c.avatar === createButtonId);
        if (index !== -1) return index;
    }
    
    // Method 2: Avatar image
    const avatarImg = document.querySelector<HTMLImageElement>('#avatar_div img');
    if (avatarImg?.src) {
        const avatarName = avatarImg.src.split('/').pop();
        if (avatarName) {
            const index = characters.findIndex(c => 
                c.avatar === avatarName || c.avatar === decodeURIComponent(avatarName)
            );
            if (index !== -1) return index;
        }
    }
    
    // Method 3: Name input
    const nameInput = (document.getElementById('character_name_pole') as HTMLInputElement | null)
        ?? (document.getElementById('rm_character_name') as HTMLInputElement | null);
    if (nameInput?.value) {
        const charName = nameInput.value.trim();
        const index = characters.findIndex(c => c.name === charName);
        if (index !== -1) return index;
    }
    
    return undefined;
}
```

> **TL;DR:** Inject buttons into `.form_create_bottom_buttons_block.buttons_block`. Use `Popup` class from `popup.js` for modals. Listen for `CHARACTER_EDITED` and `CHARACTER_PAGE_LOADED` to inject UI. Get character ID from `context.characterId`, `context.this_chid`, or panel DOM elements.

---

## 11. Slash Commands

### Registering a Slash Command

```typescript
import { SlashCommandParser } from '../../../../scripts/slash-commands/SlashCommandParser.js';
import { SlashCommand } from '../../../../scripts/slash-commands/SlashCommand.js';
import { 
    ARGUMENT_TYPE, 
    SlashCommandArgument, 
    SlashCommandNamedArgument 
} from '../../../../scripts/slash-commands/SlashCommandArgument.js';
import { SlashCommandEnumValue, enumTypes } from '../../../../scripts/slash-commands/SlashCommandEnumValue.js';
import { commonEnumProviders, enumIcons } from '../../../../scripts/slash-commands/SlashCommandCommonEnumsProvider.js';

async function registerSlashCommand(): Promise<void> {
    const context = getContext();
    const { 
        SlashCommandParser, 
        SlashCommand, 
        SlashCommandNamedArgument, 
        SlashCommandArgument,
        SlashCommandEnumValue,
        ARGUMENT_TYPE,
        commonEnumProviders,
        enumTypes 
    } = context;
    
    if (!SlashCommandParser || !SlashCommand || !SlashCommandNamedArgument) {
        return;
    }
    
    // Helper to create enum values
    const toEnumValue = (value: string, description?: string) => 
        new SlashCommandEnumValue(value, description ?? null, enumTypes.enum);
    
    SlashCommandParser.addCommandObject(SlashCommand.fromProps({
        name: 'yourcommand',
        aliases: ['yc', 'your-cmd'],
        returns: 'Description of what this returns',
        callback: async (args: Record<string, unknown>) => {
            const action = String(args.action ?? 'status').trim().toLowerCase();
            const charArg = String(args.char ?? '').trim();
            
            // Command logic here
            if (action === 'status') {
                return 'Current status information';
            }
            
            if (action === 'enable') {
                // Enable logic
                return 'Enabled successfully';
            }
            
            return 'Unknown action';
        },
        namedArgumentList: [
            SlashCommandNamedArgument.fromProps({
                name: 'action',
                description: 'What action to perform',
                typeList: [ARGUMENT_TYPE.STRING],
                defaultValue: 'status',
                enumList: [
                    toEnumValue('status', 'Show current status'),
                    toEnumValue('enable', 'Enable the feature'),
                    toEnumValue('disable', 'Disable the feature'),
                    toEnumValue('toggle', 'Toggle on/off'),
                ],
            }),
            SlashCommandNamedArgument.fromProps({
                name: 'char',
                description: 'Character name. Defaults to current character.',
                typeList: [ARGUMENT_TYPE.STRING],
                enumProvider: commonEnumProviders.characters('character'),
            }),
        ],
        helpString: `
            <div>
                <b>/${'yourcommand'}</b> - Description of your command
            </div>
            <div>
                <strong>Examples</strong>
                <ul>
                    <li><code>/${'yourcommand'} action=enable char="Character Name"</code></li>
                    <li><code>/${'yourcommand'} action=status</code></li>
                </ul>
            </div>
        `,
    }));
}
```

### Argument Types

```typescript
const ARGUMENT_TYPE = {
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    OBJECT: 'object',
};
```

### Common Enum Providers

```typescript
// Available character names
commonEnumProviders.characters('character')

// Available group names  
commonEnumProviders.groups()

// Available lorebooks
commonEnumProviders.worldInfo()

// Available personas
commonEnumProviders.personas()

// Available chats for current character
commonEnumProviders.chats()
```

### Using Arguments in Callback

```typescript
callback: async (args: Record<string, unknown>) => {
    // Named arguments
    const action = args.action as string;
    const charName = args.char as string;
    
    // Get character from argument
    const characters = getContext().characters;
    const targetCharacter = charName 
        ? characters.find(c => c.name === charName || c.avatar === charName)
        : characters[getContext().characterId as number];
    
    if (!targetCharacter) {
        getContext().toastr?.warning('Character not found', 'Your Extension');
        return '';
    }
    
    // Your logic here
    return `Action ${action} completed for ${targetCharacter.name}`;
}
```

> **TL;DR:** Use `SlashCommandParser.addCommandObject()` to register. Define `namedArgumentList` with types and enums. Use `commonEnumProviders` for character/group/lorebook selectors. Return strings from callbacks for user feedback. Use `toastr` for errors.

---

## 12. Common Problems & Solutions

### Problem: Module Imports Fail at Runtime

**Symptoms:**
```
Error: Cannot find module '../../../../scripts/world-info.js'
```

**Solution:**
Ensure webpack.config.js has:
```javascript
experiments: {
    outputModule: true,
},
externalsType: 'module',
externals: {
    '../../../../scripts/world-info.js': '../../../../scripts/world-info.js',
    // ... other modules
},
```

And imports have `@ts-ignore`:
```typescript
// @ts-ignore
import { world_info } from '../../../../scripts/world-info.js';
```

---

### Problem: `world_info.charLore` is Undefined

**Symptoms:**
```
Cannot read properties of undefined (reading 'charLore')
```

**Cause:**
The `world_info` module hasn't been initialized yet, or you're accessing it before SillyTavern loads settings.

**Solution:**
```typescript
// Check if charLore exists before accessing
if (!world_info.charLore) {
    world_info.charLore = [];
}

// Or wait for WORLDINFO_ENTRIES_LOADED event
eventSource.on(eventTypes.WORLDINFO_ENTRIES_LOADED, () => {
    // Now safe to access world_info
    const lorebooks = world_info.charLore;
});
```

---

### Problem: Lorebook Changes Don't Persist

**Symptoms:**
Lorebooks revert after page reload or don't apply during generation.

**Cause:**
Missing `saveSettingsDebounced()` call after modifying `world_info`.

**Solution:**
```typescript
// WRONG - changes won't persist
world_info.charLore.push({ name: 'char', extraBooks: ['lore1'] });

// CORRECT - changes persist
world_info.charLore.push({ name: 'char', extraBooks: ['lore1'] });
saveSettingsDebounced();
```

---

### Problem: Group Chat Speaker Detection Fails

**Symptoms:**
Extension works in 1-on-1 chats but not group chats.

**Cause:**
Using `context.characterId` or `this_chid` which is unreliable in groups.

**Solution:**
```typescript
// WRONG for groups
const speaker = characters[context.characterId];

// CORRECT for groups
let speakerId: number | undefined;

eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, (...args) => {
    speakerId = args[0] as number;
    const speaker = characters[speakerId];
    // Handle speaker change
});
```

---

### Problem: Character Key Mismatch

**Symptoms:**
Lorebook associations don't work, charLore entries not found.

**Cause:**
Inconsistent character key format (with vs without extension).

**Solution:**
```typescript
// Use getCharaFilename for consistency
import { getCharaFilename } from '../../../../scripts/utils.js';

const charKey = getCharaFilename(null, { manualAvatarKey: 'character.png' });
// Returns: "character" (no extension)

// Or manually strip extension
const charKey = avatar.replace(/\.[^/.]+$/, '');

// charLore uses keys WITHOUT extension
world_info.charLore.find(e => e.name === 'character');  // NOT 'character.png'
```

---

### Problem: UI Doesn't Appear in Character Panel

**Symptoms:**
Button injection code runs but button doesn't show.

**Cause:**
Panel not fully loaded when injection runs.

**Solution:**
```typescript
// Add delay and retry
function injectButtonWithRetry(retries = 3): void {
    const buttonRow = document.querySelector('.form_create_bottom_buttons_block.buttons_block');
    
    if (!buttonRow) {
        if (retries > 0) {
            setTimeout(() => injectButtonWithRetry(retries - 1), 200);
        }
        return;
    }
    
    // Inject button
}

eventSource.on(eventTypes.CHARACTER_EDITED, () => {
    setTimeout(() => injectButtonWithRetry(), 200);
});
```

---

### Problem: Settings Don't Save

**Symptoms:**
Settings reset after page reload.

**Cause:**
Not calling `saveSettingsDebounced()` or wrong settings namespace.

**Solution:**
```typescript
// CORRECT pattern
function saveSettings(settings: YourSettings): void {
    extension_settings['your_extension_key'] = settings;
    getContext().saveSettingsDebounced();
}

// Verify manifest.json has matching key
{
    "js": "dist/index.js",
    // The key used in extension_settings should match your extension's internal name
}
```

---

### Problem: Extension Prompts Not Appearing

**Symptoms:**
`setExtensionPrompt()` called but prompts don't show in output.

**Cause:**
1. Module name collision with another extension
2. Position/depth configuration incorrect
3. Prompt being overwritten by regeneration

**Solution:**
```typescript
// Use unique module names
const MODULE_NAME = 'your_extension_unique_identifier';

// Verify prompt is set correctly
context.setExtensionPrompt(
    MODULE_NAME,
    'Your prompt content',
    0,      // Position: 0=after, 2=before main prompt
    4,      // Depth (only matters for position=1)
    false,  // Don't scan for WI
    0       // System role
);

// Debug: Check if prompt exists
const prompts = context.extensionPrompts;
console.log('Extension prompts:', prompts);
```

---

### Problem: Event Handlers Not Firing

**Symptoms:**
Registered events never trigger callback.

**Cause:**
1. Event name typo
2. Event system not initialized when handler registered
3. Wrong event for use case

**Solution:**
```typescript
// Verify event types are available
function registerEventHandlers(): void {
    const context = getContext();
    const { eventSource, eventTypes } = context;
    
    if (!eventSource || !eventTypes) {
        console.error('Event system not ready');
        return;
    }
    
    // Log available events for debugging
    console.log('Available events:', Object.keys(eventTypes));
    
    // Use exact event type from eventTypes object
    eventSource.on(eventTypes.GROUP_MEMBER_DRAFTED, handler);
    
    // NOT string literals that might be wrong
    // eventSource.on('group_member_drafted', handler);  // Risky!
}
```

---

### Problem: TypeScript Compilation Errors

**Symptoms:**
```
TS2307: Cannot find module '../../../../scripts/world-info.js'
TS7016: Could not find a declaration file
```

**Solution:**
These are expected - use `@ts-ignore`:
```typescript
// @ts-ignore - SillyTavern module resolved at runtime
import { world_info } from '../../../../scripts/world-info.js';
```

Or add to globals.d.ts:
```typescript
declare module '../../../../scripts/world-info.js' {
    export const world_info: any;
    export const charSetAuxWorlds: any;
}
```

> **TL;DR:** Most problems stem from: missing webpack externals config, not calling `saveSettingsDebounced()`, using `context.characterId` in groups, wrong character key format (with/without extension), or registering events before event system is ready. Always add defensive null checks and retry logic for UI injection.

---

## 13. Best Practices Checklist

### Project Setup
- [ ] `experiments.outputModule: true` in webpack.config.js
- [ ] `externalsType: 'module'` in webpack.config.js
- [ ] All SillyTavern imports in externals
- [ ] `@ts-ignore` comments on SillyTavern imports
- [ ] Unique extension key in manifest.json

### Data Access
- [ ] Use `getContext()` for runtime context
- [ ] Cache context reference early in initialization
- [ ] Check for null/undefined before accessing nested properties
- [ ] Use `getCharaFilename()` for character keys
- [ ] Remember charLore keys are WITHOUT file extension

### Events
- [ ] Wait for event system initialization before registering handlers
- [ ] Use `eventTypes.EVENT_NAME` not string literals
- [ ] For group chats: use `GROUP_MEMBER_DRAFTED` not `GENERATION_STARTED`
- [ ] Clean up temporary state in `GENERATE_AFTER_DATA`
- [ ] Listen for `WORLDINFO_ENTRIES_LOADED` before accessing world_info

### World Info / Lorebooks
- [ ] Use `charSetAuxWorlds()` and `charUpdateAddAuxWorld()` when possible
- [ ] Always call `saveSettingsDebounced()` after modifying world_info
- [ ] Save original state before temporary modifications
- [ ] Restore original state after generation completes
- [ ] Check `world_info.charLore` exists before accessing

### Settings
- [ ] Use `extension_settings['your_key']` for global settings
- [ ] Use `writeExtensionField()` for per-character data
- [ ] Debounce settings saves
- [ ] Provide defaults for all settings
- [ ] Use `constants.unset` to clear character data

### UI
- [ ] Check if UI element already exists before injecting
- [ ] Use SillyTavern's `Popup` class for modals
- [ ] Add retry logic for panel button injection
- [ ] Listen for `CHARACTER_EDITED` and `CHARACTER_PAGE_LOADED`
- [ ] Escape HTML in user-provided content

### Generation
- [ ] Don't modify prompts during active generation
- [ ] Use `setExtensionPrompt()` before generation starts
- [ ] Debounce prompt updates
- [ ] Use unique module names for prompts
- [ ] Clear prompts when extension disabled

### Error Handling
- [ ] Wrap async operations in try/catch
- [ ] Use `toastr` for user-facing errors
- [ ] Log errors with context for debugging
- [ ] Graceful degradation when features unavailable
- [ ] Check feature availability before use

### Code Quality
- [ ] Use TypeScript for type safety
- [ ] Define interfaces for complex data structures
- [ ] Use meaningful variable names
- [ ] Comment complex logic
- [ ] Keep functions focused and small

---

## Appendix A: Quick Reference

### Most Used Imports
```typescript
// @ts-ignore
import { world_info, charSetAuxWorlds } from '../../../../scripts/world-info.js';
// @ts-ignore
import { saveSettingsDebounced, eventSource, event_types, characters, selected_group } from '../../../../script.js';
// @ts-ignore
import { getContext } from '../../../../scripts/extensions.js';
// @ts-ignore
import { getCharaFilename, debounce } from '../../../../scripts/utils.js';
// @ts-ignore
import { Popup, POPUP_TYPE, POPUP_RESULT } from '../../../../scripts/popup.js';
```

### Most Used Context Methods
```typescript
const ctx = getContext();

ctx.setExtensionPrompt(name, content, position, depth, scan, role);
ctx.writeExtensionField(characterId, key, value);
ctx.saveSettingsDebounced();
ctx.saveMetadataDebounced();
ctx.toastr?.warning('message', 'title');
```

### Critical Event Sequence for Group Chats
```
1. GROUP_MEMBER_DRAFTED → Save state, inject temporary data
2. GENERATION_STARTED → (too late for groups, skip)
3. GENERATE_AFTER_DATA → Restore original state
```

### Character Key Format
```typescript
// CORRECT: No extension
const key = avatar.replace(/\.[^/.]+$/, '');  // "character.png" -> "character"
const key = getCharaFilename(null, { manualAvatarKey: 'character.png' });

// charLore stores entries by key without extension
world_info.charLore.find(e => e.name === 'character');
```

---

## Appendix B: Useful Code Snippets

### Debounced Function
```typescript
import { debounce } from '../../../../scripts/utils.js';

const myFunction = debounce((arg: string) => {
    // Logic here
}, 500);
```

### HTML Escaping
```typescript
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

### Wait for Condition
```typescript
async function waitForCondition(
    condition: () => boolean,
    timeout = 5000,
    interval = 100
): Promise<boolean> {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > timeout) {
            return false;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    return true;
}
```

### Get All Group Member Lorebooks
```typescript
function getGroupMemberLorebooks(groupId: string): Set<string> {
    const lorebooks = new Set<string>();
    const groups = getContext().groups;
    const characters = getContext().characters;
    const group = groups.find(g => g.id === groupId);
    
    if (!group) return lorebooks;
    
    for (const avatar of group.members) {
        if (group.disabled_members.includes(avatar)) continue;
        
        const character = characters.find(c => c.avatar === avatar);
        if (!character) continue;
        
        // Primary lorebook
        if (character.data?.extensions?.world) {
            lorebooks.add(character.data.extensions.world);
        }
        
        // Auxiliary lorebooks
        const charKey = avatar.replace(/\.[^/.]+$/, '');
        const charExtra = world_info.charLore?.find(e => e.name === charKey);
        if (charExtra?.extraBooks) {
            for (const book of charExtra.extraBooks) {
                lorebooks.add(book);
            }
        }
    }
    
    return lorebooks;
}
```

---

*Last Updated: 2026-05-05*
*Based on SillyTavern extension development for NarratorCharacterHelper*

