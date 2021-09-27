import MovingObject from './MovingObject';

/**
 * Vehicle class with steering behavior capability.
 *
 * @author Anthony Tambrin
 */

// ===========================================
//  Temporary Variables
// ===========================================
let __predictedTargetX = 0;
let __predictedTargetY = 0;
let __averageVelocityX = 0;
let __averageVelocityY = 0;
let __averagePositionX = 0;
let __averagePositionY = 0;
let __headingX = 0;
let __headingY = 0;
let __vx = 0;
let __vy = 0;
let __dx = 0;
let __dy = 0;
let __dist = 0;
let __offsetDist = 0;
let __invDist = 0;
let __m = 0;
let __dotProd = 0;
let __obj = null;

export default class SteeredObject extends MovingObject {
  // ===========================================
  //  Constructor
  // ===========================================
  /**
   * @inheritDoc
   */
  constructor(id) {
    super(id || '');

    this._maxForce = 0.1; // maximum total force applicable to this vehicle
    this._maxForceSquared = this._maxForce * this._maxForce; // Above^ squared
    this._steeringForceX = 0;
    this._steeringForceY = 0;
    this._arrivalThreshold = 50; // distance before arrival logic kicks in
    this._arrivalThresholdSquared =
      this._arrivalThreshold * this._arrivalThreshold; // Above^ squared
    this._wanderAngle = 0;
    this._wanderDistance = 10; // distance of helper circle for wander behavior
    this._wanderRadius = 100; // radius of helper circle for wander behavior
    this._wanderRange = 0.5; // random angle range variance for wander behavior
    this._avoidDistance = 100; // antenna length for avoid behavior
    this._avoidDistanceSquared = this._avoidDistance * this._avoidDistance; // Above^ squared
    this._avoidBuffer = 5; // comfort distance between vehicle and obstacle
    this._flockVicinity = 200; // sight distance for flock behavior
    this._flockVicinitySquared = this._flockVicinity * this._flockVicinity; // Above^ squared
    this._flockBuffer = 80; // distance before vehicle flees away for flock behavior
    this._flockBufferSquared = this._flockBuffer * this._flockBuffer; // Above^ squared
    this._flockIndex = 0; // group index of the flock to follow
    this._flockArrive = false; // whether or not to use arrive when flocking
  }

  // ===========================================
  //  Getters / Setters
  // ===========================================
  /**
   * Maximum force allowed in any direction.
   * @type {number}
   */
  get maxForce() {
    return this._maxForce;
  }
  /**
   * @private
   */
  set maxForce(value) {
    this._maxForce = value;
    this._maxForceSquared = this._maxForce * this._maxForce;
  }

  /**
   * Speed threshold when arriving at destination.
   * @type {number}
   */
  get arrivalThreshold() {
    return this._arrivalThreshold;
  }
  /**
   * @private
   */
  set arrivalThreshold(value) {
    this._arrivalThreshold = value;
    this._arrivalThresholdSquared =
      this._arrivalThreshold * this._arrivalThreshold;
  }

  /**
   * Allowed distance when in wandering behavior.
   * @type {number}
   */
  get wanderDistance() {
    return this._wanderDistance;
  }
  /**
   * @private
   */
  set wanderDistance(value) {
    this._wanderDistance = value;
  }

  /**
   * Radius of steering when in wandering behavior.
   * @type {number}
   */
  get wanderRadius() {
    return this._wanderRadius;
  }
  /**
   * @private
   */
  set wanderRadius(value) {
    this._wanderRadius = value;
  }

  /**
   * Maximum range when in wandering behavior.
   * @type {number}
   */
  get wanderRange() {
    return this._wanderRange;
  }
  /**
   * @private
   */
  set wanderRange(value) {
    this._wanderRange = value;
  }

  /**
   * Distance preserved when in avoidance behavior.
   * @type {number}
   */
  get avoidDistance() {
    return this._avoidDistance;
  }
  /**
   * @private
   */
  set avoidDistance(value) {
    this._avoidDistance = value;
    this._avoidDistanceSquared = this._avoidDistance * this._avoidDistance;
  }

