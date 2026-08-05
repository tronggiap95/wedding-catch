import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { t } from '../i18n';
import type { AudioManager } from '../managers/AudioManager';
import {
  GUEST_NAME_MAX_LEN,
  guestNameStore,
  type GuestGender,
} from '../state/GuestNameStore';
import { createPrimaryButton } from './UiFactory';
import { UiTheme } from './UiTheme';

/** Local Y of the name field inside the modal root (must match fieldBg). */
const FIELD_LOCAL_Y = 12;
const FIELD_W = 240;
const FIELD_H = 42;

/**
 * Cute name + gender entry overlay (Phaser panel + DOM input).
 * DOM input is pinned to the Phaser field and re-laid out against
 * visualViewport so iOS Safari keyboard does not hide caret/text.
 */
export class GuestNameModal {
  private readonly scene: Phaser.Scene;
  private readonly audio: AudioManager;
  private readonly root: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly maleChip: Phaser.GameObjects.Container;
  private readonly femaleChip: Phaser.GameObjects.Container;
  private readonly inputEl: HTMLInputElement;
  private readonly inputHost: HTMLElement;
  private readonly onDone: () => void;
  private open = false;
  private gender: GuestGender = 'male';
  private focusTimer: number | null = null;
  private relayoutTimers: number[] = [];

  public constructor(
    scene: Phaser.Scene,
    audio: AudioManager,
    onDone: () => void,
  ) {
    this.scene = scene;
    this.audio = audio;
    this.onDone = onDone;
    this.gender = guestNameStore.getGender();

    const { width, height } = scene.scale;

    this.dim = scene.add
      .rectangle(0, 0, width, height, 0x2b2118, 0.45)
      .setOrigin(0.5)
      .setInteractive()
      .setData('isHud', true);

    const panel = scene.add
      .image(0, -4, TextureKey.UiPanel)
      .setDisplaySize(300, 290);

    const title = scene.add
      .text(0, -112, t('guest.nameTitle'), {
        fontFamily: UiTheme.font,
        fontSize: '22px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const hint = scene.add
      .text(0, -78, t('guest.nameHint'), {
        fontFamily: UiTheme.font,
        fontSize: '13px',
        color: UiTheme.inkSoft,
        align: 'center',
        wordWrap: { width: 250 },
      })
      .setOrigin(0.5);

    this.maleChip = this.makeGenderChip(-58, -40, t('guest.gender.male'), 'male');
    this.femaleChip = this.makeGenderChip(
      58,
      -40,
      t('guest.gender.female'),
      'female',
    );

    const fieldBg = scene.add
      .rectangle(0, FIELD_LOCAL_Y, FIELD_W, FIELD_H, 0xfff8f0, 1)
      .setStrokeStyle(3, 0xe8b86d);

    const save = createPrimaryButton(
      scene,
      0,
      72,
      t('guest.nameSave'),
      200,
      52,
    );

    const skip = scene.add
      .text(0, 122, t('guest.nameSkip'), {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: UiTheme.inkSoft,
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.root = scene.add
      .container(width / 2, height / 2, [
        this.dim,
        panel,
        title,
        hint,
        this.maleChip,
        this.femaleChip,
        fieldBg,
        save,
        skip,
      ])
      .setDepth(Depth.Popup)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    // Host next to the Phaser canvas so absolute coords track the game column
    // (body-fixed jumps under the iOS keyboard / visualViewport pan).
    const canvas = scene.game.canvas;
    this.inputHost = canvas.parentElement ?? document.body;
    if (getComputedStyle(this.inputHost).position === 'static') {
      this.inputHost.style.position = 'relative';
    }

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.maxLength = GUEST_NAME_MAX_LEN;
    this.inputEl.placeholder = t('guest.namePlaceholder');
    this.inputEl.autocomplete = 'off';
    this.inputEl.autocapitalize = 'words';
    this.inputEl.spellcheck = false;
    this.inputEl.setAttribute('enterkeyhint', 'done');
    this.inputEl.setAttribute('autocorrect', 'off');
    this.inputEl.setAttribute('inputmode', 'text');
    // 16px min avoids iOS focus zoom; line-height = height keeps caret centered.
    const inputStyle = this.inputEl.style;
    inputStyle.position = 'absolute';
    inputStyle.zIndex = '40';
    inputStyle.display = 'none';
    inputStyle.border = 'none';
    inputStyle.outline = 'none';
    inputStyle.background = 'transparent';
    inputStyle.textAlign = 'center';
    inputStyle.fontFamily = UiTheme.font;
    inputStyle.fontWeight = '700';
    inputStyle.fontSize = '16px';
    inputStyle.lineHeight = `${FIELD_H}px`;
    inputStyle.color = UiTheme.ink;
    inputStyle.padding = '0 10px';
    inputStyle.margin = '0';
    inputStyle.boxSizing = 'border-box';
    inputStyle.setProperty('-webkit-appearance', 'none');
    inputStyle.appearance = 'none';
    inputStyle.transform = 'translateZ(0)';
    inputStyle.setProperty('-webkit-user-select', 'text');
    inputStyle.userSelect = 'text';
    // Prevent iOS from scrolling the focused caret outside the field box.
    inputStyle.overflow = 'hidden';
    this.inputHost.appendChild(this.inputEl);

    save.on('pointerup', () => {
      this.commit(true);
    });
    skip.on('pointerup', () => {
      this.audio.playSfx(Sound.UiClick);
      guestNameStore.setGender(this.gender);
      this.close();
    });
    this.inputEl.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.commit(true);
      }
    });
    this.inputEl.addEventListener('focus', this.onInputFocus);
    this.inputEl.addEventListener('blur', this.onInputBlur);

    scene.scale.on('resize', this.layoutInput, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.destroy();
    });

    this.refreshGenderChips();
  }

