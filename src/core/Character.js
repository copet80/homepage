import SteeredObject from "./SteeredObject";
import { roundRect } from "../utils/draw";

let __target;
let __now;
let __wanderFactor;

/**
 * A simple 2-dimensional vector class serving as data container that include vector operations.
 *
 * @author Anthony Tambrin
 */
export default class Character extends SteeredObject {
  // ===========================================
  //  Constructor
  // ===========================================
  /**
   * @constructor
   * Creates an instance of this class.
   *
   * @param {number} x Starting X position.
   * @param {number} y Starting Y position.
   */
  constructor(id) {
    super(id);

    this.seekTarget = null;
  }

  /**
   * @private
   */
  set avoidDistance(value) {
    this._avoidDistance = value;
    this._avoidDistanceSquared = this._avoidDistance * this._avoidDistance;
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Resets the state of things.
   */
  reset() {
    this.arriveAtTarget();
  }

  /**
   * Handles all steering motion.
   * Should be called on each frame update.
   */
  update() {
    __target = this.seekTarget || this.finalDestination;
    __now = Date.now();
    __wanderFactor = this._isSleeping ? 0.2 : 0.5;
    if (__target) {
      if (Math.random() < __wanderFactor) this.wander();
      else this.seek(__target.x, __target.y);
      if (__target.dist(this) < 50) {
        if (!this._isSleeping) {
          this._isSleeping = true;
          this._nextAwakeAt =
            __now +
            this.minSleepingDuration +
            Math.random() *
              (this.maxSleepingDuration - this.minSleepingDuration);
        } else {
          if (__now > this._nextAwakeAt) {
            this._isSleeping = false;
            this.arriveAtTarget();
          }
        }
      }
    }
    super.update();
  }

  /**
   * Notify if arrived at target.
   */
  arriveAtTarget() {}

  /**
   * Renders the character.
   * @param {Context} ctx
   */
  render(ctx) {}
}
