const fs = require('fs').promises;

// Dynamically import node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const INPUT_FILE = '6-letter-words-old.json';
const OUTPUT_FILE = '6-letter-words.json';
const API_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en/';

// Function to add a delay between API calls
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function hasDefinition(word) {
    try {
        const response = await fetch(`${API_URL}${word}`);
        if (response.status === 404) {
            return false; // Word not found in the dictionary
        }
        if (!response.ok) {
            // Log other API errors, e.g., rate limiting (429)
            console.error(`API error for "${word}": ${response.status} ${response.statusText}`);
            return false;
        }
        const data = await response.json();
        // A successful response is an array of definition objects
        return Array.isArray(data) && data.length > 0;
    } catch (error) {
        console.error(`Error checking word "${word}":`, error.message);
        return false;
    }
}

async function filterWordList() {
    try {
        console.log(`Reading words from '${INPUT_FILE}'...`);
        const data = await fs.readFile(INPUT_FILE, 'utf8');
        const words = JSON.parse(data);
        console.log(`Found ${words.length} words to check.`);

        const wordsWithDefinitions = [];
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (await hasDefinition(word)) {
                wordsWithDefinitions.push(word);
                console.log(`(${i + 1}/${words.length}) - SUCCESS: "${word}" has a definition.`);
            } else {
                console.log(`(${i + 1}/${words.length}) - FAILED:  "${word}" has no definition.`);
            }
            // Add a small delay to be respectful to the public API
            await delay(1000);
        }

        console.log(`\nFiltering complete. ${wordsWithDefinitions.length} out of ${words.length} words have definitions.`);

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(wordsWithDefinitions, null, 2));
        console.log(`New word list saved to '${OUTPUT_FILE}'.`);
        console.log(`You can now rename '${OUTPUT_FILE}' to '6-letter-words.json' to use it in your game.`);

    } catch (error) {
        console.error('An error occurred during the filtering process:', error);
    }
}

filterWordList();
