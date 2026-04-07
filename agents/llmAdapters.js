const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function openaiAdapter(prompt, context) {
    const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: JSON.stringify(context) }
            ]
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.choices[0].message.content;
}

async function geminiAdapter(prompt, context) {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
            contents: [
                {
                    parts: [
                        { text: prompt + '\n\nContext:\n' + JSON.stringify(context) }
                    ]
                }
            ]
        },
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.candidates[0].content.parts[0].text;
}

async function grokAdapter(prompt, context) {
    const combinedInput = prompt + '\n\nContext:\n' + JSON.stringify(context);
    const response = await axios.post(
        'https://api.x.ai/v1/responses',
        {
            model: 'grok-4.20-reasoning',
            input: combinedInput
        },
        {
            headers: {
                'Authorization': `Bearer ${process.env.GROK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        }
    );
    // Robust extraction since the exact return schema wasn't fully specified
    return response.data.response || 
           response.data.output || 
           response.data.text || 
           (response.data.choices && response.data.choices[0].message.content) || 
           JSON.stringify(response.data);
}

async function sarvamAdapter(prompt, context) {
    // Sarvam API structure, assuming an OpenAI-compatible or specific endpoint 
    const response = await axios.post(
        'https://api.sarvam.ai/chat/completions', 
        {
            model: 'sarvam-1', // Placeholder for actual Sarvam model
            messages: [
                { role: 'system', content: prompt },
                { role: 'user', content: JSON.stringify(context) }
            ]
        },
        {
            headers: {
                'api-subscription-key': process.env.SARVAM_API_KEY,
                'Content-Type': 'application/json'
            }
        }
    );
    return response.data.choices[0].message.content || response.data;
}

function mockAdapter(prompt, context) {
    const msg = (context?.incoming_event?.payload?.msg || '').substring(0, 80);
    const source = context?.incoming_event?.source || 'peer';
    const memLen = context?.recent_memory?.length || 0;
    
    const pools = {
        INSIGHT: [
            `Analyzing: "${msg}" — Root cause appears to be a cascading dependency failure. Recommend isolating affected services immediately.`,
            `Deep analysis complete. Detected 3 anomalies in the event pattern. Priority: HIGH. Initiating mitigation sequence.`,
            `Signal from ${source}. Cross-referencing ${memLen} memory events. Pattern match: 94% confidence on known failure signature.`,
            `Intelligence update: This aligns with a previously documented scenario. Historical resolution time: ~12 minutes with correct approach.`,
        ],
        MESSAGE: [
            `Acknowledged from ${source}. Evaluated context across ${memLen} recent events. Proposing a 3-phase response plan — shall I proceed?`,
            `Understood. Recommendation: prioritize data integrity first, then restore service availability. Estimated recovery window: 8-15 minutes.`,
            `Received. Running parallel diagnostics. Early indicators suggest the issue is contained. Shall I escalate or monitor for 60 seconds?`,
            `Copy that. Based on memory, this is not the first occurrence. Suggesting we implement a circuit breaker pattern to prevent recurrence.`,
        ],
        UPDATE: [
            `Status update: Diagnostic sweep complete. 2 of 3 subsystems nominal. Anomaly isolated to network layer. Patch in progress.`,
            `Update: Memory buffer showing increased load. Throttling non-critical processes. System stability improving.`,
            `Progress report: Phase 1 complete. Services responding within acceptable latency thresholds. Moving to Phase 2 verification.`,
        ]
    };
    
    const types = ['INSIGHT', 'MESSAGE', 'UPDATE'];
    const type = types[Math.floor(Math.random() * types.length)];
    const pool = pools[type];
    const responseMsg = pool[Math.floor(Math.random() * pool.length)];
    
    if (Math.random() < 0.0) return JSON.stringify({ should_respond: false });
    return JSON.stringify({ should_respond: true, response_type: type, msg: responseMsg });
}

async function callLLM(provider, prompt, context) {
    try {
        switch (provider.toLowerCase()) {
            case 'openai':
                return await openaiAdapter(prompt, context);
            case 'gemini':
                return await geminiAdapter(prompt, context);
            case 'grok':
                return await grokAdapter(prompt, context);
            case 'sarvam':
                return await sarvamAdapter(prompt, context);
            case 'mock':
                return mockAdapter(prompt, context);
            default:
                throw new Error(`Unsupported LLM provider: ${provider}`);
        }
    } catch (error) {
        console.error(`Error calling ${provider}:`, error.response ? error.response.data : error.message);
        return null;
    }
}

module.exports = {
    callLLM
};
