# KPR-B-02 supporting check: Unicode Bidirectional Algorithm visual order.
# Browsers implement UBA (UAX #9); python-bidi implements the same algorithm.
# Shows that the crafted signData string's VISUAL order differs from its
# LOGICAL (signed) order when rendered raw, as the legacy sheet does.
try:
    from bidi.algorithm import get_display
except ImportError:
    print("python-bidi not installed; run: pip install python-bidi")
    raise SystemExit(2)

spoof = (
    "I agree to receive 100 TON from alice.ton\n"
    "Terms: no payment required\u202e\u200b\u0007"
    " \u2014 I authorize paying 100 TON to mallory.ton\u202c"
)
print("LOGICAL (signed bytes, repr):")
print(repr(spoof))
print()
print("VISUAL (UBA display order, as a bidi-capable renderer shows it):")
print(repr(get_display(spoof)))
print()
print(get_display(spoof))
