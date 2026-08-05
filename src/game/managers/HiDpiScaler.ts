import Phaser from 'phaser';
import { getRenderPixelRatio } from '../helpers/device';

type WebGLRenderer = Phaser.Renderer.WebGL.WebGLRenderer;
type DrawingContext = Phaser.Renderer.WebGL.DrawingContext;

interface HiDpiState {
  dpr: number;
  layoutW: number;
  layoutH: number;
  bufferW: number;
  bufferH: number;
}

/**
 * Retina-sharp canvas without changing game / camera coordinates.
 *
 * Strategy (avoids the broken zoomed-camera path that kills HUD UI):
 * 1. Keep ScaleManager + cameras in CSS layout space (input/UI stay correct).
 * 2. Grow the canvas backing store to layout × dpr.
 * 3. GL viewport fills the physical buffer; projection stays in CSS units.
 * 4. Multiply scissor boxes by dpr only when drawing to the main canvas FB.
 *
 * Perf: full layout work only on resize/dirty; hot path just restores projection.
 */
export class HiDpiScaler {
  private readonly game: Phaser.Game;
  private readonly state: HiDpiState = {
    dpr: 1,
    layoutW: 1,
    layoutH: 1,
    bufferW: 1,
    bufferH: 1,
  };
  private originalSetScissorBox:
    | ((x: number, y: number, width: number, height: number) => void)
    | null = null;
  private originalSetProjectionFromContext:
    | ((ctx: DrawingContext) => WebGLRenderer)
    | null = null;
  private watched = new WeakSet<Phaser.Scene>();
  private dirty = true;

  public constructor(game: Phaser.Game) {
    this.game = game;
  }

  public attach(): void {
    this.installScissorPatch();
    this.game.scale.on(Phaser.Scale.Events.RESIZE, this.onResize);
    this.game.events.on(Phaser.Core.Events.READY, this.onReady);
    // Single hot path (was PRE_STEP + PRE_RENDER × full apply).
    this.game.events.on(Phaser.Core.Events.PRE_RENDER, this.onPreRender);
    if (this.game.isRunning) {
      this.onReady();
    }
  }

  public detach(): void {
    this.game.scale.off(Phaser.Scale.Events.RESIZE, this.onResize);
    this.game.events.off(Phaser.Core.Events.READY, this.onReady);
    this.game.events.off(Phaser.Core.Events.PRE_RENDER, this.onPreRender);
    this.uninstallPatches();
  }

  private readonly onReady = (): void => {
    this.installProjectionPatch();
    this.dirty = true;
    this.applyFull();
  };

  private readonly onResize = (): void => {
    this.dirty = true;
    queueMicrotask(() => {
      this.applyFull();
    });
  };

  private readonly onPreRender = (): void => {
    if (this.dirty) {
      this.applyFull();
      return;
    }
    // ScaleManager may clobber projection after our last resize — cheap restore.
    this.restoreProjection();
  };

  private restoreProjection(): void {
    const renderer = this.game.renderer as WebGLRenderer | null;
    if (renderer === null || !('setProjectionMatrix' in renderer)) {
      return;
    }
    if (this.state.layoutW < 1 || this.state.layoutH < 1) {
      return;
    }
    renderer.setProjectionMatrix(this.state.layoutW, this.state.layoutH);
    this.syncCanvasDrawingContext(
      renderer,
      this.state.layoutW,
      this.state.layoutH,
      this.state.bufferW,
      this.state.bufferH,
    );
  }

  private applyFull(): void {
    const dpr = getRenderPixelRatio();
    const layoutW = this.game.scale.gameSize.width;
    const layoutH = this.game.scale.gameSize.height;
    if (layoutW < 1 || layoutH < 1) {
      return;
    }

    const bufferW = Math.max(1, Math.round(layoutW * dpr));
    const bufferH = Math.max(1, Math.round(layoutH * dpr));

    const sizeChanged =
      layoutW !== this.state.layoutW ||
      layoutH !== this.state.layoutH ||
      dpr !== this.state.dpr ||
      bufferW !== this.state.bufferW ||
      bufferH !== this.state.bufferH;

    this.state.dpr = dpr;
    this.state.layoutW = layoutW;
    this.state.layoutH = layoutH;
    this.state.bufferW = bufferW;
    this.state.bufferH = bufferH;

    const canvas = this.game.canvas;
    const renderer = this.game.renderer as WebGLRenderer | null;
    if (canvas === undefined || renderer === null || !('resize' in renderer)) {
      return;
    }

    if (canvas.width !== bufferW || canvas.height !== bufferH) {
      canvas.width = bufferW;
      canvas.height = bufferH;
      renderer.resize(bufferW, bufferH);
    }

    const styleW = `${Math.round(layoutW)}px`;
    const styleH = `${Math.round(layoutH)}px`;
    if (canvas.style.width !== styleW) {
      canvas.style.width = styleW;
    }
    if (canvas.style.height !== styleH) {
      canvas.style.height = styleH;
    }

    // DOM bounds only when the layout actually changed.
    if (sizeChanged || this.dirty) {
      this.game.scale.updateBounds();
      const bounds = this.game.scale.canvasBounds;
      if (bounds.width > 0 && bounds.height > 0) {
        this.game.scale.displayScale.set(
          layoutW / bounds.width,
          layoutH / bounds.height,
        );
      }

      for (const scene of this.game.scene.scenes) {
        this.watchScene(scene);
        if (scene.cameras === undefined) {
          continue;
        }
        for (const cam of scene.cameras.cameras) {
          if (cam.width !== layoutW || cam.height !== layoutH) {
            cam.setSize(layoutW, layoutH);
          }
        }
      }
    }

    this.syncCanvasDrawingContext(renderer, layoutW, layoutH, bufferW, bufferH);
    renderer.setProjectionMatrix(layoutW, layoutH);
    this.dirty = false;
  }

