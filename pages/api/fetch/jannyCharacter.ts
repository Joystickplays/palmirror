import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid character ID' });
    }

    const targetUrl = `https://jannyai.com/api/v1/characters/${id}`;
    
    const refererUrl = `https://jannyai.com/characters/${id}`;

    try {
        const response = await fetch(targetUrl, {
            method: 'GET',
            headers: {
                // teehee browser in nextjs fetch
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Origin': 'https://jannyai.com', 
                'Referer': refererUrl,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'Connection': 'keep-alive',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            redirect: 'follow', 
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Upstream Error ${response.status}:`, errorText);
            return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
        }

        const data = await response.json();
        
        if (response.headers.get('cache-control')) {
            res.setHeader('Cache-Control', response.headers.get('cache-control')!);
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}