  public isOpen(): boolean {
    return this.open;
  }

  public show(prefill = true): void {
    if (this.open) {
      return;
    }
    this.open = true;
    this.gender = guestNameStore.getGender();
    this.refreshGenderChips();
    this.root.setVisible(true).setAlpha(0);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 1,
      duration: 200,
      ease: 'Cubic.Out',
    });

    this.inputEl.value =
      prefill && guestNameStore.hasCustomName()
        ? guestNameStore.getDisplayName()
        : '';
    this.inputEl.placeholder = t('guest.namePlaceholder');
    this.inputEl.style.display = 'block';
    this.bindViewportListeners(true);
    this.layoutInput();
    // Delay focus so first layout settles before Safari opens the keyboard.
    this.clearFocusTimer();
    this.focusTimer = window.setTimeout(() => {
      this.focusTimer = null;
      this.layoutInput();
      try {
        this.inputEl.focus({ preventScroll: true });
      } catch {
        this.inputEl.focus();
      }
      // Keyboard / visualViewport update after animation frames on iOS.
      this.scheduleRelayout(80);
      this.scheduleRelayout(200);
      this.scheduleRelayout(400);
    }, 120);
  }

  public destroy(): void {
    this.clearFocusTimer();
    this.clearRelayoutTimers();
    this.bindViewportListeners(false);
    this.scene.scale.off('resize', this.layoutInput, this);
    this.inputEl.removeEventListener('focus', this.onInputFocus);
    this.inputEl.removeEventListener('blur', this.onInputBlur);
    this.scene.tweens.killTweensOf(this.root);
    this.inputEl.remove();
    this.root.destroy(true);
    this.open = false;
  }

  private makeGenderChip(
    x: number,
    y: number,
    label: string,
    gender: GuestGender,
  ): Phaser.GameObjects.Container {
    const bg = this.scene.add
      .rectangle(0, 0, 100, 34, 0xfff8f0, 1)
      .setStrokeStyle(2, 0xe8b86d);
    const text = this.scene.add
      .text(0, 0, label, {
        fontFamily: UiTheme.font,
        fontSize: '14px',
        fontStyle: 'bold',
        color: UiTheme.ink,
      })
      .setOrigin(0.5);
    const root = this.scene.add
      .container(x, y, [bg, text])
      .setSize(100, 34)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true)
      .setData('bg', bg)
      .setData('gender', gender);

    root.on('pointerup', () => {
      this.audio.playSfx(Sound.UiToggle);
      this.gender = gender;
      this.refreshGenderChips();
    });

    return root;
  }

  private refreshGenderChips(): void {
    for (const chip of [this.maleChip, this.femaleChip]) {
      const bg = chip.getData('bg') as Phaser.GameObjects.Rectangle;
      const selected = chip.getData('gender') === this.gender;
      bg.setFillStyle(selected ? 0xffe0c8 : 0xfff8f0, 1);
      bg.setStrokeStyle(2.5, selected ? 0xd4a017 : 0xe8b86d);
      chip.setScale(selected ? 1.04 : 1);
    }
  }

  private commit(playSound: boolean): void {
    if (playSound) {
      this.audio.playSfx(Sound.UiClick);
    }
    guestNameStore.setProfile(this.inputEl.value, this.gender);
    this.close();
  }

  private close(): void {
    if (!this.open) {
      return;
    }
    this.open = false;
    this.clearFocusTimer();
    this.clearRelayoutTimers();
    this.bindViewportListeners(false);
    this.inputEl.blur();
    this.inputEl.style.display = 'none';
    // Restore centered panel for next open.
    const { width, height } = this.scene.scale;
    this.root.setPosition(width / 2, height / 2);
    this.dim.setPosition(0, 0);
    this.scene.tweens.killTweensOf(this.root);
    this.scene.tweens.add({
      targets: this.root,
      alpha: 0,
      duration: 160,
      ease: 'Sine.In',
      onComplete: () => {
        this.root.setVisible(false);
        this.onDone();
      },
    });
  }

  private onInputFocus = (): void => {
    this.layoutInput();
    window.requestAnimationFrame(() => this.layoutInput());
    this.scheduleRelayout(100);
    this.scheduleRelayout(280);
  };

  private onInputBlur = (): void => {
    this.layoutInput();
  };

  private clearFocusTimer(): void {
    if (this.focusTimer !== null) {
      window.clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }

  private scheduleRelayout(delayMs: number): void {
    const id = window.setTimeout(() => {
      this.relayoutTimers = this.relayoutTimers.filter((t) => t !== id);
      this.layoutInput();
    }, delayMs);
    this.relayoutTimers.push(id);
  }

  private clearRelayoutTimers(): void {
    for (const id of this.relayoutTimers) {
      window.clearTimeout(id);
    }
    this.relayoutTimers = [];
  }

  private bindViewportListeners(active: boolean): void {
    const vv = window.visualViewport;
    if (active) {
      vv?.addEventListener('resize', this.layoutInput);
      vv?.addEventListener('scroll', this.layoutInput);
      window.addEventListener('resize', this.layoutInput);
    } else {
      vv?.removeEventListener('resize', this.layoutInput);
      vv?.removeEventListener('scroll', this.layoutInput);
      window.removeEventListener('resize', this.layoutInput);
    }
  }

  /**
   * Place the modal + DOM field inside the visible area above the keyboard.
   * Uses host-relative absolute positioning (stable on iOS Safari).
   */
  private layoutInput = (): void => {
    if (!this.open) {
      return;
    }
    const { width, height } = this.scene.scale;
    const canvas = this.scene.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    if (canvasRect.width <= 0 || canvasRect.height <= 0) {
      return;
    }

    const hostRect = this.inputHost.getBoundingClientRect();
    // getBoundingClientRect is visual-viewport relative — do not mix with offsetTop.
    const viewH = window.visualViewport?.height ?? window.innerHeight;
    const viewW = window.visualViewport?.width ?? window.innerWidth;

    const clipTop = Math.max(canvasRect.top, 0);
    const clipBottom = Math.min(canvasRect.bottom, viewH);
    const clipLeft = Math.max(canvasRect.left, 0);
    const clipRight = Math.min(canvasRect.right, viewW);
    const clipH = Math.max(1, clipBottom - clipTop);
    const clipW = Math.max(1, clipRight - clipLeft);

    // Only lift the panel when the keyboard has shrunk the visual viewport.
    const layoutH = window.innerHeight;
    const keyboardOpen = viewH < layoutH * 0.82;

    let rootY = height / 2;
    if (keyboardOpen) {
      const fieldCyVisible = clipTop + Math.min(clipH * 0.36, 150);
      rootY =
        ((fieldCyVisible - canvasRect.top) / canvasRect.height) * height -
        FIELD_LOCAL_Y;
      rootY = Math.min(height * 0.52, Math.max(height * 0.22, rootY));
    }

    this.root.setPosition(width / 2, rootY);
    // Keep dim covering the full canvas while the panel is shifted up.
    this.dim.setPosition(0, height / 2 - rootY);
    this.dim.setSize(width, height);

    const fieldGameY = rootY + FIELD_LOCAL_Y;
    const fieldCssCx = (clipLeft + clipRight) / 2;
    const fieldCssCy =
      canvasRect.top + (fieldGameY / height) * canvasRect.height;
    const fieldCssW = Math.min(
      FIELD_W * (canvasRect.width / width),
      clipW * 0.72,
    );
    const fieldCssH = Math.max(36, FIELD_H * (canvasRect.height / height));

    const style = this.inputEl.style;
    style.width = `${fieldCssW}px`;
    style.height = `${fieldCssH}px`;
    style.lineHeight = `${fieldCssH}px`;
    // Absolute coords relative to game host — both rects share visual space.
    style.left = `${fieldCssCx - fieldCssW / 2 - hostRect.left}px`;
    style.top = `${fieldCssCy - fieldCssH / 2 - hostRect.top}px`;
  };
}
