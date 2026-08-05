import Phaser from 'phaser';
import { Depth } from '../constants/Depth';
import { TextureKey } from '../constants/TextureKey';
import { pickThrowerLine } from '../data/throwerDialogue';
import { localeStore, t } from '../i18n';
import {
  guestNameStore,
  type GuestGender,
} from '../state/GuestNameStore';
import type { ItemCategory } from '../types/config';
import { UiTheme } from '../ui/UiTheme';

export type ThrowerRole = 'devil' | 'guest' | 'angel';

interface SpeechBubble {
  readonly root: Phaser.GameObjects.Container;
  readonly bg: Phaser.GameObjects.Graphics;
  readonly text: Phaser.GameObjects.Text;
  hideTimer: Phaser.Time.TimerEvent | null;
}

interface ThrowerActor {
  readonly role: ThrowerRole;
  idleKey: string;
  throwKey: string;
  readonly sprite: Phaser.GameObjects.Image;
  readonly speech: SpeechBubble;
  readonly size: number;
  bobMs: number;
  busy: boolean;
  /** Remaining ms before this thrower may speak again. */
  speechCooldownMs: number;
}

const SPEECH_CHANCE: Record<ThrowerRole, number> = {
  guest: 0.62,
  devil: 0.58,
  angel: 0.88,
};
const SPEECH_COOLDOWN: Record<
  ThrowerRole,
  { min: number; max: number; skipMin: number; skipMax: number }
> = {
  guest: { min: 1800, max: 4200, skipMin: 400, skipMax: 1100 },
  devil: { min: 1800, max: 4200, skipMin: 400, skipMax: 1100 },
  angel: { min: 1200, max: 2800, skipMin: 250, skipMax: 700 },
};
const SPEECH_HOLD_MS = 2400;
const BUBBLE_MAX_WIDTH = 118;
const SIDE_SIZE = 78;
const GUEST_SIZE = 94;
/** Character body Y — clear of HUD row so name tags are not covered. */
const ROOT_Y = 132;
/** Name tag offset above sprite center (relative to display size). */
const NAME_TAG_OFFSET = 0.62;

const ROLE_INK: Record<ThrowerRole, string> = {
  guest: '#5c3d2e',
  devil: '#7a1020',
  angel: '#4a3d7a',
};

const ROLE_FILL: Record<ThrowerRole, number> = {
  guest: 0xfff6ea,
  devil: 0xffe8ec,
  angel: 0xf3efff,
};

const ROLE_STROKE: Record<ThrowerRole, number> = {
  guest: 0xe8b86d,
  devil: 0xe63946,
  angel: 0x9b7edc,
};

/**
 * Top throwers: devil (bad), guest (good), angel (bonus).
 */
interface RoleNameTag {
  readonly root: Phaser.GameObjects.Container;
  readonly bg: Phaser.GameObjects.Graphics;
  readonly text: Phaser.GameObjects.Text;
}

/** Top throwers: devil (bad), guest (good), angel (bonus). */
export class ThrowerCharacters {
  private readonly scene: Phaser.Scene;
  private readonly actors: Record<ThrowerRole, ThrowerActor>;
  private readonly rootY: number;
  private readonly nameTags: Record<ThrowerRole, RoleNameTag>;
  private unsubscribeGuestName: (() => void) | null = null;
  private unsubscribeLocale: (() => void) | null = null;

  public constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const { width } = scene.scale;
    this.rootY = ROOT_Y;
    const guestKeys = guestTextures(guestNameStore.getGender());

    this.actors = {
      devil: this.makeActor(
        'devil',
        TextureKey.CharDevilIdle,
        TextureKey.CharDevilThrow,
        44,
        SIDE_SIZE,
      ),
      guest: this.makeActor(
        'guest',
        guestKeys.idle,
        guestKeys.throwKey,
        width / 2,
        GUEST_SIZE,
      ),
      angel: this.makeActor(
        'angel',
        TextureKey.CharAngelIdle,
        TextureKey.CharAngelThrow,
        width - 44,
        SIDE_SIZE,
      ),
    };

    this.nameTags = {
      devil: this.makeNameTag(this.actors.devil),
      guest: this.makeNameTag(this.actors.guest),
      angel: this.makeNameTag(this.actors.angel),
    };

