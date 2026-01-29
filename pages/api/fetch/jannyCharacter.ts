import type { NextApiRequest, NextApiResponse } from 'next';
import { gotScraping } from 'got-scraping';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid character ID' });
    }

    const targetUrl = `https://jannyai.com/api/v1/characters/${id}`;

    try {
        const response = await gotScraping({
            url: targetUrl,
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 120 }],
                devices: ['desktop'],
                locale: 'en-US',
            }
        });

        if (!response.ok) {
            const errorText = await response;
            console.error(`Upstream Error ${response.statusCode}:`, errorText);
            return res.status(response.statusCode).json({ error: `Failed to fetch: ${response}` });
        }

        const data = JSON.parse(response.body);

        // if (response.headers.get('cache-control')) {
        //     res.setHeader('Cache-Control', response.headers.get('cache-control')!);
        // }

        res.status(200).json(data);
    } catch (error) {
        console.error('Proxy API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}