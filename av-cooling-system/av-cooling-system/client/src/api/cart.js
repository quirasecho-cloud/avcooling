// Cart kept client-side as {productId, quantity} only; server re-prices at checkout.
export const getCart = () => JSON.parse(localStorage.getItem('cart') || '[]');
export const setCart = c => { localStorage.setItem('cart', JSON.stringify(c)); window.dispatchEvent(new Event('cart')); };
export const addToCart = (productId, quantity = 1) => { const c = getCart(); const i = c.find(x => x.productId === productId); i ? i.quantity += quantity : c.push({ productId, quantity }); setCart(c); };
