import Character from "./Character";

// ===========================================
//  Public Constants
// ===========================================
/**
 * Turns to circle shape.
 * @type {int}
 */
export const SHAPE_CIRCLE = 1;

/**
 * Turns to square shape.
 * @type {int}
 */
export const SHAPE_SQUARE = 2;

/**
 * A ShapeShifter character object.
 *
 * @author Anthony Tambrin
 */
export default class ShapeShifter extends Character {
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

    this.seekTarget = null;

    this._radiusChangeSpeed = 0.01;
    this._vr = 0; // radius velocity
    this._ar = 0; // radius acceleration

    this._shapeStep = 0;
    this._targetShapeStep = 0;
    this._shapeChangeSpeed = 0.01;
    this._vs = 0; // shape velocity
    this._as = 0; // shape acceleration

    this._colorChangeSpeed = 0.05;

    this._targetColorR = this._colorR;
    this._vcr = 0; // red color velocity
    this._acr = 0; // red color acceleration

    this._targetColorG = this._colorG;
    this._vcg = 0; // green color velocity
    this._acg = 0; // green color acceleration

    this._targetColorB = this._colorB;
    this._vcb = 0; // blue color velocity
    this._acb = 0; // blue color acceleration

    this._fleeX = 0;
    this._fleeY = 0;
    this._fleeUntil = -1;

    this.now = Date.now();
    this.targetMaxSpeed = this._maxSpeed;
    this.targetRadius = this._radius;
    this.shape = SHAPE_CIRCLE;
  }

  // ===========================================
  //  Getters / Setters
  // ===========================================
  /**
   * Speed for color change.
   * @type {number}
   */
  get colorChangeSpeed() {
    return this._colorChangeSpeed;
  }
  /**
   * @private
   */
  set colorChangeSpeed(value) {
    this._colorChangeSpeed = value;
  }

  /**
   * Target RGB color.
   * @type {int[]}
   */
  get targetColor() {
    return [this._targetColorR, this._targetColorG, this._targetColorB];
  }
  /**
   * @private
   */
  set targetColor([r, g, b]) {
    if (
      this._targetColorR !== r ||
      this._targetColorG !== g ||
      this._targetColorB !== b
    ) {
      this._vcr = 0;
      this._vcg = 0;
      this._vcb = 0;
      this._acr = 0;
      this._acg = 0;
      this._acb = 0;
    }
    this._targetColorR = r;
    this._targetColorG = g;
    this._targetColorB = b;
  }

  /**
   * ID string from RGB color.
   * @type {string}
   */
  get colorId() {
    return `${this._targetColorR}_${this._targetColorG}_${this._targetColorB}`;
  }

  /**
   * Time before flee ends.
   * @type {number}
   */
  get fleeUntil() {
    return this._fleeUntil;
  }

  /**
   * Speed for radius change.
   * @type {number}
   */
  get radiusChangeSpeed() {
    return this._radiusChangeSpeed;
  }
  /**
   * @private
   */
  set radiusChangeSpeed(value) {
    this._radiusChangeSpeed = value;
  }

  /**
   * Speed for radius change.
   * @type {number}
   */
  get shape() {
    return this._shape;
  }
  /**
   * @private
   */
  set shape(value) {
    if (this._shape !== value) {
      this._vs = 0;
      this._as = 0;
    }
    this._shape = value;
    if (this._shape === SHAPE_CIRCLE) {
      this._targetShapeStep = 1;
    } else {
      this._targetShapeStep = 0;
    }
  }

  /**
   * Shape step.
   * @type {number}
   */
  get shapeStep() {
    return this._shapeStep;
  }

  /**
   * Speed for shape change.
   * @type {number}
   */
  get shapeChangeSpeed() {
    return this._shapeChangeSpeed;
  }
  /**
   * @private
   */
  set shapeChangeSpeed(value) {
    this._shapeChangeSpeed = value;
  }

  /**
   * @inheritDoc
   */
  get targetRadius() {
    return this._targetRadius;
  }
  /**
   * @private
   */
  set targetRadius(value) {
    if (this._targetRadius !== value) {
      this._vr = 0;
      this._ar = 0;
    }
    this._targetRadius = value;
    this._circ = this._targetRadius * 2;
    if (this._boundaryActive) {
      this._updateBoundary();
    }
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Flees from a target until time passes.
   *
   * @param {number} x Target X coordinate to flee from
   * @param {number} y Target Y coordinate to flee from
   * @param {number} until Time to flee until (in millilseconds)
   * @param {number} force The effecting explosion force
   */
  fleeFrom(x, y, until, force) {
    this._fleeX = x;
    this._fleeY = y;
    this._fleeUntil = until;
    this.maxSpeed = force;
  }

  /**
   * @inheritDoc
   */
  arriveAtTarget() {
    // TODO
  }

  /**
   * Handles all steering motion.
   * Should be called on each frame update.
   */
  update() {
    let diff;

    // radius change
    diff = this._radius - this._targetRadius;
    if ((this._vr < 0 && diff < 0) || (this._vr > 0 && diff > 0)) {
      this._ar = 0;
      this._vr = 0;
      this._radius = this._targetRadius;
    } else {
      this._ar =
        this._radiusChangeSpeed * (this._targetRadius < this._radius ? -1 : 1);
      this._vr += this._ar;
      this._radius += this._vr;
    }

    // shape change
    diff = this._shapeStep - this._targetShapeStep;
    if ((this._vs < 0 && diff < 0) || (this._vs > 0 && diff > 0)) {
      this._as = 0;
      this._vs = 0;
      this._shapeStep = this._targetShapeStep;
    } else {
      this._as =
        this._shapeChangeSpeed *
        (this._targetShapeStep < this._shapeStep ? -1 : 1);
      this._vs += this._as;
      this._shapeStep += this._vs;
    }

    // red color change
    diff = this._colorR - this._targetColorR;
    if ((this._vcr < 0 && diff < 0) || (this._vcr > 0 && diff > 0)) {
      this._acr = 0;
      this._vcr = 0;
      this._colorR = this._targetColorR;
    } else {
      this._acr =
        this._colorChangeSpeed * (this._targetColorR < this._colorR ? -1 : 1);
      this._vcr += this._acr;
      this._colorR += this._vcr;
    }

    // green color change
    diff = this._colorG - this._targetColorG;
    if ((this._vcg < 0 && diff < 0) || (this._vcg > 0 && diff > 0)) {
      this._acg = 0;
      this._vcg = 0;
      this._colorG = this._targetColorG;
    } else {
      this._acg =
        this._colorChangeSpeed * (this._targetColorG < this._colorG ? -1 : 1);
      this._vcg += this._acg;
      this._colorG += this._vcg;
    }

    // blue color change
    diff = this._colorB - this._targetColorB;
    if ((this._vcb < 0 && diff < 0) || (this._vcb > 0 && diff > 0)) {
      this._acb = 0;
      this._vcb = 0;
      this._colorB = this._targetColorB;
    } else {
      this._acb =
        this._colorChangeSpeed * (this._targetColorB < this._colorB ? -1 : 1);
      this._vcb += this._acb;
      this._colorB += this._vcb;
    }

    if (this._maxSpeed > this.targetMaxSpeed) {
      this.maxSpeed *= 0.95;
    } else if (this._maxSpeed < this.targetMaxSpeed) {
      this.maxSpeed = this.targetMaxSpeed;
    }

    // TODO optimise Date.now() usage
    if (this.now < this._fleeUntil) {
      this.flee(this._fleeX, this._fleeY);
    }

    super.update();
  }
}
