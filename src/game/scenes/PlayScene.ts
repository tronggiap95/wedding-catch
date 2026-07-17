import Phaser from 'phaser';
import type { ConfigStore } from '../config/ConfigStore';
import { Events } from '../constants/Events';
import { RegistryKey } from '../constants/RegistryKey';
import { FallingItem } from '../entities/FallingItem';
import { Player } from '../entities/Player';
import { ThrowerCharacters } from '../entities/ThrowerCharacters';
import { EventBus } from '../events/EventBus';
import { CollisionManager } from '../managers/CollisionManager';
import type { AudioManager } from '../managers/AudioManager';
import { HUDManager } from '../managers/HUDManager';
import { ItemManager } from '../managers/ItemManager';
import { ScoreManager } from '../managers/ScoreManager';
import { SpawnManager } from '../managers/SpawnManager';
import { StageBackground } from '../managers/StageBackground';
import { StageManager } from '../managers/StageManager';
import type { GameState } from '../state/GameState';
import { PauseMenu } from '../ui/PauseMenu';
import { SceneKey } from '../types/SceneKey';
import { TextureKey } from '../constants/TextureKey';

/**
 * Orchestrates one survival run until strike-out. Business logic lives in managers.
 */
export class PlayScene extends Phaser.Scene {
  private state!: GameState;
  private config!: ConfigStore;
  private player!: Player;
  private throwers!: ThrowerCharacters;
  private stageManager!: StageManager;
  private scoreManager!: ScoreManager;
  private itemManager!: ItemManager;
  private spawnManager!: SpawnManager;
  private collisionManager!: CollisionManager;
  private hud!: HUDManager;
  private pauseMenu!: PauseMenu;
  private audio!: AudioManager;
  private stageBackground!: StageBackground;
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private ended = false;

  public constructor() {
    super({ key: SceneKey.Play });
  }

  public create(): void {
    this.ended = false;
    this.state = this.registry.get(RegistryKey.GameState) as GameState;
    this.config = this.registry.get(RegistryKey.ConfigStore) as ConfigStore;
    this.audio = this.registry.get(RegistryKey.AudioManager) as AudioManager;

    this.state.reset();

    const initialBg =
      this.config.stages.stages[0]?.background ?? TextureKey.BgStage1;
    this.stageBackground = new StageBackground(this, initialBg);

    this.throwers = new ThrowerCharacters(this);
    this.player = new Player(this, this.config.runtime);
    this.stageManager = new StageManager(this.state, this.config);
    this.scoreManager = new ScoreManager(this.state, this.config);
    this.itemManager = new ItemManager(this, () => {
      return new FallingItem(this, this.config.runtime.itemSize);
    });
    this.spawnManager = new SpawnManager(
      this,
      this.state,
      this.config,
      this.itemManager,
      this.throwers,
      () => this.player.x,
    );
    this.collisionManager = new CollisionManager(
      this,
      this.state,
      this.config,
      this.itemManager,
      this.scoreManager,
      this.player,
    );
    this.hud = new HUDManager(
      this,
      this.state,
      this.config.items.comboTiers,
    );
    // Pause/mute after HUD so their hit Zones sit above HUD art in the input stack.
    this.pauseMenu = new PauseMenu(this, this.audio, {
      onPauseRequest: () => this.pauseGame(),
      onResumeRequest: () => this.resumeGame(),
    });
    this.pauseMenu.layout(this.scale.width);

    this.spaceKey = this.input.keyboard?.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.input.keyboard?.addCapture('SPACE');

    this.audio.ensureThemeBgm();

    this.stageManager.start();
    this.spawnManager.reset();
    EventBus.emit(Events.HudRefresh, {});
    EventBus.emit(Events.TimeChanged, {
      elapsedMs: this.state.elapsedMs,
    });

    EventBus.once(Events.GameOver, this.onGameOver, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      EventBus.off(Events.GameOver, this.onGameOver, this);
      this.resumeSystems();
      this.pauseMenu.destroy();
      this.hud.destroy();
      this.player.destroy();
      this.throwers.destroy();
      this.itemManager.clear();
      this.stageBackground.destroy();
    });
  }

  public override update(_time: number, delta: number): void {
    if (this.ended || this.state.isGameOver) {
      return;
    }

    this.handlePauseHotkey();

    if (this.state.isPaused || !this.state.isPlaying) {
      return;
    }

    this.throwers.update(delta);
    this.player.setInvincible(this.state.invincibleRemainingMs > 0);
    this.player.update(delta);
    this.spawnManager.update(delta, this.stageManager.current);

    const magnet =
      this.state.magnetRemainingMs > 0
        ? {
            x: this.player.x,
            y: this.player.y,
            radius: Math.min(this.scale.width, this.scale.height) * 0.42,
            magnetStrength: 4.5,
            repelStrength: 0,
          }
        : this.state.repelRemainingMs > 0
          ? {
              x: this.player.x,
              y: this.player.y,
              radius: Math.min(this.scale.width, this.scale.height) * 0.48,
              magnetStrength: 0,
              repelStrength: 5.2,
            }
          : null;
    this.itemManager.update(delta, magnet);

    this.collisionManager.update();
    this.scoreManager.update(delta);
    this.scoreManager.tickTime(delta);
    this.stageManager.update(delta);
    this.hud.tickBonuses();
  }

  private handlePauseHotkey(): void {
    if (this.spaceKey === undefined) {
      return;
    }

    if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      return;
    }

    if (this.state.isPaused) {
      this.resumeGame();
      return;
    }

    this.pauseGame();
  }

  private pauseGame(): void {
    if (this.ended || this.state.isGameOver || this.state.isPaused) {
      return;
    }

    this.state.isPaused = true;
    this.player.setInputEnabled(false);
    this.time.paused = true;
    this.tweens.pauseAll();
    this.pauseMenu.showPaused();
  }

  private resumeGame(): void {
    if (this.ended || this.state.isGameOver || !this.state.isPaused) {
      return;
    }

    this.state.isPaused = false;
    this.resumeSystems();
    this.player.setInputEnabled(true);
    this.pauseMenu.hidePaused();
  }

  private resumeSystems(): void {
    this.time.paused = false;
    this.tweens.resumeAll();
  }

  private onGameOver = (): void => {
    if (this.ended) {
      return;
    }
    this.ended = true;
    if (this.state.isPaused) {
      this.state.isPaused = false;
      this.resumeSystems();
      this.pauseMenu.hidePaused();
    }
    this.time.delayedCall(400, () => {
      this.scene.start(SceneKey.Result);
    });
  };
}
