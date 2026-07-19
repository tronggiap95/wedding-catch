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

/**
 * Cute name + gender entry overlay (Phaser panel + DOM input).
 */
export class GuestNameModal {
  private readonly scene: Phaser.Scene;
  private readonly audio: AudioManager;
  private readonly root: Phaser.GameObjects.Container;
  private readonly dim: Phaser.GameObjects.Rectangle;
  private readonly maleChip: Phaser.GameObjects.Container;
  private readonly femaleChip: Phaser.GameObjects.Container;
  private readonly inputEl: HTMLInputElement;
  private readonly onDone: () => void;
  private open = false;
  private gender: GuestGender = 'male';

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
      .rectangle(0, 12, 240, 42, 0xfff8f0, 1)
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

    this.inputEl = document.createElement('input');
    this.inputEl.type = 'text';
    this.inputEl.maxLength = GUEST_NAME_MAX_LEN;
    this.inputEl.placeholder = t('guest.namePlaceholder');
    this.inputEl.autocomplete = 'off';
    this.inputEl.setAttribute('enterkeyhint', 'done');
    Object.assign(this.inputEl.style, {
      position: 'fixed',
      zIndex: '40',
      display: 'none',
      border: 'none',
      outline: 'none',
      background: 'transparent',
      textAlign: 'center',
      fontFamily: UiTheme.font,
      fontWeight: '700',
      fontSize: '16px',
      color: UiTheme.ink,
      padding: '0',
      margin: '0',
      boxSizing: 'border-box',
    } as CSSStyleDeclaration);
    document.body.appendChild(this.inputEl);

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
    const { width, height } = this.scene.scale;
    this.dim.setSize(width, height);
    this.root.setPosition(width / 2, height / 2).setVisible(true).setAlpha(0);
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
    this.layoutInput();
    window.setTimeout(() => {
      this.inputEl.focus();
      this.inputEl.select();
    }, 80);
  }

  public destroy(): void {
    this.scene.scale.off('resize', this.layoutInput, this);
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
    this.inputEl.blur();
    this.inputEl.style.display = 'none';
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

  private layoutInput = (): void => {
    if (!this.open) {
      return;
    }
    const canvas = this.scene.game.canvas;
    const rect = canvas.getBoundingClientRect();
    const fieldW = Math.min(220, rect.width * 0.62);
    const fieldH = 36;
    const cx = rect.left + rect.width / 2;
    // Match fieldBg local y=12 inside centered modal.
    const cy = rect.top + rect.height / 2 + 12;
    this.inputEl.style.width = `${fieldW}px`;
    this.inputEl.style.height = `${fieldH}px`;
    this.inputEl.style.left = `${cx - fieldW / 2}px`;
    this.inputEl.style.top = `${cy - fieldH / 2}px`;
  };
}
