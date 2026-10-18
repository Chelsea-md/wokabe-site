// Shared decorative upgrade glyph; retain an accessible text equivalent.
export function upgradeValue(from,to){
  return `<span>${from}</span><span class="sr-only"> to </span><svg class="upgrade-arrow" viewBox="290 173 947 669" aria-hidden="true"><image href="../../../assets/cartoon-v5-upgrade-arrow-v17.png" width="1510" height="1041"/></svg><span>${to}</span>`;
}
