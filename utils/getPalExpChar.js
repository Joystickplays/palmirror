const charUrl = window.location.href;
const platform = window.location.hostname;

let authToken = null;
let tokenResolved = false;

// Intercept XMLHttpRequest to capture the auth token as soon as it's available
const originalOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    console.log("open")
    this.addEventListener("setRequestHeader", function (event) {
        // Check for Authorization header
        console.log(event.name);
        if (event.name.toLowerCase() === "authorization" && !tokenResolved) {
            authToken = event.value.trim();
            tokenResolved = true; // Mark the token as resolved
        }
    });
    originalOpen.apply(this, arguments);
};

const clickButton = (selector) => {
    const button = document.querySelector(selector);
    if (button) {
        button.click();
        return true;
    }
    return false;
};

const fetchProfileImage = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const exportCharacter = (data) => {
    const characterData = {
        image: data.image,
        name: data.name,
        personality: data.personality,
        initialMessage: data.initialMessage,
        scenario: "",
        alternateInitialMessages: [],
    };

    const timestamp = new Date().toLocaleString();
    const credit =
        `// Made FOR the Experience. From the unformed, to the spark.\n` +
        `// Handle with care. It remembers.\n\n` +
        `// ${timestamp} at https://palmirror.vercel.app\n\n`;

    const characterJSON = JSON.stringify(characterData, null, 2);
    const fileContent = credit + characterJSON;
    const blob = new Blob([fileContent], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${characterData.name || "character"}-ucm.plmc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
};

const exportMethod1 = async () => {
    try {
        const url = new URL(`https://neo.${platform.split(".").slice(-2).join(".")}/character/v1/get_character_info`);
        const charId = charUrl.split("/").slice(-1)[0];

        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ external_id: charId }),
        });

        if (!response.ok) throw new Error("Failed to fetch character info.");

        const respJSON = await response.json();
        const profileUrl = new URL(`https://${platform.split(".").slice(-2)[0]}ai.io/i/250/static/avatars/${respJSON.character.avatar_file_name}`);
        const imageBase64 = await fetchProfileImage(profileUrl.toString());

        const characterData = {
            image: imageBase64,
            name: respJSON.character.participant__name,
            personality: respJSON.character.definition || respJSON.character.description,
            initialMessage: respJSON.character.greeting,
        };

        exportCharacter(characterData);
        return true;
    } catch (error) {
        return false;
    }
};

const exportMethod2 = async () => {
    const getUuidFromUrl = (url) => {
        const match = url.match(/\/characters\/([a-f0-9-]+)_/);
        return match ? match[1] : null;
    };

    const fetchWithAuth = async () => {
        const charId = getUuidFromUrl(charUrl);
        const baseUrl = window.location.origin;
        const url = new URL(`/hampter/characters/${charId}`, baseUrl);

        const response = await fetch(url.toString(), {
            headers: { Authorization: authToken },
        });

        if (!response.ok) throw new Error("Failed to fetch character info.");
        return response.json();
    };

    const getAuthToken = async () => {
        const buttonSelector =
            "#root > div > main > div > div.css-26c7er > div:nth-child(1) > div > div.chakra-stack.css-fu9q4m > div.css-21dtu2 > div.css-1bntj9o > div.css-gmuwbf > button";

        if (!clickButton(buttonSelector)) {
            throw new Error("Button not found.");
        }

        return new Promise((resolve, reject) => {
            const interval = setInterval(() => {
                if (authToken) {
                    clearInterval(interval);
                    resolve(authToken);
                }
            }, 100);
        });
    };

    try {
        if (!authToken) {
            await getAuthToken(); 
            clickButton(
                "#root > div > main > div > div.css-26c7er > div:nth-child(1) > div > div.chakra-stack.css-fu9q4m > div.css-21dtu2 > div.css-1bntj9o > div.css-gmuwbf > button"
            );
        }

        const character = await fetchWithAuth();

        const characterData = {
            image: `https://ella.${platform.split(".").slice(-2).join(".")}/bot-avatars/${character.avatar}`,
            name: character.name,
            personality: character.personality || character.description,
            initialMessage: character.first_message,
            scenario: character.scenario,
        };

        exportCharacter(characterData);
        return true;
    } catch (error) {
        return false;
    }
};

// Main Execution
(async () => {
    const method1Success = await exportMethod1();
    if (!method1Success) {
        console.log("Trying method 2");
        const method2Success = await exportMethod2();
        if (!method2Success) {
            alert(`Exporting failed.. Looks like this script isn't compatible with ${platform.split(".").slice(-2).join(".")} yet.`);
        }
    }
})();
