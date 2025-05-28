/* spellcase.js
 * – Focus  ⇒ text -> lower-case  (spell-check works)
 * – Blur   ⇒ text -> UPPERCASE  (stored clean)
 * – Submit ⇒ one last uppercase pass
 * – CSS forces uppercase DISPLAY the whole time
 * – Shows ⇪ outline while Caps-Lock is on
 */

(() => {
	'use strict';

	const style = document.createElement('style');
	style.textContent = `
		[data-spellcase] {
			text-transform: uppercase;
			position: relative;
		}

		[data-spellcase][data-capslock="on"]{
			padding-right: 28px;
			background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='18'%20height='14'%20viewBox='0%200%2018%2014'%3E%3Crect%20width='18'%20height='14'%20rx='3'%20fill='%23666'/%3E%3Ctext%20x='9'%20y='11'%20text-anchor='middle'%20font-family='system-ui,%20sans-serif'%20font-size='10'%20fill='%23fff'%3E%E2%87%AA%3C/text%3E%3C/svg%3E");
			background-repeat: no-repeat;
			background-position: right 6px center;
			background-size: 18px 14px;
		}`;
	document.head.appendChild(style);

	let capsOn = false;
	['keydown','keyup'].forEach(evt =>
		document.addEventListener(evt, e => {
			if (e.getModifierState) capsOn = e.getModifierState('CapsLock');
		}, true)					// capture → always fires
	);

	const EDITABLE =
		'input[type="text"], input[type="search"], input:not([type]), textarea, [contenteditable]';

	const toLower = el =>
		el.isContentEditable ? (el.innerText = el.innerText.toLowerCase())
							 : (el.value     = el.value.toLowerCase());

	const toUpper = el =>
		el.isContentEditable ? (el.innerText = el.innerText.toUpperCase())
							 : (el.value     = el.value.toUpperCase());

	const setCapsAttr = (el, e) => {
		if (!e.getModifierState) return;
		el.dataset.capslock = e.getModifierState('CapsLock') ? 'on' : 'off';
	};


	const wire = el => {
		el.addEventListener('focus', () => {
			toLower(el);
			el.dataset.capslock = capsOn ? 'on' : 'off';
		});
		if (el.__spellcaseWired) return;
		el.__spellcaseWired = true;
		el.dataset.spellcase = '';

		el.addEventListener('focus', () => toLower(el));
		el.addEventListener('blur',  () => { toUpper(el); el.dataset.capslock = 'off'; });

		['keydown', 'keyup'].forEach(evt =>
			el.addEventListener(evt, e => setCapsAttr(el, e))
		);
	};

	document.querySelectorAll(EDITABLE).forEach(wire);


	new MutationObserver(m =>
		m.forEach(rec =>
			rec.addedNodes.forEach(n =>
				n.nodeType === 1 && n.matches && (n.matches(EDITABLE) ? wire(n)
					: n.querySelectorAll && n.querySelectorAll(EDITABLE).forEach(wire))
			)
		)
	).observe(document.documentElement, { childList: true, subtree: true });


	document.addEventListener('submit', ev => {
		if (!ev.target.matches('form')) return;
		ev.target.querySelectorAll(EDITABLE).forEach(toUpper);
	}, true);
})();