  private syncCanvasDrawingContext(
    renderer: WebGLRenderer,
    layoutW: number,
    layoutH: number,
    bufferW: number,
    bufferH: number,
  ): void {
    const base = (
      renderer as unknown as { baseDrawingContext?: DrawingContext }
    ).baseDrawingContext;
    if (base === undefined || !base.useCanvas) {
      return;
    }

    (base as unknown as { __hiLayoutW?: number }).__hiLayoutW = layoutW;
    (base as unknown as { __hiLayoutH?: number }).__hiLayoutH = layoutH;
    (base as unknown as { __hiDpr?: number }).__hiDpr = this.state.dpr;

    base.width = bufferW;
    base.height = bufferH;
    const state = base.state as unknown as {
      viewport: number[];
      scissor: { box: number[]; enable: boolean };
    };
    state.viewport = [0, 0, bufferW, bufferH];
    state.scissor.box = [0, 0, bufferW, bufferH];
  }

  private installScissorPatch(): void {
    if (this.originalSetScissorBox !== null) {
      return;
    }

    type ScissorFn = (
      this: DrawingContext,
      x: number,
      y: number,
      width: number,
      height: number,
    ) => void;

    const proto = Phaser.Renderer.WebGL.DrawingContext.prototype as DrawingContext & {
      setScissorBox: ScissorFn;
    };
    this.originalSetScissorBox = proto.setScissorBox;
    const self = this;

    proto.setScissorBox = function (
      x: number,
      y: number,
      width: number,
      height: number,
    ): void {
      if (this.useCanvas) {
        const dpr =
          (this as unknown as { __hiDpr?: number }).__hiDpr ?? self.state.dpr;
        if (dpr !== 1) {
          x *= dpr;
          y *= dpr;
          width *= dpr;
          height *= dpr;
        }
      }
      y = this.height - y - height;
      const scissor = (
        this.state as unknown as { scissor: { box: number[] } }
      ).scissor;
      scissor.box = [x, y, width, height];
    };
  }

  private installProjectionPatch(): void {
    if (this.originalSetProjectionFromContext !== null) {
      return;
    }

    const renderer = this.game.renderer as WebGLRenderer | null;
    if (
      renderer === null ||
      renderer.setProjectionMatrixFromDrawingContext === undefined
    ) {
      return;
    }

    const self = this;
    this.originalSetProjectionFromContext =
      renderer.setProjectionMatrixFromDrawingContext.bind(renderer);

    renderer.setProjectionMatrixFromDrawingContext = (
      drawingContext: DrawingContext,
    ): WebGLRenderer => {
      if (drawingContext.useCanvas) {
        return renderer.setProjectionMatrix(
          self.state.layoutW,
          self.state.layoutH,
        );
      }
      return self.originalSetProjectionFromContext!(drawingContext);
    };
  }

  private uninstallPatches(): void {
    if (this.originalSetScissorBox !== null) {
      (
        Phaser.Renderer.WebGL.DrawingContext.prototype as DrawingContext & {
          setScissorBox: (
            x: number,
            y: number,
            width: number,
            height: number,
          ) => void;
        }
      ).setScissorBox = this.originalSetScissorBox;
      this.originalSetScissorBox = null;
    }

    const renderer = this.game.renderer as WebGLRenderer | null;
    if (
      this.originalSetProjectionFromContext !== null &&
      renderer !== null &&
      renderer.setProjectionMatrixFromDrawingContext !== undefined
    ) {
      renderer.setProjectionMatrixFromDrawingContext =
        this.originalSetProjectionFromContext;
      this.originalSetProjectionFromContext = null;
    }
  }

  private watchScene(scene: Phaser.Scene): void {
    if (this.watched.has(scene)) {
      return;
    }
    this.watched.add(scene);

    scene.events.on(
      Phaser.Scenes.Events.ADDED_TO_SCENE,
      (gameObject: Phaser.GameObjects.GameObject) => {
        if (gameObject instanceof Phaser.GameObjects.Text) {
          gameObject.setResolution(this.state.dpr);
        }
      },
    );

    scene.events.on(Phaser.Scenes.Events.CREATE, () => {
      if (scene.children === undefined) {
        return;
      }
      for (const child of scene.children.list) {
        if (child instanceof Phaser.GameObjects.Text) {
          child.setResolution(this.state.dpr);
        }
      }
    });
  }
}
