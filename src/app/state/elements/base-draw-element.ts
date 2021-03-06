import { Feature } from 'ol';
import { Observable } from 'rxjs';
import { IZsMapBaseDrawElementState } from '../interfaces';
import { ZsMapStateService } from '../state.service';
import { ZsMapBaseElement } from './base-element';
import { Draw } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Options } from 'ol/interaction/Draw';
import { Geometry } from 'ol/geom';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { IZsMapDrawElementUi } from '../draw-element-ui.interfaces';
import { ZsMapOLFeatureProps } from './ol-feature-props';

export abstract class ZsMapBaseDrawElement<T extends IZsMapBaseDrawElementState = IZsMapBaseDrawElementState> extends ZsMapBaseElement<T> {
  constructor(protected override _id: string, protected override _state: ZsMapStateService) {
    super(_id, _state);
    this._olFeature.set(ZsMapOLFeatureProps.IS_DRAW_ELEMENT, true);
    this._element = this._state.observeMapState().pipe(
      map((o) => {
        // TODO typings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return o.drawElements?.find((o) => o.id === this._id) as any;
      }),
      distinctUntilChanged((x, y) => x === y),
    );
  }

  private _doInitialize(coordinates: number[] | number[][] | undefined): void {
    if (!this._isInitialized) {
      this._initialize(coordinates);
    }
    this._isInitialized = true;
  }

  public observeCoordinates(): Observable<number[] | number[][] | undefined> {
    return this._element.pipe(
      map((o) => {
        if (o?.coordinates) {
          this._doInitialize(o?.coordinates);
        }
        return o?.coordinates;
      }),
      distinctUntilChanged((x, y) => x === y),
    );
  }

  public setCoordinates(coordinates: number[] | number[][] | undefined): void {
    this._state.updateMapState((draft) => {
      const element = draft.drawElements?.find((o) => o.id === this._id);
      if (element) {
        element.coordinates = coordinates;
      }
    });
  }

  public observeLayer(): Observable<string | undefined> {
    return this._element.pipe(
      map((o) => {
        return o?.layer;
      }),
      distinctUntilChanged((x, y) => x === y),
    );
  }

  public setLayer(layer: string): void {
    this._state.updateMapState((draft) => {
      if (draft?.drawElements?.[this._id]) {
        draft.drawElements[this._id].layer = layer;
      }
    });
  }

  public getUi(): IZsMapDrawElementUi | undefined {
    return undefined;
  }

  // static handlers for drawing
  public static getOlDrawHandler(state: ZsMapStateService, layer: string): Draw {
    const draw = new Draw(
      this._enhanceOlDrawOptions({
        source: new VectorSource({ wrapX: false }),
        type: this._getOlDrawType(),
      }),
    );
    draw.on('drawend', (event) => {
      this._parseFeature(event.feature, state, layer);
    });
    return draw;
  }
  protected static _getOlDrawType(): string {
    throw new Error('static fn _getOlDrawType is not implemented');
  }
  protected static _enhanceOlDrawOptions(options: Options) {
    return options;
  }
  protected static _parseFeature(event: Feature<Geometry>, state: ZsMapStateService, layer: string): void {
    console.log('static fn _parseFeature is not implemented', { event, state, layer });
    throw new Error('static fn _parseFeature is not implemented');
  }
}
