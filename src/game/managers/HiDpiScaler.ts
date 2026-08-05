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
 * 3. GL viewport fills the physical buffer; projection stays in CSS units so
 *    each layout unit spans `dpr` physical pixels (sharp sprites/text).
 * 4. Multiply scissor boxes by dpr only when drawing to the main canvas FB.
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

  public constructor(game: Phaser.Game) {
    this.game = game;
  }

  public attach(): void {
    this.installScissorPatch();
    this.game.scale.on(Phaser.Scale.Events.RESIZE, this.queueApply);
    this.game.events.on(Phaser.Core.Events.READY, this.onReady);
    // Before update/input: canvas buffer matches layout × dpr.
    this.game.events.on(Phaser.Core.Events.PRE_STEP, this.ensure);
    // After boot (renderer exists) and every frame before draw.
    this.game.events.on(Phaser.Core.Events.PRE_RENDER, this.ensure);
    if (this.game.isRunning) {
      this.onReady();
    }
  }

  public detach(): void {
    this.game.scale.off(Phaser.Scale.Events.RESIZE, this.queueApply);
    this.game.events.off(Phaser.Core.Events.READY, this.onReady);
    this.game.events.off(Phaser.Core.Events.PRE_STEP, this.ensure);
    this.game.events.off(Phaser.Core.Events.PRE_RENDER, this.ensure);
    this.uninstallPatches();
  }

  private readonly onReady = (): void => {
    this.installProjectionPatch();
    this.apply();
  };

  private readonly queueApply = (): void => {
    queueMicrotask(() => {
      this.apply();
    });
  };

  private readonly ensure = (): void => {
    this.apply();
  };

  private apply(): void {
    const dpr = getRenderPixelRatio();
    const layoutW = this.game.scale.gameSize.width;
    const layoutH = this.game.scale.gameSize.height;
    if (layoutW < 1 || layoutH < 1) {
      return;
    }

    const bufferW = Math.max(1, Math.round(layoutW * dpr));
    const bufferH = Math.max(1, Math.round(layoutH * dpr));

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

    // Visual size stays CSS so layout + input remain 1:1 with game coords.
    const styleW = `${Math.round(layoutW)}px`;
    const styleH = `${Math.round(layoutH)}px`;
    if (canvas.style.width !== styleW) {
      canvas.style.width = styleW;
    }
    if (canvas.style.height !== styleH) {
      canvas.style.height = styleH;
    }

    // Pointer mapping: CSS game coords (do not use buffer-space pointers).
    this.game.scale.updateBounds();
    const bounds = this.game.scale.canvasBounds;
    if (bounds.width > 0 && bounds.height > 0) {
      this.game.scale.displayScale.set(
        layoutW / bounds.width,
        layoutH / bounds.height,
      );
    }

    // Cameras stay in CSS layout space (same as game units / pointers).
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

    this.syncCanvasDrawingContext(renderer, layoutW, layoutH, bufferW, bufferH);
    // Override resize()'s buffer-sized ortho: project CSS units into buffer.
    renderer.setProjectionMatrix(layoutW, layoutH);
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

    // Meta used by projection/scissor patches (clones fall back to state.dpr).
    (base as unknown as { __hiLayoutW?: number }).__hiLayoutW = layoutW;
    (base as unknown as { __hiLayoutH?: number }).__hiLayoutH = layoutH;
    (base as unknown as { __hiDpr?: number }).__hiDpr = this.state.dpr;

    // Physical size for viewport + scissor Y-flip (setScissorBox uses height).
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
      // Camera scissor is in CSS px; main canvas FB is buffer = CSS × dpr.
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
