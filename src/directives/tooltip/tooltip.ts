import { DirectiveOptions } from 'vue';
import { DirectiveBinding } from 'vue/types/options';

const Tooltip: DirectiveOptions = {
	bind(element, binding) {
		element.addEventListener('mouseenter', onEnterTooltip(element, binding));
		element.addEventListener('mouseleave', onLeaveTooltip());
	}
};

export default Tooltip;

let tooltipTimer: number;

export function onEnterTooltip(element: HTMLElement, binding: DirectiveBinding) {
	return () => {
		const tooltip = getTooltip();

		if (binding.modifiers.instant) {
			animateIn(tooltip);
			updateTooltip(element, binding, tooltip);
		} else {
			tooltipTimer = setTimeout(() => {
				animateIn(tooltip);
				updateTooltip(element, binding, tooltip);
			}, 600);
		}
	};
}

export function onLeaveTooltip() {
	return () => {
		const tooltip = getTooltip();

		clearTimeout(tooltipTimer);
		animateOut(tooltip);
	};
}

export function updateTooltip(
	element: HTMLElement,
	binding: DirectiveBinding,
	tooltip: HTMLElement
) {
	const offset = 10;
	const arrowAlign = 20;

	const bounds = element.getBoundingClientRect();
	let top = bounds.top + pageYOffset;
	let left = bounds.left + pageXOffset;
	let transformPos;

	tooltip.innerText = binding.value;
	tooltip.classList.remove('top', 'bottom', 'left', 'right', 'start', 'end');

	if (binding.modifiers.inverted) {
		tooltip.classList.add('inverted');
	} else {
		tooltip.classList.remove('inverted');
	}

	if (binding.modifiers.bottom) {
		if (binding.modifiers.start) {
			left += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			left += bounds.width - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			left += bounds.width / 2;
			transformPos = 50;
		}

		top += bounds.height + offset;
		tooltip.style.transform = `translate(calc(${left}px - ${transformPos}%), ${top}px)`;
		tooltip.classList.add('bottom');
	} else if (binding.modifiers.left) {
		if (binding.modifiers.start) {
			top += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			top += bounds.height - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			top += bounds.height / 2;
			transformPos = 50;
		}

		left -= offset;
		tooltip.style.transform = `translate(calc(${left}px - 100%), calc(${top}px - ${transformPos}%))`;
		tooltip.classList.add('left');
	} else if (binding.modifiers.right) {
		if (binding.modifiers.start) {
			top += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			top += bounds.height - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			top += bounds.height / 2;
			transformPos = 50;
		}

		left += bounds.width + offset;
		tooltip.style.transform = `translate(${left}px, calc(${top}px - ${transformPos}%))`;
		tooltip.classList.add('right');
	} else {
		if (binding.modifiers.start) {
			left += arrowAlign;
			transformPos = 100;
			tooltip.classList.add('start');
		} else if (binding.modifiers.end) {
			left += bounds.width - arrowAlign;
			transformPos = 0;
			tooltip.classList.add('end');
		} else {
			left += bounds.width / 2;
			transformPos = 50;
		}

		top -= offset;
		tooltip.style.transform = `translate(calc(${left}px - ${transformPos}%), calc(${top}px - 100%))`;
		tooltip.classList.add('top');
	}
}

export function animateIn(tooltip: HTMLElement) {
	tooltip.classList.add('visible', 'enter');
	tooltip.classList.remove('leave', 'leave-active');

	setTimeout(() => {
		if (tooltip.classList.contains('enter') === false) return;
		tooltip.classList.add('enter-active');
		tooltip.classList.remove('enter');
	}, 1);

	setTimeout(() => {
		tooltip.classList.remove('enter-active');
	}, 200);
}

export function animateOut(tooltip: HTMLElement) {
	if (tooltip.classList.contains('visible') === false) return;

	tooltip.classList.add('visible', 'leave');
	tooltip.classList.remove('enter', 'enter-active');

	setTimeout(() => {
		if (tooltip.classList.contains('leave') === false) return;
		tooltip.classList.add('leave-active');
		tooltip.classList.remove('leave');
	}, 1);

	setTimeout(() => {
		if (tooltip.classList.contains('leave-active') === false) return;
		tooltip.classList.remove('leave-active');
		tooltip.classList.remove('visible');
	}, 200);
}

export function getTooltip(): HTMLElement {
	let tooltip = document.getElementById('tooltip');

	if (tooltip instanceof HTMLElement) {
		return tooltip;
	}

	tooltip = document.createElement('div');
	tooltip.id = 'tooltip';
	document.body.appendChild(tooltip);

	return tooltip;
}