  /**
   * Buffer variable for avoidance behavior.
   * @type {number}
   */
  get avoidBuffer() {
    return this._avoidBuffer;
  }
  /**
   * @private
   */
  set avoidBuffer(value) {
    this._avoidBuffer = value;
  }

  /**
   * Vicinity distance from the rest of the flock.
   * @type {number}
   */
  get flockVicinity() {
    return this._flockVicinity;
  }
  /**
   * @private
   */
  set flockVicinity(value) {
    this._flockVicinity = value;
    this._flockVicinitySquared = this._flockVicinity * this._flockVicinity;
  }

  /**
   * Buffer variable for flocking behavior.
   * @type {number}
   */
  get flockBuffer() {
    return this._flockBuffer;
  }
  /**
   * @private
   */
  set flockBuffer(value) {
    this._flockBuffer = value;
    this._flockBufferSquared = this._flockBuffer * this._flockBuffer;
  }

  /**
   * Group index variable for grouped-flocking behavior.
   * @type {number}
   */
  get flockIndex() {
    return this._flockIndex;
  }
  /**
   * @private
   */
  set flockIndex(value) {
    this._flockIndex = value;
  }

  /**
   * Arrive speed when flocking to a destination.
   * @type {number}
   */
  get flockArrive() {
    return this._flockArrive;
  }
  /**
   * @private
   */
  set flockArrive(value) {
    this._flockArrive = value;
  }

  // ===========================================
  //  Public Methods
  // ===========================================
  /**
   * Handles all steering motion.
   * Should be called on each frame update.
   */
  update() {
    if (isNaN(this._steeringForceX) || isNaN(this._steeringForceY)) return;
    if (this._steeringForceX !== 0 || this._steeringForceY !== 0) {
      // Does same as update steering force function
      __dist =
        this._steeringForceX * this._steeringForceX +
        this._steeringForceY * this._steeringForceY;
      if (__dist > this._maxForceSquared) {
        __m = this._maxForce / Math.sqrt(__dist) / this._mass;
        this.vx += this._steeringForceX * __m;
        this.vy += this._steeringForceY * __m;
      } else {
        this.vx += this._steeringForceX / this._mass;
        this.vy += this._steeringForceY / this._mass;
      }

      this._steeringForceX = this._steeringForceY = 0;
    }

    super.update();
  }

  /**
   * Clears steering force.
   */
  clearSteering() {
    this._steeringForceX = 0;
    this._steeringForceY = 0;
    this.vx = 0;
    this.vy = 0;
  }

  /**
   * Moves away from the target.
   *
   * @param {number} x X position of the target from which the vehicle is moving away.
   * @param {number} y Y position of the target from which the vehicle is moving away.
   * @param {number} avoidBoundaryDistance Avoids boundary within distance in the process of fleeing, default is 0.
   */
  flee(x, y, avoidBoundaryDistance) {
    if (typeof avoidBoundaryDistance === 'undefined') avoidBoundaryDistance = 0;
    __dx = x - this.x;
    __dy = y - this.y;
    if (__dx === 0 && __dy === 0) {
      this._steeringForceX -= this._maxSpeed - this.vx;
      this._steeringForceY -= 0 - this.vy;
    } else {
      __dist = this._maxSpeed / Math.sqrt(__dx * __dx + __dy * __dy);
      this._steeringForceX -= __dx * __dist - this.vx;
      this._steeringForceY -= __dy * __dist - this.vy;

      if (avoidBoundaryDistance > 0 && this.boundary) {
        __dx = this.x - this.boundary.left;
        if (__dx <= avoidBoundaryDistance) {
          this._steeringForceX += __dx;
        }
        __dx = this.boundary.right - this.x;
        if (__dx <= avoidBoundaryDistance) {
          this._steeringForceX -= __dx;
        }
        __dy = this.y - this.boundary.top;
        if (__dy <= avoidBoundaryDistance) {
          this._steeringForceY += __dy;
        }
        __dy = this.boundary.bottom - this.y;
        if (__dy <= avoidBoundaryDistance) {
          this._steeringForceY -= __dy;
        }
      }
    }
  }