    this.refreshAllNameTags();
    this.applyGuestGender(guestNameStore.getGender());
    this.unsubscribeGuestName = guestNameStore.subscribe(() => {
      this.refreshNameTag('guest');
      this.applyGuestGender(guestNameStore.getGender());
    });
    this.unsubscribeLocale = localeStore.subscribe(() => {
      this.refreshAllNameTags();
    });
  }

  public static roleForCategory(category: ItemCategory): ThrowerRole {
    if (category === 'bad') {
      return 'devil';
    }
    if (category === 'bonus') {
      return 'angel';
    }
    return 'guest';
  }

  public getReleasePoint(role: ThrowerRole): { x: number; y: number } {
    const actor = this.actors[role];
    return {
      x: actor.sprite.x,
      y: actor.sprite.y + actor.size * 0.28,
    };
  }

  public throwAt(
    role: ThrowerRole,
    targetX: number,
    onRelease: (releaseX: number, releaseY: number) => void,
  ): void {
    const actor = this.actors[role];
    const lean = Phaser.Math.Clamp((targetX - actor.sprite.x) * 0.04, -12, 12);

    this.maybeSpeak(actor);

    if (actor.busy) {
      const release = this.getReleasePoint(role);
      onRelease(release.x, release.y);
      this.playThrowVisual(actor, lean, null);
      return;
    }

    this.playThrowVisual(actor, lean, onRelease);
  }

  public refreshGuestName(): void {
    this.refreshNameTag('guest');
  }

  public update(deltaMs: number): void {
    (Object.keys(this.actors) as ThrowerRole[]).forEach((role) => {
      const actor = this.actors[role];
      actor.speechCooldownMs = Math.max(0, actor.speechCooldownMs - deltaMs);

      if (!actor.busy) {
        actor.bobMs += deltaMs;
        // Female guest: softer sway; male guest: livelier bounce.
        const bobPeriod =
          role === 'guest' && guestNameStore.getGender() === 'female'
            ? 520
            : role === 'guest'
              ? 360
              : 420;
        const bobAmp =
          role === 'guest' && guestNameStore.getGender() === 'female'
            ? 1.6
            : role === 'guest'
              ? 2.8
              : 2.2;
        actor.sprite.y =
          this.rootY + Math.sin(actor.bobMs / bobPeriod + role.length) * bobAmp;
      }

      this.syncSpeech(actor);
      this.syncNameTag(role);
    });
  }

  public destroy(): void {
    this.unsubscribeGuestName?.();
    this.unsubscribeGuestName = null;
    this.unsubscribeLocale?.();
    this.unsubscribeLocale = null;

    (Object.keys(this.nameTags) as ThrowerRole[]).forEach((role) => {
      this.nameTags[role].root.destroy(true);
    });

    (Object.keys(this.actors) as ThrowerRole[]).forEach((role) => {
      const actor = this.actors[role];
      this.scene.tweens.killTweensOf(actor.sprite);
      this.scene.tweens.killTweensOf(actor.speech.root);
      actor.speech.hideTimer?.remove(false);
      actor.sprite.destroy();
      actor.speech.root.destroy(true);
    });
  }

  private makeNameTag(actor: ThrowerActor): RoleNameTag {
    const bg = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, 0, '', {
        fontFamily: UiTheme.font,
        fontSize: '11px',
        fontStyle: 'bold',
        color: ROLE_INK[actor.role],
        align: 'center',
      })
      .setOrigin(0.5);
    const root = this.scene.add
      .container(
        actor.sprite.x,
        actor.sprite.y - actor.size * NAME_TAG_OFFSET,
        [bg, text],
      )
      .setDepth(Depth.Hud)
      .setScrollFactor(0);
    return { root, bg, text };
  }

  private roleLabel(role: ThrowerRole): string {
    if (role === 'guest') {
      return guestNameStore.getDisplayName();
    }
    if (role === 'angel') {
      return t('thrower.angel');
    }
    return t('thrower.devil');
  }

  private refreshAllNameTags(): void {
    (Object.keys(this.nameTags) as ThrowerRole[]).forEach((role) => {
      this.refreshNameTag(role);
    });
  }

  private refreshNameTag(role: ThrowerRole): void {
    const tag = this.nameTags[role];
    const label = this.roleLabel(role);
    tag.text.setText(label).setColor(ROLE_INK[role]);

    const padX = 10;
    const padY = 5;
    const maxW = role === 'guest' ? 120 : 100;
    const tw = Math.min(maxW, Math.max(40, tag.text.width));
    const th = Math.max(12, tag.text.height);
    const boxW = tw + padX * 2;
    const boxH = th + padY * 2;
    const g = tag.bg;
    g.clear();
    g.fillStyle(0x000000, 0.1);
    g.fillRoundedRect(-boxW / 2 + 1, -boxH / 2 + 2, boxW, boxH, 10);
    g.fillStyle(ROLE_FILL[role], 0.96);
    g.lineStyle(2, ROLE_STROKE[role], 1);
    g.fillRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    g.strokeRoundedRect(-boxW / 2, -boxH / 2, boxW, boxH, 10);
    // Role accent dot
    g.fillStyle(ROLE_STROKE[role], 1);
    g.fillCircle(-boxW / 2 + 8, 0, 2.4);
  }

  private syncNameTag(role: ThrowerRole): void {
    const actor = this.actors[role];
    const tag = this.nameTags[role];
    tag.root.setPosition(
      actor.sprite.x,
      actor.sprite.y - actor.size * NAME_TAG_OFFSET,
    );
  }

  private maybeSpeak(actor: ThrowerActor): void {
    if (actor.speechCooldownMs > 0) {
      return;
    }

    const chance = SPEECH_CHANCE[actor.role];
    const cool = SPEECH_COOLDOWN[actor.role];
    if (Math.random() > chance) {
      actor.speechCooldownMs = Phaser.Math.Between(cool.skipMin, cool.skipMax);
      return;
    }

    const line = pickThrowerLine(localeStore.getLocale(), actor.role);
    if (line === '') {
      return;
    }

    this.showSpeech(actor, line);
    actor.speechCooldownMs = Phaser.Math.Between(cool.min, cool.max);
  }

  private showSpeech(actor: ThrowerActor, line: string): void {
    const { speech } = actor;
    this.scene.tweens.killTweensOf(speech.root);
    speech.hideTimer?.remove(false);

    speech.text
      .setText(line)
      .setColor(ROLE_INK[actor.role])
      .setVisible(true);

    this.layoutBubble(actor);
    this.syncSpeech(actor);

    speech.root.setVisible(true).setAlpha(0).setScale(0.78);

    this.scene.tweens.add({
      targets: speech.root,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.Out',
    });

    speech.hideTimer = this.scene.time.delayedCall(SPEECH_HOLD_MS, () => {
      this.scene.tweens.add({
        targets: speech.root,
        alpha: 0,
        scale: 0.88,
        duration: 200,
        ease: 'Sine.In',
        onComplete: () => {
          speech.root.setVisible(false);
          speech.text.setText('');
        },
      });
    });
  }

  private layoutBubble(actor: ThrowerActor): void {
    const { speech } = actor;
    const padX = 10;
    const padY = 7;
    const tailH = 9;

    speech.text.setWordWrapWidth(BUBBLE_MAX_WIDTH, true);
    const tw = Math.min(BUBBLE_MAX_WIDTH, Math.max(40, speech.text.width));
    const th = Math.max(16, speech.text.height);
    const boxW = tw + padX * 2;
    const boxH = th + padY * 2;

    // Tip (y=0) points up at the character; box sits below the tip.
    speech.text.setPosition(0, tailH + boxH / 2);

    const g = speech.bg;
    g.clear();
    const fill = ROLE_FILL[actor.role];
    const stroke = ROLE_STROKE[actor.role];

    g.fillStyle(0x000000, 0.12);
    g.fillRoundedRect(-boxW / 2 + 1, tailH + 2, boxW, boxH, 12);

    g.fillStyle(fill, 0.98);
    g.lineStyle(2.5, stroke, 1);
    g.fillRoundedRect(-boxW / 2, tailH, boxW, boxH, 12);
    g.strokeRoundedRect(-boxW / 2, tailH, boxW, boxH, 12);

    // Pointer tip toward character feet
    g.fillStyle(fill, 0.98);
    g.beginPath();
    g.moveTo(-8, tailH);
    g.lineTo(0, 0);
    g.lineTo(8, tailH);
    g.closePath();
    g.fillPath();

    g.lineStyle(2.5, stroke, 1);
    g.beginPath();
    g.moveTo(-8, tailH);
    g.lineTo(0, 0);
    g.lineTo(8, tailH);
    g.strokePath();

    // Hide the box edge under the pointer base
    g.lineStyle(3, fill, 1);
    g.beginPath();
    g.moveTo(-6, tailH);
    g.lineTo(6, tailH);
    g.strokePath();
  }

  private syncSpeech(actor: ThrowerActor): void {
    if (!actor.speech.root.visible) {
      return;
    }

    const { width } = this.scene.scale;
    const margin = 58;
    const x = Phaser.Math.Clamp(actor.sprite.x, margin, width - margin);
    const y = actor.sprite.y + actor.size * 0.52;
    actor.speech.root.setPosition(x, y);
  }

  private applyGuestGender(gender: GuestGender): void {
    const keys = guestTextures(gender);
    const guest = this.actors.guest;
    guest.idleKey = keys.idle;
    guest.throwKey = keys.throwKey;
    if (!guest.busy) {
      this.showIdle(guest);
    }
  }

  private applyDisplaySize(
    sprite: Phaser.GameObjects.Image,
    size: number,
  ): void {
    // setDisplaySize adjusts scale — never call setScale(1) after it
    // or the sprite snaps back to native texture size (512px).
    sprite.setDisplaySize(size, size);
  }

  private showIdle(actor: ThrowerActor): void {
    actor.sprite
      .setTexture(actor.idleKey)
      .setAngle(0)
      .setY(this.rootY);
    this.applyDisplaySize(actor.sprite, actor.size);
  }

  private playThrowVisual(
    actor: ThrowerActor,
    lean: number,
    onRelease: ((releaseX: number, releaseY: number) => void) | null,
  ): void {
    actor.busy = true;
    this.scene.tweens.killTweensOf(actor.sprite);

    const sprite = actor.sprite;
    this.showIdle(actor);

    this.scene.tweens.add({
      targets: sprite,
      angle: -lean * 0.45,
      y: this.rootY + 2,
      duration: 90,
      ease: 'Sine.Out',
      onComplete: () => {
        sprite.setTexture(actor.throwKey);
        // Female guest throw: lighter lean bounce; male: punchier.
        const throwMul =
          actor.role === 'guest' && guestNameStore.getGender() === 'female'
            ? 1.04
            : 1.06;
        this.applyDisplaySize(sprite, actor.size * throwMul);

        this.scene.tweens.add({
          targets: sprite,
          angle: lean,
          y: this.rootY - 6,
          duration: 150,
          ease: 'Sine.Out',
          onComplete: () => {
            if (onRelease !== null) {
              const release = this.getReleasePoint(actor.role);
              onRelease(release.x, release.y);
            }

            this.scene.tweens.add({
              targets: sprite,
              angle: 0,
              y: this.rootY,
              duration: 200,
              ease: 'Sine.InOut',
              onComplete: () => {
                this.showIdle(actor);
                actor.busy = false;
              },
            });
          },
        });
      },
    });
  }

  private makeActor(
    role: ThrowerRole,
    idleKey: string,
    throwKey: string,
    x: number,
    size: number,
  ): ThrowerActor {
    const sprite = this.scene.add
      .image(x, this.rootY, idleKey)
      .setDepth(Depth.CharactersTop)
      .setOrigin(0.5);

    this.applyDisplaySize(sprite, size);

    const bg = this.scene.add.graphics();
    const text = this.scene.add
      .text(0, 0, '', {
        fontFamily: UiTheme.font,
        fontSize: '12px',
        fontStyle: 'bold',
        color: ROLE_INK[role],
        align: 'center',
        wordWrap: { width: BUBBLE_MAX_WIDTH },
      })
      .setOrigin(0.5);

    const root = this.scene.add
      .container(x, this.rootY + size * 0.52, [bg, text])
      .setDepth(Depth.Particles)
      .setScrollFactor(0)
      .setVisible(false)
      .setAlpha(0);

    return {
      role,
      idleKey,
      throwKey,
      sprite,
      speech: { root, bg, text, hideTimer: null },
      size,
      bobMs: Math.random() * 1000,
      busy: false,
      speechCooldownMs: Phaser.Math.Between(200, 900),
    };
  }
}

function guestTextures(gender: GuestGender): {
  idle: string;
  throwKey: string;
} {
  if (gender === 'female') {
    return {
      idle: TextureKey.CharGuestFemaleIdle,
      throwKey: TextureKey.CharGuestFemaleThrow,
    };
  }
  return {
    idle: TextureKey.CharGuestMaleIdle,
    throwKey: TextureKey.CharGuestMaleThrow,
  };
}
