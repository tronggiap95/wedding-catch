import Phaser from 'phaser';
import { Colors } from '../constants/Colors';
import { Depth } from '../constants/Depth';
import { RegistryKey } from '../constants/RegistryKey';
import { Sound } from '../constants/Sound';
import { TextureKey } from '../constants/TextureKey';
import { LOCALE_LABELS, LOCALES, localeStore, t } from '../i18n';
import type { Locale } from '../i18n/types';
import type { AudioManager } from '../managers/AudioManager';
import type { ResponsiveManager } from '../managers/ResponsiveManager';
import { guestNameStore } from '../state/GuestNameStore';
import { AudioHub } from '../ui/AudioHub';
import { GuestNameModal } from '../ui/GuestNameModal';
import {
  createIconButton,
  createMenuPlateButton,
  createPrimaryButton,
  fitImageDisplaySize,
  fitTextureSize,
} from '../ui/UiFactory';
import { UiTheme } from '../ui/UiTheme';
import { SceneKey } from '../types/SceneKey';

type OverlayKind = 'guide' | 'rank';

const RANK_NAME_KEYS = [
  'rank.name.bride',
  'rank.name.groom',
  'rank.name.friendA',
  'rank.name.friendB',
  'rank.name.guestC',
  'rank.name.guestD',
  'rank.name.guestE',
  'rank.you',
] as const;

const RANK_SCORES = [
  128_400, 112_050, 98_700, 76_320, 54_180, 41_900, 33_250, 0,
] as const;

const LANG_TEXTURE: Record<Locale, string> = {
  vi: TextureKey.UiLangVi,
  en: TextureKey.UiLangEn,
  zh: TextureKey.UiLangZh,
};

/**
 * Welcome / start screen — polished casual-game menu.
 */
export class MenuScene extends Phaser.Scene {
  private banner: Phaser.GameObjects.Image | null = null;
  private brandTitle: Phaser.GameObjects.Text | null = null;
  private coupleNames: Phaser.GameObjects.Text | null = null;
  private welcome: Phaser.GameObjects.Text | null = null;
  private editNameBtn: Phaser.GameObjects.Text | null = null;
  private languageRoot: Phaser.GameObjects.Container | null = null;
  private couple: Phaser.GameObjects.Image | null = null;
  private playButton: Phaser.GameObjects.Container | null = null;
  private guideButton: Phaser.GameObjects.Container | null = null;
  private rankButton: Phaser.GameObjects.Container | null = null;
  private settingsButton: Phaser.GameObjects.Container | null = null;
  private muteButton: Phaser.GameObjects.Image | null = null;
  private rankIcon: Phaser.GameObjects.Image | null = null;
  private overlay: Phaser.GameObjects.Container | null = null;
  private overlayDim: Phaser.GameObjects.Rectangle | null = null;
  private overlayKind: OverlayKind | null = null;
  private audioHub: AudioHub | null = null;
  private nameModal: GuestNameModal | null = null;
  private floatHearts: Phaser.GameObjects.Image[] = [];
  private unsubscribe: (() => void) | null = null;
  private unsubscribeLocale: (() => void) | null = null;
  private unsubscribeGuestName: (() => void) | null = null;
  private starting = false;
  private playPulse: Phaser.Tweens.Tween | null = null;

  public constructor() {
    super({ key: SceneKey.Menu });
  }