  /**
   * Moves towards the predicted future location of the target, based on distance.
   *
   * @param {MovingObject} target The target to which the vehicle is moving towards.
   */
  pursue(target) {
    __vx = target.vx;
    __vy = target.vy;
    if (__vx === 0 && __vy === 0) {
      this.seek(target.x, target.y);
    } else {
      __dx = target.x - this.x;
      __dy = target.y - this.y;
      __dist =
        Math.sqrt(__dx * __dx + __dy * __dy) /
        (this._maxSpeed * Math.sqrt(__vx * __vx + __vy * __vy));
      __predictedTargetX = target.x + __vx * __dist;
      __predictedTargetY = target.y + __vy * __dist;
      this.seek(__predictedTargetX, __predictedTargetY);
    }
  }

  /**
   * Moves aimlessly.
   *
   * @param {number} avoidBoundaryDistance Avoids boundary within distance in the process of fleeing, default is 0.
   */
  wander(avoidBoundaryDistance) {
    if (typeof avoidBoundaryDistance === 'undefined') avoidBoundaryDistance = 0;

    if (this.vx === 0 && this.vy === 0) {
      this._steeringForceX +=
        this._wanderDistance + this._wanderRadius * Math.cos(this._wanderAngle);
      this._steeringForceY += this._wanderRadius * Math.sin(this._wanderAngle);
    } else {
      __dist =
        this._wanderDistance / Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      this._steeringForceX +=
        this.vx * __dist + this._wanderRadius * Math.cos(this._wanderAngle);
      this._steeringForceY +=
        this.vy * __dist + this._wanderRadius * Math.sin(this._wanderAngle);
    }
    this._wanderAngle += this._wanderRange * (Math.random() - 0.5);

    if (avoidBoundaryDistance > 0 && this.boundary) {
      __dx = this.x - this.boundary.left;
      if (__dx <= avoidBoundaryDistance) {
        this._steeringForceX += __dx;
      }
      __dx = this.boundary.right - this.x;
      if (__dx <= avoidBoundaryDistance) {
        this._steeringForceX -= __dx;
      }
      __dy = this.y - this.boundary.top;
      if (__dy <= avoidBoundaryDistance) {
        this._steeringForceY += __dy;
      }
      __dy = this.boundary.bottom - this.y;
      if (__dy <= avoidBoundaryDistance) {
        this._steeringForceY -= __dy;
      }
    }
  }

  /**
   * Moves towards the target.
   *
   * @param {number} x X position of the target to which the vehicle is moving towards.
   * @param {number} y Y position of the target to which the vehicle is moving towards.
   * @param {boolean} arrive If true, the vehicle slows down when nearing the target
   *                 with speed reduction proportional to the arrival threshold.
   * @param {number} arriveDistance The distance where arriving starts.
   */
  seek(x, y, arrive, arriveDistance) {
    if (typeof arrive === 'undefined') arrive = true;
    if (typeof arriveDistance === 'undefined') arriveDistance = 50;
    __dx = x - this.x;
    __dy = y - this.y;

    // Normalise to obtain desired velocity
    if (__dx === 0 && __dy === 0) {
      if (!arrive || this._arrivalThreshold === 0) {
        this._steeringForceX += this._maxSpeed - this.vx;
        this._steeringForceY += 0 - this.vy;
      } else {
        this._steeringForceX += 0 - this.vx;
        this._steeringForceY += 0 - this.vy;
      }
    } else {
      if (!arrive || this._arrivalThreshold === 0) {
        __invDist = this._maxSpeed / Math.sqrt(__dx * __dx + __dy * __dy);
      } else {
        __dist = Math.sqrt(__dx * __dx + __dy * __dy);
        __offsetDist = __dist - arriveDistance;
        if (__offsetDist > this._arrivalThreshold) {
          __m = this._maxSpeed;
        } else {
          __m = this._maxSpeed * (__offsetDist / this._arrivalThreshold);
        }

        __invDist = __m / __dist;
      }

      this._steeringForceX += __dx * __invDist - this.vx;
      this._steeringForceY += __dy * __invDist - this.vy;
    }
  }

