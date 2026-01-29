import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST for proxying.' });
    }

    const { url, headers, method = 'GET', body } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid target URL' });
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: headers,
            body: body ? (typeof body === 'object' ? JSON.stringify(body) : body) : undefined
        });

        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        const responseData = await response.text();
        res.status(response.status).send(responseData);
    } catch (error: any) {
        console.error('Proxy API Error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
}