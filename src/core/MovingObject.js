/**
 * Base class for moving objects.
 *
 * @author Anthony Tambrin
 */

import Vector2D from './Vector2D';

// ===========================================
//  Public Constants
// ===========================================
/**
 * Wrap behavior makes moving object going out of an edge to wrap and appear on the opposite edge.
 * @type {int}
 */
export const EDGE_WRAP = 1;

/**
 * Bounce behavior makes moving object touching an edge to bounce back in.
 * @type {int}
 */
export const EDGE_BOUNCE = 2;

// ===========================================
//  Private Constants
// ===========================================
const HALF_PI = Math.PI * 0.5;

// ===========================================
//  Temporary Variables
// ===========================================
let __dist = null;
let __m = null;

export default class MovingObject extends Vector2D {
  // ===========================================
  //  Constructor
  // ===========================================
  /**
   * @constructor
   * Creates an instance of this class.
   *
   * @param {string} id Unique ID of the object.
   */
  constructor(id) {
    super(0, 0);

    if (typeof id === 'undefined' || id.length === 0)
      id = '' + Math.floor(Math.random() * 9999999);
    this._id = id;
    this._active = false;

    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.offsetX = 0;
    this.offsetY = 0;

    this._maxSpeed = 0.75;
    this._maxSpeedSquared = this._maxSpeed * this._maxSpeed;
    this._edgeBehavior = EDGE_WRAP;
    this._radius = 5;
    this._circ = this._radius * 2;
    this._mass = 1;
    this._rotation = 0;
    this._rotation0 = this._rotation;
    this._boundaryActive = false;
    this._boundsLeft = 0;
    this._boundsRight = 0;
    this._boundsTop = 0;
    this._boundsBottom = 0;
    this._boundsLeftBounce = 0;
    this._boundsRightBounce = 0;
    this._boundsTopBounce = 0;
    this._boundsBottomBounce = 0;
    this._boundsLeftWrap = 0;
    this._boundsRightWrap = 0;
    this._boundsTopWrap = 0;
    this._boundsBottomWrap = 0;
    this._colorR = 0;
    this._colorG = 0;
    this._colorB = 0;
    this._scale = 1;
    this._scale0 = this._scale;
    this._autoRotate = true;
    this._isTransformSaved = false;
    this._isInvincible = false;
  }

  // ===========================================
  //  Getters / Setters
  // ===========================================
  /**
   * Unique ID of this object.
   * @type {string}
   */
  get id() {
    return this._id;
  }
  /**
   * @private
   */
  set id(value) {
    this._id = value;
  }

  /**
   * True if active, false otherwise.
   * @type {string}
   */
  get active() {
    return this._active;
  }
  /**
   * @private
   */
  set active(value) {
    this._active = value;
  }

  /**
   * Maximum speed this object can move within.
   * @type {number}
   */
  get maxSpeed() {
    return this._maxSpeed;
  }
  /**
   * @private
   */
  set maxSpeed(value) {
    this._maxSpeed = value;
    this._maxSpeedSquared = this._maxSpeed * this._maxSpeed;
  }

  /**
   * Target maximum speed this object can move within.
   * @type {number}
   */
  get targetMaxSpeed() {
    return this._targetMaxSpeed;
  }
  /**
   * @private
   */
  set targetMaxSpeed(value) {
    this._targetMaxSpeed = value;
  }

  /**
   * Rotation in radian.
   * @type {number}
   */
  get rotation() {
    return this._rotation;
  }
  /**
   * @private
   */
  set rotation(value) {
    if (!this._autoRotate) this._rotation = value;
  }

  /**
   * Scale between 0 and 1.
   * @type {number}
   */
  get scale() {
    return this._scale;
  }
  /**
   * @private
   */
  set scale(value) {
    this._scale = value;
  }

  /**
   * Edge behavior determines how object react when hitting boundary edge.
   * @type {int}
   */
  get edgeBehavior() {
    return this._edgeBehavior;
  }
  /**
   * @private
   */
  set edgeBehavior(value) {
    this._edgeBehavior = value;
  }

  /**
   * Object mass determines how agile it moves.
   * @type {number}
   */
  get mass() {
    return this._mass;
  }
  /**
   * @private
   */
  set mass(value) {
    this._mass = value;
  }

  /**
   * Radius of the bounding circle for collision detection.
   * @type {number}
   */
  get radius() {
    return this._radius;
  }
  /**
   * @private
   */
  set radius(value) {
    this._radius = value;
    this._circ = this._radius * 2;
    if (this._boundaryActive) {
      this._updateBoundary();
    }
  }

