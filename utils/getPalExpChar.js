const charUrl = window.location.href;
const platform = window.location.hostname;

// Pako lib
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js";
document.head.appendChild(script);

script.onload = () => {
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
      `// ${timestamp} at https://palm.goteamst.com\n\n`;

    const characterJSON = JSON.stringify(characterData, null, 2);
    const compressedData = pako.gzip(characterJSON, { level: 2 });

    const fileContent = new Uint8Array([...new TextEncoder().encode(credit), ...compressedData]);
    const blob = new Blob([fileContent], { type: "application/octet-stream" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${characterData.name || "character"}.plmc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
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

  const exportMethod1 = async () => {
    try {
      const url = new URL(`https://plus.${platform.split(".").slice(-2).join(".")}/chat/character/info/`);
      const charId = charUrl.split("/").slice(-1)[0];

      const response = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ external_id: charId }),
      });

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
      console.error("Export method 1 failed.", error);
      return false;
    }
  };

  const exportMethod2 = async () => {
    try {
      // scrapped, might reimplement
      return false;
    } catch (error) {
      console.error("Export method 2 failed.", error);
      return false;
    }
  };

  (async () => {
    const success = await exportMethod1();
    if (!success) {
      await exportMethod2();
    }
    navigator.vibrate(100);
  })();
};