  /**
   * Flocks along in a set of moving objects.
   *
   * @param {SteeredObject[]} objects The moving objects to flock in.
   * @param {int} length Flock item count (passed in rather than calculated for performance).
   * @param {number} x X position to flock to (optional).
   * @param {number} y Y position to flock to (optional).
   */
  flock(objects, length, x, y) {
    if (typeof length === 'undefined') length = -1;
    __averageVelocityX = this.vx;
    __averageVelocityY = this.vy;
    __averagePositionX = 0;
    __averagePositionY = 0;
    let inSightCount = 0;
    let i = -1;
    let len = length;
    if (length === -1) len = objects.length;

    // Pre-calculate heading
    __headingX = this.vx;
    __headingY = this.vy;
    if (__headingX === 0 && __headingY === 0) __headingX = 1;
    else {
      __dist = 1 / Math.sqrt(__headingX * __headingX + __headingY * __headingY);
      __headingX *= __dist;
      __headingY *= __dist;
    }

    while (++i < len) {
      __obj = objects[i];

      if (__obj === this) continue;
      if (!__obj) continue;

      __dx = __obj.x - this.x;
      __dy = __obj.y - this.y;
      __dist = __dx * __dx + __dy * __dy;

      __dotProd = __dx * __headingX + __dy * __headingY;
      if (__dotProd >= 0) {
        __averageVelocityX += __obj.vx;
        __averageVelocityY += __obj.vy;
        __averagePositionX += __obj.x;
        __averagePositionY += __obj.y;

        if (__dist < this._flockBufferSquared) this.flee(__obj.x, __obj.y);
        ++inSightCount;
      }
    }

    if (inSightCount > 0) {
      __averageVelocityX /= inSightCount;
      __averageVelocityY /= inSightCount;
      __averagePositionX /= inSightCount;
      __averagePositionY /= inSightCount;
      if (
        (typeof x === 'undefined' || !isNaN(x)) &&
        (typeof y === 'undefined' || !isNaN(y))
      ) {
        this.seek(
          __averagePositionX * 0.75 + x * 0.25,
          __averagePositionY * 0.75 + y * 0.25,
          this._flockArrive,
          this._flockBuffer,
        );
      } else {
        this.seek(
          __averagePositionX,
          __averagePositionY,
          this._flockArrive,
          this._flockBuffer,
        );
      }
      this._steeringForceX += __averageVelocityX - this.vx;
      this._steeringForceY += __averageVelocityY - this.vy;
    } else {
      if (
        (typeof x === 'undefined' || !isNaN(x)) &&
        (typeof y === 'undefined' || !isNaN(y))
      ) {
        //this.wander();
        this.seek(x, y);
      } else {
        this.wander();
      }
    }
  }

  /**
   * Checks if other vehicle is in sight.
   *
   * @param {number} x X position to check.
   * @param {number} y Y position to check.
   * @param {number} flockIndex Flock index.
   * @return {boolean} True if too close, false otherwise.
   */
  isInSight(x, y, flockIndex) {
    if (this._flockIndex !== 0 && flockIndex !== this._flockIndex) return false;
    __dx = x - this.x;
    __dy = y - this.y;
    __dist = __dx * __dx + __dy * __dy;
    if (__dist > this._flockVicinitySquared) return false;
    __headingX = this.vx;
    __headingY = this.vy;
    if (__headingX === 0 && __headingY === 0) __headingX = 1;
    else {
      __dist = 1 / Math.sqrt(__headingX * __headingX + __headingY * __headingY);
      __headingX *= __dist;
      __headingY *= __dist;
    }
    __dotProd = __dx * __headingX + __dy * __headingY;
    return __dotProd >= 0;
  }

  /**
   * Checks if other vehicle is too close.
   *
   * @param {number} x X position to check.
   * @param {number} y Y position to check.
   * @param {number} flockIndex Flock index.
   * @return {boolean} True if too close, false otherwise.
   */
  isTooClose(x, y, flockIndex) {
    if (this._flockIndex !== 0 && flockIndex !== this._flockIndex) return false;
    __dx = x - this.x;
    __dy = y - this.y;
    __dist = __dx * __dx + __dy * __dy;
    return __dist < this._flockBufferSquared;
  }
}
