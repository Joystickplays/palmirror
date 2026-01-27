import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid character ID' });
    }

    try {
        const response = await fetch(`https://jannyai.com/api/v1/characters/${id}`);
        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch character: ${response.statusText}` });
        }

        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
