# Narrator Character Helper

This SillyTavern extension lets you mark any character as a narrator or omniscient entity, then injects a private briefing containing the group roster, character dossiers, and linked lorebook summaries into the prompt.

## Features

- Mark or clear narrator status directly on a character card.
- Build a narrator briefing from group members, character cards, embedded character books, and linked world info files.
- Skip muted group members by default, with a toggle to include them.
- Open a built-in control panel from the SillyTavern extensions menu.
- Use the `/narrator` slash command to toggle narrator status or preview the current briefing.

## Development

1. Install dependencies with `npm install`.
2. Build the bundle with `npm run build`.
3. Copy the extension into your SillyTavern `third-party` extensions folder or use the compiled `dist/index.js` from this repo.

## Notes

- Narrator state is stored on the character card under the extension field `narrator_character_helper`.
- The prompt is injected with SillyTavern's extension prompt system so it follows the normal prompt pipeline.
