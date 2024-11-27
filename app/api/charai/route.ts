export const dynamic = 'force-dynamic';

async function fetchData(char?: string): Promise<string> {
    const url = new URL('https://plus.character.ai/chat/character/info/');

    const data = { external_id: "" };
    // Add external_id if provided
    if (char) {
        data.external_id = char;
    }

    const response = await fetch(url.toString(), {
        method: 'POST', 
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data), 
    });

    if (!response.ok) {
        let message = `HTTP error! status: ${response.status}, message: ${response.statusText}`;
        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch {}
        throw new Error(JSON.stringify({status: response.status, message}));
    }

    const json = await response.json();
    return JSON.stringify(json);
}


export function GET(request: Request) {
    const url = new URL(request.url);
    const char = url.searchParams.get('char');

    return fetchData(char || "").then(json => new Response(json))
        .catch(error => new Response(error.message, { status: 502 }));
}