  /**
   * Rectangular boundary of vehicle.
   * @type {Boundary}
   * @see EDGE_WRAP
   * @see EDGE_BOUNCE
   */
  get boundary() {
    return this._boundary;
  }
  /**
   * @private
   */
  set boundary(value) {
    this._boundaryActive = typeof value !== 'undefined';
    this._boundary = value;
    if (this._boundaryActive) {
      this._boundsLeft = value.left;
      this._boundsRight = value.right;
      this._boundsTop = value.top;
      this._boundsBottom = value.bottom;
      this._updateBoundary();
    }
  }

  /**
   * RGB color.
   * @type {number[]}
   */
  get color() {
    return [this._colorR, this._colorG, this._colorB];
  }
  /**
   * @private
   */
  set color([r, g, b]) {
    this._colorR = r;
    this._colorG = g;
    this._colorB = b;
  }

  /**
   * ID string from RGB color.
   * @type {string}
   */
  get colorId() {
    return `${this._colorR}_${this._colorG}_${this._colorB}`;
  }

  /**
   * Auto rotate to the velocity if set to true.
   * @type {boolean}
   */
  get autoRotate() {
    return this._autoRotate;
  }
  /**
   * @private
   */
  set autoRotate(value) {
    this._autoRotate = value;
  }

  /**
   * [read-only] Saved scale value after saveTransform() is called.
   * @type {number}
   */
  get scale0() {
    return this._scale0;
  }

  /**
   * [read-only] Saved rotation value after saveTransform() is called.
   * @type {number}
   */
  get rotation0() {
    return this._rotation0;
  }

  /**
   * [read-only] True if saveTransform() has been called at least once.
   * @type {boolean}
   */
  get isTransformSaved() {
    return this._isTransformSaved;
  }

  /**
   * [read-only] True if invincible.
   * @type {boolean}
   */
  get isInvincible() {
    return this._isInvincible;
  }

  // ===========================================
  //  Protected Methods
  // ===========================================
  _updateBoundary() {
    this._boundsLeftBounce = this._boundsLeft + this._radius;
    this._boundsRightBounce = this._boundsRight - this._radius;
    this._boundsTopBounce = this._boundsTop + this._radius;
    this._boundsBottomBounce = this._boundsBottom - this._radius;
    this._boundsLeftWrap = this._boundsLeft - this._circ;
    this._boundsRightWrap = this._boundsRight + this._circ;
    this._boundsTopWrap = this._boundsTop - this._circ;
    this._boundsBottomWrap = this._boundsBottom + this._circ;
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Handles all basic motion.
   * Should be called on each frame update.
   */
  update() {
    if (this.vx === 0 && this.vy === 0) return;

    // make sure velocity stays within max speed
    __dist = this.vx * this.vx + this.vy * this.vy;
    if (__dist > this._maxSpeedSquared) {
      __m = this._maxSpeed / Math.sqrt(__dist);
      this.vx *= __m;
      this.vy *= __m;
    }

    // add velocity to position
    this.x += this.vx;
    this.y += this.vy;

    // handle any edge behavior
    if (this._boundaryActive) {
      if (this._edgeBehavior === EDGE_BOUNCE) {
        if (this.x > this._boundsRightBounce) {
          this.x = this._boundsRightBounce;
          this.vx = -this.vx;
        } else if (this.x < this._boundsLeftBounce) {
          this.x = this._boundsLeftBounce;
          this.vx = -this.vx;
        }
        if (this.y > this._boundsBottomBounce) {
          this.y = this._boundsBottomBounce;
          this.vy = -this.vy;
        } else if (this.y < this._boundsTopBounce) {
          this.y = this._boundsTopBounce;
          this.vy = -this.vy;
        }
      } else {
        if (this.x > this._boundsRightWrap) {
          this.x = this._boundsLeftWrap + (this.x - this._boundsRightWrap);
        } else if (this.x < this._boundsLeftWrap) {
          this.x = this._boundsRightWrap - (this._boundsLeftWrap - this.x);
        }
        if (this.y > this._boundsBottomWrap) {
          this.y = this._boundsTopWrap + (this.y - this._boundsBottomWrap);
        } else if (this.y < this._boundsTopWrap) {
          this.y = this._boundsBottomWrap - (this._boundsTopWrap - this.y);
        }
      }
    }

    if (this._autoRotate && __dist > 0.1) {
      this._rotation = Math.atan2(this.vy, this.vx) + HALF_PI;
    }
  }

  /**
   * Generates a string representation of this object.
   *
   * @return {string} A string representation of this object.
   */
  toString() {
    return (
      '[MovingObject(id:' +
      this._id +
      ', x:' +
      this.x +
      ', y:' +
      this.y +
      ', vx:' +
      this.vx +
      ', vy:' +
      this.vy +
      ')]'
    );
  }
}
