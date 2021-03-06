import { DNode } from '@dojo/widget-core/interfaces';
import { ThemedMixin, ThemedProperties, theme } from '@dojo/widget-core/mixins/Themed';
import { v, w } from '@dojo/widget-core/d';
import { WidgetBase } from '@dojo/widget-core/WidgetBase';

import * as fixedCss from './styles/split-pane.m.css';
import * as css from '../theme/split-pane.m.css';
import { Dimensions } from '@dojo/widget-core/meta/Dimensions';
import { GlobalEvent } from '../global-event/index';
import { customElement } from '@dojo/widget-core/decorators/customElement';

/**
 * Direction of this SplitPane
 */
export const enum Direction {
	column,
	row
}

/**
 * @type SplitPaneProperties
 *
 * Properties that can be set on a SplitPane component
 *
 * @property direction      Orientation of this SplitPane, can be `row` or `column`
 * @property leading        Content to show in the primary pane
 * @property onResize       Called when the divider is dragged; should be used to update `size`
 * @property size           Size of the primary pane
 * @property trailing       Content to show in the secondary pane
 */
export interface SplitPaneProperties extends ThemedProperties {
	direction?: Direction;
	onResize?(size: number): void;
	size?: number;
}

export const ThemedBase = ThemedMixin(WidgetBase);

const DEFAULT_SIZE = 100;

@theme(css)
@customElement<SplitPaneProperties>({
	tag: 'dojo-split-pane',
	properties: [ 'theme', 'extraClasses', 'size', 'direction' ],
	attributes: [ 'direction' ],
	events: [
		'onResize'
	]
})
export class SplitPaneBase<P extends SplitPaneProperties = SplitPaneProperties> extends ThemedBase<P> {
	private _dragging: boolean;
	private _lastSize?: number;
	private _position: number;

	private _getPosition(event: MouseEvent & TouchEvent) {
		event.stopPropagation();
		const { direction = Direction.row } = this.properties;

		if (direction === Direction.row) {
			return event.changedTouches ? event.changedTouches[0].clientX : event.clientX;
		}
		else {
			return event.changedTouches ? event.changedTouches[0].clientY : event.clientY;
		}
	}

	private _onDragStart(event: MouseEvent & TouchEvent) {
		event.stopPropagation();
		this._dragging = true;
		this._position = this._getPosition(event);
	}

	private _onDragMove = (event: MouseEvent & TouchEvent) => {
		event.stopPropagation();
		if (!this._dragging) {
			return;
		}

		const {
			direction = Direction.row,
			onResize,
			size = DEFAULT_SIZE
		} = this.properties;

		const currentPosition = this._getPosition(event);
		let newSize = (this._lastSize === undefined ? size : this._lastSize) + currentPosition - this._position;

		const rootDimensions = this.meta(Dimensions).get('root');
		const dividerDimensions = this.meta(Dimensions).get('divider');
		const maxSize = direction === Direction.row ?
			rootDimensions.offset.width - dividerDimensions.offset.width :
			rootDimensions.offset.height - dividerDimensions.offset.height;

		this._lastSize = newSize;

		newSize = newSize < 0 ? 0 : newSize;
		newSize = newSize > maxSize ? maxSize : newSize;

		this._position = currentPosition;

		onResize && onResize(newSize);
	}

	private _onDragEnd = (event: MouseEvent & TouchEvent) => {
		event.stopPropagation();
		this._dragging = false;
		this._lastSize = undefined;
	}

	protected getPaneContent(content: DNode): DNode[] {
		return [ content ];
	}

	protected getPaneStyles(): {[key: string]: string} {
		const {
			direction = Direction.row,
			size = DEFAULT_SIZE
		} = this.properties;
		const styles: {[key: string]: string} = {};

		styles[direction === Direction.row ? 'width' : 'height'] = `${size}px`;
		return styles;
	}

	protected render(): DNode {
		const {
			direction = Direction.row
		} = this.properties;

		return v('div', {
			classes: [
				...this.theme([
					css.root,
					direction === Direction.column ? css.column : css.row
				]),
				fixedCss.rootFixed,
				direction === Direction.column ? fixedCss.columnFixed : fixedCss.rowFixed
			],
			key: 'root'
		}, [
			w(GlobalEvent, {
				key: 'global',
				window: {
					mouseup: this._onDragEnd,
					mousemove: this._onDragMove,
					touchmove: this._onDragMove
				}
			}),
			v('div', {
				classes: [
					this.theme(css.leading),
					fixedCss.leadingFixed
				],
				key: 'leading',
				styles: this.getPaneStyles()
			}, this.getPaneContent(this.children[0])),
			v('div', {
				classes: [
					this.theme(css.divider),
					fixedCss.dividerFixed
				],
				key: 'divider',
				onmousedown: this._onDragStart,
				ontouchend: this._onDragEnd,
				ontouchstart: this._onDragStart
			}),
			v('div', {
				classes: [
					this.theme(css.trailing),
					fixedCss.trailingFixed
				],
				key: 'trailing'
			}, this.getPaneContent(this.children[1]))
		]);
	}
}

export default class SplitPane extends SplitPaneBase<SplitPaneProperties> {}
