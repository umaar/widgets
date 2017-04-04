import * as registerSuite from 'intern!object';
import * as assert from 'intern/chai!assert';
import has from '@dojo/has/has';
import { VNode } from '@dojo/interfaces/vdom';
import TestHarness from '@dojo/intern-helper/widgets/TestHarness';
import SlidePane, { Align } from '../../SlidePane';
import * as css from '../../styles/slidePane.m.css';

const hasTouch = (function (): boolean {
	/* Since jsdom will fake it anyways, no problem predending we can do touch */
	return Boolean(has('host-node') || 'ontouchstart' in window);
})();

function createEvent(type: string, x: number): any {
	return {
		type,
		stopPropagation() { },
		preventDefault() { },
		pageX: x,
		changedTouches: [{
			screenX: x
		}],
		target: {
			classList: {
				contains() { return true; }
			}
		}
	};
}

/* for some reasons, it is "difficult" to explicitly type mixin class instance, so creating an
 * instance just to extract type information */
let harness = new TestHarness(SlidePane);

registerSuite({
	name: 'SlidePane',

	beforeEach() {
		harness = new TestHarness(SlidePane);
	},

	afterEach() {
		harness.destroy();
	},

	'Should construct SlidePane with passed properties'() {
		const slidePane = new SlidePane();
		slidePane.setProperties({
			key: 'foo',
			align: Align.left,
			open: true,
			underlay: true
		});

		assert.strictEqual(slidePane.properties.key, 'foo');
		assert.strictEqual(slidePane.properties.align, Align.left);
		assert.isTrue(slidePane.properties.open);
		assert.isTrue(slidePane.properties.underlay);
	},

	'Render correct children'() {
		harness.setProperties({
			key: 'foo',
			underlay: false
		});

		harness.addRenderAssertion((render: any) => {
			assert.strictEqual(render.vnodeSelector, 'div', 'tagname should be div');
			assert.lengthOf(render.children, 1);

			harness.setProperties({
				open: true,
				underlay: true,
				align: Align.right,
				width: 256
			});
		}, (render: any) => {
			assert.lengthOf(render.children, 2);
		});

		return harness.startRender();
	},

	onOpen() {
		let called = false;

		harness.setProperties({
			open: true,
			onOpen() {
				called = true;
			}
		});

		harness.addRenderAssertion(() => {
			assert.isTrue(called, 'onOpen should be called');
		});

		return harness.startRender();
	},

	'change property to close'() {
		harness.setProperties({
			open: true
		});

		harness.addRenderAssertion((render: any) => {
			assert.lengthOf(render.children, 2, 'should have two children nodes');

			harness.setProperties({
				open: false
			});
		}, (render: any) => {
			assert.lengthOf(render.children, 1, 'should have one child node');
		});

		return harness.startRender();
	},

	async 'click underlay to close'() {
		let called = false;

		harness.setProperties({
			open: true,

			onRequestClose() {
				called = true;
			}
		});

		await harness.append();

		harness.sendEvent('mousedown', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 300
			},

			selector: ':first-child' /* this should be the underlay */
		});

		/* using MouseEvent here causes issues between pepjs and jsdom, therefore we will use custom event */
		harness.sendEvent('mouseup', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 300
			},

			selector: ':first-child' /* this should be the underlay */
		});

		assert.isTrue(called, 'onRequestClose should be called on underlay click');
	},

	async 'tap underlay to close'(this: any) {
		if (!hasTouch) {
			this.skip('Environment not support touch events');
		}

		let called = false;

		harness.setProperties({
			open: true,

			onRequestClose() {
				called = true;
			}
		});

		await harness.append();

		harness.sendEvent('touchstart', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 300 } ]
			},

			selector: ':first-child' /* this should be the underlay */
		});

		harness.sendEvent('touchend', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 300 } ]
			},

			selector: ':first-child' /* this should be the underlay */
		});

		assert.isTrue(called, 'onRequestClose should be called on underlay tap');
	},

	async 'drag to close'() {
		let called = false;

		harness.setProperties({
			open: true,

			onRequestClose() {
				called = true;
			}
		});

		await harness.append();

		harness.sendEvent('mousedown', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 300
			}
		});

		harness.sendEvent('mousemove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 150
			}
		});

		harness.sendEvent('mouseup', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 50
			}
		});

		assert.isTrue(called, 'onRequestClose should be called if dragged far enough');
	},

	async 'swipe to close'(this: any) {
		if (!hasTouch) {
			this.skip('Environment not support touch events');
		}

		let called = false;

		harness.setProperties({
			open: true,

			onRequestClose() {
				called = true;
			}
		});

		await harness.append();

		harness.sendEvent('touchmove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 150 } ]
			}
		});

		harness.sendEvent('touchstart', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 300 } ]
			}
		});

		harness.sendEvent('touchmove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 150 } ]
			}
		});

		harness.sendEvent('touchend', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 50 } ]
			}
		});

		assert.isTrue(called, 'onRequestClose should be called if swiped far enough');
	},

	async 'swipe to close right'(this: any) {
		if (!hasTouch) {
			this.skip('Environment not support touch events');
		}

		let called = false;

		harness.setProperties({
			align: Align.right,
			open: true,
			width: 256,

			onRequestClose() {
				called = true;
			}
		});

		await harness.append();

		harness.sendEvent('touchstart', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 300 } ]
			}
		});

		harness.sendEvent('touchmove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 400 } ]
			}
		});

		harness.sendEvent('touchend', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				changedTouches: [ { screenX: 500 } ]
			}
		});

		assert.isTrue(called, 'onRequestClose should be called if swiped far enough to close right');
	},

	async 'not dragged far enough to close'() {
		let called = false;

		harness.setProperties({
			open: true,

			onRequestClose() {
				called = true;
			}
		});

		harness.setChildren([
			`Lorem ipsum dolor sit amet, consectetur adipiscing elit.
			Quisque id purus ipsum. Aenean ac purus purus.
			Nam sollicitudin varius augue, sed lacinia felis tempor in.`
		]);

		await harness.append();

		harness.sendEvent('mousedown', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 300
			}
		});

		harness.sendEvent('mousemove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 250
			}
		});

		harness.sendEvent('mouseup', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 250
			}
		});

		assert.isFalse(called, 'onRequestClose should not be called if not swiped far enough to close');
	},

	async 'pane cannot be moved past screen edge'() {
		// const slidePane = new SlidePane();

		harness.setProperties({
			open: true
		});

		harness.setChildren([
			`Lorem ipsum dolor sit amet, consectetur adipiscing elit.
			Quisque id purus ipsum. Aenean ac purus purus.
			Nam sollicitudin varius augue, sed lacinia felis tempor in.`
		]);

		await harness.append();

		harness.sendEvent('mousedown', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 300
			},

			selector: ':last-child'
		});

		harness.sendEvent('mousemove', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 400
			},

			selector: ':last-child'
		});

		harness.sendEvent('mouseup', 'CustomEvent', {
			eventInit: <MouseEventInit> {
				bubbles: true,
				pageX: 500
			},

			selector: ':last-child'
		});

		assert.isUndefined(harness.widgetElement && (<HTMLElement> harness.widgetElement.lastChild).style.transform);
	},

	'classes and transform removed after transition'() {
		let called = false;

		const event: any = {
			target: {
				addEventListener() {},
				classList: {
					remove() {
						called = true;
						assert.strictEqual(arguments[0], css.slideIn, 'slideIn class should be removed after transition');
						assert.strictEqual(arguments[1], css.slideOut, 'slideOut class should be removed after transition');
					}
				},
				style: { transform: 'foobar' }
			}
		};

		const slidePane = new SlidePane();
		(<any> slidePane)._onTransitionEnd(event);

		assert.strictEqual(event.target.style.transform, '');
		assert.isTrue(called, `Element.classList.remove should be called when transition finishes`);
	},

	'last transform is applied on next render if being swiped closed'() {
		const slidePane = new SlidePane();
		slidePane.setProperties({
			open: true
		});
		<VNode> slidePane.__render__();
		slidePane.setProperties({ open: false });
		(<any> slidePane)._onSwipeStart(createEvent('touchstart', 300));
		(<any> slidePane)._onSwipeMove(createEvent('touchmove', 150));
		(<any> slidePane)._onSwipeEnd(createEvent('touchend', 50));
		const vnode = <VNode> slidePane.__render__();

		assert.isDefined(vnode.children![0].properties!.styles!['transform'], 'transform should be applied');
	},

	'last transform is applied on next render if being swiped closed right'() {
		const slidePane = new SlidePane();
		slidePane.setProperties({
			open: true
		});
		<VNode> slidePane.__render__();
		slidePane.setProperties({
			open: false,
			align: Align.right
		});
		(<any> slidePane)._onSwipeStart(createEvent('touchstart', 300));
		(<any> slidePane)._onSwipeMove(createEvent('touchmove', 400));
		(<any> slidePane)._onSwipeEnd(createEvent('touchend', 500));
		const vnode = <VNode> slidePane.__render__();

		assert.isDefined(vnode.children![0].properties!.styles!['transform'], 'transform should be applied');
	}
});