  public create(): void {
    this.starting = false;
    this.overlayKind = null;
    this.floatHearts = [];

    const responsive = this.registry.get(
      RegistryKey.ResponsiveManager,
    ) as ResponsiveManager;
    const audio = this.registry.get(RegistryKey.AudioManager) as AudioManager;
    const { width, height } = this.scale;

    this.buildBackdrop(width, height);
    this.buildDecor(width, height);
    this.buildHero(width, height);
    this.buildLanguagePicker(audio, width, height);
    this.buildButtons(audio);
    this.buildChrome(audio, width);

    this.audioHub = new AudioHub(this, audio, () => {
      this.refreshMute(audio);
    });

    this.nameModal = new GuestNameModal(this, audio, () => {
      this.refreshWelcome();
    });

    audio.ensureThemeBgm();
    this.playEntrance();
    this.startIdleMotion();

    this.unsubscribe = responsive.subscribe(({ width: w, height: h }) => {
      this.layout(w, h);
    });

    this.unsubscribeLocale = localeStore.subscribe(() => {
      this.scene.restart();
    });

    this.unsubscribeGuestName = guestNameStore.subscribe(() => {
      this.refreshWelcome();
    });

    this.input.once('pointerdown', () => {
      audio.unlock();
      audio.ensureThemeBgm();
    });

    // First visit: ask for a guest name after the entrance settles.
    if (!guestNameStore.hasCustomName()) {
      this.time.delayedCall(700, () => {
        if (!this.starting) {
          this.nameModal?.show(false);
        }
      });
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.playPulse?.stop();
      this.playPulse = null;
      this.unsubscribe?.();
      this.unsubscribe = null;
      this.unsubscribeLocale?.();
      this.unsubscribeLocale = null;
      this.unsubscribeGuestName?.();
      this.unsubscribeGuestName = null;
      this.audioHub?.destroy();
      this.audioHub = null;
      this.nameModal?.destroy();
      this.nameModal = null;
      this.overlay?.destroy(true);
      this.overlay = null;
      this.overlayDim = null;
      this.banner = null;
      this.brandTitle = null;
      this.coupleNames = null;
      this.welcome = null;
      this.editNameBtn = null;
      this.languageRoot = null;
      this.couple = null;
      this.playButton = null;
      this.guideButton = null;
      this.rankButton = null;
      this.settingsButton = null;
      this.muteButton = null;
      this.rankIcon = null;
      this.floatHearts = [];
    });
  }

  private buildBackdrop(width: number, height: number): void {
    if (this.textures.exists(TextureKey.BgStage1)) {
      const bg = this.add
        .image(width / 2, height / 2, TextureKey.BgStage1)
        .setDepth(Depth.Background);
      const frame = bg.frame;
      const scale = Math.max(width / frame.width, height / frame.height);
      bg.setDisplaySize(frame.width * scale, frame.height * scale);
    } else {
      this.add
        .rectangle(width / 2, height / 2, width, height, Colors.Background)
        .setDepth(Depth.Background);
    }

    this.add
      .rectangle(width / 2, height / 2, width, height, 0xfff5eb, 0.48)
      .setDepth(Depth.Background);

    this.add
      .rectangle(width / 2, height * 0.82, width, height * 0.42, 0xffe8d6, 0.35)
      .setDepth(Depth.Background);
  }

  private buildDecor(width: number, height: number): void {
    if (!this.textures.exists(TextureKey.UiHeartFull)) {
      return;
    }

    for (let i = 0; i < 6; i += 1) {
      const heart = this.add
        .image(
          Phaser.Math.Between(24, Math.floor(width - 24)),
          Phaser.Math.Between(Math.floor(height * 0.15), Math.floor(height * 0.75)),
          TextureKey.UiHeartFull,
        )
        .setDisplaySize(18 + (i % 3) * 4, 18 + (i % 3) * 4)
        .setAlpha(0.18 + (i % 3) * 0.05)
        .setDepth(Depth.Background + 1)
        .setScrollFactor(0);
      this.floatHearts.push(heart);
    }
  }

  private buildHero(width: number, height: number): void {
    this.couple = this.add
      .image(width / 2, height * 0.5, TextureKey.CoupleIdle)
      .setDepth(Depth.CharactersTop)
      .setAlpha(0);

    const coupleH = Math.min(210, height * 0.28);
    const frame = this.couple.frame;
    const aspect = frame.width / frame.height;
    this.couple.setDisplaySize(coupleH * aspect, coupleH);

    this.banner = this.add
      .image(width / 2, height * 0.15, TextureKey.UiMenuBanner)
      .setDepth(Depth.Hud)
      .setAlpha(0);
    this.fitBanner(width, height);

    this.brandTitle = this.add
      .text(width / 2, height * 0.145, t('menu.title'), {
        fontFamily: UiTheme.font,
        fontSize: '28px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setAlpha(0);

    this.coupleNames = this.add
      .text(width / 2, height * 0.23, t('menu.coupleNames'), {
        fontFamily: UiTheme.font,
        fontSize: '22px',
        fontStyle: 'bold',
        color: UiTheme.ink,
        stroke: '#fff8f0',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setAlpha(0);

    this.welcome = this.add
      .text(width / 2, height * 0.29, this.welcomeMessage(), {
        fontFamily: UiTheme.font,
        fontSize: '15px',
        color: UiTheme.inkSoft,
        align: 'center',
        lineSpacing: 5,
        wordWrap: { width: width * 0.8 },
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setAlpha(0);

    this.editNameBtn = this.add
      .text(width / 2, height * 0.325, t('menu.editName'), {
        fontFamily: UiTheme.font,
        fontSize: '13px',
        fontStyle: 'bold',
        color: UiTheme.rose,
        stroke: '#fff8f0',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(Depth.Hud)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    this.editNameBtn.on('pointerup', () => {
      const audio = this.registry.get(RegistryKey.AudioManager) as AudioManager;
      if (this.audioHub?.isOpen() || this.nameModal?.isOpen()) {
        return;
      }
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      this.nameModal?.show(true);
    });
  }

  private welcomeMessage(): string {
    return t('menu.welcomeNamed', { name: guestNameStore.getDisplayName() });
  }

  private refreshWelcome(): void {
    this.welcome?.setText(this.welcomeMessage());
  }

  private buildLanguagePicker(
    audio: AudioManager,
    width: number,
    height: number,
  ): void {
    const chipSize = 38;
    const gap = 14;
    const totalW = LOCALES.length * chipSize + (LOCALES.length - 1) * gap;
    const startX = -totalW / 2 + chipSize / 2;
    const active = localeStore.getLocale();
    const chips: Phaser.GameObjects.GameObject[] = [];

    LOCALES.forEach((locale, index) => {
      const x = startX + index * (chipSize + gap);
      chips.push(
        this.createLanguageChip(x, 0, locale, chipSize, locale === active, audio),
      );
    });

    this.languageRoot = this.add
      .container(width / 2, height * 0.355, chips)
      .setDepth(Depth.Hud)
      .setAlpha(0);
  }

  private createLanguageChip(
    x: number,
    y: number,
    locale: Locale,
    size: number,
    selected: boolean,
    audio: AudioManager,
  ): Phaser.GameObjects.Container {
    const ring = this.add
      .circle(0, 0, size / 2 + 3, selected ? 0xd4a017 : 0xfff8f0, selected ? 1 : 0.85)
      .setStrokeStyle(2, selected ? 0x8b3a3a : 0xd4a017);

    const icon = this.add
      .image(0, 0, LANG_TEXTURE[locale])
      .setDisplaySize(size, size);

    const caption = this.add
      .text(0, size / 2 + 10, LOCALE_LABELS[locale], {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        fontStyle: 'bold',
        color: selected ? UiTheme.ink : UiTheme.inkSoft,
      })
      .setOrigin(0.5, 0);

    const hit = this.add
      .zone(0, 4, size + 8, size + 24)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    const root = this.add.container(x, y, [ring, icon, caption, hit]);

    hit.on('pointerup', () => {
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      if (localeStore.getLocale() === locale) {
        return;
      }
      localeStore.setLocale(locale);
    });

    return root;
  }

  private buildButtons(audio: AudioManager): void {
    const { width, height } = this.scale;

    this.playButton = createPrimaryButton(
      this,
      width / 2,
      height * 0.66,
      t('menu.playNow'),
      250,
      70,
      TextureKey.UiBtnPrimary,
    );
    this.playButton.on('pointerup', () => {
      if (this.nameModal?.isOpen() || this.audioHub?.isOpen()) {
        return;
      }
      this.startGame(audio);
    });

    this.guideButton = createMenuPlateButton(
      this,
      width / 2,
      height * 0.755,
      t('menu.guide'),
      200,
      48,
    );
    this.guideButton.on('pointerup', () => {
      if (this.audioHub?.isOpen() || this.nameModal?.isOpen()) {
        return;
      }
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      this.showOverlay('guide', audio);
    });

    this.rankButton = createMenuPlateButton(
      this,
      width / 2,
      height * 0.83,
      t('menu.rank'),
      200,
      48,
    );
    this.rankButton.on('pointerup', () => {
      if (this.audioHub?.isOpen()) {
        return;
      }
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      this.showOverlay('rank', audio);
    });

    this.settingsButton = createMenuPlateButton(
      this,
      width / 2,
      height * 0.905,
      t('menu.settings'),
      200,
      48,
    );
    this.settingsButton.on('pointerup', () => {
      if (this.overlayKind !== null) {
        return;
      }
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      this.audioHub?.show();
    });
  }

  private buildChrome(audio: AudioManager, width: number): void {
    const muteY = UiTheme.topPad + UiTheme.iconBtn / 2;
    const muteX = width - 16 - UiTheme.iconBtn / 2;

    this.muteButton = createIconButton(
      this,
      muteX,
      muteY,
      audio.isMuted() ? TextureKey.UiBtnSoundOff : TextureKey.UiBtnSoundOn,
    );
    this.muteButton.on('pointerup', () => {
      audio.unlock();
      audio.toggleMute();
      audio.playSfx(Sound.UiToggle);
      this.refreshMute(audio);
    });

    this.rankIcon = createIconButton(
      this,
      16 + UiTheme.iconBtn / 2,
      muteY,
      TextureKey.UiBtnRank,
    );
    this.rankIcon.on('pointerup', () => {
      if (this.audioHub?.isOpen()) {
        return;
      }
      audio.unlock();
      audio.playSfx(Sound.UiClick);
      this.showOverlay('rank', audio);
    });
  }

  private fitBanner(w: number, h: number): void {
    if (this.banner === null) {
      return;
    }
    const fitted = fitTextureSize(
      this.banner.frame.width,
      this.banner.frame.height,
      Math.min(340, w * 0.9),
      Math.min(110, h * 0.14),
    );
    fitImageDisplaySize(this.banner, fitted.width, fitted.height);
  }

  private layout(w: number, h: number): void {
    this.banner?.setPosition(w / 2, h * 0.15);
    this.fitBanner(w, h);
    this.brandTitle?.setPosition(w / 2, h * 0.145);
    this.coupleNames?.setPosition(w / 2, h * 0.23);
    this.welcome?.setPosition(w / 2, h * 0.285);
    this.editNameBtn?.setPosition(w / 2, h * 0.322);
    this.languageRoot?.setPosition(w / 2, h * 0.365);

    if (this.couple !== null) {
      const coupleH = Math.min(210, h * 0.28);
      const frame = this.couple.frame;
      const aspect = frame.width / frame.height;
      this.couple
        .setPosition(w / 2, h * 0.5)
        .setDisplaySize(coupleH * aspect, coupleH);
    }

    this.playButton?.setPosition(w / 2, h * 0.66);
    this.guideButton?.setPosition(w / 2, h * 0.755);
    this.rankButton?.setPosition(w / 2, h * 0.83);
    this.settingsButton?.setPosition(w / 2, h * 0.905);
    this.muteButton?.setPosition(
      w - 16 - UiTheme.iconBtn / 2,
      UiTheme.topPad + UiTheme.iconBtn / 2,
    );
    this.rankIcon?.setPosition(
      16 + UiTheme.iconBtn / 2,
      UiTheme.topPad + UiTheme.iconBtn / 2,
    );
    this.overlay?.setPosition(w / 2, h / 2);
    if (this.overlayDim !== null) {
      this.overlayDim.setSize(w, h);
    }
  }

  private playEntrance(): void {
    const fadeUp = (
      target: { y: number; setAlpha: (v: number) => unknown } | null,
      delay: number,
      fromY = 18,
    ): void => {
      if (target === null) {
        return;
      }
      const destY = target.y;
      target.setAlpha(0);
      target.y = destY + fromY;
      this.tweens.add({
        targets: target,
        alpha: 1,
        y: destY,
        duration: 420,
        delay,
        ease: 'Back.Out',
      });
    };

    fadeUp(this.banner, 40, 24);
    fadeUp(this.brandTitle, 80, 16);
    fadeUp(this.coupleNames, 140, 14);
    fadeUp(this.welcome, 180, 12);
    fadeUp(this.editNameBtn, 200, 10);
    fadeUp(this.languageRoot, 220, 10);
    fadeUp(this.couple, 200, 28);
    fadeUp(this.playButton, 280, 28);
    fadeUp(this.guideButton, 330, 20);
    fadeUp(this.rankButton, 370, 18);
    fadeUp(this.settingsButton, 410, 16);

    if (this.muteButton !== null) {
      this.muteButton.setAlpha(0);
      this.tweens.add({
        targets: this.muteButton,
        alpha: 1,
        duration: 300,
        delay: 200,
      });
    }
    if (this.rankIcon !== null) {
      this.rankIcon.setAlpha(0);
      this.tweens.add({
        targets: this.rankIcon,
        alpha: 1,
        duration: 300,
        delay: 200,
      });
    }
  }

  private startIdleMotion(): void {
    if (this.couple !== null) {
      this.tweens.add({
        targets: this.couple,
        y: this.couple.y - 8,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    }

    if (this.playButton !== null) {
      const plate = this.playButton.getData('plate') as
        | Phaser.GameObjects.Image
        | undefined;
      const baseW = this.playButton.getData('baseW') as number | undefined;
      const baseH = this.playButton.getData('baseH') as number | undefined;
      if (plate !== undefined && baseW !== undefined && baseH !== undefined) {
        this.playPulse = this.tweens.add({
          targets: plate,
          displayWidth: baseW * 1.04,
          displayHeight: baseH * 1.04,
          duration: 900,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.InOut',
          delay: 700,
        });
      }
    }

    this.floatHearts.forEach((heart, index) => {
      this.tweens.add({
        targets: heart,
        y: heart.y - Phaser.Math.Between(18, 36),
        alpha: heart.alpha * 0.55,
        duration: 2800 + index * 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: index * 180,
      });
      this.tweens.add({
        targets: heart,
        angle: index % 2 === 0 ? 12 : -12,
        duration: 2200 + index * 150,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
    });

    if (this.coupleNames !== null) {
      this.tweens.add({
        targets: this.coupleNames,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
        delay: 500,
      });
    }
  }

  private startGame(audio: AudioManager): void {
    if (
      this.starting ||
      this.overlayKind !== null ||
      this.audioHub?.isOpen()
    ) {
      return;
    }
    this.starting = true;
    this.playPulse?.stop();
    audio.unlock();
    audio.playSfx(Sound.UiClick);
    audio.playSfx(Sound.GameStart);
    this.scene.start(SceneKey.Countdown);
  }

  private refreshMute(audio: AudioManager): void {
    if (this.muteButton === null) {
      return;
    }
    const size =
      (this.muteButton.getData('iconSize') as number) ?? UiTheme.iconBtn;
    const tex = audio.isMuted()
      ? TextureKey.UiBtnSoundOff
      : TextureKey.UiBtnSoundOn;
    this.muteButton.setTexture(tex).setDisplaySize(size, size);
  }

  private showOverlay(kind: OverlayKind, audio: AudioManager): void {
    this.hideOverlay();
    this.overlayKind = kind;
    this.setMenuButtonsEnabled(false);

    const { width, height } = this.scale;
    const panelW = Math.min(330, width * 0.9);
    const panelH = Math.min(440, height * 0.72);

    this.overlayDim = this.add
      .rectangle(0, 0, width, height, 0x5c3d2e, 0.55)
      .setInteractive()
      .setData('isHud', true);

    const panel = this.add
      .image(0, 0, TextureKey.UiPanel)
      .setDisplaySize(panelW, panelH)
      .setData('isHud', true);

    const title = this.add
      .text(
        0,
        -panelH / 2 + 36,
        kind === 'guide' ? t('guide.title') : t('rank.title'),
        {
          fontFamily: UiTheme.font,
          fontSize: '26px',
          fontStyle: 'bold',
          color: UiTheme.ink,
          stroke: '#fff8f0',
          strokeThickness: 4,
        },
      )
      .setOrigin(0.5);

    const guideBody = [
      t('guide.line1'),
      t('guide.line2'),
      t('guide.line3'),
      t('guide.line4'),
      '',
      t('guide.footer'),
    ].join('\n');

    const body =
      kind === 'guide'
        ? this.add
            .text(0, -8, guideBody, {
              fontFamily: UiTheme.font,
              fontSize: '15px',
              color: UiTheme.ink,
              align: 'left',
              lineSpacing: 5,
              wordWrap: { width: panelW * 0.78 },
            })
            .setOrigin(0.5)
        : this.buildRankList(panelW, panelH);

    const close = this.add
      .text(0, panelH / 2 - 40, t('menu.close'), {
        fontFamily: UiTheme.font,
        fontSize: '18px',
        fontStyle: 'bold',
        color: UiTheme.cream,
        backgroundColor: '#c97b84',
        padding: { x: 24, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .setData('isHud', true);

    close.on('pointerup', () => {
      audio.playSfx(Sound.UiClick);
      this.hideOverlay();
    });
    this.overlayDim.on('pointerup', () => {
      this.hideOverlay();
    });

    this.overlay = this.add
      .container(width / 2, height / 2, [
        this.overlayDim,
        panel,
        title,
        body,
        close,
      ])
      .setDepth(Depth.Popup)
      .setAlpha(0)
      .setScale(0.92);

    this.tweens.add({
      targets: this.overlay,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 220,
      ease: 'Back.Out',
    });
  }

  private buildRankList(
    panelW: number,
    panelH: number,
  ): Phaser.GameObjects.Container {
    const lines: Phaser.GameObjects.GameObject[] = [];
    const startY = -panelH / 2 + 78;

    RANK_NAME_KEYS.forEach((nameKey, index) => {
      const y = startY + index * 34;
      const score = RANK_SCORES[index] ?? 0;
      const rank = `#${index + 1}`;
      const scoreLabel =
        score > 0 ? localeStore.formatNumber(score) : '—';
      const color = index < 3 ? UiTheme.ink : UiTheme.inkSoft;

      lines.push(
        this.add
          .text(-panelW * 0.38, y, `${rank}  ${t(nameKey)}`, {
            fontFamily: UiTheme.font,
            fontSize: '14px',
            fontStyle: index < 3 ? 'bold' : 'normal',
            color,
          })
          .setOrigin(0, 0.5),
      );
      lines.push(
        this.add
          .text(panelW * 0.38, y, scoreLabel, {
            fontFamily: UiTheme.font,
            fontSize: '14px',
            fontStyle: 'bold',
            color,
          })
          .setOrigin(1, 0.5),
      );
    });

    const note = this.add
      .text(0, panelH / 2 - 78, t('rank.notice'), {
        fontFamily: UiTheme.font,
        fontSize: '12px',
        color: UiTheme.inkSoft,
        align: 'center',
      })
      .setOrigin(0.5);
    lines.push(note);

    return this.add.container(0, 0, lines);
  }

  private hideOverlay(): void {
    if (this.overlay === null) {
      return;
    }
    this.overlayDim?.disableInteractive();
    this.overlay.destroy(true);
    this.overlay = null;
    this.overlayDim = null;
    this.overlayKind = null;
    this.setMenuButtonsEnabled(true);
  }

  private setMenuButtonsEnabled(enabled: boolean): void {
    for (const btn of [
      this.playButton,
      this.guideButton,
      this.rankButton,
      this.settingsButton,
    ]) {
      const hit = btn?.getData('hitZone') as Phaser.GameObjects.Zone | undefined;
      if (hit?.input !== null && hit?.input !== undefined) {
        hit.input.enabled = enabled;
      }
    }
  }
}
