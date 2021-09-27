import MovingObject from "./MovingObject";

/**
 * A simple 2-dimensional vector class serving as data container that include vector operations.
 *
 * @author Anthony Tambrin
 */
export default class Explosion extends MovingObject {
  // ===========================================
  //  Constructor
  // ===========================================
  /**
   * @constructor
   * Creates an instance of this class.
   *
   * @inheritDoc
   */
  constructor(id) {
    super(id);

    this.expansionSpeed = 20;
    this.decay = 0.05;
    this.life = 0;
  }

  // ===========================================
  //  Getters / Setters
  // ===========================================
  /**
   * Speed for color change.
   * @type {number}
   */
  get isAwake() {
    return this.life > 0;
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Awakens this object and resets its parameter.
   */
  awake() {
    this.life = 1;
    this._radius = 0;
  }

  /**
   * Handles all steering motion.
   * Should be called on each frame update.
   */
  update() {
    if (!this.isAwake) {
      return;
    }

    this._radius += this.expansionSpeed;
    this.life -= this.decay;

    super.update();
  }
}
