import type { NextApiRequest, NextApiResponse } from 'next';
import { gotScraping } from 'got-scraping';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST for proxying.' });
    }

    const { url, headers, method = 'GET', body } = req.body;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Missing or invalid target URL' });
    }

    try {
        const options: any = {
            url: url,
            method: method,
            headers: headers,
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 120 }],
                devices: ['desktop'],
                locale: 'en-US',
            }
        };

        if (body) {
            if (typeof body === 'object') {
                options.json = body;
            } else {
                options.body = body;
            }
        }

        const response = await gotScraping(options);

        if (response.headers['content-type']) {
            res.setHeader('Content-Type', response.headers['content-type']);
        }

        res.status(response.statusCode).send(response.body);
    } catch (error: any) {
        console.error('Proxy API Error:', error);
        res.status(error.response?.statusCode || 500).json({ error: error.message || 'Internal server error' });
    }
}